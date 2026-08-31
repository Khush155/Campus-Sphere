const Complaint = require('../models/Complaint');
const { assertHODDeptBound } = require('../utils/privilegeGuard');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const ROLES = require('../constants/roles');
const { logAuditEvent } = require('../utils/auditLogger');
const paginate = require('../utils/paginate');

const createComplaint = async (complaintData, actor) => {
  const { title, description, category, priority } = complaintData;

  let departmentId = actor.departmentId;
  if (!departmentId && actor.branchId) {
    const Branch = require('../models/Branch');
    const branch = await Branch.findById(actor.branchId).select('hostingDepartmentId departmentId');
    departmentId = branch?.hostingDepartmentId || branch?.departmentId;
  }
  if (!departmentId) {
    const Department = require('../models/Department');
    const firstDept = await Department.findOne().select('_id');
    departmentId = firstDept?._id;
  }

  const complaint = await Complaint.create({
    title,
    description,
    category,
    priority: priority || 'MEDIUM',
    submittedBy: actor.id,
    departmentId,
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

  // Enforce role boundaries
  if (actor.role === ROLES.HOD) {
    filters.departmentId = actor.departmentId;
  } else if (actor.role === ROLES.STUDENT) {
    filters.submittedBy = actor.id;
  } else if (actor.role === ROLES.FACULTY) {
    if (actor.departmentId) {
      filters.$or = [{ submittedBy: actor.id }, { departmentId: actor.departmentId }];
    } else {
      filters.submittedBy = actor.id;
    }
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
    req,
  });

  // Notify submitter
  try {
    const { createNotification } = require('./notificationService');
    const User = require('../models/User');
    const submitter = await User.findById(complaint.submittedBy).select('role');
    const targetLink = submitter?.role === ROLES.STUDENT ? '/student/complaints' : '/complaints';
    await createNotification({
      recipientId: complaint.submittedBy,
      title: `🛠️ Complaint ${status}: ${complaint.title}`,
      message: `Your complaint "${complaint.title}" has been marked as ${status.toLowerCase()}.${resolutionRemarks ? ` Remarks: ${resolutionRemarks}` : ''}`,
      category: 'COMPLAINT',
      link: targetLink,
      senderId: actor.id,
      metadata: { complaintId: complaint._id, status },
    });
  } catch (err) {
    // Non-blocking
  }

  return complaint;
};

module.exports = {
  createComplaint,
  getComplaints,
  updateComplaintStatus
};
