const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  proofUrl: {
    type: String // Optional medical certificate etc.
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Faculty or HOD
  },
  reviewNotes: {
    type: String
  }
}, { timestamps: true });

leaveRequestSchema.index({ studentId: 1, status: 1 });
leaveRequestSchema.index({ departmentId: 1, status: 1 });

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
