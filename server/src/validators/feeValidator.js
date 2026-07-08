const { z } = require('zod');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const PAYMENT_METHODS = ['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE'];

/**
 * Schema for creating a new fee structure entry.
 */
const createFeeStructureSchema = z.object({
  courseId: z
    .string()
    .regex(objectIdRegex, 'Invalid course ID format'),
  branchId: z
    .string()
    .regex(objectIdRegex, 'Invalid branch ID format')
    .optional()
    .or(z.null()),
  semester: z
    .number({ invalid_type_error: 'Semester must be a number' })
    .int('Semester must be an integer')
    .min(1, 'Semester must be at least 1')
    .max(12, 'Semester cannot exceed 12'),
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .min(0, 'Fee amount cannot be negative'),
  label: z
    .string()
    .min(2, 'Label must be at least 2 characters')
    .max(100, 'Label cannot exceed 100 characters')
    .trim(),
  academicYear: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'Academic year must be in format YYYY-YY (e.g. 2025-26)')
    .trim(),
});

/**
 * Schema for recording a new fee payment.
 */
const recordPaymentSchema = z.object({
  studentId: z
    .string()
    .regex(objectIdRegex, 'Invalid student ID format'),
  feeStructureId: z
    .string()
    .regex(objectIdRegex, 'Invalid fee structure ID format'),
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .min(1, 'Payment amount must be greater than 0'),
  transactionReference: z
    .string()
    .min(3, 'Transaction reference must be at least 3 characters')
    .max(100, 'Transaction reference cannot exceed 100 characters')
    .trim(),
  paymentMethod: z.enum(PAYMENT_METHODS, {
    errorMap: () => ({ message: `Payment method must be one of: ${PAYMENT_METHODS.join(', ')}` }),
  }),
  remarks: z
    .string()
    .max(200, 'Remarks cannot exceed 200 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  paidAt: z
    .string()
    .datetime({ message: 'Invalid date format for paidAt' })
    .optional(),
});

module.exports = {
  createFeeStructureSchema,
  recordPaymentSchema,
};
