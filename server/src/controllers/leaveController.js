const LeaveRequest = require('../models/LeaveRequest');
const AuditLog = require('../models/AuditLog');
const AppError = require('../utils/AppError');

/**
 * Checks if a user has an overlapping leave in the given date range.
 */
const hasOverlappingLeave = async (userId, startDate, endDate, excludeId = null) => {
  const query = {
    userId,
    status: { $ne: 'REJECTED' },
    $or: [
      { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
    ],
  };
  if (excludeId) query._id = { $ne: excludeId };
  return !!(await LeaveRequest.findOne(query));
};

/**
 * POST /api/v1/leave
 * Create a leave request with overlap validation and totalDays auto-compute.
 */
exports.createLeaveRequest = async (req, res) => {
  const { leaveType, startDate, endDate, reason, isMedicalOverride, medicalCertificateRef } = req.body;

  if (!leaveType || !startDate || !endDate || !reason) {
    throw new AppError('leaveType, startDate, endDate, and reason are required.', 400);
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) throw new AppError('Start date cannot be after end date.', 400);

  // Business rule: no overlapping pending/approved leaves
  const overlap = await hasOverlappingLeave(req.user.id, start, end);
  if (overlap) {
    throw new AppError('You already have an active leave request overlapping with these dates.', 409);
  }

  const leave = await LeaveRequest.create({
    userId: req.user.id,
    departmentId: req.user.departmentId,
    leaveType,
    startDate: start,
    endDate: end,
    reason,
    isMedicalOverride: !!isMedicalOverride,
    medicalCertificateRef: medicalCertificateRef || null,
  });

  res.status(201).json({ success: true, data: leave });
};

/**
 * GET /api/v1/leave
 * List leave requests with pagination and filters.
 */
exports.getLeaveRequests = async (req, res) => {
  const { departmentId, userId, status, leaveType, page = 1, limit = 20 } = req.query;
  const filters = {};

  if (departmentId) filters.departmentId = departmentId;
  if (userId) filters.userId = userId;
  if (status) filters.status = status;
  if (leaveType) filters.leaveType = leaveType;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [leaves, total] = await Promise.all([
    LeaveRequest.find(filters)
      .populate('userId', 'name email role')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    LeaveRequest.countDocuments(filters),
  ]);

  res.status(200).json({
    success: true,
    data: leaves,
    meta: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
  });
};

/**
 * PATCH /api/v1/leave/:id/status
 * Approve or reject a leave with a mandatory remarks field for rejections.
 * Medical leaves can be granted with an attendance override flag.
 */
exports.updateLeaveStatus = async (req, res) => {
  const { id } = req.params;
  const { status, remarks, isMedicalOverride } = req.body;

  if (!status) throw new AppError('Status is required.', 400);
  if (status === 'REJECTED' && !remarks) {
    throw new AppError('A rejection reason (remarks) is required when rejecting a leave.', 400);
  }

  const leave = await LeaveRequest.findById(id);
  if (!leave) throw new AppError('Leave request not found.', 404);
  if (leave.status !== 'PENDING') throw new AppError('Only PENDING leave requests can be updated.', 409);

  const before = { status: leave.status };

  leave.status = status;
  leave.approvedBy = req.user.id;
  leave.approvedAt = new Date();
  if (remarks) leave.remarks = remarks;
  if (isMedicalOverride !== undefined) leave.isMedicalOverride = isMedicalOverride;

  await leave.save();

  // Write audit log
  await AuditLog.create({
    actorId: req.user.id,
    action: `LEAVE_${status}`,
    targetId: leave._id,
    targetModel: 'LeaveRequest',
    before,
    after: { status: leave.status, remarks: leave.remarks },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json({ success: true, data: leave });
};
