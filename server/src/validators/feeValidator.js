const { z } = require('zod');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const createFeeStructureSchema = z.object({
  title: z.string().min(2, 'Title is required').max(100),
  amount: z.coerce.number().min(0, 'Amount cannot be negative'),
  type: z.enum(['ACADEMIC', 'ADDITIONAL', 'DISCOUNT', 'FINE']),
  courseId: z.string().regex(objectIdRegex, 'Invalid course ID').optional().nullable(),
  branchId: z.string().regex(objectIdRegex, 'Invalid branch ID').optional().nullable(),
  semester: z.coerce.number().min(1).max(12).optional().nullable(),
  dueDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid due date' }),
  lateFeePerDay: z.coerce.number().min(0).optional().default(0),
  description: z.string().max(500).optional(),
});

const processPaymentSchema = z.object({
  feeStructureId: z.string().regex(objectIdRegex, 'Invalid fee structure ID'),
  amountPaid: z.coerce.number().min(1, 'Amount must be greater than 0'),
  transactionReference: z.string().min(3, 'Transaction reference required'),
  paymentMethod: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING', 'UPI', 'CASH']),
  remarks: z.string().max(500).optional(),
});

const createAdjustmentSchema = z.object({
  title: z.string().min(2, 'Title is required').max(100),
  amount: z.coerce.number().min(0, 'Amount cannot be negative'),
  type: z.enum(['DISCOUNT', 'FINE']),
  dueDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid due date' }),
  description: z.string().max(500).optional(),
});

module.exports = {
  createFeeStructureSchema,
  processPaymentSchema,
  createAdjustmentSchema,
};
