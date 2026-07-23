const PlacementDrive = require('../models/PlacementDrive');
const PlacementApplication = require('../models/PlacementApplication');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const ROLES = require('../constants/roles');
const { logAuditEvent } = require('../utils/auditLogger');
const paginate = require('../utils/paginate');

const createDrive = async (driveData, _actor) => {
  const { companyName, role, packageInfo, eligibilityCriteria, driveDate, departmentIds, jobDescription, applicationDeadline } = driveData;

  const drive = await PlacementDrive.create({
    companyName,
    role,
    packageInfo,
    eligibilityCriteria: eligibilityCriteria || {},
    driveDate: new Date(driveDate),
    departmentIds: departmentIds || [],
    jobDescription,
    applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
  });

  return drive;
};

const getDrives = async (queryOptions, actor) => {
  const { departmentId, status } = queryOptions;
  const filters = {};
  if (departmentId) {
    filters.departmentIds = departmentId;
  }
  if (status) {
    filters.status = status;
  }

  // Enforce HOD & Student boundaries
  if (actor.role === ROLES.HOD || actor.role === ROLES.STUDENT) {
    filters.departmentIds = actor.departmentId;
  }

  return await paginate(PlacementDrive, filters, {
    ...queryOptions,
    sort: { driveDate: -1 }
  });
};

const applyForDrive = async (driveId, actor) => {
  const [drive, student] = await Promise.all([
    PlacementDrive.findById(driveId),
    User.findById(actor.id),
  ]);

  if (!drive) {
    throw new AppError('Placement drive not found.', 404, ERROR_CODES.NOT_FOUND);
  }
  if (drive.status === 'COMPLETED') {
    throw new AppError('This drive has already concluded.', 400, ERROR_CODES.BAD_REQUEST);
  }

  // Check application deadline
  if (drive.applicationDeadline && new Date() > drive.applicationDeadline) {
    throw new AppError('Application deadline has passed.', 400, ERROR_CODES.BAD_REQUEST);
  }

  // Enforce eligibility criteria
  const criteria = drive.eligibilityCriteria || {};
  if (criteria.cgpa && student.cgpa < criteria.cgpa) {
    throw new AppError(
      `Eligibility not met: Minimum CGPA required is ${criteria.cgpa}. Your CGPA is ${student.cgpa || 'not set'}.`,
      403,
      ERROR_CODES.FORBIDDEN
    );
  }
  if (criteria.backlogs !== undefined && (student.activeBacklogs || 0) > criteria.backlogs) {
    throw new AppError(
      `Eligibility not met: Maximum allowed backlogs is ${criteria.backlogs}. You have ${student.activeBacklogs || 0}.`,
      403,
      ERROR_CODES.FORBIDDEN
    );
  }

  // Duplicate check
  const existing = await PlacementApplication.findOne({ studentId: actor.id, driveId });
  if (existing) {
    throw new AppError('You have already applied for this drive.', 409, ERROR_CODES.DUPLICATE_ENTRY);
  }

  const application = await PlacementApplication.create({
    studentId: actor.id,
    driveId,
    cgpaAtApplication: student.cgpa || null,
    backlogsAtApplication: student.activeBacklogs || 0,
  });

  return application;
};

