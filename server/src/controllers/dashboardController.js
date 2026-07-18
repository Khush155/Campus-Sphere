const dashboardService = require('../services/dashboardService');
const { successResponse } = require('../utils/apiResponse');

/**
 * GET /api/v1/admin/dashboard/stats
 * Returns aggregate KPI counts. All values are 0 on a fresh install — never an error.
 */
const getStats = async (req, res, _next) => {
  const stats = await dashboardService.getDashboardStats();
  return successResponse(res, 200, 'Dashboard stats retrieved successfully.', stats);
};

/**
 * GET /api/v1/admin/dashboard/department-distribution
 * Returns student count per department, sorted descending.
 * Returns [] when no students exist — this is valid and expected.
 */
const getDepartmentDistribution = async (req, res, _next) => {
  const distribution = await dashboardService.getDepartmentDistribution();
  return successResponse(res, 200, 'Department distribution retrieved successfully.', distribution);
};

/**
 * GET /api/v1/admin/insights
 * Returns institutional insight alerts. Returns [] when everything is healthy.
 */
const getInsights = async (req, res, _next) => {
  const insights = await dashboardService.getInsights();
  return successResponse(res, 200, 'Institutional insights retrieved successfully.', insights);
};

const Notice = require('../models/Notice');

const getRecentNotices = async (req, res, _next) => {
  const notices = await Notice.find({ status: 'PUBLISHED' })
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(8)
    .populate('publishedBy', 'name');

  const formatted = notices.map((n) => ({
    id: n._id,
    title: n.title,
    content: n.content,
    priority: n.priority,
    publishedAt: n.publishedAt || n.createdAt,
    publishedByName: n.publishedBy ? n.publishedBy.name : 'System',
  }));

  return successResponse(res, 200, 'Recent notices retrieved successfully.', formatted);
};

module.exports = {
  getStats,
  getDepartmentDistribution,
  getInsights,
  getRecentNotices,
};
