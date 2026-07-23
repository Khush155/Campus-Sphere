const leaveService = require('../services/leaveService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../middlewares/asyncHandler');

/**
 * @desc    Create a leave request
 * @route   POST /api/v1/leaves
 * @access  Private/Faculty/Student/HOD
 */
const createLeaveRequest = asyncHandler(async (req, res) => {
  const leave = await leaveService.createLeaveRequest(req.body, req.user);
  return successResponse(res, 201, 'Leave request submitted successfully', leave);
});

/**
 * @desc    List leave requests
 * @route   GET /api/v1/leaves
 * @access  Private/SuperAdmin/HOD/Faculty/Student
 */
const getLeaveRequests = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const result = await leaveService.getLeaveRequests(req.query, req.user);
  return successResponse(res, 200, 'Leave requests retrieved successfully', result.data, {
    total: result.meta.total,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

/**
 * @desc    Approve or reject a leave request
 * @route   PATCH /api/v1/leaves/:id/status
 * @access  Private/SuperAdmin/HOD
 */
const updateLeaveStatus = asyncHandler(async (req, res) => {
  const leave = await leaveService.updateLeaveStatus(req.params.id, req.body, req.user, req);
  return successResponse(res, 200, 'Leave request updated successfully', leave);
});

module.exports = {
  createLeaveRequest,
  getLeaveRequests,
  updateLeaveStatus,
};
