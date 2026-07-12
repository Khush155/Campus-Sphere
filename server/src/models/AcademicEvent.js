const mongoose = require('mongoose');

const academicEventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    type: {
      type: String,
      enum: {
        values: ['HOLIDAY', 'EXAM', 'EVENT', 'BREAK'],
        message: 'Type must be HOLIDAY, EXAM, EVENT, or BREAK',
      },
      required: [true, 'Event type is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    // Applicable to specific semester or branch. If null, applies to ALL.
    applicableBranch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
    },
    applicableSemester: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficiently querying events in a date range
academicEventSchema.index({ startDate: 1, endDate: 1 });

const AcademicEvent = mongoose.model('AcademicEvent', academicEventSchema);

module.exports = AcademicEvent;
