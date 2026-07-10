const requestService = require('../services/requestService');
const { createRequestSchema, respondRequestSchema, finalizeRequestSchema } = require('../validators/requestValidator');
const { successResponse } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');

const createRequest = async (req, res) => {
  const departmentId = req.user.departmentId;
  const parsedData = createRequestSchema.safeParse(req.body);
  if (!parsedData.success) {
    throw new AppError('Validation failed', 400, ERROR_CODES.VALIDATION_ERROR, parsedData.error.errors);
  }

  const crossRequest = await requestService.createRequest(parsedData.data, departmentId, req.user._id, req);
  return successResponse(res, 201, 'Cross-department request sent successfully', crossRequest);
};

const getSentRequests = async (req, res) => {
  const departmentId = req.user.departmentId;
  const requests = await requestService.getSentRequests(departmentId);
  return successResponse(res, 200, 'Sent requests fetched successfully', requests);
};

const getReceivedRequests = async (req, res) => {
  const departmentId = req.user.departmentId;
  const requests = await requestService.getReceivedRequests(departmentId);
  return successResponse(res, 200, 'Received requests fetched successfully', requests);
};

const respondToRequest = async (req, res) => {
  const departmentId = req.user.departmentId;
  const requestId = req.params.id;
  
  const parsedData = respondRequestSchema.safeParse(req.body);
  if (!parsedData.success) {
    throw new AppError('Validation failed', 400, ERROR_CODES.VALIDATION_ERROR, parsedData.error.errors);
  }

  const { action, responseNotes } = parsedData.data;
  const result = await requestService.respondToRequest(requestId, departmentId, action, responseNotes, req.user._id, req);
  
  const msg = action === 'APPROVE' 
    ? 'Request approved. Share the PIN with the requester to finalize.' 
    : 'Request rejected.';
    
  return successResponse(res, 200, msg, result);
};

const finalizeRequest = async (req, res) => {
  const departmentId = req.user.departmentId;
  const requestId = req.params.id;
  
  const parsedData = finalizeRequestSchema.safeParse(req.body);
  if (!parsedData.success) {
    throw new AppError('Validation failed', 400, ERROR_CODES.VALIDATION_ERROR, parsedData.error.errors);
  }

  const crossRequest = await requestService.finalizeRequest(requestId, departmentId, parsedData.data.pin, req.user._id, req);
  return successResponse(res, 200, 'Request finalized and faculty assigned successfully', crossRequest);
};

module.exports = {
  createRequest,
  getSentRequests,
  getReceivedRequests,
  respondToRequest,
  finalizeRequest,
};
