const mongoose = require('mongoose');
const User = require('../models/User');
const Subject = require('../models/Subject');
const FacultyAssignment = require('../models/FacultyAssignment');
const LeaveRequest = require('../models/LeaveRequest');
const Complaint = require('../models/Complaint');
const Attendance = require('../models/Attendance');
const Result = require('../models/Result');
const Project = require('../models/Project');
const PlacementApplication = require('../models/PlacementApplication');
const Examination = require('../models/Examination');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');

const ATTENDANCE_THRESHOLD = 75;

const getHodMetrics = async (departmentId) => {
  if (!departmentId) {
    throw new AppError('Department ID is required', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const deptObjectId = new mongoose.Types.ObjectId(departmentId);

  // Run all 8 KPI queries in parallel for performance
  const [
    workloadDistribution,
    vacantSubjects,
    attendanceHealth,
    complaintSlaStats,
    examPassRates,
    projectStats,
    leaveStats,
    placementStats,
  ] = await Promise.all([

    // ── KPI 1: Faculty Workload Distribution ──────────────────────────────────
    User.aggregate([
      { $match: { departmentId: deptObjectId, role: 'FACULTY', status: 'ACTIVE' } },
      {
        $lookup: {
          from: 'facultyassignments',
          localField: '_id',
          foreignField: 'facultyId',
          as: 'assignments',
        },
      },
      {
        $project: {
          name: 1,
          email: 1,
          subjectCount: {
            $size: {
              $filter: { input: '$assignments', as: 'a', cond: { $eq: ['$$a.status', 'ACTIVE'] } },
            },
          },
        },
      },
      { $sort: { subjectCount: -1, name: 1 } },
    ]),

    // ── KPI 2: Vacant Subjects ────────────────────────────────────────────────
    Subject.aggregate([
      { $match: { departmentId: deptObjectId } },
      {
        $lookup: {
          from: 'facultyassignments',
          let: { sid: '$_id' },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ['$subjectId', '$$sid'] }, { $eq: ['$status', 'ACTIVE'] }] } } },
          ],
          as: 'activeAssignments',
        },
      },
      { $match: { activeAssignments: { $size: 0 } } },
      {
        $lookup: { from: 'branches', localField: 'branchId', foreignField: '_id', as: 'branchInfo' },
      },
      { $unwind: { path: '$branchInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: 1, code: 1, credits: 1, semester: 1,
          branchName: '$branchInfo.name',
          branchCode: '$branchInfo.code',
        },
      },
      { $sort: { semester: 1, name: 1 } },
    ]),

    // ── KPI 3: Department Attendance Health ───────────────────────────────────
    (async () => {
      // Get all subjects in the dept
      const subjects = await Subject.find({ departmentId: deptObjectId }, '_id name code');
      if (!subjects.length) return { subjectHealth: [], atRiskStudentCount: 0 };

      const subjectIds = subjects.map(s => s._id);

      const perStudentPerSubject = await Attendance.aggregate([
        { $match: { subjectId: { $in: subjectIds } } },
        {
          $group: {
            _id: { studentId: '$studentId', subjectId: '$subjectId' },
            total: { $sum: 1 },
            present: { $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] } },
          },
        },
        {
          $project: {
            percentage: {
              $round: [{ $multiply: [{ $divide: ['$present', { $max: ['$total', 1] }] }, 100] }, 1],
            },
            isAtRisk: {
              $lt: [
                { $multiply: [{ $divide: ['$present', { $max: ['$total', 1] }] }, 100] },
                ATTENDANCE_THRESHOLD,
              ],
            },
          },
        },
      ]);

      const atRiskCount = new Set(
        perStudentPerSubject.filter(r => r.isAtRisk).map(r => r._id.studentId.toString())
      ).size;

      const subjectHealth = await Attendance.aggregate([
        { $match: { subjectId: { $in: subjectIds } } },
        {
          $group: {
            _id: '$subjectId',
            avgPercentage: {
              $avg: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 100, 0] },
            },
            totalRecords: { $sum: 1 },
          },
        },
      ]);

      return { subjectHealth, atRiskStudentCount: atRiskCount };
    })(),

    // ── KPI 4: Complaint SLA Compliance ──────────────────────────────────────
    Complaint.aggregate([
      { $match: { departmentId: deptObjectId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $in: ['$status', ['RESOLVED', 'CLOSED']] }, 1, 0] } },
          slaBreached: { $sum: { $cond: ['$slaBreached', 1, 0] } },
          open: { $sum: { $cond: [{ $eq: ['$status', 'OPEN'] }, 1, 0] } },
          critical: { $sum: { $cond: [{ $eq: ['$priority', 'CRITICAL'] }, 1, 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
          resolved: 1,
          slaBreached: 1,
          open: 1,
          critical: 1,
          resolutionRate: {
            $round: [{ $multiply: [{ $divide: ['$resolved', { $max: ['$total', 1] }] }, 100] }, 1],
          },
          slaComplianceRate: {
            $round: [
              {
                $multiply: [
                  { $divide: [{ $subtract: ['$total', '$slaBreached'] }, { $max: ['$total', 1] }] },
                  100,
                ],
              },
              1,
            ],
          },
        },
      },
    ]),

    // ── KPI 5: Examination Pass Rates by Subject ──────────────────────────────
    Result.aggregate([
      {
        $lookup: {
          from: 'examinations',
          localField: 'examinationId',
          foreignField: '_id',
          as: 'exam',
        },
      },
      { $unwind: '$exam' },
      { $match: { 'exam.departmentId': deptObjectId } },
      {
        $group: {
          _id: '$exam.subjectId',
          total: { $sum: 1 },
          passed: { $sum: { $cond: [{ $eq: ['$status', 'PASS'] }, 1, 0] } },
          avgGradePoint: { $avg: '$gradePoint' },
          requiresRemedial: { $sum: { $cond: ['$requiresRemedialClass', 1, 0] } },
        },
      },
      {
        $lookup: { from: 'subjects', localField: '_id', foreignField: '_id', as: 'subject' },
      },
      { $unwind: { path: '$subject', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          subjectName: '$subject.name',
          subjectCode: '$subject.code',
          total: 1,
          passed: 1,
          requiresRemedial: 1,
          passRate: {
            $round: [{ $multiply: [{ $divide: ['$passed', { $max: ['$total', 1] }] }, 100] }, 1],
          },
          avgGradePoint: { $round: ['$avgGradePoint', 2] },
        },
      },
      { $sort: { passRate: 1 } }, // Lowest pass rates first (needs attention)
    ]),

    // ── KPI 6: Project Status Breakdown ──────────────────────────────────────
    Project.aggregate([
      { $match: { departmentId: deptObjectId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),

    // ── KPI 7: Leave Approval Turnaround Time ────────────────────────────────
    LeaveRequest.aggregate([
      { $match: { departmentId: deptObjectId, status: { $in: ['APPROVED', 'REJECTED'] }, approvedAt: { $exists: true } } },
      {
        $project: {
          turnaroundHours: {
            $divide: [{ $subtract: ['$approvedAt', '$createdAt'] }, 1000 * 60 * 60],
          },
          status: 1,
          leaveType: 1,
        },
      },
      {
        $group: {
          _id: null,
          avgTurnaroundHours: { $avg: '$turnaroundHours' },
          maxTurnaroundHours: { $max: '$turnaroundHours' },
          totalProcessed: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'APPROVED'] }, 1, 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          avgTurnaroundHours: { $round: ['$avgTurnaroundHours', 1] },
          avgTurnaroundDays: { $round: [{ $divide: ['$avgTurnaroundHours', 24] }, 1] },
          maxTurnaroundHours: { $round: ['$maxTurnaroundHours', 1] },
          totalProcessed: 1,
          approved: 1,
          approvalRate: {
            $round: [{ $multiply: [{ $divide: ['$approved', { $max: ['$totalProcessed', 1] }] }, 100] }, 1],
          },
        },
      },
    ]),

    // ── KPI 8: Placement Success Rate ─────────────────────────────────────────
    PlacementApplication.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student',
        },
      },
      { $unwind: '$student' },
      { $match: { 'student.departmentId': deptObjectId } },
      {
        $group: {
          _id: null,
          totalApplications: { $sum: 1 },
          selected: { $sum: { $cond: [{ $eq: ['$finalStatus', 'SELECTED'] }, 1, 0] } },
          avgPackage: { $avg: { $cond: [{ $eq: ['$finalStatus', 'SELECTED'] }, '$offerPackageLPA', null] } },
          uniqueStudents: { $addToSet: '$studentId' },
        },
      },
      {
        $project: {
          _id: 0,
          totalApplications: 1,
          selected: 1,
          uniqueStudentsApplied: { $size: '$uniqueStudents' },
          avgPackageLPA: { $round: ['$avgPackage', 2] },
          selectionRate: {
            $round: [
              { $multiply: [{ $divide: ['$selected', { $max: ['$totalApplications', 1] }] }, 100] },
              1,
            ],
          },
        },
      },
    ]),

  ]);

  return {
    workloadDistribution,
    vacantSubjects,
    attendanceHealth,
    complaintSlaStats: complaintSlaStats[0] || {},
    examPassRates,
    projectStats,
    leaveStats: leaveStats[0] || {},
    placementStats: placementStats[0] || {},
  };
};

module.exports = { getHodMetrics };
