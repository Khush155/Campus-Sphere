const mongoose = require('mongoose');

const examResultSchema = new mongoose.Schema({
  examinationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Examination',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  marksObtained: {
    type: Number,
    required: true
  },
  grade: {
    type: String,
    enum: ['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F', 'Absent'],
    required: true
  },
  remarks: {
    type: String,
    trim: true
  }
}, { timestamps: true });

examResultSchema.index({ examinationId: 1, studentId: 1 }, { unique: true });
examResultSchema.index({ studentId: 1 });
examResultSchema.index({ subjectId: 1 });

module.exports = mongoose.model('ExamResult', examResultSchema);
