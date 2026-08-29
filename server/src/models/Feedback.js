const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    targetRole: {
      type: String,
      enum: ['FACULTY', 'STUDENT'],
      required: true,
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
    },
    semester: {
      type: Number,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    criteriaRatings: {
      courseCoverage: { type: Number, min: 1, max: 5 },
      conceptClarity: { type: Number, min: 1, max: 5 },
      punctuality: { type: Number, min: 1, max: 5 },
      doubtClearing: { type: Number, min: 1, max: 5 },
      practicalRelevance: { type: Number, min: 1, max: 5 },
    },
    comments: {
      type: String,
      required: true,
    },
    isAnonymous: {
      type: Boolean,
      default: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Feedback', feedbackSchema);
