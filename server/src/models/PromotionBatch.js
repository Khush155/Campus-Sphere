const mongoose = require('mongoose');

const promotionBatchSchema = new mongoose.Schema(
  {
    executedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    scope: {
      type: Object,
      default: {},
    }, // the filters used: { departmentId, courseId, branchId } or {} for college-wide
    promotedCount: {
      type: Number,
      required: true,
    },
    graduatedCount: {
      type: Number,
      required: true,
    },
    affectedStudentIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    status: {
      type: String,
      enum: ['COMPLETED', 'FAILED'],
      default: 'COMPLETED',
    },
  },
  { timestamps: true }
);

const PromotionBatch = mongoose.model('PromotionBatch', promotionBatchSchema);

module.exports = PromotionBatch;
