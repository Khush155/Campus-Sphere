const AcademicSession = require('../models/AcademicSession');
const { logAuditEvent } = require('../utils/auditLogger');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const logger = require('../utils/logger');

/**
 * Creates a new Academic Session.
 * If status is set to 'ACTIVE', atomically archives any previously active sessions.
 */
const createSession = async (sessionData, adminUserId, meta) => {
  const isPendingActive = sessionData.status === 'ACTIVE';

  if (isPendingActive) {
    // Archives all existing active sessions
    await AcademicSession.updateMany({ status: 'ACTIVE' }, { status: 'ARCHIVED' });
  }

  const session = await AcademicSession.create(sessionData);

  if (isPendingActive) {
    await logAuditEvent({
      actorId: adminUserId,
      action: 'ACADEMIC_SESSION_ACTIVATED',
      targetId: session._id,
      targetModel: 'AcademicSession',
      after: {
        academicYear: session.academicYear,
        semesterType: session.semesterType,
        status: 'ACTIVE',
      },
      meta,
    });
    logger.info(`[Academic Session Activated] ID: ${session._id} - Year: ${session.academicYear} - Semester: ${session.semesterType}`);
  }

  logger.info(`[Academic Session Created] ID: ${session._id} - Status: ${session.status}`);
  return session;
};

/**
 * Activates an existing Academic Session.
 * Atomically archives any currently active sessions first.
 */
const activateSession = async (sessionId, adminUserId, meta) => {
  // 1. Archive whatever session currently holds ACTIVE status first
  await AcademicSession.updateMany({ status: 'ACTIVE' }, { status: 'ARCHIVED' });

  // 2. Activate the target session
  const session = await AcademicSession.findByIdAndUpdate(
    sessionId,
    { status: 'ACTIVE' },
    { new: true }
  );

  if (!session) {
    throw new AppError('Session not found', 404, ERROR_CODES.NOT_FOUND);
  }

  // 3. Register transition to AuditLog
  await logAuditEvent({
    actorId: adminUserId,
    action: 'ACADEMIC_SESSION_ACTIVATED',
    targetId: session._id,
    targetModel: 'AcademicSession',
    after: {
      academicYear: session.academicYear,
      semesterType: session.semesterType,
      status: 'ACTIVE',
    },
    meta,
  });

  logger.info(`[Academic Session Activated] ID: ${session._id} - Year: ${session.academicYear} - Semester: ${session.semesterType}`);
  return session;
};

/**
 * Retrieves a paginated list of all academic sessions.
 */
const getSessionsList = async ({ page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;

  const sessions = await AcademicSession.find({})
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await AcademicSession.countDocuments({});
  const totalPages = Math.ceil(total / limit);

  return {
    sessions,
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

/**
 * Retrieves the single currently active academic session.
 */
const getActiveSession = async () => {
  const activeSession = await AcademicSession.findOne({ status: 'ACTIVE' });
  return activeSession || null;
};

module.exports = {
  createSession,
  activateSession,
  getSessionsList,
  getActiveSession,
};
