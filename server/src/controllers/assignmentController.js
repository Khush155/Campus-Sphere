const assignmentService = require('../services/assignmentService');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { createAssignmentSchema, revokeAssignmentSchema } = require('../validators/assignmentValidator');
const ERROR_CODES = require('../constants/errorCodes');

const createAssignment = async (req, res, next) => {
  try {
    const validatedData = createAssignmentSchema.parse(req.body);

    const assignment = await assignmentService.createAssignment({
      ...validatedData,
      assignedBy: req.user.id,
      departmentId: req.user.departmentId,
      req, // For audit logging
    });

    return successResponse(res, 201, 'Faculty assigned successfully', assignment);
  } catch (error) {
    if (error.name === 'ZodError') {
      return errorResponse(res, 400, 'Validation failed', ERROR_CODES.VALIDATION_ERROR, error.errors);
    }
    next(error);
  }
};

const revokeAssignment = async (req, res, next) => {
  try {
    const validatedData = revokeAssignmentSchema.parse(req.body);
    const { id } = req.params;

    const assignment = await assignmentService.revokeAssignment({
      assignmentId: id,
      revokedBy: req.user.id,
      departmentId: req.user.departmentId,
      revokedReason: validatedData.revokedReason,
      req, // For audit logging
    });

    return successResponse(res, 200, 'Faculty assignment revoked successfully', assignment);
  } catch (error) {
    if (error.name === 'ZodError') {
      return errorResponse(res, 400, 'Validation failed', ERROR_CODES.VALIDATION_ERROR, error.errors);
    }
    next(error);
  }
};

const getAssignments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, branchId, semester } = req.query;

    const result = await assignmentService.listAssignmentsByDept(req.user.departmentId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      status,
      branchId,
      semester: semester ? parseInt(semester, 10) : undefined,
    });

    return successResponse(res, 200, 'Assignments retrieved successfully', result.data, result.meta);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAssignment,
  revokeAssignment,
  getAssignments,
};
