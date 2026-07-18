const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const studentController = require('../controllers/studentController');

// All routes require authentication and STUDENT role
router.use(authMiddleware);
router.use(roleMiddleware('STUDENT'));

router.get('/dashboard/summary', studentController.getDashboardSummary);
router.get('/academics', studentController.getAcademics);
router.get('/timetable', studentController.getTimetable);
router.get('/examinations', studentController.getUpcomingExams);
router.get('/examinations/results', studentController.getExamResults);

module.exports = router;
