const meetingService = require('../services/meetingService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../middlewares/asyncHandler');

/**
 * @desc    Create a meeting
 * @route   POST /api/v1/meetings
 * @access  Private/SuperAdmin/HOD
 */
const createMeeting = asyncHandler(async (req, res) => {
  const meeting = await meetingService.createMeeting(req.body, req.user);
  return successResponse(res, 201, 'Meeting created successfully', meeting);
});

/**
 * @desc    List meetings
 * @route   GET /api/v1/meetings
 * @access  Private/SuperAdmin/HOD/Faculty/Student
 */
const getMeetings = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const result = await meetingService.getMeetings(req.query, req.user);
  return successResponse(res, 200, 'Meetings retrieved successfully', result.data, {
    total: result.meta.total,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

/**
 * @desc    Add minutes of meeting
 * @route   PATCH /api/v1/meetings/:id/minutes
 * @access  Private/SuperAdmin/HOD
 */
const addMinutes = asyncHandler(async (req, res) => {
  const meeting = await meetingService.addMinutes(req.params.id, req.body.minutesOfMeeting, req.user);
  return successResponse(res, 200, 'Minutes of meeting added successfully', meeting);
});

/**
 * @desc    Update RSVP status
 * @route   PATCH /api/v1/meetings/:id/rsvp
 * @access  Private/SuperAdmin/HOD/Faculty/Student
 */
const updateRSVP = asyncHandler(async (req, res) => {
  const meeting = await meetingService.updateRSVP(req.params.id, req.body.rsvpStatus, req.user);
  return successResponse(res, 200, 'RSVP status updated successfully', meeting);
});

/**
 * @desc    Add action item
 * @route   POST /api/v1/meetings/:id/action-items
 * @access  Private/SuperAdmin/HOD
 */
const addActionItem = asyncHandler(async (req, res) => {
  const meeting = await meetingService.addActionItem(req.params.id, req.body, req.user);
  return successResponse(res, 200, 'Action item added successfully', meeting);
});

/**
 * @desc    Update meeting status
 * @route   PATCH /api/v1/meetings/:id/status
 * @access  Private/SuperAdmin/HOD
 */
const updateMeetingStatus = asyncHandler(async (req, res) => {
  const meeting = await meetingService.updateMeetingStatus(req.params.id, req.body, req.user, req);
  return successResponse(res, 200, 'Meeting status updated successfully', meeting);
});

module.exports = {
  createMeeting,
  getMeetings,
  addMinutes,
  updateRSVP,
  addActionItem,
  updateMeetingStatus,
};
