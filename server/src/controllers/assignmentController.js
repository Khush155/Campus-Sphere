const assignmentService = require('../services/assignmentService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../middlewares/asyncHandler');

/**
 * @desc    Assign faculty workload
 * @route   POST /api/v1/assignments
 * @access  Private/HOD
 */
const createAssignment = asyncHandler(async (req, res) => {
  const assignment = await assignmentService.createAssignment({
    ...req.body,
    assignedBy: req.user.id,
    departmentId: req.user.departmentId,
    req, // For audit logging
  });

  return successResponse(res, 201, 'Faculty assigned successfully', assignment);
});

/**
 * @desc    Revoke faculty workload assignment
 * @route   POST /api/v1/assignments/:id/revoke
 * @access  Private/HOD
 */
const revokeAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const assignment = await assignmentService.revokeAssignment({
    assignmentId: id,
    revokedBy: req.user.id,
    departmentId: req.user.departmentId,
    revokedReason: req.body.revokedReason,
    req, // For audit logging
  });

  return successResponse(res, 200, 'Faculty assignment revoked successfully', assignment);
});

/**
 * @desc    Get workload assignments
 * @route   GET /api/v1/assignments
 * @access  Private/HOD
 */
const getAssignments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, branchId, semester } = req.query;

  const result = await assignmentService.listAssignmentsByDept(req.user.departmentId, {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    status,
    branchId,
    semester: semester ? parseInt(semester, 10) : undefined,
  });

  return successResponse(res, 200, 'Assignments retrieved successfully', result.data, result.meta);
});

module.exports = {
  createAssignment,
  revokeAssignment,
  getAssignments,
};
