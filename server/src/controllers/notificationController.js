const notificationService = require('../services/notificationService');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../middlewares/asyncHandler');

/**
 * @desc    Get notifications for logged-in user
 * @route   GET /api/v1/notifications
 * @access  Private
 */
const getNotifications = asyncHandler(async (req, res, _next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 15;
  const unreadOnly = req.query.unreadOnly === 'true';

  const result = await notificationService.getNotificationsForUser(req.user.id, {
    page,
    limit,
    unreadOnly,
  });

  return successResponse(
    res,
    200,
    'Notifications retrieved successfully',
    result.notifications,
    result.meta
  );
});

/**
 * @desc    Get cheap unread notification count for logged-in user
 * @route   GET /api/v1/notifications/unread-count
 * @access  Private
 */
const getUnreadCount = asyncHandler(async (req, res, _next) => {
  const unreadCount = await notificationService.getUnreadCountForUser(req.user.id);
  return successResponse(res, 200, 'Unread notification count retrieved', { unreadCount });
});

/**
 * @desc    Mark a single notification as read
 * @route   PATCH /api/v1/notifications/:id/read
 * @access  Private
 */
const markNotificationRead = asyncHandler(async (req, res, next) => {
  const notification = await notificationService.markAsRead(req.params.id, req.user.id);
  if (!notification) {
    return next(new AppError('Notification not found or access denied', 404, ERROR_CODES.NOT_FOUND));
  }

  return successResponse(res, 200, 'Notification marked as read', notification);
});

/**
 * @desc    Mark all notifications of the user as read
 * @route   PATCH /api/v1/notifications/read-all
 * @access  Private
 */
const markAllRead = asyncHandler(async (req, res, _next) => {
  const count = await notificationService.markAllAsRead(req.user.id);
  return successResponse(res, 200, 'All notifications marked as read', { markedCount: count });
});

module.exports = {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllRead,
};
