const mongoose = require('mongoose');

const examinationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['Mid-Term', 'End-Term', 'Practical', 'Quiz', 'Other'],
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
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  durationMinutes: {
    type: Number,
    required: true
  },
  maxMarks: {
    type: Number,
    required: true,
    default: 100
  },
  passingMarks: {
    type: Number,
    required: true,
    default: 40
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Completed', 'Cancelled', 'Results Published'],
    default: 'Scheduled'
  }
}, { timestamps: true });

examinationSchema.index({ departmentId: 1, semester: 1 });
examinationSchema.index({ date: 1 });
examinationSchema.index({ subjectId: 1 });

module.exports = mongoose.model('Examination', examinationSchema);
