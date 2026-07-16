const express = require('express');
const examinationController = require('../controllers/examinationController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const ROLES = require('../constants/roles');

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const router = express.Router();
router.use(authMiddleware);

// Create exam with syllabus and datesheet fields (with optional PDF uploads)
router.post(
  '/',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD),
  upload.fields([{ name: 'datesheet' }, { name: 'seatingPlan' }]),
  asyncHandler(examinationController.createExamination)
);

// List exams with pagination
router.get(
  '/',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT),
  asyncHandler(examinationController.getExaminations)
);

// Batch-publish results with auto-grading (triggers remedial class flag)
router.post(
  '/:examId/results/batch',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD, ROLES.FACULTY),
  asyncHandler(examinationController.batchPublishResults)
);

// Class-level statistics: pass %, grade distribution, averages
router.get(
  '/:examId/stats',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD, ROLES.FACULTY),
  asyncHandler(examinationController.getExamStats)
);

// Legacy single-student result publish
router.post(
  '/:examId/results',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD, ROLES.FACULTY),
  asyncHandler(examinationController.publishResult)
);

module.exports = router;
