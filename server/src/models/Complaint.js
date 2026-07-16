const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  note: { type: String, trim: true },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const complaintSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['ACADEMIC', 'INFRASTRUCTURE', 'HARASSMENT', 'ADMINISTRATIVE', 'FACULTY_CONDUCT', 'OTHER'],
    required: true,
  },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  status: {
    type: String,
    enum: ['OPEN', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ESCALATED'],
    default: 'OPEN',
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM',
  },
  resolutionRemarks: { type: String, trim: true },
  // Immutable audit trail of every status change
  statusHistory: [statusHistorySchema],
  // SLA: auto-set 7 calendar days from submission date
  slaDeadline: { type: Date },
  slaBreached: { type: Boolean, default: false },
  // HOD can delegate complaint investigation to a faculty member
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date },
}, { timestamps: true });

// Auto-set SLA deadline 7 days from creation
complaintSchema.pre('save', function (next) {
  if (this.isNew && !this.slaDeadline) {
    const deadline = new Date(this.createdAt || Date.now());
    deadline.setDate(deadline.getDate() + 7);
    this.slaDeadline = deadline;
  }
  next();
});

complaintSchema.index({ departmentId: 1, status: 1, createdAt: -1 });
complaintSchema.index({ slaDeadline: 1, slaBreached: 1 });

module.exports = mongoose.model('Complaint', complaintSchema);
