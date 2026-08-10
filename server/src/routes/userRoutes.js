const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const ROLES = require('../constants/roles');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const router = express.Router();

// Super Admin access guard
const superAdminGuard = [
  authMiddleware,
  roleMiddleware(ROLES.SUPER_ADMIN),
];

// Wide Admin access guard
const adminGuard = [
  authMiddleware,
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN),
];

// Admin and HOD access guard for read operations
const adminAndHodGuard = [
  authMiddleware,
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.HOD, ROLES.FACULTY),
];

// Update guard for super admins, college admins, and HODs
const updateGuard = [
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
router.get('/me', authMiddleware, asyncHandler(userController.getMyProfile));
router.put('/me', authMiddleware, asyncHandler(userController.updateMyProfile));

router.get('/', adminAndHodGuard, asyncHandler(userController.getUsers));
router.post('/import-students', adminAndHodGuard, upload.single('file'), asyncHandler(userController.importStudents));

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
router.get('/audit-logs', adminGuard, asyncHandler(userController.getAuditLogs));

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
router.get('/insights', adminGuard, asyncHandler(userController.getInsights));

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
router.put('/:id', updateGuard, asyncHandler(userController.updateUser));

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
router.delete('/:id', adminGuard, asyncHandler(userController.deleteUser));

/**
 * @openapi
 * /api/v1/users/{id}/permanent:
 *   delete:
 *     summary: Permanently delete a user account (hard delete — irreversible)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User permanently deleted.
 */
router.delete('/:id/permanent', superAdminGuard, asyncHandler(userController.hardDeleteUser));

module.exports = router;
