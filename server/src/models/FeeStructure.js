const mongoose = require('mongoose');

/**
 * FeeStructure defines the amount charged per course/branch/semester/academic year.
 * A null branchId means the structure applies to all branches of that course.
 */
const feeStructureSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course is required for a fee structure'],
      index: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null, // null = applies to entire course
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: [1, 'Semester must be at least 1'],
      max: [12, 'Semester cannot exceed 12'],
    },
    amount: {
      type: Number,
      required: [true, 'Fee amount is required'],
      min: [0, 'Fee amount cannot be negative'],
    },
    label: {
      type: String,
      required: [true, 'Fee label is required'],
      trim: true,
      maxlength: [100, 'Label cannot exceed 100 characters'],
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required (e.g. 2025-26)'],
      trim: true,
      match: [/^\d{4}-\d{2}$/, 'Academic year must be in the format YYYY-YY (e.g. 2025-26)'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent exact duplicate fee structures
feeStructureSchema.index(
  { courseId: 1, branchId: 1, semester: 1, academicYear: 1, label: 1 },
  { unique: true }
);

const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema);

module.exports = FeeStructure;
