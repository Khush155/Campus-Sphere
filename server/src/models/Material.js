const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Material title is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Material type is required'],
      enum: {
        values: ['PDF', 'PPT', 'YOUTUBE', 'LINK', 'NOTE'],
        message: 'Type must be PDF, PPT, YOUTUBE, LINK, or NOTE',
      },
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject reference is required'],
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
    },
    group: {
      type: String,
      required: [true, 'Class section/group is required'],
      trim: true,
    },
    url: {
      type: String,
      trim: true,
      required: function () {
        return this.type !== 'NOTE';
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    unit: {
      type: String,
      trim: true,
      default: 'General Reference',
    },
    fileSize: {
      type: String,
      trim: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader user reference is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes to speed up subject & section filtering queries
materialSchema.index({ subjectId: 1, group: 1 });
materialSchema.index({ uploadedBy: 1 });

const Material = mongoose.model('Material', materialSchema);

module.exports = Material;
