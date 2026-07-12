const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Fee title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Fee amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    type: {
      type: String,
      enum: {
        values: ['ACADEMIC', 'ADDITIONAL', 'DISCOUNT', 'FINE'],
        message: 'Invalid fee type',
      },
      required: [true, 'Fee type is required'],
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
    },
    semester: {
      type: Number,
      min: 1,
      max: 12,
      default: null,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // If populated, this fee targets an individual student
      default: null,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    lateFeePerDay: {
      type: Number,
      default: 0,
      min: [0, 'Late fee cannot be negative'],
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes to speed up queries when finding fees for a specific student's profile
feeStructureSchema.index({ studentId: 1, courseId: 1, branchId: 1, semester: 1 });
feeStructureSchema.index({ type: 1 });

const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema);

module.exports = FeeStructure;
