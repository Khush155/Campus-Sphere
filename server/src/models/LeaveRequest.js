/* eslint-disable no-console */
const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  leaveType: { type: String, enum: ['SICK', 'CASUAL', 'ACADEMIC', 'EMERGENCY', 'MEDICAL'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String, required: true, trim: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  remarks: { type: String, trim: true }, // HOD rejection/approval note
  // Medical leave can be granted with minimum attendance override
  isMedicalOverride: { type: Boolean, default: false },
  medicalCertificateRef: { type: String }, // URL or reference to uploaded certificate
  // Auto-computed fields
  totalDays: { type: Number, min: 0 },
}, { timestamps: true });

// Auto-compute totalDays before save
leaveRequestSchema.pre('save', function (next) {
  if (this.startDate && this.endDate) {
    const diffTime = Math.abs(this.endDate - this.startDate);
    this.totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
  }
  next();
});

// Index for fast overlap queries per user
leaveRequestSchema.index({ userId: 1, startDate: 1, endDate: 1 });
leaveRequestSchema.index({ departmentId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
