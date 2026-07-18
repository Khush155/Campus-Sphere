const PlacementDrive = require('../models/PlacementDrive');
const PlacementApplication = require('../models/PlacementApplication');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const AppError = require('../utils/AppError');

/**
 * POST /api/v1/placements/drives
 * Create a placement drive.
 */
exports.createDrive = async (req, res) => {
  const { companyName, role, packageInfo, eligibilityCriteria, driveDate, departmentIds, jobDescription, applicationDeadline } = req.body;

  if (!companyName || !role || !driveDate) {
    throw new AppError('companyName, role, and driveDate are required.', 400);
  }

  const drive = await PlacementDrive.create({
    companyName, role, packageInfo,
    eligibilityCriteria: eligibilityCriteria || {},
    driveDate: new Date(driveDate),
    departmentIds: departmentIds || [],
    jobDescription,
    applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
  });

  res.status(201).json({ success: true, data: drive });
};

/**
 * GET /api/v1/placements/drives
 * List drives with pagination.
 */
exports.getDrives = async (req, res) => {
  const { departmentId, status, page = 1, limit = 20 } = req.query;
  const filters = {};
  if (departmentId) filters.departmentIds = departmentId;
  if (status) filters.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [drives, total] = await Promise.all([
    PlacementDrive.find(filters).sort({ driveDate: -1 }).skip(skip).limit(parseInt(limit)),
    PlacementDrive.countDocuments(filters),
  ]);

  res.status(200).json({
    success: true,
    data: drives,
    meta: { total, page: parseInt(page), limit: parseInt(limit) },
  });
};

/**
 * POST /api/v1/placements/drives/:driveId/apply
 * Student applies for a drive — enforces CGPA and backlog eligibility before applying.
 */
exports.applyForDrive = async (req, res) => {
  const { driveId } = req.params;
  const studentId = req.user.id;

  const [drive, student] = await Promise.all([
    PlacementDrive.findById(driveId),
    User.findById(studentId),
  ]);

  if (!drive) throw new AppError('Placement drive not found.', 404);
  if (drive.status === 'COMPLETED') throw new AppError('This drive has already concluded.', 400);

  // Check application deadline
  if (drive.applicationDeadline && new Date() > drive.applicationDeadline) {
    throw new AppError('Application deadline has passed.', 400);
  }

  // Enforce eligibility criteria
  const criteria = drive.eligibilityCriteria || {};
  if (criteria.cgpa && student.cgpa < criteria.cgpa) {
    throw new AppError(
      `Eligibility not met: Minimum CGPA required is ${criteria.cgpa}. Your CGPA is ${student.cgpa || 'not set'}.`,
      403
    );
  }
  if (criteria.backlogs !== undefined && (student.activeBacklogs || 0) > criteria.backlogs) {
    throw new AppError(
      `Eligibility not met: Maximum allowed backlogs is ${criteria.backlogs}. You have ${student.activeBacklogs || 0}.`,
      403
    );
  }

  // Duplicate check
  const existing = await PlacementApplication.findOne({ studentId, driveId });
  if (existing) throw new AppError('You have already applied for this drive.', 409);

  const application = await PlacementApplication.create({
    studentId,
    driveId,
    cgpaAtApplication: student.cgpa || null,
    backlogsAtApplication: student.activeBacklogs || 0,
  });

  res.status(201).json({ success: true, data: application });
};

/**
 * PATCH /api/v1/placements/applications/:appId/round
 * HOD/Admin updates an interview round result for a student.
 * Body: { round, roundName, status, score, feedback, date }
 */
