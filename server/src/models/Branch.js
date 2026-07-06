const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Branch name is required'],
      trim: true,
      maxlength: [100, 'Branch name cannot exceed 100 characters'],
    },
    code: {
      type: String,
      required: [true, 'Branch code is required'],
      trim: true,
      uppercase: true,
      maxlength: [15, 'Branch code cannot exceed 15 characters'],
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound Unique Index: prevents duplicate branch codes under the same Course
branchSchema.index({ courseId: 1, code: 1 }, { unique: true });

const Branch = mongoose.model('Branch', branchSchema);

module.exports = Branch;
