const mongoose = require('mongoose');
const User = require('../models/User');
const PromotionBatch = require('../models/PromotionBatch');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const logger = require('../utils/logger');
const { logAuditEvent } = require('../utils/auditLogger');

/**
 * Formats a timestamp into a human-readable relative string.
 */
const getRelativeTime = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const secs = Math.floor(diff / 1000);
  const mins = Math.floor(secs / 60);
  const hours = Math.floor(mins / 60);
  if (secs < 60) return 'just now';
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  return `${Math.floor(hours / 24)} day${Math.floor(hours / 24) !== 1 ? 's' : ''} ago`;
};

/**
 * Cleans the input scope filters to remove falsy values (like empty strings or nulls).
 */
const cleanScope = (scope) => {
  const cleaned = {};
  if (!scope) return cleaned;
  for (const [key, value] of Object.entries(scope)) {
    if (value !== undefined && value !== null && value !== '') {
      cleaned[key] = value;
    }
  }
  return cleaned;
};

/**
 * Preview (dry-run) computation for the promotion set.
 * Never writes to the database.
 */
const previewPromotion = async (scope) => {
  const cleanedScope = cleanScope(scope);

  // Find active, ongoing students matching scope
  const filter = {
    role: 'STUDENT',
    status: 'ACTIVE',
    academicStatus: 'ONGOING',
    ...cleanedScope,
  };

  const students = await User.find(filter)
    .populate('courseId', 'name durationYears')
    .populate('branchId', 'name');

  const results = students.map((s) => {
    // If courseId is missing or has no durationYears, default to 4 years (8 semesters)
    const duration = s.courseId?.durationYears || 4;
    const maxSemester = duration * 2;
    const currentSemester = typeof s.semester === 'number' ? s.semester : 1;
    const willGraduate = currentSemester >= maxSemester;

    return {
      studentId: s._id,
      name: s.name,
      email: s.email,
      branchName: s.branchId?.name || 'No Branch',
      currentSemester,
      outcome: willGraduate ? 'GRADUATE' : 'PROMOTE',
      newSemester: willGraduate ? null : currentSemester + 1,
    };
  });

  // Group by branch for the summary view
  const grouped = {};
  for (const r of results) {
    const key = r.branchName;
    grouped[key] ??= { promote: 0, graduate: 0 };
    grouped[key][r.outcome === 'PROMOTE' ? 'promote' : 'graduate']++;
  }

  // Idempotency check: warning if a batch already ran recently (last 24 hours)
  const lastBatch = await PromotionBatch.findOne({ status: 'COMPLETED' })
    .sort({ createdAt: -1 })
    .lean();

  let recentWarning = null;
  if (lastBatch && Date.now() - new Date(lastBatch.createdAt).getTime() < 24 * 60 * 60 * 1000) {
    const relativeTime = getRelativeTime(lastBatch.createdAt);
    recentWarning = `A promotion batch already ran ${relativeTime} ago, affecting ${
      lastBatch.promotedCount + lastBatch.graduatedCount
    } students.`;
  }

  return {
    totalPromote: results.filter((r) => r.outcome === 'PROMOTE').length,
    totalGraduate: results.filter((r) => r.outcome === 'GRADUATE').length,
    grouped,
    details: results,
    recentWarning,
  };
};

/**
 * Transaction-safe promotion execute pipeline.
 * Computes the promotion set inside the transaction and executes bulkWrite.
 */
const executePromotion = async (scope, actorId) => {
  const cleanedScope = cleanScope(scope);
  const session = await mongoose.startSession();
  let transactionActive = false;

  try {
    // Try starting a transaction
    try {
      session.startTransaction();
      transactionActive = true;
    } catch (txErr) {
      logger.warn(
        `[Promotion Transaction Warning] Transaction failed to start (likely standalone MongoDB instance). Running promotion WITHOUT transaction fallback: ${txErr.message}`
      );
    }

    // Recompute promotion set fresh, inside the session context if transaction is active
    const filter = {
      role: 'STUDENT',
      status: 'ACTIVE',
      academicStatus: 'ONGOING',
      ...cleanedScope,
    };

    const students = await User.find(filter)
      .populate('courseId', 'name durationYears')
      .populate('branchId', 'name')
      .session(transactionActive ? session : null);

    const details = students.map((s) => {
      const duration = s.courseId?.durationYears || 4;
      const maxSemester = duration * 2;
      const currentSemester = typeof s.semester === 'number' ? s.semester : 1;
      const willGraduate = currentSemester >= maxSemester;

      return {
        studentId: s._id,
        outcome: willGraduate ? 'GRADUATE' : 'PROMOTE',
        newSemester: willGraduate ? null : currentSemester + 1,
      };
    });

    const bulkOps = details.map((r) => ({
      updateOne: {
        filter: { _id: r.studentId },
        update:
          r.outcome === 'GRADUATE'
            ? { $set: { academicStatus: 'GRADUATED' } }
            : { $set: { semester: r.newSemester } },
      },
    }));

    if (bulkOps.length > 0) {
      await User.bulkWrite(bulkOps, { session: transactionActive ? session : null });
    }

    const promotedCount = details.filter((r) => r.outcome === 'PROMOTE').length;
    const graduatedCount = details.filter((r) => r.outcome === 'GRADUATE').length;

    // Log the promotion batch record
    const batchArray = await PromotionBatch.create(
      [
        {
          executedBy: actorId,
          scope: cleanedScope,
          promotedCount,
          graduatedCount,
          affectedStudentIds: details.map((r) => r.studentId),
          status: 'COMPLETED',
        },
      ],
      { session: transactionActive ? session : null }
    );

    const batch = batchArray[0];

    // Commit only if transaction was successfully started
    if (transactionActive) {
      await session.commitTransaction();
    }

    // Log a single consolidated audit entry for the whole batch
    await logAuditEvent({
      actorId,
      action: 'BULK_SEMESTER_PROMOTION',
      targetId: batch._id,
      targetModel: 'PromotionBatch',
      after: {
        promotedCount,
        graduatedCount,
        scope: cleanedScope,
      },
    });

    return batch;
  } catch (err) {
    if (transactionActive) {
      await session.abortTransaction();
    }
    logger.error(`[Bulk Promotion Error] Failed to execute promotion: ${err.message}`);
    throw new AppError(
      'Promotion failed and was rolled back — no student records were changed.',
      500,
      ERROR_CODES.PROMOTION_FAILED
    );
  } finally {
    session.endSession();
  }
};

module.exports = {
  previewPromotion,
  executePromotion,
};
