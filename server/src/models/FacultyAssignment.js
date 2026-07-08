const mongoose = require('mongoose');

const facultyAssignmentSchema = new mongoose.Schema(
  {
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Faculty ID is required'],
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject ID is required'],
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch ID is required'],
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required (e.g., 2025-26)'],
      trim: true,
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: [1, 'Semester cannot be less than 1'],
      max: [12, 'Semester cannot exceed 12'],
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigner ID is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['ACTIVE', 'REVOKED'],
        message: '{VALUE} is not a valid status',
      },
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index with partial filter expression
facultyAssignmentSchema.index(
  { subjectId: 1, academicYear: 1, semester: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'ACTIVE' } }
);

const FacultyAssignment = mongoose.model('FacultyAssignment', facultyAssignmentSchema);

module.exports = FacultyAssignment;
