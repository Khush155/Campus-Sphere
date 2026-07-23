const requestService = require('../services/requestService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../middlewares/asyncHandler');

/**
 * @desc    Create cross-department request
 * @route   POST /api/v1/cross-dept-requests
 * @access  Private/HOD
 */
const createRequest = asyncHandler(async (req, res) => {
  const departmentId = req.user.departmentId;
  const crossRequest = await requestService.createRequest(req.body, departmentId, req.user.id, req);
  return successResponse(res, 201, 'Cross-department request sent successfully', crossRequest);
});

/**
 * @desc    Get sent requests
 * @route   GET /api/v1/cross-dept-requests/sent
 * @access  Private/HOD
 */
const getSentRequests = asyncHandler(async (req, res) => {
  const departmentId = req.user.departmentId;
  const requests = await requestService.getSentRequests(departmentId);
  return successResponse(res, 200, 'Sent requests fetched successfully', requests);
});

/**
 * @desc    Get received requests
 * @route   GET /api/v1/cross-dept-requests/received
 * @access  Private/HOD
 */
const getReceivedRequests = asyncHandler(async (req, res) => {
  const departmentId = req.user.departmentId;
  const requests = await requestService.getReceivedRequests(departmentId);
  return successResponse(res, 200, 'Received requests fetched successfully', requests);
});

/**
 * @desc    Respond to cross-department request
 * @route   POST /api/v1/cross-dept-requests/:id/respond
 * @access  Private/HOD
 */
const respondToRequest = asyncHandler(async (req, res) => {
  const departmentId = req.user.departmentId;
  const requestId = req.params.id;
  const { action, responseNotes } = req.body;

  const result = await requestService.respondToRequest(requestId, departmentId, action, responseNotes, req.user.id, req);
  
  const msg = action === 'APPROVE' 
    ? 'Request approved. Share the PIN with the requester to finalize.' 
    : 'Request rejected.';
    
  return successResponse(res, 200, msg, result);
});

/**
 * @desc    Finalize cross-department request
 * @route   POST /api/v1/cross-dept-requests/:id/finalize
 * @access  Private/HOD
 */
const finalizeRequest = asyncHandler(async (req, res) => {
  const departmentId = req.user.departmentId;
  const requestId = req.params.id;
  
  const crossRequest = await requestService.finalizeRequest(requestId, departmentId, req.body.pin, req.user.id, req);
  return successResponse(res, 200, 'Request finalized and faculty assigned successfully', crossRequest);
});

module.exports = {
  createRequest,
  getSentRequests,
  getReceivedRequests,
  respondToRequest,
  finalizeRequest,
};
