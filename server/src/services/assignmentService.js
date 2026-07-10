const FacultyAssignment = require('../models/FacultyAssignment');
const User = require('../models/User');
const Subject = require('../models/Subject');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const logger = require('../utils/logger');
const { logAuditEvent } = require('../utils/auditLogger');
const paginate = require('../utils/paginate');

const createAssignment = async ({ facultyId, subjectId, assignedBy, departmentId, req }) => {
  // 1. Verify faculty exists, is FACULTY, and belongs to the SAME department as HOD
  const faculty = await User.findById(facultyId);
  if (!faculty) {
    throw new AppError('Faculty not found.', 404, ERROR_CODES.NOT_FOUND);
  }
  if (faculty.role !== 'FACULTY') {
    throw new AppError('Only users with FACULTY role can be assigned subjects.', 400, ERROR_CODES.VALIDATION_ERROR);
  }
  if (faculty.departmentId.toString() !== departmentId.toString()) {
    throw new AppError('You can only assign faculty from your own department.', 403, ERROR_CODES.FORBIDDEN);
  }

  // 2. Verify subject exists
  const subject = await Subject.findById(subjectId);
  if (!subject) {
    throw new AppError('Subject not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  // 3. Verify no active assignment exists for this subject
  const activeAssignment = await FacultyAssignment.findOne({ subjectId, status: 'ACTIVE' });
  if (activeAssignment) {
    throw new AppError('An active assignment already exists for this subject.', 400, ERROR_CODES.DUPLICATE_ENTRY);
  }

  // 4. Create assignment
  const assignment = await FacultyAssignment.create({
    facultyId,
    subjectId,
    assignedBy,
    status: 'ACTIVE',
  });

  logger.info(`[Faculty Assigned] Faculty: ${facultyId} to Subject: ${subjectId} by HOD: ${assignedBy}`);

  // 5. Audit Log
  await logAuditEvent({
    actorId: assignedBy,
    action: 'FACULTY_ASSIGNED',
    targetId: assignment._id,
    targetModel: 'FacultyAssignment',
    after: assignment.toObject(),
    req,
  });

  return assignment;
};

const revokeAssignment = async ({ assignmentId, revokedBy, departmentId, revokedReason, req }) => {
  const assignment = await FacultyAssignment.findById(assignmentId).populate('facultyId');
  if (!assignment) {
    throw new AppError('Assignment not found.', 404, ERROR_CODES.NOT_FOUND);
  }
  
  if (assignment.status === 'REVOKED') {
    throw new AppError('Assignment is already revoked.', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  // Verify the assignment belongs to a faculty in the HOD's department
  if (assignment.facultyId.departmentId.toString() !== departmentId.toString()) {
    throw new AppError('You can only revoke assignments for faculty in your own department.', 403, ERROR_CODES.FORBIDDEN);
  }

  const beforeState = assignment.toObject();

  assignment.status = 'REVOKED';
  assignment.revokedAt = new Date();
  assignment.revokedReason = revokedReason;

  await assignment.save();

  logger.info(`[Faculty Assignment Revoked] Assignment: ${assignmentId} by HOD: ${revokedBy}`);

  await logAuditEvent({
    actorId: revokedBy,
    action: 'FACULTY_REVOKED',
    targetId: assignment._id,
    targetModel: 'FacultyAssignment',
    before: beforeState,
    after: assignment.toObject(),
    req,
  });

  return assignment;
};

const listAssignmentsByDept = async (departmentId, queryOptions = {}) => {
  // To list assignments by department, we can find all subjects in the department 
  // and then get assignments for those subjects.
  // Alternatively, we can find assignments where facultyId belongs to the department.
  // The most standard way is to return the populated assignments.
  // But paginate utility doesn't support complex joins out of the box.
  
  // Let's filter by finding faculty in the department first, or subjects in the department.
  // Assuming assignments are for subjects in the HOD's department.
  const subjectsInDept = await Subject.find({ departmentId }).select('_id');
  const subjectIds = subjectsInDept.map(s => s._id);

  const filter = {
    subjectId: { $in: subjectIds },
  };
  
  if (queryOptions.status) {
    filter.status = queryOptions.status;
  }
  
  // Allow filtering by branch and semester which are properties of Subject.
  // We'll have to find subjects matching branch/semester first.
  if (queryOptions.branchId || queryOptions.semester) {
    const subjectFilter = { departmentId };
    if (queryOptions.branchId) subjectFilter.branchId = queryOptions.branchId;
    if (queryOptions.semester) subjectFilter.semester = queryOptions.semester;
    
    const filteredSubjects = await Subject.find(subjectFilter).select('_id');
    filter.subjectId = { $in: filteredSubjects.map(s => s._id) };
  }

  return await paginate(FacultyAssignment, filter, {
    ...queryOptions,
    populate: [
      { path: 'facultyId', select: 'name email departmentId' },
      { path: 'subjectId', populate: [{ path: 'branchId', select: 'name code' }] }
    ],
  });
};

module.exports = {
  createAssignment,
  revokeAssignment,
  listAssignmentsByDept,
};
