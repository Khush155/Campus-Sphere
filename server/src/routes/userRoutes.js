const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const ROLES = require('../constants/roles');

const router = express.Router();

// Super Admin access guard
const superAdminGuard = [
  authMiddleware,
  roleMiddleware(ROLES.SUPER_ADMIN),
];

// Admin and HOD access guard for read operations
const adminAndHodGuard = [
  authMiddleware,
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.HOD),
];

/**
 * @openapi
 * /api/v1/users:
 *   get:
 *     summary: Fetch all users (paginated & filtered)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users list.
 */
router.get('/', adminAndHodGuard, asyncHandler(userController.getUsers));

/**
 * @openapi
 * /api/v1/users/audit-logs:
 *   get:
 *     summary: Fetch last 8 audit log entries
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Audit logs list.
 */
router.get('/audit-logs', superAdminGuard, asyncHandler(userController.getAuditLogs));

/**
 * @openapi
 * /api/v1/users/insights:
 *   get:
 *     summary: Fetch proactive institutional insights
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Insights list.
 */
router.get('/insights', superAdminGuard, asyncHandler(userController.getInsights));

router.get('/:id', adminAndHodGuard, asyncHandler(userController.getUser));

/**
 * @openapi
 * /api/v1/users/{id}:
 *   put:
 *     summary: Update user details
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User updated.
 */
router.put('/:id', superAdminGuard, asyncHandler(userController.updateUser));

/**
 * @openapi
 * /api/v1/users/{id}:
 *   delete:
 *     summary: Deactivate user account (soft delete)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User deactivated.
 */
router.delete('/:id', superAdminGuard, asyncHandler(userController.deleteUser));

module.exports = router;
