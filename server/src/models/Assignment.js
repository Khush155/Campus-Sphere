const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Assignment title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Assignment description is required'],
      trim: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject reference is required'],
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
    },
    group: {
      type: String,
      required: [true, 'Class group/section is required'],
      trim: true,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    maxMarks: {
      type: Number,
      required: [true, 'Maximum marks are required'],
      default: 100,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader user reference is required'],
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED'],
      default: 'PUBLISHED',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes to speed up lookups
assignmentSchema.index({ subjectId: 1, group: 1 });
assignmentSchema.index({ uploadedBy: 1 });

const Assignment = mongoose.model('Assignment', assignmentSchema);

module.exports = Assignment;
