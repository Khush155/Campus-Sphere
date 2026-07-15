const pdfService = require('../services/pdfService');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');

/**
 * Controller to generate and stream a single ID card.
 */
const generateIdCard = async (req, res, _next) => {
  await pdfService.generateIdCardStream(req.params.userId, res);
};

/**
 * Controller to generate and stream bulk ID cards based on role or department query filters.
 */
const generateBulkIdCards = async (req, res, _next) => {
  const filters = {
    departmentId: req.query.departmentId || null,
    role: req.query.role || null,
  };
  await pdfService.generateBulkIdCardsStream(filters, res);
};

/**
 * Controller to generate and stream formal student certificates.
 */
const generateCertificate = async (req, res, _next) => {
  const { studentId, type, purpose } = req.body;
  
  if (!studentId || !type) {
    throw new AppError(
      'Student ID and Certificate Type are required.',
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  await pdfService.generateCertificateStream(
    { studentId, type, purpose },
    req.user.id,
    res
  );
};

module.exports = {
  generateIdCard,
  generateBulkIdCards,
  generateCertificate,
};