exports.updateApplicationRound = async (req, res) => {
  const { appId } = req.params;
  const { round, roundName, status, score, feedback, date } = req.body;

  if (!round || !status) throw new AppError('round and status are required.', 400);

  const app = await PlacementApplication.findById(appId);
  if (!app) throw new AppError('Application not found.', 404);

  // Find existing round or push new
  const existingRoundIdx = app.interviewRounds.findIndex(r => r.round === round);
  if (existingRoundIdx >= 0) {
    app.interviewRounds[existingRoundIdx] = { round, roundName, status, score, feedback, date };
  } else {
    app.interviewRounds.push({ round, roundName, status, score, feedback, date: date ? new Date(date) : new Date() });
  }

  app.currentRound = Math.max(app.currentRound, round);

  // Determine overall application status based on round outcome
  if (status === 'FAILED') {
    app.status = 'REJECTED';
    app.finalStatus = 'REJECTED';
  } else if (status === 'CLEARED') {
    app.status = 'IN_PROCESS';
  }

  await app.save();

  await AuditLog.create({
    actorId: req.user.id,
    action: 'PLACEMENT_ROUND_UPDATE',
    targetId: app._id,
    targetModel: 'PlacementApplication',
    after: { round, status, score },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json({ success: true, data: app });
};

/**
 * PATCH /api/v1/placements/applications/:appId/finalize
 * Finalize application: SELECTED with offer package, or WAITLISTED.
 */
exports.finalizeApplication = async (req, res) => {
  const { appId } = req.params;
  const { finalStatus, offerPackageLPA, offerLetterRef } = req.body;

  if (!finalStatus) throw new AppError('finalStatus is required.', 400);
  if (finalStatus === 'SELECTED' && !offerPackageLPA) {
    throw new AppError('offerPackageLPA is required when finalizing as SELECTED.', 400);
  }

  const app = await PlacementApplication.findByIdAndUpdate(
    appId,
    {
      finalStatus,
      status: finalStatus === 'SELECTED' ? 'SELECTED' : app.status,
      offerPackageLPA: offerPackageLPA || null,
      offerLetterRef: offerLetterRef || null,
    },
    { new: true }
  );
  if (!app) throw new AppError('Application not found.', 404);

  res.status(200).json({ success: true, data: app });
};

/**
 * GET /api/v1/placements/applications
 * HOD lists applications for their department's drives.
 */
exports.getApplications = async (req, res) => {
  const { driveId, finalStatus, isNocIssued, page = 1, limit = 50 } = req.query;
  const { departmentId, role, id: userId } = req.user;

  // Find all drives for the department
  const driveFilters = {};
  if (role === 'HOD') driveFilters.departmentIds = departmentId;
  if (driveId) driveFilters._id = driveId;

  const drives = await PlacementDrive.find(driveFilters).select('_id');
  const driveIds = drives.map(d => d._id);

  const filters = { driveId: { $in: driveIds } };
  if (finalStatus) filters.finalStatus = finalStatus;
  if (isNocIssued !== undefined) filters.isNocIssued = isNocIssued === 'true';

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [applications, total] = await Promise.all([
    PlacementApplication.find(filters)
      .populate('studentId', 'name email rollNumber cgpa activeBacklogs')
      .populate('driveId', 'companyName role driveType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    PlacementApplication.countDocuments(filters),
  ]);

  res.status(200).json({
    success: true,
    data: applications,
    meta: { total, page: parseInt(page), limit: parseInt(limit) },
  });
};

/**
 * PATCH /api/v1/placements/applications/:appId/noc
 * HOD issues NOC for a selected student.
 */
exports.issueNoc = async (req, res) => {
  const { appId } = req.params;

  const app = await PlacementApplication.findById(appId).populate('driveId');
  if (!app) throw new AppError('Application not found.', 404);

  if (app.finalStatus !== 'SELECTED') {
    throw new AppError('NOC can only be issued to students whose final status is SELECTED.', 400);
  }

  if (app.isNocIssued) {
    throw new AppError('NOC has already been issued for this application.', 400);
  }

  app.isNocIssued = true;
  app.nocIssueDate = new Date();
  await app.save();

  await AuditLog.create({
    actorId: req.user.id,
    action: 'PLACEMENT_NOC_ISSUED',
    targetId: app._id,
    targetModel: 'PlacementApplication',
    after: { isNocIssued: true, nocIssueDate: app.nocIssueDate },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json({ success: true, data: app });
};
