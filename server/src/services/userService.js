const mongoose = require('mongoose');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Department = require('../models/Department');
const Course = require('../models/Course');
const Branch = require('../models/Branch');
const Subject = require('../models/Subject');
const { logAuditEvent } = require('../utils/auditLogger');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const logger = require('../utils/logger');

/**
 * Fetch a paginated, filtered, and searchable list of users.
 */
const getUsersList = async ({ page = 1, limit = 20, role, departmentId, status, search }) => {
  const filter = {};

  if (role) {
    filter.role = role;
  }

  if (departmentId) {
    filter.departmentId = departmentId;
  }

  if (status) {
    filter.status = status;
  }

  if (search && search.trim().length > 0) {
    const cleanSearch = search.trim();
    const searchRegex = new RegExp(cleanSearch, 'i');
    
    filter.$or = [
      { name: searchRegex },
      { email: searchRegex }
    ];

    if (mongoose.Types.ObjectId.isValid(cleanSearch)) {
      filter.$or.push({ _id: cleanSearch });
    }
  }

  const skip = (page - 1) * limit;

  const users = await User.find(filter)
    .select('-password -refreshTokens -resetPasswordToken -resetPasswordExpire')
    .populate('departmentId', 'name code')
    .populate('courseId', 'name code')
    .populate('branchId', 'name code')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments(filter);
  const totalPages = Math.ceil(total / limit);

  return {
    users: users.map(u => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.departmentId ? u.departmentId.name : null,
      departmentId: u.departmentId ? u.departmentId._id : null,
      course: u.courseId ? u.courseId.name : null,
      courseId: u.courseId ? u.courseId._id : null,
      branch: u.branchId ? u.branchId.name : null,
      branchId: u.branchId ? u.branchId._id : null,
      semester: u.semester || null,
      status: u.status,
      createdAt: u.createdAt,
    })),
    meta: {
      page,
      limit,
      total,
      totalPages,
    }
  };
};

/**
 * Update user profile parameters securely.
 */
const updateUserDetails = async (userId, updateData, adminUserId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  const before = user.toObject();

  // 1. Assigning HOD Role: check department bounds
  const newRole = updateData.role || user.role;
  const targetDept = updateData.departmentId !== undefined ? updateData.departmentId : user.departmentId;

  if (newRole === 'HOD' && (updateData.role === 'HOD' || updateData.departmentId !== undefined)) {
    if (!targetDept) {
      throw new AppError('An HOD must be assigned to a department.', 400, ERROR_CODES.VALIDATION_ERROR);
    }
    
    // Check if another active HOD is already assigned
    const existingHod = await User.findOne({
      departmentId: targetDept,
      role: 'HOD',
      status: 'ACTIVE',
      _id: { $ne: user._id },
    });

    if (existingHod) {
      throw new AppError(
        'This department already has an active HOD. Please demote the existing HOD first.',
        400,
        'HOD_ALREADY_ASSIGNED'
      );
    }
  }

  // 2. Changing Student branch/semester
  if (user.role === 'STUDENT') {
    const normalizeId = (id) => id ? String(id) : '';
    const branchChanged = updateData.branchId !== undefined && normalizeId(updateData.branchId) !== normalizeId(user.branchId);
    const semesterChanged = updateData.semester !== undefined && Number(updateData.semester || 1) !== Number(user.semester || 1);
    
    if (branchChanged || semesterChanged) {
      if (!updateData.reason || updateData.reason.trim().length < 3) {
        throw new AppError(
          'A reasoning of at least 3 characters is required for updating student branches or semesters.',
          400,
          ERROR_CODES.VALIDATION_ERROR
        );
      }
    }
  }

  // 3. Map update fields
  if (updateData.name !== undefined) {
    user.name = updateData.name;
  }
  if (updateData.role !== undefined) {
    user.role = updateData.role;
  }
  if (updateData.departmentId !== undefined) {
    user.departmentId = updateData.departmentId || null;
  }
  if (updateData.status !== undefined) {
    user.status = updateData.status;
  }
  if (updateData.courseId !== undefined) {
    user.courseId = updateData.courseId || null;
  }
  if (updateData.branchId !== undefined) {
    user.branchId = updateData.branchId || null;
  }
  if (updateData.semester !== undefined) {
    user.semester = newRole === 'STUDENT' ? (updateData.semester || 1) : null;
  }

  await user.save();
  const after = user.toObject();

  // 4. Audit Log Writing
  if (before.role !== after.role) {
    await logAuditEvent({
      actorId: adminUserId,
      action: 'ROLE_CHANGE',
      targetId: user._id,
      targetModel: 'User',
      before: { role: before.role },
      after: { role: after.role },
    });
  } else if (before.status !== after.status) {
    await logAuditEvent({
      actorId: adminUserId,
      action: 'STATUS_CHANGE',
      targetId: user._id,
      targetModel: 'User',
      before: { status: before.status },
      after: { status: after.status },
    });
  }

  // Log Student details change specifically
  if (user.role === 'STUDENT') {
    const branchChanged = before.branchId !== after.branchId;
    const semesterChanged = before.semester !== after.semester;
    if (branchChanged || semesterChanged) {
      await logAuditEvent({
        actorId: adminUserId,
        action: 'STUDENT_ACADEMIC_CHANGE',
        targetId: user._id,
        targetModel: 'User',
        before: { branchId: before.branchId, semester: before.semester },
        after: { branchId: after.branchId, semester: after.semester, reason: updateData.reason },
      });
    }
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    departmentId: user.departmentId,
    courseId: user.courseId,
    branchId: user.branchId,
    semester: user.semester,
    status: user.status,
  };
};

