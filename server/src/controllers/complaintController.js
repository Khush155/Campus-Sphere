const complaintService = require('../services/complaintService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../middlewares/asyncHandler');

/**
 * @desc    Submit a complaint
 * @route   POST /api/v1/complaints
 * @access  Private/Student/Faculty/HOD
 */
const createComplaint = asyncHandler(async (req, res) => {
  const complaint = await complaintService.createComplaint(req.body, req.user);
  return successResponse(res, 201, 'Complaint submitted successfully', complaint);
});

/**
 * @desc    List complaints
 * @route   GET /api/v1/complaints
 * @access  Private/SuperAdmin/HOD
 */
const getComplaints = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const result = await complaintService.getComplaints(req.query, req.user);
  return successResponse(res, 200, 'Complaints retrieved successfully', result.data, {
    total: result.meta.total,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

/**
 * @desc    Update complaint status
 * @route   PATCH /api/v1/complaints/:id/status
 * @access  Private/SuperAdmin/HOD
 */
const updateComplaintStatus = asyncHandler(async (req, res) => {
  const complaint = await complaintService.updateComplaintStatus(req.params.id, req.body, req.user, req);
  return successResponse(res, 200, 'Complaint status updated successfully', complaint);
});

module.exports = {
  createComplaint,
  getComplaints,
  updateComplaintStatus,
};
