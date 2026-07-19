const express = require('express');
const router = express.Router();

// Import controllers
const examController = require('../controllers/examController');

// Import authentication and authorization middlewares
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Import validation middleware
const validate = require('../middlewares/validate');
const { createExamSchema, submitResultSchema } = require('../validations/examValidation');

// Apply authentication globally to all exam routes
router.use(authMiddleware);

router
  .route('/')
  .get(examController.getExams)
  .post(
    roleMiddleware('FACULTY', 'ADMIN'),
    validate(createExamSchema),
    examController.scheduleExam
  );

// Route to submit/update student exam grades (restricted to Faculty & Admin)
router.post(
  '/results',
  roleMiddleware('FACULTY', 'ADMIN'),
  validate(submitResultSchema),
  examController.submitExamResult
);

// Route to fetch exam results by examId
router.get(
  '/:examId/results',
  examController.getExamResults
);

// Route to calculate GPA for a student (accessible to Admin, Faculty, and Students)
router.get(
  '/gpa/:studentId',
  roleMiddleware('ADMIN', 'FACULTY', 'STUDENT'),
  examController.calculateStudentGPA
);

module.exports = router;
