const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
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
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timetableSlotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimetableSlot' // Can be null if it's not strictly tied to a timetable slot
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Leave', 'Late'],
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  remarks: {
    type: String,
    trim: true
  }
}, { timestamps: true });

// Prevent duplicate attendance for the same student, subject, and date
attendanceSchema.index({ studentId: 1, subjectId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ studentId: 1, status: 1 });
attendanceSchema.index({ subjectId: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
