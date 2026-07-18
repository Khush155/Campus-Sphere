const userService = require('../services/userService');
const { updateUserSchema } = require('../validators/userValidator');
const { successResponse } = require('../utils/apiResponse');

/**
 * Controller to fetch users list with sorting and filtering options.
 */
const getUsers = async (req, res, _next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const { role, department, status, search } = req.query;

  const result = await userService.getUsersList({
    page,
    limit,
    role,
    departmentId: department,
    status,
    search,
  }, req.user.role);

  return successResponse(res, 200, 'Users fetched successfully', result.users, result.meta);
};

/**
 * Controller to update a user's details (admin only).
 */
const updateUser = async (req, res, _next) => {
  const { id } = req.params;
  const validatedBody = updateUserSchema.parse(req.body);
  const meta = { ipAddress: req.ip || req.headers['x-forwarded-for'], userAgent: req.headers['user-agent'] };

  const updatedUser = await userService.updateUserDetails(id, validatedBody, req.user.id, meta, req.user.role);

  return successResponse(res, 200, 'User updated successfully', updatedUser);
};

/**
 * Controller to soft delete (deactivate) a user.
 */
const deleteUser = async (req, res, _next) => {
  const { id } = req.params;
  const meta = { ipAddress: req.ip || req.headers['x-forwarded-for'], userAgent: req.headers['user-agent'] };

  await userService.deleteUserAccount(id, req.user.id, meta, req.user.role);

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
  const user = await userService.getUserDetails(id, req.user.role);
  return successResponse(res, 200, 'User details fetched successfully', user);
};

module.exports = {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getAuditLogs,
  getInsights,
};
