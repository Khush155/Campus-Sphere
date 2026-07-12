const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required'],
  },
  status: {
    type: String,
    enum: {
      values: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'],
      message: 'Status must be PRESENT, ABSENT, LATE, or EXCUSED',
    },
    required: [true, 'Attendance status is required'],
  },
  remarks: {
    type: String,
    trim: true,
    maxlength: [200, 'Remarks cannot exceed 200 characters'],
  }
}, { _id: false });

const attendanceSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject reference is required'],
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Faculty reference is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    records: [attendanceRecordSchema],
  },
  {
    timestamps: true,
  }
);

// Prevent multiple attendance sheets for the same subject on the same day
attendanceSchema.index({ subjectId: 1, date: 1 }, { unique: true });

// For quick fetching of all attendance records by a specific faculty
attendanceSchema.index({ facultyId: 1, date: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
