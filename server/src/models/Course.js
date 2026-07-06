const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Course name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Course name cannot exceed 100 characters'],
    },
    code: {
      type: String,
      required: [true, 'Course code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [15, 'Course code cannot exceed 15 characters'],
    },
    durationYears: {
      type: Number,
      required: [true, 'Course duration is required'],
      min: [1, 'Course duration must be at least 1 year'],
      max: [6, 'Course duration cannot exceed 6 years'],
    },
  },
  {
    timestamps: true,
  }
);



const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