/**
 * Deactivates (soft deletes) a user account.
 */
const deleteUserAccount = async (userId, adminUserId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  const before = { status: user.status };
  user.status = 'INACTIVE';
  await user.save();

  await logAuditEvent({
    actorId: adminUserId,
    action: 'USER_DEACTIVATED',
    targetId: user._id,
    targetModel: 'User',
    before,
    after: { status: 'INACTIVE' },
  });

  logger.info(`[User Deactivated] ID: ${user._id} - Actioned By: ${adminUserId}`);
  return true;
};

/**
 * Returns the last 8 audit logs populated with actor info.
 */
const getAuditLogsList = async () => {
  const logs = await AuditLog.find()
    .sort({ timestamp: -1 })
    .limit(8)
    .populate('actorId', 'name email');

  return logs.map(log => ({
    id: log._id,
    actorName: log.actorId ? log.actorId.name : 'System',
    actorEmail: log.actorId ? log.actorId.email : '',
    action: log.action,
    targetId: log.targetId,
    targetModel: log.targetModel,
    before: log.before,
    after: log.after,
    timestamp: log.timestamp,
  }));
};

/**
 * Performs institution-wide anomaly check and returns configuration insights.
 */
const getInstitutionalInsights = async () => {
  const insights = [];

  // 1. Departments with no HOD
  const departments = await Department.find();
  for (const dept of departments) {
    const hod = await User.findOne({ role: 'HOD', departmentId: dept._id, status: 'ACTIVE' });
    if (!hod) {
      insights.push({
        id: `no-hod-${dept._id}`,
        type: 'NO_HOD',
        message: `${dept.name} has no active HOD assigned`,
        severity: 'amber',
        actionRoute: `/admin/users?role=HOD&department=${dept._id}`,
        actionText: 'Assign',
      });
    }
  }

  // 2. Courses with zero branches
  const courses = await Course.find();
  for (const course of courses) {
    const branch = await Branch.findOne({ courseId: course._id });
    if (!branch) {
      insights.push({
        id: `no-branch-${course._id}`,
        type: 'EMPTY_COURSE',
        message: `Course ${course.name} has no specialization branches configured`,
        severity: 'red',
        actionRoute: `/admin/college-setup/branches?add=true`,
        actionText: 'Configure',
      });
    }
  }

  // 3. Branches with zero subjects assigned
  const branches = await Branch.find().populate('courseId');
  for (const branch of branches) {
    const subject = await Subject.findOne({ branchId: branch._id });
    if (!subject) {
      insights.push({
        id: `no-subject-${branch._id}`,
        type: 'EMPTY_BRANCH',
        message: `Branch ${branch.name} (${branch.courseId?.code || 'N/A'}) has no subjects configured`,
        severity: 'amber',
        actionRoute: `/admin/college-setup/subjects?add=true`,
        actionText: 'Add Subject',
      });
    }
  }

  // 4. Users created who have never logged in (empty refreshTokens)
  const neverLoggedInCount = await User.countDocuments({ refreshTokens: { $size: 0 }, status: 'ACTIVE' });
  if (neverLoggedInCount > 0) {
    insights.push({
      id: 'pending-first-login',
      type: 'PENDING_LOGIN',
      message: `${neverLoggedInCount} active user account(s) pending first login`,
      severity: 'amber',
      actionRoute: `/admin/users?status=ACTIVE`,
      actionText: 'View',
    });
  }

  return insights;
};

/**
 * Retrieve details for a single user by ID.
 */
const getUserDetails = async (userId) => {
  const u = await User.findById(userId)
    .select('-password -refreshTokens -resetPasswordToken -resetPasswordExpire')
    .populate('departmentId', 'name code')
    .populate('courseId', 'name code')
    .populate('branchId', 'name code');
  
  if (!u) {
    throw new AppError('User not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  return {
    id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    department: u.departmentId ? u.departmentId.name : null,
    departmentId: u.departmentId ? u.departmentId._id : null,
    course: u.courseId ? u.courseId.name : null,
    courseId: u.courseId ? u.courseId._id : null,
    branch: u.branchId ? u.branchId.name : null,
    branchId: u.branchId ? u.branchId._id : null,
    semester: u.semester || null,
    status: u.status,
    createdAt: u.createdAt,
  };
};

module.exports = {
  getUsersList,
  getUserDetails,
  updateUserDetails,
  deleteUserAccount,
  getAuditLogsList,
  getInstitutionalInsights,
};
