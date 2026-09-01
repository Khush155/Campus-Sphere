const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Opportunity title is required'],
      trim: true,
    },
    organization: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['HACKATHON', 'INTERNSHIP', 'PLACEMENT'],
      required: [true, 'Opportunity type is required'],
    },
    location: {
      type: String,
      default: 'Remote / Hybrid',
      trim: true,
    },
    deadline: {
      type: Date,
      required: [true, 'Application deadline is required'],
    },
    url: {
      type: String,
      required: [true, 'Application link/URL is required'],
      trim: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    source: {
      type: String,
      default: 'Department Faculty Desk',
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Opportunity', opportunitySchema);
