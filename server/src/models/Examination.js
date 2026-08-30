const mongoose = require('mongoose');

const examinationSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  type: { type: String, enum: ['INTERNAL', 'EXTERNAL', 'PRACTICAL', 'VIVA'], required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  semester: { type: Number, min: 1, max: 12 },
  academicYear: { type: String, trim: true }, // e.g. "2025-2026"
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  date: { type: Date, required: true },
  totalMarks: { type: Number, required: true, min: 1 },
  passingMarks: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['SCHEDULED', 'ONGOING', 'COMPLETED', 'RESULTS_PUBLISHED', 'CANCELLED'], default: 'SCHEDULED' },
  venue: { type: String, trim: true }, // Room/hall details
  duration: { type: Number }, // Duration in minutes
  // Syllabus: array of topic strings covered in this exam
  syllabus: [{ type: String, trim: true }],
  // Datesheet info: slot (morning/afternoon), reporting time
  datesheetSlot: {
    type: String,
    enum: ['MORNING', 'AFTERNOON', 'EVENING'],
    default: 'MORNING',
  },
  reportingTime: { type: String }, // e.g., "09:00 AM"
  instructions: { type: String, trim: true }, // General instructions for students
  datesheetPdfUrl: { type: String, trim: true }, // Link to PDF datesheet
  seatingPlanPdfUrl: { type: String, trim: true }, // Link to PDF seating plan
  marksEntryEnabled: { type: Boolean, default: false }, // HOD permission toggle for faculty marks entry
}, { timestamps: true });

examinationSchema.index({ departmentId: 1, status: 1 });
examinationSchema.index({ subjectId: 1, date: -1 });
examinationSchema.index({ departmentId: 1, courseId: 1, branchId: 1, semester: 1 });

module.exports = mongoose.model('Examination', examinationSchema);
