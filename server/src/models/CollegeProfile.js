const mongoose = require('mongoose');

const collegeProfileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'College name is required'],
      trim: true,
      maxlength: [150, 'College name cannot exceed 150 characters'],
    },
    affiliation: {
      type: String,
      trim: true,
      maxlength: [200, 'Affiliation info cannot exceed 200 characters'],
    },
    address: {
      type: String,
      trim: true,
      maxlength: [300, 'Address cannot exceed 300 characters'],
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    logoUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CollegeProfile', collegeProfileSchema);
