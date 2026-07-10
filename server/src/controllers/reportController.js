const reportService = require('../services/reportService');
const { successResponse } = require('../utils/apiResponse');

const getHodMetrics = async (req, res, _next) => {
  const departmentId = req.user.departmentId;
  const metrics = await reportService.getHodMetrics(departmentId);
  return successResponse(res, 200, 'HOD Metrics fetched successfully', metrics);
};

module.exports = {
  getHodMetrics,
};
