const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      index: true,
    },
    targetModel: {
      type: String,
      required: false,
    },
    before: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
    after: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
    ipAddress: {
      type: String,
      required: false,
    },
    userAgent: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: { createdAt: 'timestamp', updatedAt: false }, // Only need timestamp of action
    versionKey: false,
  }
);

// Optimize retrieval of audit logs (common query patterns)
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ actorId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
