const express = require('express');
const academicSessionController = require('../controllers/academicSessionController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const ROLES = require('../constants/roles');

const router = express.Router();

const superAdminGuard = [
  authMiddleware,
  roleMiddleware(ROLES.SUPER_ADMIN),
];

const adminGuard = [
  authMiddleware,
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN),
];

const authGuard = [authMiddleware];

// Public/Shared active session lookup (Any authenticated user)
router.get('/active', authGuard, asyncHandler(academicSessionController.getActiveSession));

// Session listing (Admins)
router.get('/', adminGuard, asyncHandler(academicSessionController.getSessions));

// SUPER_ADMIN configuration changes
router.post('/', superAdminGuard, asyncHandler(academicSessionController.createSession));
router.put('/:id/activate', superAdminGuard, asyncHandler(academicSessionController.activateSession));

module.exports = router;
