const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
      maxlength: [100, 'Subject name cannot exceed 100 characters'],
    },
    code: {
      type: String,
      required: [true, 'Subject code is required'],
      trim: true,
      uppercase: true,
      maxlength: [15, 'Subject code cannot exceed 15 characters'],
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Subject must belong to a department'],
    },
    credits: {
      type: Number,
      required: [true, 'Subject credits are required'],
      min: [1, 'Credits must be at least 1'],
      max: [6, 'Credits cannot exceed 6'],
    },
    type: {
      type: String,
      enum: {
        values: ['THEORY', 'PRACTICAL', 'SESSIONAL'],
        message: 'Type must be THEORY, PRACTICAL, or SESSIONAL',
      },
      required: [true, 'Subject type is required'],
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch reference is required'],
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: [1, 'Semester must be at least 1'],
      max: [12, 'Semester cannot exceed 12'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound Unique Index: ensures subject codes are unique within their specific Branch
subjectSchema.index({ branchId: 1, code: 1 }, { unique: true });
subjectSchema.index({ departmentId: 1, semester: 1 });

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;
