const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    priority: {
      type: String,
      enum: ['NORMAL', 'IMPORTANT', 'URGENT'],
      default: 'NORMAL',
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
      default: 'DRAFT',
    },
    targetRoles: {
      type: [String],
      enum: ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD', 'FACULTY', 'STUDENT'],
      default: [],
    },
    targetDepartments: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Department',
      default: [],
    },
    targetSemesters: {
      type: [Number],
      default: [],
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
noticeSchema.index({ status: 1, expiresAt: 1 });
noticeSchema.index({ targetRoles: 1 });
noticeSchema.index({ targetDepartments: 1 });

const Notice = mongoose.model('Notice', noticeSchema);

module.exports = Notice;
