const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

/**
 * Retrieves paginated audit logs matching the specified query filters.
 */
const getAuditLogs = async ({
  page = 1,
  limit = 10,
  actorId,
  action,
  targetModel,
  dateFrom,
  dateTo,
  search,
}) => {
  const filter = {};

  if (actorId) {
    filter.actorId = actorId;
  }
  if (action) {
    filter.action = action;
  }
  if (targetModel) {
    filter.targetModel = targetModel;
  }

  // Handle Date range filter (matching against "timestamp" field)
  if (dateFrom || dateTo) {
    filter.timestamp = {};
    if (dateFrom) {
      filter.timestamp.$gte = new Date(dateFrom);
    }
    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      filter.timestamp.$lte = endOfDay;
    }
  }

  // Handle free text search (actor name/email or action name)
  if (search) {
    const matchingUsers = await User.find({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ],
    }).select('_id');
    
    const userIds = matchingUsers.map((u) => u._id);

    filter.$or = [
      { actorId: { $in: userIds } },
      { action: { $regex: search, $options: 'i' } },
    ];
  }

  const logs = await AuditLog.find(filter)
    .populate('actorId', 'name email role')
    .sort({ timestamp: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  // Populate target user info for 'User' targetModel entries
  const userLogEntries = logs.filter((l) => l.targetModel === 'User' && l.targetId);
  if (userLogEntries.length > 0) {
    const userIds = [...new Set(userLogEntries.map((l) => String(l.targetId)))];
    const targetUsers = await User.find({ _id: { $in: userIds } }).select('name email role rollNumber').lean();
    const userMap = new Map(targetUsers.map((u) => [String(u._id), u]));

    logs.forEach((log) => {
      if (log.targetModel === 'User' && log.targetId) {
        const targetUser = userMap.get(String(log.targetId));
        if (targetUser) {
          log.targetUser = targetUser;
        }
      }
    });
  }

  const total = await AuditLog.countDocuments(filter);

  return { logs, total };
};

/**
 * Gets a distinct list of actions currently present in the audit log collection.
 */
const getDistinctActions = async () => {
  return AuditLog.distinct('action');
};

/**
 * Gets a distinct list of target models currently present in the audit log collection.
 */
const getDistinctTargetModels = async () => {
  return AuditLog.distinct('targetModel');
};

module.exports = {
  getAuditLogs,
  getDistinctActions,
  getDistinctTargetModels,
};
