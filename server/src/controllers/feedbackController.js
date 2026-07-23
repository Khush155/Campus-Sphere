const feedbackService = require('../services/feedbackService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../middlewares/asyncHandler');

/**
 * @desc    Get all feedback
 * @route   GET /api/v1/feedback
 * @access  Private/HOD/SuperAdmin/Faculty/Student
 */
const getAllFeedback = asyncHandler(async (req, res) => {
  const { page = 1, limit = 30 } = req.query;
  const result = await feedbackService.getAllFeedback(req.query, req.user);
  return successResponse(res, 200, 'Feedback retrieved successfully', result.data, {
    total: result.meta.total,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

/**
 * @desc    Submit feedback
 * @route   POST /api/v1/feedback
 * @access  Private/Faculty/Student
 */
const createFeedback = asyncHandler(async (req, res) => {
  const feedback = await feedbackService.createFeedback(req.body, req.user);
  return successResponse(res, 201, 'Feedback submitted successfully', feedback);
});

/**
 * @desc    Get feedback ratings analytics
 * @route   GET /api/v1/feedback/analytics
 * @access  Private/HOD/SuperAdmin
 */
const getFeedbackAnalytics = asyncHandler(async (req, res) => {
  const result = await feedbackService.getFeedbackAnalytics(req.user);
  return successResponse(res, 200, 'Feedback analytics retrieved successfully', result);
});

module.exports = {
  getAllFeedback,
  createFeedback,
  getFeedbackAnalytics,
};
