const Feedback = require('../models/Feedback');
const AppError = require('../utils/AppError');
const { successResponse } = require('../utils/apiResponse');

/**
 * GET /api/v1/feedback
 * HOD views all student-submitted feedback for their department.
 * Students see only their own submissions.
 * Feedback is scoped to the HOD's department automatically.
 */
exports.getAllFeedback = async (req, res) => {
  const { role, departmentId, id: userId } = req.user;
  const { targetRole, rating, page = 1, limit = 30 } = req.query;

  const filters = {};

  // HOD/SUPER_ADMIN see department-scoped feedback
  if (role === 'SUPER_ADMIN') {
    if (req.query.departmentId) filters.department = req.query.departmentId;
  } else if (role === 'HOD') {
    filters.department = departmentId; // Only their department
  } else if (role === 'STUDENT' || role === 'FACULTY') {
    // Students and Faculty see only their own submitted feedback
    filters.submittedBy = userId;
  }

  if (targetRole) filters.targetRole = targetRole;
  if (rating) filters.rating = Number(rating);

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [feedback, total] = await Promise.all([
    Feedback.find(filters)
      .populate('targetUser', 'name email role')
      .populate('submittedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Feedback.countDocuments(filters),
  ]);

  successResponse(res, 200, 'Feedback retrieved', feedback, { total, page: parseInt(page), limit: parseInt(limit) });
};

/**
 * POST /api/v1/feedback
 * Students and Faculty submit feedback for a faculty member or student.
 * HOD role cannot submit feedback — they only view.
 * Prevents duplicate feedback for the same (submitter, target, period).
 */
exports.createFeedback = async (req, res) => {
  const { role, departmentId, id: userId } = req.user;

  // HOD does NOT submit feedback — they are reviewers, not evaluators
  if (role === 'HOD') {
    throw new AppError(
      'HODs do not submit feedback. Students and faculty submit reviews. You have read-only access to this module.',
      403
    );
  }

  const { targetRole, targetUser, rating, comments } = req.body;

  if (!targetRole || !rating || !comments) {
    throw new AppError('targetRole, rating, and comments are required.', 400);
  }
  if (rating < 1 || rating > 5) {
    throw new AppError('Rating must be between 1 and 5.', 400);
  }
  if (targetUser && targetUser === userId) {
    throw new AppError('You cannot submit feedback for yourself.', 400);
  }

  // Check for duplicate feedback this month (prevent spam)
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const existing = await Feedback.findOne({
    submittedBy: userId,
    targetUser,
    createdAt: { $gte: startOfMonth },
  });
  if (existing) {
    throw new AppError('You have already submitted feedback for this person this month.', 409);
  }

  const newFeedback = await Feedback.create({
    targetRole,
    targetUser: targetUser || null,
    department: departmentId,
    rating: Number(rating),
    comments: comments.trim(),
    submittedBy: userId,
  });

  successResponse(res, 201, 'Feedback submitted successfully', newFeedback);
};

/**
 * GET /api/v1/feedback/analytics
 * Per-faculty average ratings for the HOD's department.
 * Sorted by lowest-rated first (needs attention).
 */
exports.getFeedbackAnalytics = async (req, res) => {
  const { departmentId } = req.user;

  const perFaculty = await Feedback.aggregate([
    { $match: { department: new (require('mongoose').Types.ObjectId)(departmentId), targetRole: 'FACULTY' } },
    {
      $group: {
        _id: '$targetUser',
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        positiveReviews: { $sum: { $cond: [{ $gte: ['$rating', 4] }, 1, 0] } },
        negativeReviews: { $sum: { $cond: [{ $lte: ['$rating', 2] }, 1, 0] } },
        recentComment: { $last: '$comments' },
      },
    },
    {
      $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'faculty' },
    },
    { $unwind: { path: '$faculty', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        facultyName: '$faculty.name',
        facultyEmail: '$faculty.email',
        avgRating: { $round: ['$avgRating', 1] },
        totalReviews: 1,
        positiveReviews: 1,
        negativeReviews: 1,
        positiveRate: {
          $round: [{ $multiply: [{ $divide: ['$positiveReviews', { $max: ['$totalReviews', 1] }] }, 100] }, 0],
        },
        recentComment: 1,
      },
    },
    { $sort: { avgRating: 1 } }, // Lowest first — needs attention
  ]);

  successResponse(res, 200, 'Feedback analytics retrieved', perFaculty);
};
