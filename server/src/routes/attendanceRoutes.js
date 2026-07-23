const express = require('express');
const attendanceController = require('../controllers/attendanceController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validate');
const { submitAttendanceSchema, markAttendanceSchema } = require('../validators/attendanceValidator');
const ROLES = require('../constants/roles');

const router = express.Router();
router.use(authMiddleware);

// Route to submit/update bulk attendance sheet (Faculty)
router.post(
  '/',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.FACULTY),
  validate(submitAttendanceSchema),
  attendanceController.submitAttendance
);

// Route to get a student's attendance summary
router.get(
  '/student/:studentId',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.FACULTY, ROLES.STUDENT),
  attendanceController.getStudentAttendanceSummary
);

// Single-record mark (legacy, backward compat)
router.post(
  '/single',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD, ROLES.FACULTY),
  validate(markAttendanceSchema),
  attendanceController.markAttendance
);

// Bulk mark for HOD / Faculty
router.post(
  '/bulk',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD, ROLES.FACULTY),
  validate(submitAttendanceSchema),
  attendanceController.bulkMarkAttendance
);

// Per-student attendance % summary with at-risk flag for HOD
router.get(
  '/summary',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD, ROLES.FACULTY),
  attendanceController.getAttendanceSummary
);

// HOD approves medical leave
router.patch(
  '/:id/approve-medical',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD),
  attendanceController.approveMedicalLeave
);

// Retrieve existing attendance sheet
router.get(
  '/',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT),
  async (req, res, next) => {
    if (req.query.group) {
      return attendanceController.getAttendanceSheet(req, res, next);
    }
    return attendanceController.getAttendance(req, res, next);
  }
);

module.exports = router;
