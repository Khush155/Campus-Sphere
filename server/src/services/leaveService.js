const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');
const { createNotification, createBulkNotifications } = require('./notificationService');
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

  let targetDeptId = actor.departmentId || leaveData.departmentId;
  if (!targetDeptId && actor.branchId) {
    const Branch = require('../models/Branch');
    const branch = await Branch.findById(actor.branchId).select('hostingDepartmentId');
    if (branch?.hostingDepartmentId) {
      targetDeptId = branch.hostingDepartmentId;
    } else {
      targetDeptId = actor.branchId;
    }
  }

  const leave = await LeaveRequest.create({
    userId: actor.id,
    departmentId: targetDeptId,
    leaveType,
    startDate: start,
    endDate: end,
    reason,
    isMedicalOverride: !!isMedicalOverride,
    medicalCertificateRef: medicalCertificateRef || null,
  });

  // Notify Department HOD
  try {
    const hods = targetDeptId
      ? await User.find({ role: ROLES.HOD, $or: [{ departmentId: targetDeptId }, { branchId: targetDeptId }] }).select('_id')
      : await User.find({ role: ROLES.HOD }).select('_id');
    const hodIds = hods.map((h) => h._id);
    await createBulkNotifications(hodIds, {
      title: `🌴 Leave Request Submitted: ${actor.name || 'Applicant'}`,
      message: `A new ${leaveType} leave request has been submitted for review.`,
      category: 'LEAVE',
      link: '/hod/leave-management',
      senderId: actor.id,
      metadata: { leaveId: leave._id },
    });
  } catch (err) {
    // Non-blocking logger
  }

  return leave;
};

const getLeaveRequests = async (queryOptions, actor) => {
  const { departmentId, userId, status, leaveType, role } = queryOptions;
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
    if (actor.departmentId) {
      const Branch = require('../models/Branch');
      const branchIds = (await Branch.find({ hostingDepartmentId: actor.departmentId }).select('_id')).map((b) => b._id);
      filters.$or = [
        { departmentId: actor.departmentId },
        { departmentId: { $in: branchIds } },
      ];
    }
  } else if (actor.role === ROLES.FACULTY || actor.role === ROLES.STUDENT) {
    filters.userId = actor.id;
  }

  // Filter by applicant role (e.g. FACULTY vs STUDENT)
  if (role) {
    const userRoleQuery = { role };
    if (filters.departmentId) {
      userRoleQuery.departmentId = filters.departmentId;
    }
    const matchingUsers = await User.find(userRoleQuery).select('_id');
    const matchingUserIds = matchingUsers.map((u) => u._id);
    filters.userId = { $in: matchingUserIds };
  }

  return await paginate(LeaveRequest, filters, {
    ...queryOptions,
    populate: [
      { path: 'userId', select: 'name email role rollNumber officeRoom' },
      { path: 'approvedBy', select: 'name email' },
    ],
    sort: { createdAt: -1 },
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

  // Notify requesting applicant (faculty or student)
  try {
    const applicant = await User.findById(leave.userId).select('role');
    const notificationLink = applicant?.role === ROLES.STUDENT ? '/student/leave' : '/leaves';

    await createNotification({
      recipientId: leave.userId,
      title: `🌴 Leave Request ${status}: ${leave.leaveType}`,
      message: `Your ${leave.leaveType} leave request has been ${status.toLowerCase()} by your HOD.${remarks ? ` Remarks: ${remarks}` : ''}`,
      category: 'LEAVE',
      link: notificationLink,
      senderId: actor.id,
      metadata: { leaveId: leave._id, status },
    });
  } catch (err) {
    // Non-blocking
  }

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
