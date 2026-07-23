const userService = require('../services/userService');
const { updateUserSchema } = require('../validators/userValidator');
const { successResponse } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const ROLES = require('../constants/roles');

/**
 * Controller to fetch users list with sorting and filtering options.
 */
const getUsers = async (req, res, _next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const { role, department, status, search, course, branch, semester, group } = req.query;

  // Security Rule: HODs default to their own department, but can query target department faculty for cross-dept requests
  const isHod = req.user.role === ROLES.HOD;
  let targetDepartmentId = department;
  if (isHod && (role !== 'FACULTY' || !department)) {
    targetDepartmentId = req.user.departmentId;
  }

  const result = await userService.getUsersList({
    page,
    limit,
    role,
    departmentId: targetDepartmentId,
    status,
    search,
    courseId: course,
    branchId: branch,
    semester: semester ? parseInt(semester, 10) : undefined,
    group: group,
  });

  return successResponse(res, 200, 'Users fetched successfully', result.users, result.meta);
};

/**
 * Controller to update a user's details.
 */
const updateUser = async (req, res, _next) => {
  const { id } = req.params;
  const targetUser = await userService.getUserDetails(id);
  if (!targetUser) {
    throw new AppError('User not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  const { assertNoPrivilegeEscalation, assertHODDeptBound } = require('../utils/privilegeGuard');

  // Enforce privilege guards
  assertNoPrivilegeEscalation({
    actorRole: req.user.role,
    targetCurrentRole: targetUser.role,
    targetNewRole: req.body.role || targetUser.role,
  });

  if (req.user.role === ROLES.HOD) {
    // HOD can only update users within their own department
    assertHODDeptBound(req.user, targetUser.departmentId);

    // HODs cannot assign a user to a different department or set admin roles
    if (req.body.departmentId && String(req.body.departmentId) !== String(req.user.departmentId)) {
      throw new AppError('Access denied. You cannot assign users to a different department.', 403, ERROR_CODES.FORBIDDEN);
    }

    const newRole = req.body.role || targetUser.role;
    if (newRole !== ROLES.FACULTY && newRole !== ROLES.STUDENT) {
      throw new AppError('Access denied. HODs can only assign FACULTY or STUDENT roles.', 403, ERROR_CODES.FORBIDDEN);
    }
  }

  const validatedBody = updateUserSchema.parse(req.body);
  const meta = { ipAddress: req.ip || req.headers['x-forwarded-for'], userAgent: req.headers['user-agent'] };

  const updatedUser = await userService.updateUserDetails(id, validatedBody, req.user.id, meta);

  return successResponse(res, 200, 'User updated successfully', updatedUser);
};

/**
 * Controller to soft delete (deactivate) a user.
 */
const deleteUser = async (req, res, _next) => {
  const { id } = req.params;
  const meta = { ipAddress: req.ip || req.headers['x-forwarded-for'], userAgent: req.headers['user-agent'] };

  await userService.deleteUserAccount(id, req.user.id, meta);

  return successResponse(res, 200, 'User deactivated successfully');
};

/**
 * Controller to fetch the last 8 audit log events.
 */
const getAuditLogs = async (req, res, _next) => {
  const logs = await userService.getAuditLogsList();
  return successResponse(res, 200, 'Audit logs fetched successfully', logs);
};

/**
 * Controller to fetch proactive institutional insights (admin only).
 */
const getInsights = async (req, res, _next) => {
  const insights = await userService.getInstitutionalInsights();
  return successResponse(res, 200, 'Institutional insights fetched successfully', insights);
};

/**
 * Controller to fetch a single user's details.
 */
const getUser = async (req, res, _next) => {
  const { id } = req.params;
  const user = await userService.getUserDetails(id);

  if (req.user.role === ROLES.HOD) {
    if (String(user.departmentId) !== String(req.user.departmentId)) {
      throw new AppError('Access denied to users outside your department.', 403, ERROR_CODES.FORBIDDEN);
    }
  }

  return successResponse(res, 200, 'User details fetched successfully', user);
};

const importStudents = async (req, res, _next) => {
  if (!req.file || !req.file.path) {
    throw new AppError('No CSV file uploaded.', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const fs = require('fs');
  const fileBuffer = fs.readFileSync(req.file.path);
  try { fs.unlinkSync(req.file.path); } catch (e) {
    // Ignore cleanup errors
  }

  const result = await userService.importStudents(fileBuffer, req.user.id, req);
  return successResponse(res, 200, 'Student CSV import processed successfully', result);
};

module.exports = {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getAuditLogs,
  getInsights,
  importStudents,
};
