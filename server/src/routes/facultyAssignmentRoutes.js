const express = require('express');
const router = express.Router();
const facultyAssignmentController = require('../controllers/facultyAssignmentController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const ROLES = require('../constants/roles');

router.use(authMiddleware);

router
  .route('/')
  .get(facultyAssignmentController.getAssignments)
  .post(
    roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.FACULTY),
    facultyAssignmentController.createAssignment
  );

router
  .route('/:id')
  .put(
    roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.FACULTY),
    facultyAssignmentController.updateAssignment
  )
  .delete(
    roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.FACULTY),
    facultyAssignmentController.deleteAssignment
  );

router.patch(
  '/:id/status',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.FACULTY),
  facultyAssignmentController.updateAssignmentStatus
);

router.get(
  '/:id/submissions',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.FACULTY),
  facultyAssignmentController.getAssignmentSubmissions
);

router.patch(
  '/:id/submissions/:submissionId/grade',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.FACULTY),
  facultyAssignmentController.gradeSubmission
);

const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `assignment-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.zip', '.rar', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Allowed formats: PDF, ZIP, RAR, DOC, DOCX, TXT, PNG, JPG.'));
    }
  },
});

router.post(
  '/:id/submit',
  roleMiddleware(ROLES.STUDENT),
  upload.single('file'),
  facultyAssignmentController.submitAssignment
);

module.exports = router;
