const feeService = require('../services/feeService');
const { createFeeStructureSchema, processPaymentSchema, createAdjustmentSchema } = require('../validators/feeValidator');
const { successResponse } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const { generateFeeReceipt } = require('../utils/pdfService');
const FeeTransaction = require('../models/FeeTransaction');

const createStructure = async (req, res) => {
  const parsedData = createFeeStructureSchema.safeParse(req.body);
  if (!parsedData.success) {
    throw new AppError('Validation failed', 400, ERROR_CODES.VALIDATION_ERROR, parsedData.error.errors);
  }

  const structure = await feeService.createFeeStructure(parsedData.data, req.user.id, req);
  return successResponse(res, 201, 'Fee structure created successfully', structure);
};

const updateStructure = async (req, res) => {
  const parsedData = createFeeStructureSchema.safeParse(req.body);
  if (!parsedData.success) {
    throw new AppError('Validation failed', 400, ERROR_CODES.VALIDATION_ERROR, parsedData.error.errors);
  }

  const structure = await feeService.updateFeeStructure(req.params.id, parsedData.data, req.user.id, req);
  return successResponse(res, 200, 'Fee structure updated successfully', structure);
};

const getStructures = async (req, res) => {
  // Can filter by courseId or branchId if passed in query
  const filters = {};
  if (req.query.courseId) filters.courseId = req.query.courseId;
  if (req.query.branchId) filters.branchId = req.query.branchId;

  const structures = await feeService.getFeeStructures(filters);
  return successResponse(res, 200, 'Fee structures fetched', structures);
};

const getStudentLedger = async (req, res) => {
  const studentId = req.params.studentId;
  const ledger = await feeService.getStudentFeeLedger(studentId);
  return successResponse(res, 200, 'Student fee ledger fetched', ledger);
};

const processPayment = async (req, res) => {
  const studentId = req.params.studentId;
  const parsedData = processPaymentSchema.safeParse(req.body);
  
  if (!parsedData.success) {
    throw new AppError('Validation failed', 400, ERROR_CODES.VALIDATION_ERROR, parsedData.error.errors);
  }

  const transaction = await feeService.processPayment(studentId, parsedData.data, req.user.id, req);
  return successResponse(res, 201, 'Payment processed successfully', transaction);
};

const downloadReceipt = async (req, res) => {
  const transactionId = req.params.transactionId;
  
  const transaction = await FeeTransaction.findById(transactionId)
    .populate('studentId')
    .populate('feeStructureId');

  if (!transaction || transaction.status !== 'SUCCESS') {
    throw new AppError('Valid successful transaction not found', 404, ERROR_CODES.NOT_FOUND);
  }

  // Ensure students can only download their own receipts
  if (req.user.role === 'STUDENT' && transaction.studentId._id.toString() !== req.user.id.toString()) {
    throw new AppError('Unauthorized access to receipt', 403, ERROR_CODES.FORBIDDEN);
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=Receipt_${transaction.transactionReference}.pdf`);

  generateFeeReceipt(transaction, res);
};

const createAdjustment = async (req, res) => {
  const studentId = req.params.studentId;
  const parsedData = createAdjustmentSchema.safeParse(req.body);
  if (!parsedData.success) {
    throw new AppError('Validation failed', 400, ERROR_CODES.VALIDATION_ERROR, parsedData.error.errors);
  }

  const structureData = {
    ...parsedData.data,
    studentId,
  };

  const structure = await feeService.createFeeStructure(structureData, req.user.id, req);
  return successResponse(res, 201, 'Adjustment created successfully', structure);
};

module.exports = {
  createStructure,
  updateStructure,
  getStructures,
  getStudentLedger,
  processPayment,
  downloadReceipt,
  createAdjustment,
};
