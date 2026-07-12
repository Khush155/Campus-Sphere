const mongoose = require('mongoose');

const admissionApplicationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of Birth is required'],
    },
    contactNumber: {
      type: String,
      required: [true, 'Contact number is required'],
      match: [/^\d{10}$/, 'Contact number must be exactly 10 digits'],
    },
    guardianName: {
      type: String,
      required: [true, 'Guardian name is required'],
    },
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER'],
      required: [true, 'Gender is required'],
    },
    bloodGroup: {
      type: String,
      required: [true, 'Blood Group is required'],
    },
    highSchoolMarks: {
      type: Number,
      required: [true, '10th Marks percentage is required'],
      min: 0,
      max: 100,
    },
    intermediateMarks: {
      type: Number,
      required: [true, '12th Marks percentage is required'],
      min: 0,
      max: 100,
    },
    photoUrl: {
      type: String,
      required: [true, 'Student photo is required'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course is required'],
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['PENDING', 'APPROVED', 'REJECTED'],
        message: 'Invalid status',
      },
      default: 'PENDING',
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

const AdmissionApplication = mongoose.model('AdmissionApplication', admissionApplicationSchema);

module.exports = AdmissionApplication;
