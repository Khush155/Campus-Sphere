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
 * Checks for HOD assignment conflicts within a department.
 * A department can have either one GENERAL HOD, or up to two shift HODs (one MORNING, one EVENING).
 */
const checkHodConflict = async (departmentId, shift, excludeUserId = null) => {
  const query = {
    departmentId,
    role: 'HOD',
    status: 'ACTIVE',
    ...(excludeUserId && { _id: { $ne: excludeUserId } }),
  };

  const dept = await Department.findById(departmentId);
  const departmentName = dept ? dept.name : 'Department';

  if (shift === 'GENERAL') {
    const anyExisting = await User.findOne(query);
    if (anyExisting) {
      throw new AppError(
        `${departmentName} already has an active HOD (${anyExisting.name}, ${anyExisting.shift || 'GENERAL'}). Remove or reassign them before adding a General HOD.`,
        409,
        ERROR_CODES.HOD_ALREADY_ASSIGNED
      );
    }
  } else {
    const conflicting = await User.findOne({
      ...query,
      shift: { $in: ['GENERAL', shift] },
    });
    if (conflicting) {
      const reason = conflicting.shift === 'GENERAL'
        ? `${departmentName} currently has a General HOD (${conflicting.name}). Reassign or convert them to shift-specific before adding a ${shift} HOD.`
        : `${departmentName} already has a ${shift}-shift HOD: ${conflicting.name}.`;
      throw new AppError(reason, 409, ERROR_CODES.HOD_ALREADY_ASSIGNED);
    }
  }
};

/**
 * Fetch a paginated, filtered, and searchable list of users.
 */
