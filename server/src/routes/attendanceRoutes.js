const express = require('express');
const attendanceController = require('../controllers/attendanceController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const ROLES = require('../constants/roles');

const router = express.Router();
router.use(authMiddleware);

// Single-record mark (legacy, backward compat)
router.post(
  '/',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD, ROLES.FACULTY),
  asyncHandler(attendanceController.markAttendance)
);

// Bulk mark for entire class in one call
router.post(
  '/bulk',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD, ROLES.FACULTY),
  asyncHandler(attendanceController.bulkMarkAttendance)
);

// Per-student attendance % summary with at-risk flag
router.get(
  '/summary',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD, ROLES.FACULTY),
  asyncHandler(attendanceController.getAttendanceSummary)
);

// HOD approves medical leave — exempts absence from % calculation
router.patch(
  '/:id/approve-medical',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD),
  asyncHandler(attendanceController.approveMedicalLeave)
);

// Raw records
router.get(
  '/',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT),
  asyncHandler(attendanceController.getAttendance)
);

module.exports = router;
