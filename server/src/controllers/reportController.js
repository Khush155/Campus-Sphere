const reportService = require('../services/reportService');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const { successResponse } = require('../utils/apiResponse');

/**
 * GET /api/v1/reports/types
 * Returns registered report keys, descriptions, and filters specifications.
 */
const getReportTypes = async (req, res, _next) => {
  const types = Object.entries(reportService.REPORT_TYPES).map(([key, val]) => ({
    key,
    label: val.label,
    description: val.description,
    filtersSchema: val.filtersSchema,
  }));
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

/**
 * GET /api/v1/reports/hod
 * Fetch HOD Overview & Reports metrics
 */
const getHodReports = async (req, res, _next) => {
  // Dummy data for now until fully implemented in the service
  const workloadDistribution = [
    { subject: 'Computer Networks', hours: 15 },
    { subject: 'Operating Systems', hours: 12 },
    { subject: 'Data Structures', hours: 18 },
  ];
  
  const vacantSubjects = [
    { name: 'Machine Learning', code: 'CS501', requiredFaculty: 2 },
    { name: 'Cloud Computing', code: 'CS502', requiredFaculty: 1 },
  ];

  return successResponse(res, 200, 'HOD reports retrieved successfully.', {
    workloadDistribution,
    vacantSubjects,
  });
};

module.exports = {
  getReportTypes,
  generateReport,
  getHodReports,
};
