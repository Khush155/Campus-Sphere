const mongoose = require('mongoose');

const crossDeptRequestSchema = new mongoose.Schema(
  {
    requesterDeptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Requester Department is required'],
    },
    targetDeptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Target Department is required'],
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Faculty reference is required'],
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject reference is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['PENDING', 'PIN_GENERATED', 'APPROVED', 'REJECTED', 'CANCELLED'],
        message: 'Invalid status',
      },
      default: 'PENDING',
    },
    reason: {
      type: String,
      required: [true, 'Reason is required for borrowing faculty'],
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    responseNotes: {
      type: String,
      maxlength: [500, 'Response notes cannot exceed 500 characters'],
    },
    approvalPin: {
      type: String,
      select: false, // Don't expose the PIN by default in queries
    },
  },
  {
    timestamps: true,
  }
);

const CrossDeptRequest = mongoose.model('CrossDeptRequest', crossDeptRequestSchema);

module.exports = CrossDeptRequest;
