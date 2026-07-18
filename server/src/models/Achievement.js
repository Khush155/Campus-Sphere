const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['Hackathon', 'Certification', 'Publication', 'Sports', 'Cultural', 'Other'],
    required: true
  },
  description: {
    type: String
  },
  dateEarned: {
    type: Date,
    required: true
  },
  proofUrl: {
    type: String // Link to certificate/image
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Admin or HOD who verified it
  }
}, { timestamps: true });

achievementSchema.index({ studentId: 1 });
achievementSchema.index({ category: 1 });

module.exports = mongoose.model('Achievement', achievementSchema);
