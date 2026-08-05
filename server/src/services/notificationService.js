const Notification = require('../models/Notification');
const logger = require('../utils/logger');

/**
 * Creates a single notification for a specific recipient.
 * Automatically suppresses self-notifications if recipient is the sender.
 */
const createNotification = async ({
  recipientId,
  title,
  message,
  category = 'GENERAL',
  link = '',
  senderId = null,
  metadata = null,
}) => {
  if (!recipientId) {
    return null;
  }

  // Suppress self-notifications
  if (senderId && String(recipientId) === String(senderId)) {
    return null;
  }

  try {
    const notification = await Notification.create({
      recipientId,
      title,
      message,
      category,
      link,
      senderId,
      metadata,
    });
    return notification;
  } catch (error) {
    logger.error(`Error creating notification for user ${recipientId}: ${error.message}`);
    return null;
  }
};

/**
 * Creates notifications in bulk for an array of recipient IDs.
 * Filters out duplicate IDs and self-notifications.
 */
const createBulkNotifications = async (
  recipientIds,
  { title, message, category = 'GENERAL', link = '', senderId = null, metadata = null }
) => {
  if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
    return [];
  }

  // Deduplicate and remove senderId self-notifications
  const validRecipients = [...new Set(recipientIds.map((id) => String(id)))].filter(
    (id) => !senderId || String(id) !== String(senderId)
  );

  if (validRecipients.length === 0) {
    return [];
  }

  const docs = validRecipients.map((recipientId) => ({
    recipientId,
    title,
    message,
    category,
    link,
    senderId,
    metadata,
  }));

  try {
    const created = await Notification.insertMany(docs);
    return created;
  } catch (error) {
    logger.error(`Error creating bulk notifications: ${error.message}`);
    return [];
  }
};

/**
 * Gets paginated notifications for a recipient along with total unread count.
 */
const getNotificationsForUser = async (userId, { page = 1, limit = 15, unreadOnly = false }) => {
  const filter = { recipientId: userId };
  if (unreadOnly) {
    filter.isRead = false;
  }

  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .populate('senderId', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipientId: userId, isRead: false }),
  ]);

  return {
    notifications,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      unreadCount,
    },
  };
};

/**
 * Gets total unread notifications count cheaply for badge.
 */
const getUnreadCountForUser = async (userId) => {
  const unreadCount = await Notification.countDocuments({ recipientId: userId, isRead: false });
  return unreadCount;
};

/**
 * Marks a single notification as read, strictly enforcing recipient ownership.
 */
const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOne({ _id: notificationId, recipientId: userId });
  if (!notification) {
    return null;
  }

  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
  }

  return notification;
};

/**
 * Marks all unread notifications as read for a recipient.
 */
const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { recipientId: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );

  return result.modifiedCount;
};

module.exports = {
  createNotification,
  createBulkNotifications,
  getNotificationsForUser,
  getUnreadCountForUser,
  markAsRead,
  markAllAsRead,
};
