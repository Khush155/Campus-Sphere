const { successResponse } = require('../utils/apiResponse');
const facultyAssignmentService = require('../services/facultyAssignmentService');
const { createAssignmentSchema, revokeAssignmentSchema } = require('../validators/facultyAssignmentValidator');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');

const assignFaculty = async (req, res) => {
  const parsed = createAssignmentSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('Validation failed', 400, ERROR_CODES.VALIDATION_ERROR, parsed.error.format());
  }

  try {
    const assignment = await facultyAssignmentService.assignFaculty(parsed.data, req.user.id, req);
    return successResponse(res, 201, 'Faculty assigned successfully', assignment);
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError('An active assignment already exists for this subject, semester, and academic year', 409, ERROR_CODES.DUPLICATE_ENTRY);
    }
    throw error;
  }
};

const listAssignments = async (req, res) => {
  const { branchId, academicYear, semester } = req.query;
  
  if (!branchId) {
    throw new AppError('branchId query parameter is required', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const filters = {};
  if (academicYear) filters.academicYear = academicYear;
  if (semester) filters.semester = semester;

  const assignments = await facultyAssignmentService.listAssignmentsByBranch(branchId, filters);
  return successResponse(res, 200, 'Faculty assignments retrieved', assignments);
};

const listMyAssignments = async (req, res) => {
  const assignments = await facultyAssignmentService.listAssignmentsByFaculty(req.user.id);
  return successResponse(res, 200, 'My assignments retrieved', assignments);
};

const revokeAssignment = async (req, res) => {
  const parsed = revokeAssignmentSchema.safeParse(req.params);
  if (!parsed.success) {
    throw new AppError('Invalid assignment ID', 400, ERROR_CODES.VALIDATION_ERROR, parsed.error.format());
  }

  const assignment = await facultyAssignmentService.revokeAssignment(parsed.data.id, req.user.id, req);
  return successResponse(res, 200, 'Faculty assignment revoked successfully', assignment);
};

module.exports = {
  assignFaculty,
  listAssignments,
  listMyAssignments,
  revokeAssignment,
};
