const Complaint = require('../models/Complaint');
const { assertHODDeptBound } = require('../utils/privilegeGuard');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const ROLES = require('../constants/roles');
const { logAuditEvent } = require('../utils/auditLogger');
const paginate = require('../utils/paginate');

const createComplaint = async (complaintData, actor) => {
  const { title, description, category, priority } = complaintData;

  const complaint = await Complaint.create({
    title,
    description,
    category,
    priority: priority || 'MEDIUM',
    submittedBy: actor.id,
    departmentId: actor.departmentId,
    statusHistory: [{
      status: 'OPEN',
      changedBy: actor.id,
      note: 'Complaint submitted.',
      timestamp: new Date(),
    }],
  });

  return complaint;
};

const getComplaints = async (queryOptions, actor) => {
  const { departmentId, status, category, priority, slaBreached } = queryOptions;
  const filters = {};

  if (departmentId) {
    filters.departmentId = departmentId;
  }
  if (status) {
    filters.status = status;
  }
  if (category) {
    filters.category = category;
  }
  if (priority) {
    filters.priority = priority;
  }
  if (slaBreached !== undefined) {
    filters.slaBreached = slaBreached === 'true' || slaBreached === true;
  }

  // Enforce HOD department boundaries
  if (actor.role === ROLES.HOD) {
    filters.departmentId = actor.departmentId;
  }

  // Auto-check SLA breaches on fetch
  const now = new Date();
  await Complaint.updateMany(
    { slaDeadline: { $lt: now }, slaBreached: false, status: { $nin: ['RESOLVED', 'CLOSED'] } },
    { $set: { slaBreached: true } }
  );

  return await paginate(Complaint, filters, {
    ...queryOptions,
    populate: [
      { path: 'submittedBy', select: 'name email role' },
      { path: 'assignedTo', select: 'name email' }
    ],
    sort: { priority: -1, createdAt: -1 }
  });
};

const updateComplaintStatus = async (id, statusData, actor, req) => {
  const { status, resolutionRemarks, note, assignedTo } = statusData;

  const complaint = await Complaint.findById(id);
  if (!complaint) {
    throw new AppError('Complaint not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  // Enforce HOD department boundaries
  assertHODDeptBound(actor, complaint.departmentId);

  const before = { status: complaint.status };

  complaint.statusHistory.push({
    status,
    changedBy: actor.id,
    note: note || resolutionRemarks || `Status changed to ${status}`,
    timestamp: new Date(),
  });

  complaint.status = status;
  if (resolutionRemarks) {
    complaint.resolutionRemarks = resolutionRemarks;
  }
  if (assignedTo) {
    complaint.assignedTo = assignedTo;
  }
  if (status === 'RESOLVED' || status === 'CLOSED') {
    complaint.resolvedAt = new Date();
    if (new Date() > complaint.slaDeadline) {
      complaint.slaBreached = true;
    }
  }

  await complaint.save();

  // Audit Log
  await logAuditEvent({
    actorId: actor.id,
    action: `COMPLAINT_STATUS_${status}`,
    targetId: complaint._id,
    targetModel: 'Complaint',
    before,
    after: { status, resolutionRemarks, assignedTo },
    req
  });

  return complaint;
};

module.exports = {
  createComplaint,
  getComplaints,
  updateComplaintStatus
};
