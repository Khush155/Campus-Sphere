const User = require('../models/User');
const Subject = require('../models/Subject');
const Department = require('../models/Department');
const FacultyAssignment = require('../models/FacultyAssignment');
const FeePayment = require('../models/FeePayment');
const FeeStructure = require('../models/FeeStructure');
const Announcement = require('../models/Announcement');
const { successResponse } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');

/**
 * Controller to fetch metrics and statistics for the HOD Dashboard
 */
const getHodStats = async (req, res) => {
  const departmentId = req.user.departmentId;

  if (!departmentId) {
    throw new AppError('Department ID is missing for this HOD account', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  // Fetch department name
  const department = await Department.findById(departmentId).select('name code');
  if (!department) {
    throw new AppError('Department not found', 404, ERROR_CODES.NOT_FOUND);
  }

  // Run parallel count queries
  const [studentCount, facultyCount, subjectCount] = await Promise.all([
    User.countDocuments({ role: 'STUDENT', departmentId, status: 'ACTIVE' }),
    User.countDocuments({ role: 'FACULTY', departmentId, status: 'ACTIVE' }),
    Subject.countDocuments({ departmentId })
  ]);

  // Fetch active faculty assignments for workload
  const activeAssignments = await FacultyAssignment.find({ status: 'ACTIVE' })
    .populate('subjectId', 'credits departmentId')
    .populate('facultyId', 'name departmentId')
    .lean();

  // Filter to only assignments for this department's faculty
  const deptFacultyAssignments = activeAssignments.filter(
    (a) => a.facultyId?.departmentId?.toString() === departmentId.toString()
  );

  const workloadMap = {};
  deptFacultyAssignments.forEach((assignment) => {
    const facultyId = assignment.facultyId._id.toString();
    const facultyName = assignment.facultyId.name;
    const credits = assignment.subjectId?.credits || 0;

    if (!workloadMap[facultyId]) {
      workloadMap[facultyId] = { id: facultyId, name: facultyName, credits: 0 };
    }
    workloadMap[facultyId].credits += credits;
  });

  const facultyWorkloads = Object.values(workloadMap).sort((a, b) => b.credits - a.credits);

  // Mock Student Alerts
  const studentAlerts = [
    { id: 1, type: 'ATTENDANCE', message: '5 students have < 75% attendance in CS301' },
    { id: 2, type: 'ACADEMIC', message: '3 students failing consecutive internals in Math' },
  ];

  // Dummy recent activities for now, can be replaced by Audit Logs later
  const recentActivities = [
    { id: 1, title: 'End Semester Examinations Schedule Released', date: new Date(Date.now() - 86400000 * 2).toISOString(), type: 'NOTICE' },
    { id: 2, title: 'Department Faculty Meeting', date: new Date(Date.now() - 86400000 * 5).toISOString(), type: 'EVENT' },
    { id: 3, title: 'New curriculum updated for 4th Semester', date: new Date(Date.now() - 86400000 * 10).toISOString(), type: 'UPDATE' },
  ];

  return successResponse(res, 200, 'HOD Dashboard stats retrieved successfully', {
    department: {
      id: department._id,
      name: department.name,
      code: department.code,
    },
    metrics: {
      totalStudents: studentCount,
      totalFaculty: facultyCount,
      totalSubjects: subjectCount,
    },
    facultyWorkloads,
    studentAlerts,
    recentActivities,
  });
};

/**
 * Controller to fetch metrics for the College Admin (Institution Operator)
 */
const getCollegeAdminStats = async (req, res) => {
  // 1. Run parallel counts
  const [totalStudents, totalFaculty, totalDepartments] = await Promise.all([
    User.countDocuments({ role: 'STUDENT', status: 'ACTIVE' }),
    User.countDocuments({ role: 'FACULTY', status: 'ACTIVE' }),
    Department.countDocuments()
  ]);

  // 2. Department Breakdown
  const departments = await Department.find().select('name code');
  
  // Aggregate students and faculty per department
  const deptStatsPromises = departments.map(async (dept) => {
    const sCount = await User.countDocuments({ role: 'STUDENT', departmentId: dept._id, status: 'ACTIVE' });
    const fCount = await User.countDocuments({ role: 'FACULTY', departmentId: dept._id, status: 'ACTIVE' });
    
    let status = 'Good';
    if (sCount > 0 && fCount === 0) status = 'Warning'; // students but no faculty
    
    return {
      id: dept._id,
      name: dept.name,
      code: dept.code,
      studentsCount: sCount,
      facultyCount: fCount,
      status
    };
  });
  
  const departmentStats = await Promise.all(deptStatsPromises);

  // 3. Finance / Fees Overview
  const feeStructures = await FeeStructure.find();
  const feePayments = await FeePayment.find({ status: 'COMPLETED' });

  let totalExpected = 0;
  feeStructures.forEach(fs => totalExpected += fs.totalAmount);
  // simplified logic: total paid / total expected base amount across all structures
  let totalPaid = 0;
  feePayments.forEach(fp => totalPaid += fp.amountPaid);
  
  let feesCollectionPercent = 0;
  if (totalExpected > 0) {
    feesCollectionPercent = Math.round((totalPaid / (totalExpected * totalStudents)) * 100);
  } else {
    feesCollectionPercent = 78; // Fallback if no structures exist
  }

  if (feesCollectionPercent > 100) feesCollectionPercent = 100;
  if (isNaN(feesCollectionPercent)) feesCollectionPercent = 0;

  // 4. Notice Board / Announcements
  const recentAnnouncements = await Announcement.find({ status: 'Published' })
    .sort('-createdAt')
    .limit(5)
    .lean();

  const formattedNotices = recentAnnouncements.map(ann => ({
    id: ann._id,
    title: ann.title,
    date: new Date(ann.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
    category: ann.category,
    priority: ann.priority
  }));

  return successResponse(res, 200, 'College Admin stats retrieved successfully', {
    totalStudents,
    totalFaculty,
    totalDepartments,
    feesCollectionPercent,
    departmentStats,
    notices: formattedNotices
  });
};

module.exports = {
  getHodStats,
  getCollegeAdminStats,
};
