const mongoose = require('mongoose');

const clubMembershipSchema = new mongoose.Schema({
  clubId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['Member', 'Core Committee', 'President', 'Vice President', 'Treasurer'],
    default: 'Member'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Active', 'Alumni', 'Left'],
    default: 'Active'
  }
}, { timestamps: true });

clubMembershipSchema.index({ clubId: 1, studentId: 1 }, { unique: true });
clubMembershipSchema.index({ studentId: 1 });

module.exports = mongoose.model('ClubMembership', clubMembershipSchema);
