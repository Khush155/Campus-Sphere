const mongoose = require('mongoose');

/**
 * Grading scale (10-point system used by most Indian universities):
 * O  (Outstanding) = 91-100 → 10 points
 * A+ (Excellent)   = 81-90  →  9 points
 * A  (Very Good)   = 71-80  →  8 points
 * B+ (Good)        = 61-70  →  7 points
 * B  (Above Avg)   = 51-60  →  6 points
 * C  (Average)     = 40-50  →  5 points
 * F  (Fail)        = < pass →  0 points
 */
const computeGrade = (percentage, isAbsent) => {
  if (isAbsent) {return { grade: 'AB', gradePoint: 0 };}
  if (percentage >= 91) {return { grade: 'O', gradePoint: 10 };}
  if (percentage >= 81) {return { grade: 'A+', gradePoint: 9 };}
  if (percentage >= 71) {return { grade: 'A', gradePoint: 8 };}
  if (percentage >= 61) {return { grade: 'B+', gradePoint: 7 };}
  if (percentage >= 51) {return { grade: 'B', gradePoint: 6 };}
  if (percentage >= 40) {return { grade: 'C', gradePoint: 5 };}
  return { grade: 'F', gradePoint: 0 };
};

const resultSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  examinationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Examination', required: true },
  marksObtained: { type: Number, min: 0, default: 0 },
  isAbsent: { type: Boolean, default: false }, // DNE (Did Not Appear)
  // Auto-computed fields
  percentage: { type: Number, min: 0, max: 100 },
  grade: {
    type: String,
    enum: ['O', 'A+', 'A', 'B+', 'B', 'C', 'F', 'AB'],
  },
  gradePoint: { type: Number, min: 0, max: 10 },
  status: { type: String, enum: ['PASS', 'FAIL', 'ABSENT'], required: true },
  // If grade is poor, flag for remedial action
  requiresRemedialClass: { type: Boolean, default: false },
  remedialClassScheduled: { type: Boolean, default: false },
  publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  publishedAt: { type: Date },
}, { timestamps: true });

// Unique constraint: one result per student per exam
resultSchema.index({ studentId: 1, examinationId: 1 }, { unique: true });

// Export the grading helper too so controllers can use it
resultSchema.statics.computeGrade = computeGrade;

module.exports = mongoose.model('Result', resultSchema);
