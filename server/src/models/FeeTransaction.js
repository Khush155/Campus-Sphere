const mongoose = require('mongoose');

const feeTransactionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
    },
    feeStructureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeeStructure',
      required: [true, 'Fee Structure ID is required'],
    },
    amountPaid: {
      type: Number,
      required: [true, 'Amount paid is required'],
      min: [1, 'Amount paid must be greater than 0'],
    },
    transactionReference: {
      type: String,
      required: [true, 'Transaction reference is required'],
      unique: true, // Idempotency key: prevents double-charging
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['SUCCESS', 'FAILED', 'PENDING'],
        message: 'Invalid transaction status',
      },
      default: 'SUCCESS',
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: ['CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING', 'UPI', 'CASH'],
      required: [true, 'Payment method is required'],
    },
    remarks: {
      type: String,
      maxlength: 500,
    }
  },
  {
    timestamps: true,
  }
);

// Indexes for fast querying of a student's payment history
feeTransactionSchema.index({ studentId: 1, feeStructureId: 1 });

const FeeTransaction = mongoose.model('FeeTransaction', feeTransactionSchema);

module.exports = FeeTransaction;
