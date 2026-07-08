const mongoose = require('mongoose');

/**
 * FeePayment records a single payment made by a student against a FeeStructure.
 * transactionReference is unique to prevent double-charging (idempotency key).
 */
const feePaymentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true,
    },
    feeStructureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeeStructure',
      required: [true, 'Fee structure reference is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [1, 'Payment amount must be greater than 0'],
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
    transactionReference: {
      type: String,
      required: [true, 'Transaction reference is required'],
      unique: true, // Idempotency key — prevents duplicate payments
      trim: true,
      maxlength: [100, 'Transaction reference cannot exceed 100 characters'],
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE'],
        message: 'Invalid payment method',
      },
      required: [true, 'Payment method is required'],
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: [200, 'Remarks cannot exceed 200 characters'],
      default: '',
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recording admin ID is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Secondary index for listing all payments by student
feePaymentSchema.index({ studentId: 1, paidAt: -1 });

const FeePayment = mongoose.model('FeePayment', feePaymentSchema);

module.exports = FeePayment;
