const feeService = require('../services/feeService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../middlewares/asyncHandler');

const getStudentReceipts = asyncHandler(async (req, res) => {
  const receipts = await feeService.getStudentReceipts(req.user.id);
  return successResponse(res, 200, 'Fee receipts retrieved successfully', receipts);
});

const getReceiptById = asyncHandler(async (req, res) => {
  const receipt = await feeService.getReceiptById(req.params.receiptId, req.user);
  return successResponse(res, 200, 'Fee receipt retrieved successfully', receipt);
});

module.exports = {
  getStudentReceipts,
  getReceiptById,
};
