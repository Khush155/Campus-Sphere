const mongoose = require('mongoose');

const assignmentSubmissionSchema = new mongoose.Schema({
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  attachments: [{
    fileName: String,
    fileUrl: String
  }],
  status: {
    type: String,
    enum: ['Submitted', 'Graded', 'Late'],
    default: 'Submitted'
  },
  marksAwarded: {
    type: Number
  },
  feedback: {
    type: String,
    trim: true
  }
}, { timestamps: true });

assignmentSubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });
assignmentSubmissionSchema.index({ studentId: 1 });

module.exports = mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);
