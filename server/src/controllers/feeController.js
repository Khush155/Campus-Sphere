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

const payStudentFee = asyncHandler(async (req, res) => {
  const receipt = await feeService.payStudentFee(req.user);
  return successResponse(res, 200, 'Fee payment processed successfully', receipt);
});

const generateBulkFees = asyncHandler(async (req, res) => {
  const result = await feeService.generateBulkFees(req.body, req.user);
  return successResponse(res, 200, 'Bulk fees generated successfully', result);
});

module.exports = {
  getStudentReceipts,
  getReceiptById,
  payStudentFee,
  generateBulkFees,
};
