const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required'],
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject ID is required'],
  },
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Faculty ID is required'],
  },
  date: {
    type: Date,
    required: [true, 'Attendance date is required'],
  },
  sessionType: {
    type: String,
    enum: ['LECTURE', 'LAB', 'TUTORIAL'],
    default: 'LECTURE',
  },
  status: {
    type: String,
    enum: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'MEDICAL_LEAVE', 'DUTY_LEAVE'],
    required: [true, 'Attendance status is required'],
  },
  isMedicalApproved: {
    type: Boolean,
    default: false,
  },
  remarks: {
    type: String,
    trim: true,
  },
}, { timestamps: true });

// Compound unique index: a student can have only one attendance record per subject per date per session
attendanceSchema.index({ studentId: 1, subjectId: 1, date: 1, sessionType: 1 }, { unique: true });

// Individual/Compound performance indexes
attendanceSchema.index({ subjectId: 1, date: 1 });
attendanceSchema.index({ facultyId: 1, date: -1 });
attendanceSchema.index({ studentId: 1 });
attendanceSchema.index({ date: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
