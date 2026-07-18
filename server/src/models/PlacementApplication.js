const mongoose = require('mongoose');

const placementApplicationSchema = new mongoose.Schema({
  driveId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PlacementDrive',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Applied', 'Shortlisted', 'Interviewing', 'Selected', 'Rejected', 'Withdrawn'],
    default: 'Applied'
  },
  resumeUrl: {
    type: String
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String // HR or Placement Cell notes
  }
}, { timestamps: true });

placementApplicationSchema.index({ driveId: 1, studentId: 1 }, { unique: true });
placementApplicationSchema.index({ studentId: 1 });

module.exports = mongoose.model('PlacementApplication', placementApplicationSchema);
