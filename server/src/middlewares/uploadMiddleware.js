const multer = require('multer');
const AppError = require('../utils/AppError');

// Use memory storage so CSV contents are available as a Buffer (req.file.buffer)
const storage = multer.memoryStorage();

const csvFilter = (_req, file, cb) => {
  if (
    file.mimetype === 'text/csv' ||
    file.mimetype === 'application/vnd.ms-excel' ||
    file.originalname.toLowerCase().endsWith('.csv')
  ) {
    cb(null, true);
  } else {
    cb(new AppError('Only .csv files are accepted for bulk import.', 400, 'INVALID_FILE_TYPE'), false);
  }
};

/**
 * Multer middleware for CSV file uploads.
 * Accepts a single file under the field name "file".
 * Max size: 5 MB.
 */
const uploadCsv = multer({
  storage,
  fileFilter: csvFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
}).single('file');

/**
 * Express-compatible wrapper that converts multer callback errors to AppErrors.
 */
const csvUploadMiddleware = (req, res, next) => {
  uploadCsv(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError('CSV file exceeds the 5 MB size limit.', 400, 'FILE_TOO_LARGE'));
      }
      return next(new AppError(`Upload error: ${err.message}`, 400, 'UPLOAD_ERROR'));
    }
    if (err) {
      return next(err);
    }
    next();
  });
};

module.exports = { csvUploadMiddleware };
