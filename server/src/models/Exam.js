const mongoose = require('mongoose');

const examSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Exam name is required'],
      trim: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject ID is required'],
    },
    examType: {
      type: String,
      enum: ['MID_TERM', 'END_TERM', 'LAB', 'QUIZ'],
      required: [true, 'Exam type is required'],
    },
    date: {
      type: Date,
      required: [true, 'Exam date is required'],
    },
    maxMarks: {
      type: Number,
      required: [true, 'Maximum marks are required'],
      default: 100,
    },
    passingMarks: {
      type: Number,
      required: [true, 'Passing marks are required'],
      default: 40,
    },
  },
  {
    timestamps: true,
  }
);

const Exam = mongoose.model('Exam', examSchema);

module.exports = Exam;
