const placementService = require('../services/placementService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../middlewares/asyncHandler');

/**
 * @desc    Create a placement drive
 * @route   POST /api/v1/placements/drives
 * @access  Private/SuperAdmin/HOD
 */
const createDrive = asyncHandler(async (req, res) => {
  const drive = await placementService.createDrive(req.body, req.user);
  return successResponse(res, 201, 'Placement drive created successfully', drive);
});

/**
 * @desc    List placement drives
 * @route   GET /api/v1/placements/drives
 * @access  Private/SuperAdmin/HOD/Student
 */
const getDrives = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const result = await placementService.getDrives(req.query, req.user);
  return successResponse(res, 200, 'Placement drives retrieved successfully', result.data, {
    total: result.meta.total,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

/**
 * @desc    Student applies for drive
 * @route   POST /api/v1/placements/drives/:driveId/apply
 * @access  Private/Student
 */
const applyForDrive = asyncHandler(async (req, res) => {
  const app = await placementService.applyForDrive(req.params.driveId, req.user);
  return successResponse(res, 201, 'Application submitted successfully', app);
});

/**
 * @desc    HOD/Admin updates interview round result
 * @route   PATCH /api/v1/placements/applications/:appId/round
 * @access  Private/SuperAdmin/HOD
 */
const updateApplicationRound = asyncHandler(async (req, res) => {
  const app = await placementService.updateApplicationRound(req.params.appId, req.body, req.user, req);
  return successResponse(res, 200, 'Application round result updated successfully', app);
});

/**
 * @desc    Finalize placement application
 * @route   PATCH /api/v1/placements/applications/:appId/finalize
 * @access  Private/SuperAdmin/HOD
 */
const finalizeApplication = asyncHandler(async (req, res) => {
  const app = await placementService.finalizeApplication(req.params.appId, req.body, req.user, req);
  return successResponse(res, 200, 'Application finalized successfully', app);
});

/**
 * @desc    HOD lists placement applications
 * @route   GET /api/v1/placements/applications
 * @access  Private/SuperAdmin/HOD
 */
const getApplications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const result = await placementService.getApplications(req.query, req.user);
  return successResponse(res, 200, 'Applications retrieved successfully', result.data, {
    total: result.meta.total,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

/**
 * @desc    HOD issues NOC
 * @route   PATCH /api/v1/placements/applications/:appId/noc
 * @access  Private/SuperAdmin/HOD
 */
const issueNoc = asyncHandler(async (req, res) => {
  const app = await placementService.issueNoc(req.params.appId, req.user, req);
  return successResponse(res, 200, 'NOC issued successfully', app);
});

module.exports = {
  createDrive,
  getDrives,
  applyForDrive,
  updateApplicationRound,
  finalizeApplication,
  getApplications,
  issueNoc,
};
