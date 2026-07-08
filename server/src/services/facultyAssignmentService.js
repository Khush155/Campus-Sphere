const FacultyAssignment = require('../models/FacultyAssignment');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const auditLogger = require('../utils/auditLogger');
const mongoose = require('mongoose');

const assignFaculty = async (payload, assignerId, req) => {
  const { facultyId, subjectId, branchId, academicYear, semester } = payload;

  // Verify user is a FACULTY
  const facultyUser = await User.findById(facultyId);
  if (!facultyUser) {
    throw new AppError('Faculty user not found', 404, ERROR_CODES.NOT_FOUND);
  }
  if (facultyUser.role !== 'FACULTY') {
    throw new AppError('Assigned user must have the FACULTY role', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  // Create assignment
  const assignment = await FacultyAssignment.create({
    facultyId,
    subjectId,
    branchId,
    academicYear,
    semester,
    assignedBy: assignerId,
    status: 'ACTIVE',
  });

  await auditLogger.logAuditEvent({
    actorId: assignerId,
    action: 'CREATE_FACULTY_ASSIGNMENT',
    targetId: assignment._id,
    targetModel: 'FacultyAssignment',
    before: null,
    after: assignment,
    req,
  });

  return assignment;
};

const listAssignmentsByBranch = async (branchId, filters) => {
  const query = { branchId, status: 'ACTIVE' };
  if (filters.academicYear) query.academicYear = filters.academicYear;
  if (filters.semester) query.semester = Number(filters.semester);

  const assignments = await FacultyAssignment.find(query)
    .populate('facultyId', 'name email role')
    .populate('subjectId', 'name code credits type')
    .lean();

  return assignments;
};

const listAssignmentsByFaculty = async (facultyId) => {
  const assignments = await FacultyAssignment.find({ facultyId, status: 'ACTIVE' })
    .populate('subjectId', 'name code credits type')
    .populate('branchId', 'name code')
    .lean();

  return assignments;
};

const revokeAssignment = async (assignmentId, revokerId, req) => {
  const assignment = await FacultyAssignment.findById(assignmentId);
  if (!assignment) {
    throw new AppError('Faculty assignment not found', 404, ERROR_CODES.NOT_FOUND);
  }

  if (assignment.status === 'REVOKED') {
    throw new AppError('Assignment is already revoked', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const before = { ...assignment.toObject() };
  assignment.status = 'REVOKED';
  await assignment.save();

  await auditLogger.logAuditEvent({
    actorId: revokerId,
    action: 'REVOKE_FACULTY_ASSIGNMENT',
    targetId: assignment._id,
    targetModel: 'FacultyAssignment',
    before,
    after: assignment,
    req,
  });

  return assignment;
};

module.exports = {
  assignFaculty,
  listAssignmentsByBranch,
  listAssignmentsByFaculty,
  revokeAssignment,
};
