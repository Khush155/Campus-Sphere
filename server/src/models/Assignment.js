const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  deadline: {
    type: Date,
    required: true
  },
  maxMarks: {
    type: Number,
    default: 100
  },
  attachments: [{
    fileName: String,
    fileUrl: String
  }],
  status: {
    type: String,
    enum: ['Active', 'Closed'],
    default: 'Active'
  }
}, { timestamps: true });

assignmentSchema.index({ subjectId: 1 });
assignmentSchema.index({ deadline: 1 });
assignmentSchema.index({ departmentId: 1, semester: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
