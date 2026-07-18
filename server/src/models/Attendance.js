const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  sessionType: {
    type: String,
    enum: ['LECTURE', 'LAB', 'TUTORIAL'],
    default: 'LECTURE',
  },
  status: { type: String, enum: ['PRESENT', 'ABSENT', 'EXCUSED', 'MEDICAL_LEAVE'], required: true },
  // Medical leave flag — counts as excused (does not hurt attendance % if approved)
  isMedicalApproved: { type: Boolean, default: false },
  remarks: { type: String, trim: true }, // e.g., "Proxy detected" or "Medical certificate submitted"
}, { timestamps: true });

// Compound unique index: a student can have only one attendance record per subject per date per session
attendanceSchema.index({ studentId: 1, subjectId: 1, date: 1, sessionType: 1 }, { unique: true });
// Fast department-level queries
attendanceSchema.index({ subjectId: 1, date: 1 });
attendanceSchema.index({ facultyId: 1, date: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
