const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Academic', 'Exam', 'Event', 'Finance', 'General', 'Placement'],
    default: 'General'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  date: {
    type: Date,
    default: Date.now
  },
  targetRoles: [{
    type: String,
    enum: ['STUDENT', 'FACULTY', 'HOD', 'COLLEGE_ADMIN']
  }],
  targetDepartments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  }],
  attachments: [{
    fileName: String,
    fileUrl: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Filter indexes for queries
noticeSchema.index({ date: -1 });
noticeSchema.index({ targetRoles: 1 });
noticeSchema.index({ targetDepartments: 1 });

module.exports = mongoose.model('Notice', noticeSchema);
