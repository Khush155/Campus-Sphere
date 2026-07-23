const documentService = require('../services/documentService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../middlewares/asyncHandler');

/**
 * @desc    Submit a document request
 * @route   POST /api/v1/documents
 * @access  Private/Student
 */
const createDocumentRequest = asyncHandler(async (req, res) => {
  const doc = await documentService.createDocumentRequest(req.body, req.user);
  return successResponse(res, 201, 'Document request submitted successfully', doc);
});

/**
 * @desc    List document requests
 * @route   GET /api/v1/documents
 * @access  Private/SuperAdmin/HOD/Student
 */
const getDocumentRequests = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const result = await documentService.getDocumentRequests(req.query, req.user);
  return successResponse(res, 200, 'Document requests retrieved successfully', result.data, {
    total: result.meta.total,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

/**
 * @desc    Approve, reject, or mark as processed
 * @route   PATCH /api/v1/documents/:id/status
 * @access  Private/SuperAdmin/HOD
 */
const updateDocumentStatus = asyncHandler(async (req, res) => {
  const doc = await documentService.updateDocumentStatus(req.params.id, req.body, req.user, req);
  return successResponse(res, 200, 'Document request updated successfully', doc);
});

module.exports = {
  createDocumentRequest,
  getDocumentRequests,
  updateDocumentStatus,
};
