const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../middlewares/asyncHandler');

/**
 * @desc    Get notifications for logged in user
 * @route   GET /api/v1/notifications
 * @access  Private
 */
const getNotifications = asyncHandler(async (req, res, next) => {
  const filter = { recipientId: req.user.id };
  const { category, unreadOnly } = req.query;

  if (category) {
    filter.category = category;
  }
  if (unreadOnly === 'true') {
    filter.isRead = false;
  }

  const notifications = await Notification.find(filter)
    .populate('senderId', 'name email')
    .sort({ createdAt: -1 });

  return successResponse(res, 200, 'Notifications retrieved successfully', notifications);
});

/**
 * @desc    Mark a notification as read
 * @route   PATCH /api/v1/notifications/:id/read
 * @access  Private
 */
const markNotificationRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) {
    return next(new AppError('Notification not found', 404, ERROR_CODES.NOT_FOUND));
  }

  // Verify recipient match
  if (String(notification.recipientId) !== String(req.user.id)) {
    return next(new AppError('Unauthorized access', 403, ERROR_CODES.FORBIDDEN));
  }

  notification.isRead = true;
  await notification.save();

  return successResponse(res, 200, 'Notification marked as read', notification);
});

/**
 * @desc    Mark all notifications of the user as read
 * @route   PATCH /api/v1/notifications/read-all
 * @access  Private
 */
const markAllRead = asyncHandler(async (req, res, next) => {
  await Notification.updateMany(
    { recipientId: req.user.id, isRead: false },
    { $set: { isRead: true } }
  );

  return successResponse(res, 200, 'All notifications marked as read', null);
});

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllRead,
};
