const mongoose = require('mongoose');

const timetableSlotSchema = new mongoose.Schema(
  {
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    semester: {
      type: Number,
      required: true,
    },
    group: {
      type: String,
      trim: true,
      required: false, // Optional if the whole semester is taking the class
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dayOfWeek: {
      type: String,
      enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Please use HH:MM 24-hour format'],
    },
    endTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Please use HH:MM 24-hour format'],
    },
    room: {
      type: String,
      trim: true,
      required: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// We rely on the conflict detection engine to prevent overlapping slots.
// We can index common queries to improve performance.
timetableSlotSchema.index({ departmentId: 1, courseId: 1, branchId: 1, semester: 1 });
timetableSlotSchema.index({ facultyId: 1, dayOfWeek: 1 });

const TimetableSlot = mongoose.model('TimetableSlot', timetableSlotSchema);

module.exports = TimetableSlot;
