const CrossDeptRequest = require('../models/CrossDeptRequest');
const FacultyAssignment = require('../models/FacultyAssignment');
const User = require('../models/User');
const Subject = require('../models/Subject');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const logger = require('../utils/logger');
const crypto = require('crypto');
const { logAuditEvent } = require('../utils/auditLogger');

// Helper to generate a 6-digit PIN
const generatePin = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const createRequest = async (requestData, requesterDeptId, createdBy, req) => {
  // Verify faculty belongs to a different department
  const faculty = await User.findById(requestData.facultyId);
  if (!faculty) throw new AppError('Faculty not found', 404, ERROR_CODES.NOT_FOUND);
  if (faculty.departmentId.toString() === requesterDeptId.toString()) {
    throw new AppError('Faculty is already in your department. You can assign them directly.', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  // Verify subject belongs to the requester's department
  const subject = await Subject.findById(requestData.subjectId);
  if (!subject) throw new AppError('Subject not found', 404, ERROR_CODES.NOT_FOUND);
  if (subject.departmentId.toString() !== requesterDeptId.toString()) {
    throw new AppError('Subject does not belong to your department.', 403, ERROR_CODES.FORBIDDEN);
  }

  // Prevent duplicate pending requests for the same faculty-subject combo
  const existing = await CrossDeptRequest.findOne({
    requesterDeptId,
    facultyId: requestData.facultyId,
    subjectId: requestData.subjectId,
    status: { $in: ['PENDING', 'PIN_GENERATED'] }
  });
  if (existing) {
    throw new AppError('A pending request for this faculty and subject already exists.', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const crossRequest = await CrossDeptRequest.create({
    requesterDeptId,
    targetDeptId: faculty.departmentId,
    facultyId: requestData.facultyId,
    subjectId: requestData.subjectId,
    reason: requestData.reason,
    status: 'PENDING',
  });

  await logAuditEvent({
    actorId: createdBy,
    action: 'CROSS_DEPT_REQUEST_CREATED',
    targetId: crossRequest._id,
    targetModel: 'CrossDeptRequest',
    after: crossRequest.toObject(),
    req,
  });

  return crossRequest;
};

const getSentRequests = async (requesterDeptId) => {
  return await CrossDeptRequest.find({ requesterDeptId })
    .populate('facultyId', 'name email employeeId')
    .populate('subjectId', 'name code')
    .populate('targetDeptId', 'name')
    .sort({ createdAt: -1 });
};

const getReceivedRequests = async (targetDeptId) => {
  return await CrossDeptRequest.find({ targetDeptId })
    .populate('facultyId', 'name email employeeId')
    .populate('subjectId', 'name code')
    .populate('requesterDeptId', 'name')
    .sort({ createdAt: -1 });
};

const respondToRequest = async (requestId, targetDeptId, action, responseNotes, actorId, req) => {
  const crossRequest = await CrossDeptRequest.findOne({ _id: requestId, targetDeptId });
  if (!crossRequest) throw new AppError('Request not found or unauthorized', 404, ERROR_CODES.NOT_FOUND);

  if (crossRequest.status !== 'PENDING') {
    throw new AppError(`Cannot respond to a request in ${crossRequest.status} state.`, 400, ERROR_CODES.VALIDATION_ERROR);
  }

  let pin = null;
  if (action === 'APPROVE') {
    pin = generatePin();
    crossRequest.status = 'PIN_GENERATED';
    crossRequest.approvalPin = pin;
  } else {
    crossRequest.status = 'REJECTED';
  }

  if (responseNotes) crossRequest.responseNotes = responseNotes;
  await crossRequest.save();

  await logAuditEvent({
    actorId,
    action: `CROSS_DEPT_REQUEST_${action}`,
    targetId: crossRequest._id,
    targetModel: 'CrossDeptRequest',
    after: { status: crossRequest.status },
    req,
  });

  return { status: crossRequest.status, pin };
};

const finalizeRequest = async (requestId, requesterDeptId, pin, actorId, req) => {
  // We need to explicitly select the approvalPin because it's select: false in schema
  const crossRequest = await CrossDeptRequest.findOne({ _id: requestId, requesterDeptId }).select('+approvalPin');
  if (!crossRequest) throw new AppError('Request not found or unauthorized', 404, ERROR_CODES.NOT_FOUND);

  if (crossRequest.status !== 'PIN_GENERATED') {
    throw new AppError('Request is not in PIN_GENERATED state.', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  if (crossRequest.approvalPin !== pin) {
    throw new AppError('Invalid PIN.', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  // PIN is correct, finalize the request
  crossRequest.status = 'APPROVED';
  crossRequest.approvalPin = undefined; // Clear the pin
  await crossRequest.save();

  // INJECT FACULTY ASSIGNMENT
  // Check if an assignment already exists
  const existingAssignment = await FacultyAssignment.findOne({
    subjectId: crossRequest.subjectId,
    facultyId: crossRequest.facultyId,
    status: 'ACTIVE'
  });

  if (!existingAssignment) {
    await FacultyAssignment.create({
      subjectId: crossRequest.subjectId,
      facultyId: crossRequest.facultyId,
      assignedBy: actorId,
      status: 'ACTIVE',
      notes: `Auto-assigned via approved Cross-Department Request (ID: ${crossRequest._id})`,
    });
    logger.info(`[Cross Dept] Created FacultyAssignment for ${crossRequest.facultyId} to ${crossRequest.subjectId}`);
  }

  await logAuditEvent({
    actorId,
    action: 'CROSS_DEPT_REQUEST_FINALIZED',
    targetId: crossRequest._id,
    targetModel: 'CrossDeptRequest',
    after: { status: 'APPROVED' },
    req,
  });

  return crossRequest;
};

module.exports = {
  createRequest,
  getSentRequests,
  getReceivedRequests,
  respondToRequest,
  finalizeRequest,
};
