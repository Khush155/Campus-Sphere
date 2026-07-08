const feeService = require('../services/feeService');
const { createFeeStructureSchema, recordPaymentSchema } = require('../validators/feeValidator');
const { successResponse } = require('../utils/apiResponse');

/**
 * GET /api/v1/fees/structures
 * List fee structures with optional filters.
 */
const getFeeStructures = async (req, res, _next) => {
  const { courseId, branchId, semester, academicYear } = req.query;
  const structures = await feeService.getFeeStructures({ courseId, branchId, semester, academicYear });
  return successResponse(res, 200, 'Fee structures fetched successfully', structures);
};

/**
 * POST /api/v1/fees/structures
 * Create a new fee structure.
 */
const createFeeStructure = async (req, res, _next) => {
  const validatedBody = createFeeStructureSchema.parse(req.body);
  const structure = await feeService.createFeeStructure(validatedBody, req.user.id);
  return successResponse(res, 201, 'Fee structure created successfully', structure);
};

/**
 * GET /api/v1/fees/student/:studentId
 * Get all fee payments for a specific student.
 */
const getStudentFees = async (req, res, _next) => {
  const { studentId } = req.params;
  const result = await feeService.getStudentFees(studentId);
  return successResponse(res, 200, 'Student fee records fetched successfully', result);
};

/**
 * POST /api/v1/fees/payments
 * Record a new payment (idempotent — rejects duplicate transactionReference).
 */
const recordPayment = async (req, res, _next) => {
  const validatedBody = recordPaymentSchema.parse(req.body);
  const payment = await feeService.recordPayment(validatedBody, req.user.id);
  return successResponse(res, 201, 'Payment recorded successfully', payment);
};

/**
 * GET /api/v1/fees/payments/:paymentId/receipt
 * Stream a PDF receipt for a payment record.
 */
const downloadReceipt = async (req, res, next) => {
  const { paymentId } = req.params;
  // generatePaymentReceipt pipes directly to res — no need to call successResponse
  await feeService.generatePaymentReceipt(paymentId, res);
};

module.exports = {
  getFeeStructures,
  createFeeStructure,
  getStudentFees,
  recordPayment,
  downloadReceipt,
};
