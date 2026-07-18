const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const ROLES = require('../constants/roles');

const router = express.Router();

// All dashboard routes require authentication and SUPER_ADMIN or COLLEGE_ADMIN role
router.use(authMiddleware);
router.use(roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN));

// KPI aggregation counts
router.get('/dashboard/stats', asyncHandler(dashboardController.getStats));

// Department-level student distribution (server-side aggregation)
router.get('/dashboard/department-distribution', asyncHandler(dashboardController.getDepartmentDistribution));

// Institutional configuration insights / alerts
router.get('/insights', asyncHandler(dashboardController.getInsights));

// Recent notices for College Admin dashboard
router.get('/dashboard/recent-notices', asyncHandler(dashboardController.getRecentNotices));

module.exports = router;
