const Feedback = require('../models/Feedback');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const ROLES = require('../constants/roles');
const paginate = require('../utils/paginate');
const mongoose = require('mongoose');

const getAllFeedback = async (queryOptions, actor) => {
  const { targetRole, rating, departmentId } = queryOptions;
  const filters = {};

  if (actor.role === ROLES.SUPER_ADMIN) {
    if (departmentId) {
      filters.department = departmentId;
    }
  } else if (actor.role === ROLES.HOD) {
    filters.department = actor.departmentId;
  } else if (actor.role === ROLES.STUDENT || actor.role === ROLES.FACULTY) {
    filters.submittedBy = actor.id;
  }

  if (targetRole) {
    filters.targetRole = targetRole;
  }
  if (rating) {
    filters.rating = Number(rating);
  }

  return await paginate(Feedback, filters, {
    ...queryOptions,
    populate: [
      { path: 'targetUser', select: 'name email role' },
      { path: 'submittedBy', select: 'name email role' }
    ],
    sort: { createdAt: -1 }
  });
};

const createFeedback = async (feedbackData, actor) => {
  const { targetRole, targetUser, rating, comments } = feedbackData;

  if (actor.role === ROLES.HOD) {
    throw new AppError(
      'HODs do not submit feedback. Students and faculty submit reviews. You have read-only access to this module.',
      403,
      ERROR_CODES.FORBIDDEN
    );
  }

  if (rating < 1 || rating > 5) {
    throw new AppError('Rating must be between 1 and 5.', 400, ERROR_CODES.BAD_REQUEST);
  }
  if (targetUser && targetUser === actor.id) {
    throw new AppError('You cannot submit feedback for yourself.', 400, ERROR_CODES.BAD_REQUEST);
  }

  // Duplicate check for this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const existing = await Feedback.findOne({
    submittedBy: actor.id,
    targetUser,
    createdAt: { $gte: startOfMonth },
  });
  if (existing) {
    throw new AppError('You have already submitted feedback for this person this month.', 409, ERROR_CODES.DUPLICATE_ENTRY);
  }

  const newFeedback = await Feedback.create({
    targetRole,
    targetUser: targetUser || null,
    department: actor.departmentId,
    rating: Number(rating),
    comments: comments.trim(),
    submittedBy: actor.id,
  });

  return newFeedback;
};

const getFeedbackAnalytics = async (actor) => {
  if (actor.role !== ROLES.HOD && actor.role !== ROLES.SUPER_ADMIN) {
    throw new AppError('Access denied.', 403, ERROR_CODES.FORBIDDEN);
  }

  const perFaculty = await Feedback.aggregate([
    { $match: { department: new mongoose.Types.ObjectId(actor.departmentId), targetRole: 'FACULTY' } },
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
    { $sort: { avgRating: 1 } },
  ]);

  return perFaculty;
};

module.exports = {
  getAllFeedback,
  createFeedback,
  getFeedbackAnalytics
};
