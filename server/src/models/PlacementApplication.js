const mongoose = require('mongoose');

const interviewRoundSchema = new mongoose.Schema({
  round: { type: Number, required: true }, // 1, 2, 3...
  roundName: { type: String, trim: true }, // e.g., "Aptitude Test", "Technical", "HR"
  status: {
    type: String,
    enum: ['SCHEDULED', 'CLEARED', 'FAILED', 'ABSENT', 'PENDING'],
    default: 'PENDING',
  },
  score: { type: Number },
  feedback: { type: String, trim: true },
  date: { type: Date },
}, { _id: true });

const placementApplicationSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  driveId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlacementDrive', required: true },
  status: {
    type: String,
    enum: ['APPLIED', 'SHORTLISTED', 'IN_PROCESS', 'SELECTED', 'REJECTED', 'WAITLISTED', 'WITHDRAWN'],
    default: 'APPLIED',
  },
  currentRound: { type: Number, default: 0 },
  interviewRounds: [interviewRoundSchema],
  finalStatus: {
    type: String,
    enum: ['PENDING', 'SELECTED', 'REJECTED', 'WAITLISTED', 'WITHDRAWN'],
    default: 'PENDING',
  },
  // Package offered (if selected)
  offerPackageLPA: { type: Number },
  offerLetterRef: { type: String }, // URL/path to offer letter PDF
  // Eligibility snapshot at time of application
  cgpaAtApplication: { type: Number },
  backlogsAtApplication: { type: Number, default: 0 },
  // NOC for internships/placements
  isNocIssued: { type: Boolean, default: false },
  nocIssueDate: { type: Date },
}, { timestamps: true });

// Unique: a student can apply to a drive only once
placementApplicationSchema.index({ studentId: 1, driveId: 1 }, { unique: true });
placementApplicationSchema.index({ driveId: 1, status: 1 });

module.exports = mongoose.model('PlacementApplication', placementApplicationSchema);
