const mongoose = require('mongoose');

const facultyAssignmentSchema = new mongoose.Schema(
  {
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Faculty reference is required'],
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject reference is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['ACTIVE', 'REVOKED'],
        message: 'Status must be ACTIVE or REVOKED',
      },
      default: 'ACTIVE',
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned by user reference is required'],
    },
    revokedAt: {
      type: Date,
    },
    revokedReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Revoke reason cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Enforce only one ACTIVE assignment per subject at a time
facultyAssignmentSchema.index(
  { subjectId: 1 },
  { unique: true, partialFilterExpression: { status: 'ACTIVE' } }
);

// Index to quickly query all assignments for a faculty member
facultyAssignmentSchema.index({ facultyId: 1, status: 1 });

const FacultyAssignment = mongoose.model('FacultyAssignment', facultyAssignmentSchema);

module.exports = FacultyAssignment;
