const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');

router.use(authMiddleware);

// FACULTY routes
router.get(
  '/faculty/subjects',
  roleMiddleware('FACULTY'),
  asyncHandler(attendanceController.getAssignedSubjects)
);

router.get(
  '/faculty/students/:subjectId',
  roleMiddleware('FACULTY'),
  asyncHandler(attendanceController.getEnrolledStudents)
);

router.post(
  '/',
  roleMiddleware('FACULTY'),
  asyncHandler(attendanceController.markAttendance)
);

// STUDENT routes
router.get(
  '/student/summary',
  roleMiddleware('STUDENT'),
  asyncHandler(attendanceController.getStudentSummary)
);

router.post(
  '/student/planner',
  roleMiddleware('STUDENT'),
  asyncHandler(attendanceController.predictHolidayImpact)
);

module.exports = router;
