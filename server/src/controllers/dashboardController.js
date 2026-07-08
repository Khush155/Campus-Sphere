const User = require('../models/User');
const Subject = require('../models/Subject');
const Department = require('../models/Department');
const FacultyAssignment = require('../models/FacultyAssignment');
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

module.exports = {
  getHodStats,
};
