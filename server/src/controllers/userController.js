const userService = require('../services/userService');
const { updateUserSchema } = require('../validators/userValidator');
const { successResponse } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');

const User = require('../models/User');
const FacultyAssignment = require('../models/FacultyAssignment');
const Department = require('../models/Department');

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
  });

  return successResponse(res, 200, 'Users fetched successfully', result.users, result.meta);
};

/**
 * Controller to update a user's details (admin only).
 */
const updateUser = async (req, res, _next) => {
  const { id } = req.params;
  const validatedBody = updateUserSchema.parse(req.body);

  const updatedUser = await userService.updateUserDetails(id, validatedBody, req.user.id);

  return successResponse(res, 200, 'User updated successfully', updatedUser);
};

/**
 * Controller to soft delete (deactivate) a user.
 */
const deleteUser = async (req, res, _next) => {
  const { id } = req.params;

  await userService.deleteUserAccount(id, req.user.id);

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
  return successResponse(res, 200, 'User details fetched successfully', user);
};

/**
 * Controller to handle bulk CSV student import.
 */
const bulkImportStudents = async (req, res, _next) => {
  if (!req.file) {
    throw new AppError('No CSV file uploaded. Please attach a .csv file under the "file" field.', 400, 'MISSING_FILE');
  }

  const isDryRun = req.query.dryRun === 'true';
  const result = await userService.bulkImportStudents(req.file.buffer, req.user.id, isDryRun);

  if (isDryRun) {
    return successResponse(res, 200, 'Dry run completed', result);
  }

  return successResponse(
    res,
    200,
    `Import complete: ${result.imported} imported, ${result.skipped} skipped out of ${result.totalRows} rows.`,
    result
  );
};

/**
 * Controller to handle JSON array bulk import.
 */
const bulkImportJson = async (req, res, _next) => {
  const result = await userService.bulkImportJson(req.body, req.user.id);
  
  return successResponse(
    res,
    200,
    `JSON Import complete: ${result.imported} imported, ${result.skipped} skipped.`,
    result
  );
};

/**
 * Controller to export filtered users as a CSV stream.
 */
const exportUsers = async (req, res, _next) => {
  const csvString = await userService.exportUsersToCSV(req.query);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="students_export.csv"');
  
  return res.status(200).send(csvString);
};

/**
 * Controller to get faculty with their assigned workloads
 */
const getFaculty = async (req, res, _next) => {
  const faculty = await User.find({ role: { $in: ['FACULTY', 'HOD'] } }).populate('departmentId', 'name').lean();
  
  const assignments = await FacultyAssignment.find({
    facultyId: { $in: faculty.map(f => f._id) }
  }).populate('subjectId', 'name credits type').lean();

  const enrichedFaculty = faculty.map(f => {
    const fAssignments = assignments.filter(a => a.facultyId.toString() === f._id.toString());
    const workload = fAssignments.reduce((acc, a) => acc + (a.subjectId?.credits || 0), 0);
    return {
      id: f._id,
      name: `${f.firstName} ${f.lastName}`,
      email: f.email,
      department: f.departmentId ? f.departmentId.name : 'Unassigned',
      role: f.role,
      workload,
      status: f.status,
      subjects: fAssignments.map(a => a.subjectId?.name).filter(Boolean)
    };
  });

  return successResponse(res, 200, 'Faculty fetched successfully', enrichedFaculty);
};

module.exports = {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getAuditLogs,
  getInsights,
  bulkImportStudents,
  bulkImportJson,
  exportUsers,
  getFaculty,
};
