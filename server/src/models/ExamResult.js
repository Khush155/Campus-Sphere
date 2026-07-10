const mongoose = require('mongoose');

const examResultSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: [true, 'Exam ID is required'],
    },
    marksObtained: {
      type: Number,
      required: [true, 'Marks obtained are required'],
      min: [0, 'Marks cannot be negative'],
    },
    grade: {
      type: String, // E.g., 'O', 'A+', 'B', 'F'
    },
    gradePoint: {
      type: Number, // E.g., 10, 9, 7, 0
    },
    isPublished: {
      type: Boolean,
      default: false, // If false, results are 'in-progress' and skipped in official calculations
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a student only has one result record per exam
examResultSchema.index({ examId: 1, studentId: 1 }, { unique: true });

// Pre-save hook: Automatically compute letter grade and grade points based on score percentage
examResultSchema.pre('save', async function (next) {
  try {
    // If marksObtained wasn't modified, skip calculation
    if (!this.isModified('marksObtained')) return next();

    // Fetch the Exam metadata to get the maxMarks
    const Exam = mongoose.model('Exam');
    const exam = await Exam.findById(this.examId);
    if (!exam) {
      return next(new Error('Associated Exam metadata not found'));
    }

    // Verify marks obtained is not greater than maximum allowed marks
    if (this.marksObtained > exam.maxMarks) {
      return next(new Error(`Marks obtained (${this.marksObtained}) cannot exceed Max Marks (${exam.maxMarks})`));
    }

    const percentage = (this.marksObtained / exam.maxMarks) * 100;

    // Standard absolute grading criteria
    if (percentage >= 90) {
      this.grade = 'O';
      this.gradePoint = 10;
    } else if (percentage >= 80) {
      this.grade = 'A+';
      this.gradePoint = 9;
    } else if (percentage >= 70) {
      this.grade = 'A';
      this.gradePoint = 8;
    } else if (percentage >= 60) {
      this.grade = 'B+';
      this.gradePoint = 7;
    } else if (percentage >= 50) {
      this.grade = 'B';
      this.gradePoint = 6;
    } else if (percentage >= 40) {
      this.grade = 'C';
      this.gradePoint = 5;
    } else {
      this.grade = 'F';
      this.gradePoint = 0;
    }

    next();
  } catch (error) {
    next(error);
  }
});

const ExamResult = mongoose.model('ExamResult', examResultSchema);

module.exports = ExamResult;
