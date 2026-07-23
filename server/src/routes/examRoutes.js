const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validate');
const { createExamSchema, submitResultSchema } = require('../validators/examValidator');
const ROLES = require('../constants/roles');

router.use(authMiddleware);

router
  .route('/')
  .get(examController.getExams)
  .post(
    roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.FACULTY),
    validate(createExamSchema),
    examController.scheduleExam
  );

router.post(
  '/results',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.FACULTY),
  validate(submitResultSchema),
  examController.submitExamResult
);

router.get(
  '/:examId/results',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.FACULTY, ROLES.HOD),
  examController.getExamResults
);

router.get(
  '/gpa/:studentId',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.FACULTY, ROLES.STUDENT, ROLES.HOD),
  examController.calculateStudentGPA
);

module.exports = router;
