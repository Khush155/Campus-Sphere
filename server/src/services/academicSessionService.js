const AcademicSession = require('../models/AcademicSession');
const { logAuditEvent } = require('../utils/auditLogger');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const logger = require('../utils/logger');

/**
 * Automatically syncs academic session statuses based on current date:
 * 1. Active session stays ACTIVE until termEndDate < now (then auto-ARCHIVED).
 * 2. If no ACTIVE session, an upcoming session with termStartDate <= now <= termEndDate becomes ACTIVE.
 * 3. Completed past sessions (termEndDate < now) become ARCHIVED.
 * 4. Future sessions become UPCOMING.
 */
const syncSessionStatuses = async () => {
  try {
    const now = new Date();
    const sessions = await AcademicSession.find({});

    let activeSession = sessions.find((s) => s.status === 'ACTIVE');

    // 1. Check if the currently ACTIVE session has ended
    if (activeSession) {
      const end = new Date(activeSession.termEndDate);
      if (end < now) {
        activeSession.status = 'ARCHIVED';
        await activeSession.save();
        logger.info(`[Academic Session Auto-Archived] ID: ${activeSession._id} (${activeSession.academicYear} ${activeSession.semesterType})`);
        activeSession = null;
      }
    }

    // 2. If no active session exists, check if any upcoming session's term start date has arrived
    if (!activeSession) {
      const currentTerm = sessions.find(
        (s) => new Date(s.termStartDate) <= now && new Date(s.termEndDate) >= now
      );
      if (currentTerm) {
        currentTerm.status = 'ACTIVE';
        await currentTerm.save();
        logger.info(`[Academic Session Auto-Activated] ID: ${currentTerm._id} (${currentTerm.academicYear} ${currentTerm.semesterType})`);
        activeSession = currentTerm;
      }
    }

    // 3. Sync remaining sessions: past sessions -> ARCHIVED, future sessions -> UPCOMING
    for (const session of sessions) {
      if (activeSession && String(session._id) === String(activeSession._id)) {continue;}

      const end = new Date(session.termEndDate);
      let targetStatus = 'UPCOMING';
      if (end < now) {
        targetStatus = 'ARCHIVED';
      }

      if (session.status !== targetStatus) {
        session.status = targetStatus;
        await session.save();
      }
    }
  } catch (err) {
    logger.error('Error auto-syncing academic session statuses:', err);
  }
};

/**
 * Creates a new Academic Session.
 * Auto-assigns status based on dates if not specified.
 */
const createSession = async (sessionData, adminUserId, meta) => {
  const now = new Date();
  const start = new Date(sessionData.termStartDate);
  const end = new Date(sessionData.termEndDate);

  if (end < now) {
    sessionData.status = 'ARCHIVED';
  } else if (start <= now && end >= now) {
    sessionData.status = 'ACTIVE';
    await AcademicSession.updateMany({ status: 'ACTIVE' }, { status: 'ARCHIVED' });
  } else if (start > now) {
    sessionData.status = 'UPCOMING';
  }

  const session = await AcademicSession.create(sessionData);

  if (sessionData.status === 'ACTIVE') {
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
  await syncSessionStatuses();
  return session;
};

/**
 * Activates an existing Academic Session manually.
 */
const activateSession = async (sessionId, adminUserId, meta) => {
  // 1. Mark existing ACTIVE sessions as ARCHIVED or UPCOMING based on dates
  await AcademicSession.updateMany({ status: 'ACTIVE' }, { status: 'ARCHIVED' });

  // 2. Activate target session
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
 * Retrieves a paginated list of all academic sessions with auto-synced statuses.
 */
const getSessionsList = async ({ page = 1, limit = 20 }) => {
  await syncSessionStatuses();
  const skip = (page - 1) * limit;

  const sessions = await AcademicSession.find({})
    .sort({ termStartDate: -1 })
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
  await syncSessionStatuses();
  const activeSession = await AcademicSession.findOne({ status: 'ACTIVE' });
  return activeSession || null;
};

/**
 * Deletes an Academic Session.
 */
const deleteSession = async (sessionId, adminUserId, meta) => {
  const session = await AcademicSession.findByIdAndDelete(sessionId);
  if (!session) {
    throw new AppError('Session not found', 404, ERROR_CODES.NOT_FOUND);
  }

  await logAuditEvent({
    actorId: adminUserId,
    action: 'ACADEMIC_SESSION_DELETED',
    targetId: sessionId,
    targetModel: 'AcademicSession',
    after: null,
    meta,
  });

  logger.info(`[Academic Session Deleted] ID: ${sessionId}`);
  await syncSessionStatuses();
  return session;
};

/**
 * Updates an existing Academic Session.
 */
const updateSession = async (sessionId, updateData, adminUserId, meta) => {
  if (updateData.status === 'ACTIVE') {
    await AcademicSession.updateMany({ _id: { $ne: sessionId }, status: 'ACTIVE' }, { status: 'ARCHIVED' });
  }

  const session = await AcademicSession.findByIdAndUpdate(sessionId, updateData, { new: true, runValidators: true });
  if (!session) {
    throw new AppError('Session not found', 404, ERROR_CODES.NOT_FOUND);
  }

  await logAuditEvent({
    actorId: adminUserId,
    action: 'ACADEMIC_SESSION_UPDATED',
    targetId: sessionId,
    targetModel: 'AcademicSession',
    after: {
      academicYear: session.academicYear,
      semesterType: session.semesterType,
      status: session.status,
    },
    meta,
  });

  logger.info(`[Academic Session Updated] ID: ${sessionId} - Year: ${session.academicYear}`);
  await syncSessionStatuses();
  return session;
};

module.exports = {
  createSession,
  activateSession,
  updateSession,
  deleteSession,
  getSessionsList,
  getActiveSession,
  syncSessionStatuses,
};
