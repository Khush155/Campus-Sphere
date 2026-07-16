const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true, trim: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' }, // null = global
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
  // Who should see this notice
  targetAudience: {
    type: String,
    enum: ['ALL', 'FACULTY', 'STUDENTS', 'HOD_ONLY'],
    default: 'ALL',
  },
  expiresAt: { type: Date }, // Auto-excluded from GET after this date
  isArchived: { type: Boolean, default: false },
}, { timestamps: true });

noticeSchema.index({ departmentId: 1, priority: -1, createdAt: -1 });
noticeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true }); // TTL index for auto-cleanup

module.exports = mongoose.model('Notice', noticeSchema);
