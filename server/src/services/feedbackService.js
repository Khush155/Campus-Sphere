const Feedback = require('../models/Feedback');
const Subject = require('../models/Subject');
const FacultyAssignment = require('../models/FacultyAssignment');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const ROLES = require('../constants/roles');
const paginate = require('../utils/paginate');
const mongoose = require('mongoose');

const getAllFeedback = async (queryOptions, actor) => {
  const { targetRole, rating, departmentId, subjectId, semester } = queryOptions;
  const filters = {};

  if (actor.role === ROLES.SUPER_ADMIN || actor.role === ROLES.COLLEGE_ADMIN) {
    if (departmentId) {
      filters.department = departmentId;
    }
  } else if (actor.role === ROLES.HOD) {
    filters.department = actor.departmentId || actor.branchId;
  } else if (actor.role === ROLES.STUDENT || actor.role === ROLES.FACULTY) {
    filters.submittedBy = actor.id;
  }

  if (targetRole) {
    filters.targetRole = targetRole;
  }
  if (subjectId) {
    filters.subjectId = subjectId;
  }
  if (semester) {
    filters.semester = Number(semester);
  }
  if (rating) {
    filters.rating = Number(rating);
  }

  const paginatedResults = await paginate(Feedback, filters, {
    ...queryOptions,
    populate: [
      { path: 'targetUser', select: 'name email role' },
      { path: 'subjectId', select: 'name code semester' },
      { path: 'submittedBy', select: 'name email role' },
    ],
    sort: { createdAt: -1 },
  });

  // Enforce Student Anonymity: Mask submitter identity for HOD and Faculty views if isAnonymous is true
  if (actor.role === ROLES.HOD || actor.role === ROLES.FACULTY) {
    paginatedResults.data = paginatedResults.data.map((item) => {
      const obj = typeof item.toObject === 'function' ? item.toObject() : { ...item };
      if (obj.isAnonymous && obj.submittedBy?.role === 'STUDENT') {
        obj.submittedBy = {
          name: 'Verified Student (Confidential)',
          email: 'anonymous@campussphere.edu',
          role: 'STUDENT',
        };
      }
      return obj;
    });
  }

  return paginatedResults;
};

const createFeedback = async (feedbackData, actor) => {
  const { targetRole, targetUser, subjectId, semester, rating, criteriaRatings, comments, isAnonymous = true } = feedbackData;

  if (actor.role === ROLES.HOD) {
    throw new AppError(
      'HODs do not submit feedback. Students and faculty submit reviews. You have read-only access to this module.',
      403,
      ERROR_CODES.FORBIDDEN
    );
  }

  if (rating < 1 || rating > 5) {
    throw new AppError('Rating must be between 1 and 5.', 400, ERROR_CODES.BAD_REQUEST);
  }
  if (targetUser && String(targetUser) === String(actor.id)) {
    throw new AppError('You cannot submit feedback for yourself.', 400, ERROR_CODES.BAD_REQUEST);
  }

  // Duplicate prevention check
  const duplicateQuery = {
    submittedBy: actor.id,
    targetUser,
  };

  if (subjectId) {
    duplicateQuery.subjectId = subjectId;
  } else {
    // If general user evaluation, restrict to one per calendar month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    duplicateQuery.createdAt = { $gte: startOfMonth };
  }

  const existing = await Feedback.findOne(duplicateQuery);
  if (existing) {
    throw new AppError(
      subjectId
        ? 'You have already submitted an appraisal for this faculty instructor and subject.'
        : 'You have already submitted feedback for this person this month.',
      409,
      ERROR_CODES.DUPLICATE_ENTRY
    );
  }

  // Resolve department
  let targetDeptId = actor.departmentId;
  if (!targetDeptId && actor.branchId) {
    const Branch = require('../models/Branch');
    const branch = await Branch.findById(actor.branchId).select('hostingDepartmentId departmentId');
    targetDeptId = branch?.hostingDepartmentId || branch?.departmentId;
  }
  if (!targetDeptId && targetUser) {
    const targetUserDoc = await User.findById(targetUser).select('departmentId branchId');
    targetDeptId = targetUserDoc?.departmentId;
    if (!targetDeptId && targetUserDoc?.branchId) {
      const Branch = require('../models/Branch');
      const branch = await Branch.findById(targetUserDoc.branchId).select('hostingDepartmentId departmentId');
      targetDeptId = branch?.hostingDepartmentId || branch?.departmentId;
    }
  }
  if (!targetDeptId) {
    const Department = require('../models/Department');
    const firstDept = await Department.findOne().select('_id');
    targetDeptId = firstDept?._id;
  }

  const newFeedback = await Feedback.create({
    targetRole,
    targetUser: targetUser || null,
    subjectId: subjectId || null,
    semester: semester ? Number(semester) : actor.semester || 1,
    department: targetDeptId,
    rating: Number(rating),
    criteriaRatings: criteriaRatings || undefined,
    comments: comments.trim(),
    isAnonymous: Boolean(isAnonymous),
    submittedBy: actor.id,
  });

  return newFeedback;
};

