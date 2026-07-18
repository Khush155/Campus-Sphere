const mongoose = require('mongoose');

const clubSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Technical', 'Cultural', 'Sports', 'Literary', 'Social'],
    required: true
  },
  establishedYear: Number,
  facultyAdvisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  logoUrl: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Club', clubSchema);
