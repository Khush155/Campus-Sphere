const Announcement = require('../models/Announcement');
const { successResponse } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');

// @desc    Get all announcements
// @route   GET /api/v1/announcements
// @access  Private
exports.getAnnouncements = async (req, res, next) => {
  const announcements = await Announcement.find()
    .populate('authorId', 'firstName lastName')
    .sort('-createdAt')
    .lean();

  const formatted = announcements.map(a => ({
    id: a._id,
    title: a.title,
    content: a.content,
    audience: a.audience,
    status: a.status,
    priority: a.priority,
    category: a.category,
    date: new Date(a.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
    author: a.authorId ? `${a.authorId.firstName} ${a.authorId.lastName}` : 'Unknown'
  }));

  return successResponse(res, 200, 'Announcements retrieved successfully', formatted);
};

// @desc    Create announcement
// @route   POST /api/v1/announcements
// @access  Private (Admin/College Admin/HOD)
exports.createAnnouncement = async (req, res, next) => {
  const { title, content, audience, category, priority } = req.body;
  
  const announcement = await Announcement.create({
    title,
    content,
    audience: audience || ['All'],
    category: category || 'General',
    priority: priority || 'medium',
    authorId: req.user.id,
    status: 'Published'
  });

  return successResponse(res, 201, 'Announcement published successfully', announcement);
};
