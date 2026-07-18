const reportService = require('../services/reportService');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const { successResponse } = require('../utils/apiResponse');

/**
 * GET /api/v1/reports/types
 * Returns registered report keys, descriptions, and filters specifications.
 */
const getReportTypes = async (req, res, _next) => {
  let types = Object.entries(reportService.REPORT_TYPES).map(([key, val]) => ({
    key,
    label: val.label,
    description: val.description,
    filtersSchema: val.filtersSchema,
  }));
  if (req.user.role === 'COLLEGE_ADMIN') {
    types = types.filter((t) => t.key !== 'AUDIT_LOG_EXPORT');
  }
  return successResponse(res, 200, 'Report types retrieved successfully.', types);
};

/**
 * POST /api/v1/reports/generate
 * Generates data set and pipes down format attachment (CSV / PDF).
 */
const generateReport = async (req, res, _next) => {
  const { type, format, filters } = req.body;

  if (!type || !format) {
    throw new AppError(
      'Report type and format are required parameters.',
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  if (req.user.role === 'COLLEGE_ADMIN' && type === 'AUDIT_LOG_EXPORT') {
    throw new AppError(
      'College Admins do not have permission to access Audit Log reports.',
      403,
      ERROR_CODES.FORBIDDEN
    );
  }

  if (!reportService.REPORT_TYPES[type]) {
    throw new AppError('Invalid report type specified.', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  if (!['CSV', 'PDF'].includes(format)) {
    throw new AppError(
      'Unsupported file format. Use CSV or PDF.',
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  await reportService.exportReport({ type, format, filters }, res);
};

module.exports = {
  getReportTypes,
  generateReport,
};
