const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const ROLES = require('../constants/roles');

// Apply JWT authentication to all routes in this file
router.use(authMiddleware);

// Role-based Access Guards
const hodGuard = [
  authMiddleware,
  roleMiddleware(ROLES.HOD, ROLES.SUPER_ADMIN),
];

const collegeAdminGuard = [
  authMiddleware,
  roleMiddleware(ROLES.COLLEGE_ADMIN, ROLES.SUPER_ADMIN),
];

/**
 * @openapi
 * /api/v1/dashboard/hod:
 *   get:
 *     summary: Get dashboard statistics for HOD
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 */
router.get('/hod', hodGuard, asyncHandler(dashboardController.getHodStats));

/**
 * @openapi
 * /api/v1/dashboard/college-admin:
 *   get:
 *     summary: Get dashboard statistics for College Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 */
router.get('/college-admin', collegeAdminGuard, asyncHandler(dashboardController.getCollegeAdminStats));

module.exports = router;
