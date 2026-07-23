const noticeService = require('../services/noticeService');
const { noticeSchema } = require('../validators/noticeValidator');
const { successResponse } = require('../utils/apiResponse');

/**
 * Controller to create a new notice profile.
 */
const createNotice = async (req, res, _next) => {
  const validatedBody = noticeSchema.parse(req.body);
  const newNotice = await noticeService.createNotice(validatedBody, req.user.id);
  return successResponse(res, 201, 'Notice created successfully.', newNotice);
};

/**
 * Controller to fetch paginated notice listing for admins.
 */
const getNotices = async (req, res, _next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const { status, priority, search } = req.query;

  const result = await noticeService.getNoticesList({
    page,
    limit,
    status,
    priority,
    search,
    actor: req.user,
  });

  return successResponse(res, 200, 'Notices retrieved successfully.', result.notices, result.meta);
};

/**
 * Controller to fetch notice details by ID.
 */
const getNoticeById = async (req, res, _next) => {
  const notice = await noticeService.getNoticeDetails(req.params.id);
  return successResponse(res, 200, 'Notice details retrieved successfully.', notice);
};

/**
 * Controller to update notice attributes.
 */
const updateNotice = async (req, res, _next) => {
  const validatedBody = noticeSchema.partial().parse(req.body);
  const meta = { ipAddress: req.ip || req.headers['x-forwarded-for'], userAgent: req.headers['user-agent'] };
  const updated = await noticeService.updateNoticeDetails(req.params.id, validatedBody, req.user.id, meta);
  return successResponse(res, 200, 'Notice updated successfully.', updated);
};

/**
 * Controller to archive / soft delete notice.
 */
const archiveNotice = async (req, res, _next) => {
  const meta = { ipAddress: req.ip || req.headers['x-forwarded-for'], userAgent: req.headers['user-agent'] };
  await noticeService.archiveNoticeDetails(req.params.id, req.user.id, meta);
  return successResponse(res, 200, 'Notice archived successfully.');
};

/**
 * Controller to fetch user notice feed.
 */
const getFeed = async (req, res, _next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;

  const result = await noticeService.getFeedList(req.user, { page, limit });
  return successResponse(res, 200, 'Notice feed retrieved successfully.', result.notices, result.meta);
};

module.exports = {
  createNotice,
  getNotices,
  getNoticeById,
  updateNotice,
  archiveNotice,
  getFeed,
};
