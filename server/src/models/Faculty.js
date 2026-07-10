const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Faculty must be linked to a User account'],
      unique: true, // One user profile can only have one faculty profile
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Faculty must be assigned to a department'],
    },
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
      },
    ],
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      enum: ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer'],
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    officeHours: {
      type: String, // Example: "Mon, Wed 2:00 PM - 4:00 PM"
      trim: true,
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Faculty = mongoose.model('Faculty', facultySchema);

module.exports = Faculty;