const updateApplicationRound = async (appId, roundData, actor, req) => {
  const { round, roundName, status, score, feedback, date } = roundData;

  const app = await PlacementApplication.findById(appId).populate('driveId');
  if (!app) {
    throw new AppError('Application not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  // Enforce HOD department boundaries
  if (actor.role === ROLES.HOD) {
    const isDeptMatched = app.driveId.departmentIds.some(id => id.toString() === actor.departmentId.toString());
    if (!isDeptMatched) {
      throw new AppError('Access denied. This placement drive does not belong to your department.', 403, ERROR_CODES.FORBIDDEN);
    }
  }

  const existingRoundIdx = app.interviewRounds.findIndex(r => r.round === round);
  if (existingRoundIdx >= 0) {
    app.interviewRounds[existingRoundIdx] = { round, roundName, status, score, feedback, date };
  } else {
    app.interviewRounds.push({ round, roundName, status, score, feedback, date: date ? new Date(date) : new Date() });
  }

  app.currentRound = Math.max(app.currentRound, round);

  if (status === 'FAILED') {
    app.status = 'REJECTED';
    app.finalStatus = 'REJECTED';
  } else if (status === 'CLEARED') {
    app.status = 'IN_PROCESS';
  }

  await app.save();

  // Audit Log
  await logAuditEvent({
    actorId: actor.id,
    action: 'PLACEMENT_ROUND_UPDATE',
    targetId: app._id,
    targetModel: 'PlacementApplication',
    after: { round, status, score },
    req
  });

  return app;
};

const finalizeApplication = async (appId, finalizeData, actor, req) => {
  const { finalStatus, offerPackageLPA, offerLetterRef } = finalizeData;

  const app = await PlacementApplication.findById(appId).populate('driveId');
  if (!app) {
    throw new AppError('Application not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  // Enforce HOD department boundaries
  if (actor.role === ROLES.HOD) {
    const isDeptMatched = app.driveId.departmentIds.some(id => id.toString() === actor.departmentId.toString());
    if (!isDeptMatched) {
      throw new AppError('Access denied. This placement drive does not belong to your department.', 403, ERROR_CODES.FORBIDDEN);
    }
  }

  const before = { status: app.status, finalStatus: app.finalStatus };

  app.finalStatus = finalStatus;
  app.status = finalStatus === 'SELECTED' ? 'SELECTED' : app.status;
  app.offerPackageLPA = offerPackageLPA || null;
  app.offerLetterRef = offerLetterRef || null;

  await app.save();

  // Audit Log
  await logAuditEvent({
    actorId: actor.id,
    action: `PLACEMENT_FINALIZED_${finalStatus}`,
    targetId: app._id,
    targetModel: 'PlacementApplication',
    before,
    after: { finalStatus, status: app.status, offerPackageLPA },
    req
  });

  return app;
};

const getApplications = async (queryOptions, actor) => {
  const { driveId, finalStatus, isNocIssued } = queryOptions;

  // Find all drives for the department
  const driveFilters = {};
  if (actor.role === ROLES.HOD) {
    driveFilters.departmentIds = actor.departmentId;
  }
  if (driveId) {
    driveFilters._id = driveId;
  }

  const drives = await PlacementDrive.find(driveFilters).select('_id');
  const driveIds = drives.map(d => d._id);

  const filters = { driveId: { $in: driveIds } };
  if (finalStatus) {
    filters.finalStatus = finalStatus;
  }
  if (isNocIssued !== undefined) {
    filters.isNocIssued = isNocIssued === 'true' || isNocIssued === true;
  }

  return await paginate(PlacementApplication, filters, {
    ...queryOptions,
    populate: [
      { path: 'studentId', select: 'name email rollNumber cgpa activeBacklogs' },
      { path: 'driveId', select: 'companyName role driveType' }
    ],
    sort: { createdAt: -1 }
  });
};

const issueNoc = async (appId, actor, req) => {
  const app = await PlacementApplication.findById(appId).populate('driveId');
  if (!app) {
    throw new AppError('Application not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  // Enforce HOD department boundaries
  if (actor.role === ROLES.HOD) {
    const isDeptMatched = app.driveId.departmentIds.some(id => id.toString() === actor.departmentId.toString());
    if (!isDeptMatched) {
      throw new AppError('Access denied. This placement drive does not belong to your department.', 403, ERROR_CODES.FORBIDDEN);
    }
  }

  if (app.finalStatus !== 'SELECTED') {
    throw new AppError('NOC can only be issued to students whose final status is SELECTED.', 400, ERROR_CODES.BAD_REQUEST);
  }

  if (app.isNocIssued) {
    throw new AppError('NOC has already been issued for this application.', 400, ERROR_CODES.BAD_REQUEST);
  }

  app.isNocIssued = true;
  app.nocIssueDate = new Date();
  await app.save();

  // Audit Log
  await logAuditEvent({
    actorId: actor.id,
    action: 'PLACEMENT_NOC_ISSUED',
    targetId: app._id,
    targetModel: 'PlacementApplication',
    after: { isNocIssued: true, nocIssueDate: app.nocIssueDate },
    req
  });

  return app;
};

module.exports = {
  createDrive,
  getDrives,
  applyForDrive,
  updateApplicationRound,
  finalizeApplication,
  getApplications,
  issueNoc
};
