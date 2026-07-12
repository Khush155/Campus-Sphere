const express = require('express');
const admissionController = require('../controllers/admissionController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const ROLES = require('../constants/roles');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload dir exists
const uploadDir = path.join(__dirname, '../../uploads/photos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

const router = express.Router();

// Public route for students to apply
router.post('/apply', upload.single('photo'), asyncHandler(admissionController.apply));

// Protected routes for admins
router.use(authMiddleware);
router.use(roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN));

router.get('/queue', asyncHandler(admissionController.getPendingQueue));
router.post('/:id/action', asyncHandler(admissionController.actionApplication));
router.post('/:id/letter', asyncHandler(admissionController.downloadLetter));

module.exports = router;
