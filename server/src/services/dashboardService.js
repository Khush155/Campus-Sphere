const User = require('../models/User');
const Department = require('../models/Department');
const Course = require('../models/Course');
const Branch = require('../models/Branch');
const Subject = require('../models/Subject');
const logger = require('../utils/logger');

/**
 * Aggregates the core KPI counts for the admin dashboard.
 * All countDocuments() return 0 when the collection is empty — never throws on fresh install.
 */
const getDashboardStats = async () => {
  const [totalStudents, totalFaculty, totalHods, totalDepartments, totalCourses] = await Promise.all([
    User.countDocuments({ role: 'STUDENT', status: 'ACTIVE' }),
    User.countDocuments({ role: 'FACULTY', status: 'ACTIVE' }),
    User.countDocuments({ role: 'HOD', status: 'ACTIVE' }),
    Department.countDocuments(),
    Course.countDocuments(),
  ]);

  logger.info('[Dashboard Stats] Fetched KPI counts successfully');

  return { totalStudents, totalFaculty, totalHods, totalDepartments, totalCourses };
};

/**
 * Returns student count grouped by department via an aggregation pipeline.
 * Returns [] when there are no students or departments — this is valid, not an error.
 */
const getDepartmentDistribution = async () => {
  const distribution = await User.aggregate([
    // Only active students who have a department assigned
    { $match: { role: 'STUDENT', status: 'ACTIVE', departmentId: { $ne: null } } },
    // Group by departmentId, count per group
    { $group: { _id: '$departmentId', count: { $sum: 1 } } },
    // Join department name
    {
      $lookup: {
        from: 'departments',
        localField: '_id',
        foreignField: '_id',
        as: 'department',
      },
    },
    // Unwind array from lookup (skip records where department was deleted)
    { $unwind: { path: '$department', preserveNullAndEmptyArrays: false } },
    // Shape the output
    {
      $project: {
        _id: 0,
        departmentName: '$department.name',
        count: 1,
      },
    },
    // Largest departments first
    { $sort: { count: -1 } },
  ]);

  return distribution; // [] on empty — expected and valid
};

/**
 * Checks for institutional configuration gaps and returns insight items.
 * Returns [] when everything is healthy — this is a positive, expected state.
 *
 * Checks performed:
 *  1. Departments with no active HOD covering any shift
 *  2. Active user accounts created 7+ days ago that have never logged in
 *  3. Courses with no branches configured
 *  4. Branches with no subjects configured
 */
const getInsights = async () => {
  const insights = [];

  // 1. Departments with no HOD coverage in any shift
  const departments = await Department.find().lean();
  for (const dept of departments) {
    const hods = await User.find({
      departmentId: dept._id,
      role: 'HOD',
      status: 'ACTIVE',
    }).select('shift').lean();

    const hasAnyCoverage = hods.some((h) =>
      ['GENERAL', 'MORNING', 'EVENING'].includes(h.shift)
    );

    if (!hasAnyCoverage) {
      insights.push({
        id: `no-hod-${dept._id}`,
        type: 'NO_HOD',
        severity: 'warning',
        message: `${dept.name} has no HOD assigned`,
        actionRoute: `/admin/users?role=HOD&department=${dept._id}`,
        actionText: 'Assign HOD',
      });
    }
  }

  // 2. Accounts created 7+ days ago that have never logged in
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const pendingCount = await User.countDocuments({
    lastLoginAt: null,
    status: 'ACTIVE',
    createdAt: { $lte: sevenDaysAgo },
  });

  if (pendingCount > 0) {
    insights.push({
      id: 'pending-first-login',
      type: 'PENDING_FIRST_LOGIN',
      severity: 'info',
      message: `${pendingCount} account${pendingCount > 1 ? 's have' : ' has'} never logged in`,
      actionRoute: `/admin/users?status=ACTIVE`,
      actionText: 'View Users',
    });
  }

  // 3. Courses with no branches configured
  const courses = await Course.find().lean();
  for (const course of courses) {
    const branchCount = await Branch.countDocuments({ courseId: course._id });
    if (branchCount === 0) {
      insights.push({
        id: `no-branch-${course._id}`,
        type: 'EMPTY_COURSE',
        severity: 'warning',
        message: `${course.name} has no specialization branches`,
        actionRoute: `/admin/college-setup/branches`,
        actionText: 'Configure',
      });
    }
  }

  // 4. Branches with no subjects assigned
  const branches = await Branch.find().populate('courseId', 'code').lean();
  for (const branch of branches) {
    const subjectCount = await Subject.countDocuments({ branchId: branch._id });
    if (subjectCount === 0) {
      insights.push({
        id: `no-subject-${branch._id}`,
        type: 'EMPTY_BRANCH',
        severity: 'info',
        message: `${branch.name} (${branch.courseId?.code || 'N/A'}) has no subjects`,
        actionRoute: `/admin/college-setup/subjects`,
        actionText: 'Add Subjects',
      });
    }
  }

  return insights;
};

module.exports = {
  getDashboardStats,
  getDepartmentDistribution,
  getInsights,
};
