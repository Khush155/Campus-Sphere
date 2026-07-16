const Notice = require('../models/Notice');
const AppError = require('../utils/AppError');

/**
 * POST /api/v1/notices
 * Create a notice with audience targeting and future-only expiry validation.
 */
exports.createNotice = async (req, res) => {
  const { title, content, priority, expiresAt, targetAudience } = req.body;

  if (!title || !content) throw new AppError('title and content are required.', 400);

  if (expiresAt && new Date(expiresAt) <= new Date()) {
    throw new AppError('expiresAt must be a future date.', 400);
  }

  const notice = await Notice.create({
    title,
    content,
    departmentId: req.user.departmentId || null,
    authorId: req.user.id,
    priority: priority || 'MEDIUM',
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    targetAudience: targetAudience || 'ALL',
  });

  res.status(201).json({ success: true, data: notice });
};

/**
 * GET /api/v1/notices
 * List active (non-expired) notices sorted by priority then recency.
 */
exports.getNotices = async (req, res) => {
  const { departmentId, priority, targetAudience, page = 1, limit = 30 } = req.query;
  const now = new Date();

  const filters = {
    $and: [
      // Only active (non-expired) notices
      { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
      // Department filter: include global notices OR department-specific
      departmentId
        ? { $or: [{ departmentId }, { departmentId: null }] }
        : {},
    ],
  };

  if (priority) filters.priority = priority;
  if (targetAudience && targetAudience !== 'ALL') {
    filters.$and.push({ $or: [{ targetAudience }, { targetAudience: 'ALL' }] });
  }

  const PRIORITY_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [notices, total] = await Promise.all([
    Notice.find(filters)
      .populate('authorId', 'name role')
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Notice.countDocuments(filters),
  ]);

  // Sort in-memory by priority enum order
  notices.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3));

  res.status(200).json({
    success: true,
    data: notices,
    meta: { total, page: parseInt(page), limit: parseInt(limit) },
  });
};

/**
 * DELETE /api/v1/notices/:id
 * HOD/Admin can remove their own notices.
 */
exports.deleteNotice = async (req, res) => {
  const notice = await Notice.findById(req.params.id);
  if (!notice) throw new AppError('Notice not found.', 404);
  if (notice.authorId.toString() !== req.user.id && req.user.role !== 'SUPER_ADMIN') {
    throw new AppError('You can only delete your own notices.', 403);
  }
  await notice.deleteOne();
  res.status(200).json({ success: true, message: 'Notice deleted.' });
};