const getStudentFeedbackStatus = async (studentUser, querySemester) => {
  const targetSemester = querySemester ? Number(querySemester) : studentUser.semester || 1;
  const branchId = studentUser.branchId || studentUser.departmentId;

  // 1. Find all subjects enrolled for the student's cohort & semester
  const subjectQuery = { semester: targetSemester };
  if (branchId) {
    subjectQuery.$or = [{ branchId }, { departmentId: branchId }];
  }
  const subjects = await Subject.find(subjectQuery).select('name code semester credits type sequenceNo');
  const subjectIds = subjects.map((s) => s._id);

  // 2. Find active faculty allocations for these subjects
  const facultyAllocations = await FacultyAssignment.find({
    subjectId: { $in: subjectIds },
    status: 'ACTIVE',
  })
    .populate('facultyId', 'name email profilePicUrl specialization officeRoom')
    .populate('subjectId', 'name code semester credits');

  // 3. Find feedback already submitted by this student
  const studentFeedbacks = await Feedback.find({
    submittedBy: studentUser.id,
  }).select('targetUser subjectId rating criteriaRatings comments createdAt isAnonymous');

  const feedbackMap = new Map();
  studentFeedbacks.forEach((f) => {
    const key = `${String(f.targetUser)}_${String(f.subjectId)}`;
    feedbackMap.set(key, f);
  });

  // 4. Combine into an actionable checklist of course faculty appraisals
  const allocationsList = [];

  for (const alloc of facultyAllocations) {
    if (!alloc.facultyId || !alloc.subjectId) {
      continue;
    }

    // Cohort / group matching: match student group or general allocation
    if (alloc.group && alloc.group !== 'ALL' && alloc.group !== 'FULL_BATCH') {
      if (studentUser.group && alloc.group !== studentUser.group) {
        continue;
      }
    }

    const key = `${String(alloc.facultyId._id)}_${String(alloc.subjectId._id)}`;
    const existingFeedback = feedbackMap.get(key) || null;

    allocationsList.push({
      allocationId: alloc._id,
      faculty: {
        id: alloc.facultyId._id,
        name: alloc.facultyId.name,
        email: alloc.facultyId.email,
        profilePicUrl: alloc.facultyId.profilePicUrl || '',
        specialization: alloc.facultyId.specialization || 'Faculty Instructor',
      },
      subject: {
        id: alloc.subjectId._id,
        name: alloc.subjectId.name,
        code: alloc.subjectId.code,
        semester: alloc.subjectId.semester,
        credits: alloc.subjectId.credits,
      },
      group: alloc.group || 'FULL_BATCH',
      isSubmitted: Boolean(existingFeedback),
      feedback: existingFeedback,
    });
  }

  const totalAllocations = allocationsList.length;
  const submittedCount = allocationsList.filter((a) => a.isSubmitted).length;
  const pendingCount = totalAllocations - submittedCount;

  return {
    allocations: allocationsList,
    stats: {
      totalAllocations,
      submittedCount,
      pendingCount,
      completionRate: totalAllocations > 0 ? Math.round((submittedCount / totalAllocations) * 100) : 100,
    },
  };
};

const getFeedbackAnalytics = async (actor) => {
  if (actor.role !== ROLES.HOD && actor.role !== ROLES.SUPER_ADMIN && actor.role !== ROLES.COLLEGE_ADMIN) {
    throw new AppError('Access denied.', 403, ERROR_CODES.FORBIDDEN);
  }

  const deptId = actor.departmentId || actor.branchId;
  const matchQuery = { targetRole: 'FACULTY' };
  if (deptId && actor.role === ROLES.HOD) {
    matchQuery.department = new mongoose.Types.ObjectId(deptId);
  }

  const perFaculty = await Feedback.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$targetUser',
        avgRating: { $avg: '$rating' },
        avgCoverage: { $avg: '$criteriaRatings.courseCoverage' },
        avgClarity: { $avg: '$criteriaRatings.conceptClarity' },
        avgPunctuality: { $avg: '$criteriaRatings.punctuality' },
        avgDoubtClearing: { $avg: '$criteriaRatings.doubtClearing' },
        avgPractical: { $avg: '$criteriaRatings.practicalRelevance' },
        totalReviews: { $sum: 1 },
        positiveReviews: { $sum: { $cond: [{ $gte: ['$rating', 4] }, 1, 0] } },
        negativeReviews: { $sum: { $cond: [{ $lte: ['$rating', 2] }, 1, 0] } },
        recentComment: { $last: '$comments' },
      },
    },
    {
      $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'faculty' },
    },
    { $unwind: { path: '$faculty', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        facultyName: '$faculty.name',
        facultyEmail: '$faculty.email',
        avgRating: { $round: ['$avgRating', 1] },
        avgCoverage: { $round: [{ $ifNull: ['$avgCoverage', '$avgRating'] }, 1] },
        avgClarity: { $round: [{ $ifNull: ['$avgClarity', '$avgRating'] }, 1] },
        avgPunctuality: { $round: [{ $ifNull: ['$avgPunctuality', '$avgRating'] }, 1] },
        avgDoubtClearing: { $round: [{ $ifNull: ['$avgDoubtClearing', '$avgRating'] }, 1] },
        avgPractical: { $round: [{ $ifNull: ['$avgPractical', '$avgRating'] }, 1] },
        totalReviews: 1,
        positiveReviews: 1,
        negativeReviews: 1,
        positiveRate: {
          $round: [{ $multiply: [{ $divide: ['$positiveReviews', { $max: ['$totalReviews', 1] }] }, 100] }, 0],
        },
        recentComment: 1,
      },
    },
    { $sort: { avgRating: 1 } },
  ]);

  return perFaculty;
};

module.exports = {
  getAllFeedback,
  createFeedback,
  getFeedbackAnalytics,
  getStudentFeedbackStatus,
};
