const Notice = require('../models/Notice');
const { logAuditEvent } = require('../utils/auditLogger');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const logger = require('../utils/logger');

/**
 * Builds the visibility query for a specific user.
 * A notice is visible if it is PUBLISHED, active (not expired), and targeted to the user's role, dept, and semester.
 */
const buildVisibilityQuery = (user) => {
  const now = new Date();
  const andQuery = [
    { $or: [{ targetRoles: { $size: 0 } }, { targetRoles: user.role }] },
    { $or: [{ targetDepartments: { $size: 0 } }, { targetDepartments: user.departmentId }] },
    { $or: [{ expiresAt: null }, { expiresAt: { $gte: now } }] },
  ];

  if (user.role === 'STUDENT') {
    andQuery.push({ $or: [{ targetSemesters: { $size: 0 } }, { targetSemesters: user.semester }] });
  }

  return {
    status: 'PUBLISHED',
    $and: andQuery,
  };
};

/**
 * Creates a new notice.
 */
const createNotice = async (noticeData, authorId) => {
  const isPublished = noticeData.status === 'PUBLISHED';
  const newNotice = await Notice.create({
    ...noticeData,
    publishedBy: authorId,
    publishedAt: isPublished ? new Date() : null,
  });

  logger.info(`[Notice Created] ID: ${newNotice._id} - Status: ${newNotice.status} - By: ${authorId}`);
  return newNotice;
};

/**
 * Retrieve unfiltered list of notices for administration directory.
 */
const getNoticesList = async ({ page = 1, limit = 20, status, priority, search }) => {
  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (priority) {
    filter.priority = priority;
  }

  if (search && search.trim().length > 0) {
    filter.title = new RegExp(search.trim(), 'i');
  }

  const skip = (page - 1) * limit;

  const notices = await Notice.find(filter)
    .populate('publishedBy', 'name email')
    .populate('targetDepartments', 'name code')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Notice.countDocuments(filter);
  const totalPages = Math.ceil(total / limit);

  return {
    notices,
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

/**
 * Retrieve details for a single notice by ID.
 */
const getNoticeDetails = async (id) => {
  const notice = await Notice.findById(id)
    .populate('publishedBy', 'name email')
    .populate('targetDepartments', 'name code');

  if (!notice) {
    throw new AppError('Notice not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  return notice;
};

/**
 * Update notice fields and audit changes.
 */
const updateNoticeDetails = async (id, updateData, adminUserId, meta) => {
  const notice = await Notice.findById(id);
  if (!notice) {
    throw new AppError('Notice not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  const before = notice.toObject();

  // If status transitions from DRAFT to PUBLISHED, record publish time
  const transitionToPublished = before.status === 'DRAFT' && updateData.status === 'PUBLISHED';
  if (transitionToPublished) {
    notice.publishedAt = new Date();
  }

  // Update attributes
  const fields = [
    'title',
    'content',
    'priority',
    'status',
    'targetRoles',
    'targetDepartments',
    'targetSemesters',
    'expiresAt',
  ];

  fields.forEach((field) => {
    if (updateData[field] !== undefined) {
      notice[field] = updateData[field];
    }
  });

  await notice.save();
  const after = notice.toObject();

  // Log audit trail
  await logAuditEvent({
    actorId: adminUserId,
    action: 'NOTICE_UPDATED',
    targetId: notice._id,
    targetModel: 'Notice',
    before: {
      title: before.title,
      status: before.status,
      targetRoles: before.targetRoles,
      targetDepartments: before.targetDepartments,
      targetSemesters: before.targetSemesters,
    },
    after: {
      title: after.title,
      status: after.status,
      targetRoles: after.targetRoles,
      targetDepartments: after.targetDepartments,
      targetSemesters: after.targetSemesters,
    },
    meta,
  });

  logger.info(`[Notice Updated] ID: ${notice._id} - Actioned By: ${adminUserId}`);
  return notice;
};

/**
 * Soft delete / archive notice.
 */
const archiveNoticeDetails = async (id, adminUserId, meta) => {
  const notice = await Notice.findById(id);
  if (!notice) {
    throw new AppError('Notice not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  notice.status = 'ARCHIVED';
  await notice.save();

  await logAuditEvent({
    actorId: adminUserId,
    action: 'NOTICE_ARCHIVED',
    targetId: notice._id,
    targetModel: 'Notice',
    meta,
  });

  logger.info(`[Notice Archived] ID: ${notice._id} - Actioned By: ${adminUserId}`);
  return notice;
};

/**
 * Retrieve targeted notice feed list.
 */
const getFeedList = async (user, { page = 1, limit = 20 }) => {
  const query = buildVisibilityQuery(user);
  const skip = (page - 1) * limit;

  // Aggregate with weights to sort by Priority descending (URGENT > IMPORTANT > NORMAL)
  const notices = await Notice.aggregate([
    { $match: query },
    {
      $addFields: {
        priorityWeight: {
          $switch: {
            branches: [
              { case: { $eq: ['$priority', 'URGENT'] }, then: 3 },
              { case: { $eq: ['$priority', 'IMPORTANT'] }, then: 2 },
              { case: { $eq: ['$priority', 'NORMAL'] }, then: 1 },
            ],
            default: 0,
          },
        },
      },
    },
    { $sort: { priorityWeight: -1, publishedAt: -1 } },
    { $skip: skip },
    { $limit: limit },
  ]);

  const populated = await Notice.populate(notices, [
    { path: 'publishedBy', select: 'name email' },
    { path: 'targetDepartments', select: 'name code' },
  ]);

  const total = await Notice.countDocuments(query);
  const totalPages = Math.ceil(total / limit);

  return {
    notices: populated,
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

module.exports = {
  buildVisibilityQuery,
  createNotice,
  getNoticesList,
  getNoticeDetails,
  updateNoticeDetails,
  archiveNoticeDetails,
  getFeedList,
};
