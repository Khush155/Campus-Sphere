const express = require('express');
const router = express.Router();
const facultyAssignmentController = require('../controllers/facultyAssignmentController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const ROLES = require('../constants/roles');

// Apply JWT authentication to all routes in this file
router.use(authMiddleware);

const managementGuard = roleMiddleware(ROLES.HOD, ROLES.COLLEGE_ADMIN, ROLES.SUPER_ADMIN);
const viewerGuard = roleMiddleware(ROLES.HOD, ROLES.COLLEGE_ADMIN, ROLES.SUPER_ADMIN, ROLES.FACULTY);
const facultyGuard = roleMiddleware(ROLES.FACULTY);

/**
 * @openapi
 * /api/v1/faculty-assignments:
 *   post:
 *     summary: Assign a faculty member to a subject
 *     security:
 *       - bearerAuth: []
 */
router.post('/', managementGuard, asyncHandler(facultyAssignmentController.assignFaculty));

/**
 * @openapi
 * /api/v1/faculty-assignments:
 *   get:
 *     summary: Get all faculty assignments for a branch
 *     security:
 *       - bearerAuth: []
 */
router.get('/', viewerGuard, asyncHandler(facultyAssignmentController.listAssignments));

/**
 * @openapi
 * /api/v1/faculty-assignments/my:
 *   get:
 *     summary: Get assignments for the logged-in faculty member
 *     security:
 *       - bearerAuth: []
 */
router.get('/my', facultyGuard, asyncHandler(facultyAssignmentController.listMyAssignments));

/**
 * @openapi
 * /api/v1/faculty-assignments/{id}/revoke:
 *   patch:
 *     summary: Revoke a faculty assignment
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id/revoke', managementGuard, asyncHandler(facultyAssignmentController.revokeAssignment));

module.exports = router;
