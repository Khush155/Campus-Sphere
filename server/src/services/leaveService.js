const LeaveRequest = require('../models/LeaveRequest');
const { assertHODDeptBound } = require('../utils/privilegeGuard');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const ROLES = require('../constants/roles');
const { logAuditEvent } = require('../utils/auditLogger');
const paginate = require('../utils/paginate');

const hasOverlappingLeave = async (userId, startDate, endDate, excludeId = null) => {
  const query = {
    userId,
    status: { $ne: 'REJECTED' },
    $or: [
      { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
    ],
  };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  return !!(await LeaveRequest.findOne(query));
};

const createLeaveRequest = async (leaveData, actor) => {
  const { leaveType, startDate, endDate, reason, isMedicalOverride, medicalCertificateRef } = leaveData;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    throw new AppError('Start date cannot be after end date.', 400, ERROR_CODES.BAD_REQUEST);
  }

  const overlap = await hasOverlappingLeave(actor.id, start, end);
  if (overlap) {
    throw new AppError('You already have an active leave request overlapping with these dates.', 409, ERROR_CODES.DUPLICATE_ENTRY);
  }

  const leave = await LeaveRequest.create({
    userId: actor.id,
    departmentId: actor.departmentId,
    leaveType,
    startDate: start,
    endDate: end,
    reason,
    isMedicalOverride: !!isMedicalOverride,
    medicalCertificateRef: medicalCertificateRef || null,
  });

  return leave;
};

const getLeaveRequests = async (queryOptions, actor) => {
  const { departmentId, userId, status, leaveType } = queryOptions;
  const filters = {};

  if (departmentId) {
    filters.departmentId = departmentId;
  }
  if (userId) {
    filters.userId = userId;
  }
  if (status) {
    filters.status = status;
  }
  if (leaveType) {
    filters.leaveType = leaveType;
  }

  // Enforce HOD & Student/Faculty boundary checks
  if (actor.role === ROLES.HOD) {
    filters.departmentId = actor.departmentId;
  } else if (actor.role === ROLES.FACULTY || actor.role === ROLES.STUDENT) {
    filters.userId = actor.id;
  }

  return await paginate(LeaveRequest, filters, {
    ...queryOptions,
    populate: [
      { path: 'userId', select: 'name email role' },
      { path: 'approvedBy', select: 'name email' }
    ],
    sort: { createdAt: -1 }
  });
};

const updateLeaveStatus = async (id, statusData, actor, req) => {
  const { status, remarks, isMedicalOverride } = statusData;

  const leave = await LeaveRequest.findById(id);
  if (!leave) {
    throw new AppError('Leave request not found.', 404, ERROR_CODES.NOT_FOUND);
  }
  if (leave.status !== 'PENDING') {
    throw new AppError('Only PENDING leave requests can be updated.', 409, ERROR_CODES.BAD_REQUEST);
  }

  // Enforce HOD department boundaries
  assertHODDeptBound(actor, leave.departmentId);

  const before = { status: leave.status };

  leave.status = status;
  leave.approvedBy = actor.id;
  leave.approvedAt = new Date();
  if (remarks) {
    leave.remarks = remarks;
  }
  if (isMedicalOverride !== undefined) {
    leave.isMedicalOverride = isMedicalOverride;
  }

  await leave.save();

  // Audit Log
  await logAuditEvent({
    actorId: actor.id,
    action: `LEAVE_${status}`,
    targetId: leave._id,
    targetModel: 'LeaveRequest',
    before,
    after: { status: leave.status, remarks: leave.remarks },
    req
  });

  return leave;
};

module.exports = {
  createLeaveRequest,
  getLeaveRequests,
  updateLeaveStatus
};
