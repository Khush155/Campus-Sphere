const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const ROLES = require('../constants/roles');

// Apply JWT authentication to all routes in this file
router.use(authMiddleware);

// Only HOD and SUPER_ADMIN can view HOD dashboard stats
const hodGuard = roleMiddleware(ROLES.HOD, ROLES.SUPER_ADMIN);

/**
 * @openapi
 * /api/v1/dashboard/hod:
 *   get:
 *     summary: Get dashboard metrics for Head of Department
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats retrieved successfully
 */
router.get('/hod', hodGuard, asyncHandler(dashboardController.getHodStats));

module.exports = router;
