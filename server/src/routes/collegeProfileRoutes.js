const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const collegeProfileController = require('../controllers/collegeProfileController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const ROLES = require('../constants/roles');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');

const router = express.Router();

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = process.env.NODE_ENV === 'test' ? 'college-test' : 'college';
    const uploadPath = path.join(__dirname, `../uploads/${folder}`);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `logo-${uniqueSuffix}${ext}`);
  },
});

// Multer File Type Filter
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'Only JPEG, PNG, and WEBP image formats are allowed.',
        400,
        ERROR_CODES.VALIDATION_ERROR
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
}).single('logo');

// Multer Error Interceptor Middleware
const uploadLogoMiddleware = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(
          new AppError(
            'File size is too large. Max limit is 2MB.',
            400,
            ERROR_CODES.VALIDATION_ERROR
          )
        );
      }
      return next(new AppError(err.message, 400, ERROR_CODES.VALIDATION_ERROR));
    } else if (err) {
      return next(err);
    }
    next();
  });
};

// Route Security Guards
const superAdminGuard = [authMiddleware, roleMiddleware(ROLES.SUPER_ADMIN)];
const authGuard = [authMiddleware];

// Endpoints
router.get('/', authGuard, asyncHandler(collegeProfileController.getProfile));
router.put('/', superAdminGuard, asyncHandler(collegeProfileController.updateProfile));
router.post('/logo', superAdminGuard, uploadLogoMiddleware, asyncHandler(collegeProfileController.uploadLogo));

module.exports = router;
