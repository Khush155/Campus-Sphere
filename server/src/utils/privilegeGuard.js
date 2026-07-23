const AppError = require('./AppError');
const ERROR_CODES = require('../constants/errorCodes');
const FacultyAssignment = require('../models/FacultyAssignment');
const ROLES = require('../constants/roles');

const ADMIN_TIER_ROLES = ['SUPER_ADMIN', 'COLLEGE_ADMIN'];

/**
 * Throws if a COLLEGE_ADMIN actor is attempting to act on or assign an admin-tier role.
 * SUPER_ADMIN actors are never restricted by this check.
 */
const assertNoPrivilegeEscalation = ({ actorRole, targetCurrentRole, targetNewRole }) => {
  if (actorRole === ROLES.SUPER_ADMIN) {
    return;
  }

  if (actorRole === ROLES.COLLEGE_ADMIN) {
    if (ADMIN_TIER_ROLES.includes(targetCurrentRole) || ADMIN_TIER_ROLES.includes(targetNewRole)) {
      throw new AppError('Access denied. College Admins cannot modify or assign admin-tier roles.', 403, ERROR_CODES.FORBIDDEN);
    }
  }
};

const getIdString = (val) => {
  if (!val) {
    return '';
  }
  if (typeof val === 'string') {
    return val;
  }
  if (val._id) {
    return String(val._id);
  }
  return String(val);
};

/**
 * Throws if an HOD is attempting to act on a resource outside their department.
 */
const assertHODDeptBound = (user, departmentId) => {
  if (!user) {
    throw new AppError('Authentication required.', 401, ERROR_CODES.UNAUTHORIZED);
  }
  if (user.role === ROLES.SUPER_ADMIN || user.role === ROLES.COLLEGE_ADMIN) {
    return;
  }

  if (user.role === ROLES.HOD) {
    const userDeptId = getIdString(user.departmentId);
    const targetDeptId = getIdString(departmentId);
    if (!targetDeptId || userDeptId !== targetDeptId) {
      throw new AppError('Access denied. You can only manage resources within your own department.', 403, ERROR_CODES.FORBIDDEN);
    }
  } else {
    throw new AppError('Access denied. Unauthorized role.', 403, ERROR_CODES.FORBIDDEN);
  }
};

/**
 * Throws if a Faculty member is attempting to act on a subject they are not assigned to.
 */
const assertFacultyAssigned = async (user, subjectId) => {
  if (!user) {
    throw new AppError('Authentication required.', 401, ERROR_CODES.UNAUTHORIZED);
  }
  if (user.role === ROLES.SUPER_ADMIN || user.role === ROLES.COLLEGE_ADMIN || user.role === ROLES.HOD) {
    return;
  }

  if (user.role === ROLES.FACULTY) {
    const assignment = await FacultyAssignment.findOne({
      facultyId: user.id,
      subjectId: subjectId,
      status: 'ACTIVE'
    });
    if (!assignment) {
      const Subject = require('../models/Subject');
      const User = require('../models/User');
      const subject = await Subject.findById(subjectId);
      const facultyUser = await User.findById(user.id);
      const facultyDept = getIdString(facultyUser?.departmentId || user.departmentId);
      const subjectDept = getIdString(subject?.departmentId);

      if (!subject || !facultyDept || facultyDept !== subjectDept) {
        throw new AppError('Access denied. You are not assigned to this subject.', 403, ERROR_CODES.FORBIDDEN);
      }
    }
  } else {
    throw new AppError('Access denied. Unauthorized role.', 403, ERROR_CODES.FORBIDDEN);
  }
};

module.exports = {
  assertNoPrivilegeEscalation,
  assertHODDeptBound,
  assertFacultyAssigned
};
