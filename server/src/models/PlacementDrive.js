const mongoose = require('mongoose');

const placementDriveSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  role: { type: String, required: true },
  packageInfo: { type: String },
  eligibilityCriteria: {
    cgpa: { type: Number },
    backlogs: { type: Number }
  },
  driveDate: { type: Date, required: true },
  applicationDeadline: { type: Date },
  jobDescription: { type: String, trim: true },
  selectionProcess: { type: String, trim: true }, // e.g., "Aptitude → Technical → HR"
  driveType: { type: String, enum: ['PLACEMENT', 'INTERNSHIP'], default: 'PLACEMENT' },
  departmentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }],
  eligibleBranches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }],
  eligibleStanding: {
    type: String,
    enum: ['FINAL_YEAR', 'PRE_FINAL_YEAR', 'ALL_YEARS'],
    default: 'FINAL_YEAR',
  },
  graduatingBatchYear: { type: Number },
  status: { type: String, enum: ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'], default: 'UPCOMING' },
}, { timestamps: true });

module.exports = mongoose.model('PlacementDrive', placementDriveSchema);
