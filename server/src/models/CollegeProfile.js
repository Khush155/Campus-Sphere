const mongoose = require('mongoose');

const collegeProfileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'College name is required'],
      trim: true,
      maxlength: [150, 'College name cannot exceed 150 characters'],
    },
    institutionCode: {
      type: String,
      trim: true,
      default: 'CS-ERP-101',
    },
    establishmentYear: {
      type: Number,
      default: 1998,
    },
    accreditation: {
      type: String,
      trim: true,
      default: 'NAAC Grade A+ | NBA Accredited',
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
    website: {
      type: String,
      trim: true,
      default: 'https://campussphere.edu',
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
