const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const { csvUploadMiddleware } = require('../middlewares/uploadMiddleware');
const ROLES = require('../constants/roles');

const router = express.Router();

// Super Admin access guard
const superAdminGuard = [
  authMiddleware,
  roleMiddleware(ROLES.SUPER_ADMIN),
];

// Viewer access guard for listing users (HOD needs it to list faculty)
const viewerGuard = [
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
router.get('/', viewerGuard, asyncHandler(userController.getUsers));

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
 * /api/v1/users/export:
 *   get:
 *     summary: Export filtered users to CSV
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV stream
 */
router.get('/export', superAdminGuard, asyncHandler(userController.exportUsers));

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

/**
 * @openapi
 * /api/v1/users/bulk-import:
 *   post:
 *     summary: Bulk import users from a CSV file
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Import summary with row-level errors.
 */
router.post(
  '/bulk-import',
  superAdminGuard,
  csvUploadMiddleware,
  asyncHandler(userController.bulkImportStudents)
);

/**
 * @openapi
 * /api/v1/users/bulk-import-json:
 *   post:
 *     summary: Bulk import users from a JSON payload (after dry-run)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Import summary.
 */
router.post('/bulk-import-json', superAdminGuard, asyncHandler(userController.bulkImportJson));

router.get('/:id', superAdminGuard, asyncHandler(userController.getUser));

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