const getUsersList = async ({ page = 1, limit = 20, role, departmentId, status, search, courseId, branchId, semester, group }) => {
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

  if (courseId) {
    filter.courseId = courseId;
  }

  if (branchId) {
    filter.branchId = branchId;
  }

  if (semester) {
    filter.semester = semester;
  }

  if (group) {
    filter.group = group;
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
      rollNumber: u.rollNumber || null,
      department: u.departmentId ? u.departmentId.name : null,
      departmentId: u.departmentId ? u.departmentId._id : null,
      course: u.courseId ? u.courseId.name : null,
      courseId: u.courseId ? u.courseId._id : null,
      branch: u.branchId ? u.branchId.name : null,
      branchId: u.branchId ? u.branchId._id : null,
      semester: u.semester || null,
      group: u.group || null,
      status: u.status,
      shift: u.shift || null,
      lastLoginAt: u.lastLoginAt || null,
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
const updateUserDetails = async (userId, updateData, adminUserId, meta) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  const before = user.toObject();

  const newRole = updateData.role || user.role;
  const targetDept = updateData.departmentId !== undefined ? updateData.departmentId : user.departmentId;

  if (newRole === 'HOD' && (updateData.role === 'HOD' || updateData.departmentId !== undefined || updateData.shift !== undefined)) {
    if (!targetDept) {
      throw new AppError('An HOD must be assigned to a department.', 400, ERROR_CODES.VALIDATION_ERROR);
    }
    const targetShift = updateData.shift !== undefined ? updateData.shift : user.shift;
    if (!targetShift) {
      throw new AppError('An HOD must be assigned a shift scope.', 400, ERROR_CODES.VALIDATION_ERROR);
    }
    await checkHodConflict(targetDept, targetShift, user._id);
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

    const targetBranchId = updateData.branchId !== undefined ? updateData.branchId : user.branchId;
    const targetSem = updateData.semester !== undefined ? Number(updateData.semester) : user.semester;

    if (targetBranchId) {
      const branchDoc = await Branch.findById(targetBranchId).populate('courseId');
      if (branchDoc) {
        user.courseId = branchDoc.courseId?._id || branchDoc.courseId;
        const maxSemesters = branchDoc.courseId?.durationYears ? branchDoc.courseId.durationYears * 2 : 12;
        if (targetSem && targetSem > maxSemesters) {
          throw new AppError(`Student semester (${targetSem}) exceeds maximum allowed semester (${maxSemesters}) for ${branchDoc.courseId?.code || 'this course'}.`, 400, ERROR_CODES.VALIDATION_ERROR);
        }
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
  if (updateData.group !== undefined) {
    user.group = newRole === 'STUDENT' ? (updateData.group || null) : null;
  }
  if (updateData.shift !== undefined) {
    user.shift = newRole === 'HOD' ? updateData.shift : null;
  } else if (updateData.role !== undefined && updateData.role !== 'HOD') {
    user.shift = null;
  }

  await user.save();
  const after = user.toObject();

  if (before.shift !== after.shift) {
    await logAuditEvent({
      actorId: adminUserId,
      action: 'SHIFT_CHANGE',
      targetId: user._id,
      targetModel: 'User',
      before: { shift: before.shift },
      after: { shift: after.shift },
      meta,
    });
  }

  // 4. Audit Log Writing
  if (before.role !== after.role) {
    await logAuditEvent({
      actorId: adminUserId,
      action: 'ROLE_CHANGE',
      targetId: user._id,
      targetModel: 'User',
      before: { role: before.role },
      after: { role: after.role },
      meta,
    });
  } else if (before.status !== after.status) {
    await logAuditEvent({
      actorId: adminUserId,
      action: 'STATUS_CHANGE',
      targetId: user._id,
      targetModel: 'User',
      before: { status: before.status },
      after: { status: after.status },
      meta,
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
        meta,
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
    group: user.group,
    status: user.status,
  };
};

/**
 * Deactivates (soft deletes) a user account.
 */
const deleteUserAccount = async (userId, adminUserId, meta) => {
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
    meta,
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
    group: u.group || null,
    status: u.status,
    shift: u.shift || null,
    createdAt: u.createdAt,
  };
};

/**
 * Import students in bulk from a CSV buffer.
 */
const importStudents = async (fileBuffer, actorId, req) => {
  if (!fileBuffer) {
    throw new AppError('No CSV file uploaded.', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const csvText = fileBuffer.toString('utf-8');
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);

  if (lines.length <= 1) {
    throw new AppError('CSV file is empty or missing headers.', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const nameIdx = headers.findIndex(h => h.includes('name'));
  const emailIdx = headers.findIndex(h => h.includes('email'));
  const branchIdx = headers.findIndex(h => h.includes('branch'));
  const semIdx = headers.findIndex(h => h.includes('sem'));
  const rollIdx = headers.findIndex(h => h.includes('roll'));
  const groupIdx = headers.findIndex(h => h.includes('group'));
  const passIdx = headers.findIndex(h => h.includes('password'));

  if (nameIdx === -1 || emailIdx === -1 || branchIdx === -1) {
    throw new AppError('CSV must include "Name", "Email", and "Branch" columns.', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const actor = await User.findById(actorId);

  const branches = await Branch.find().populate('courseId');
  const branchMap = new Map();
  branches.forEach(b => {
    branchMap.set(b.code.toUpperCase(), b);
    branchMap.set(b.name.toUpperCase(), b);
  });

  const importedStudents = [];
  const errors = [];

  for (let i = 1; i < lines.length; i++) {
    const rowNum = i + 1;
    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    if (cols.length < 3) {
      continue;
    }

    const name = cols[nameIdx] || '';
    const email = cols[emailIdx] || '';
    const branchCode = (cols[branchIdx] || '').toUpperCase();
    const semester = parseInt(cols[semIdx], 10) || 1;
    const rollNumber = rollIdx !== -1 && cols[rollIdx] ? cols[rollIdx] : undefined;
    const group = groupIdx !== -1 && cols[groupIdx] ? cols[groupIdx] : undefined;
    const password = passIdx !== -1 && cols[passIdx] ? cols[passIdx] : 'Student@123';

    if (!name || name.length < 2) {
      errors.push(`Row ${rowNum}: Name must be at least 2 characters.`);
      continue;
    }

    if (!email || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      errors.push(`Row ${rowNum}: Invalid email address "${email}".`);
      continue;
    }

    const branch = branchMap.get(branchCode);
    if (!branch) {
      errors.push(`Row ${rowNum}: Branch "${branchCode}" not found.`);
      continue;
    }

    const maxSemesters = branch.courseId?.durationYears ? branch.courseId.durationYears * 2 : 12;
    if (semester < 1 || semester > maxSemesters) {
      errors.push(`Row ${rowNum}: Semester (${semester}) exceeds max semesters (${maxSemesters}) for course ${branch.courseId?.code || ''}.`);
      continue;
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      errors.push(`Row ${rowNum}: Email "${email}" already registered.`);
      continue;
    }

    if (rollNumber) {
      const existingRoll = await User.findOne({ rollNumber });
      if (existingRoll) {
        errors.push(`Row ${rowNum}: Roll number "${rollNumber}" already exists.`);
        continue;
      }
    }

    try {
      const student = await User.create({
        name,
        email: email.toLowerCase(),
        password,
        role: 'STUDENT',
        departmentId: actor?.departmentId || null,
        courseId: branch.courseId?._id || branch.courseId,
        branchId: branch._id,
        semester,
        group,
        rollNumber: rollNumber || undefined,
        status: 'ACTIVE'
      });

      importedStudents.push(student);
    } catch (createErr) {
      errors.push(`Row ${rowNum}: Failed to create student (${createErr.message}).`);
    }
  }

  await logAuditEvent({
    actorId,
    action: 'STUDENTS_BULK_IMPORTED',
    targetModel: 'User',
    after: { count: importedStudents.length, errorsCount: errors.length },
    req
  });

  return {
    importedCount: importedStudents.length,
    failedCount: errors.length,
    errors
  };
};

module.exports = {
  getUsersList,
  getUserDetails,
  updateUserDetails,
  deleteUserAccount,
  getAuditLogsList,
  getInstitutionalInsights,
  checkHodConflict,
  importStudents,
};
