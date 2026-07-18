const mongoose = require('mongoose');

const placementDriveSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  package: {
    type: String // e.g., "12 LPA", "$100k"
  },
  driveDate: {
    type: Date,
    required: true
  },
  applicationDeadline: {
    type: Date,
    required: true
  },
  eligibility: {
    minCgpa: { type: Number, default: 0 },
    maxBacklogs: { type: Number, default: 0 },
    eligibleBranches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }]
  },
  status: {
    type: String,
    enum: ['Upcoming', 'Open', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Upcoming'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

placementDriveSchema.index({ status: 1 });
placementDriveSchema.index({ applicationDeadline: 1 });

module.exports = mongoose.model('PlacementDrive', placementDriveSchema);
