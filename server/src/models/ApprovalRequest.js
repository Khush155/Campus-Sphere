const mongoose = require('mongoose');

const approvalRequestSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, 'Request type is required'],
      enum: ['Faculty Registration', 'Department Creation', 'Leave Request', 'General'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actionedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    actionedAt: {
      type: Date,
    },
    color: {
      type: String,
      enum: ['primary', 'secondary', 'warning', 'info', 'error', 'success'],
      default: 'primary',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ApprovalRequest', approvalRequestSchema);
