const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Mini Project', 'Major Project', 'Research', 'Other'],
    default: 'Mini Project'
  },
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
  semester: {
    type: Number,
    required: true
  },
  facultyGuideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Optional initially, assigned later
  },
  status: {
    type: String,
    enum: ['Proposed', 'Approved', 'In Progress', 'Completed', 'Rejected'],
    default: 'Proposed'
  },
  githubLink: String,
  demoLink: String,
  reportUrl: String,
  milestones: [{
    title: String,
    status: {
      type: String,
      enum: ['Pending', 'Completed'],
      default: 'Pending'
    },
    dueDate: Date
  }]
}, { timestamps: true });

projectSchema.index({ studentId: 1 });
projectSchema.index({ departmentId: 1, semester: 1 });

module.exports = mongoose.model('Project', projectSchema);
