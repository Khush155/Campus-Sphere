const attendanceService = require('../services/attendanceService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../middlewares/asyncHandler');

/**
 * @desc    Submit or update bulk attendance sheet
 * @route   POST /api/v1/attendance
 * @access  Private/Faculty
 */
const submitAttendance = asyncHandler(async (req, res) => {
  const result = await attendanceService.submitAttendance(req.body, req.user, req);
  return successResponse(res, 200, 'Attendance records processed successfully', result);
});

/**
 * @desc    Get attendance sheet for subject, group, date
 * @route   GET /api/v1/attendance
 * @access  Private/Faculty
 */
const getAttendanceSheet = asyncHandler(async (req, res) => {
  const records = await attendanceService.getAttendanceSheet(req.query);
  return successResponse(res, 200, 'Attendance sheet retrieved successfully', records);
});

/**
 * @desc    Get attendance summary for student
 * @route   GET /api/v1/attendance/student/:studentId
 * @access  Private
 */
const getStudentAttendanceSummary = asyncHandler(async (req, res) => {
  const summary = await attendanceService.getStudentAttendanceSummary(req.params.studentId);
  return successResponse(res, 200, 'Student attendance summary calculated', summary);
});

/**
 * @desc    Bulk mark attendance (HOD)
 * @route   POST /api/v1/attendance/bulk
 * @access  Private/SuperAdmin/HOD
 */
const bulkMarkAttendance = asyncHandler(async (req, res) => {
  const result = await attendanceService.bulkMarkAttendance(req.body, req.user, req);
  return successResponse(res, 200, `Attendance marked successfully`, result);
});

/**
 * @desc    Mark attendance (legacy HOD single)
 * @route   POST /api/v1/attendance/single
 * @access  Private/SuperAdmin/HOD/Faculty
 */
const markAttendance = asyncHandler(async (req, res) => {
  const att = await attendanceService.markAttendance(req.body, req.user, req);
  return successResponse(res, 200, 'Attendance marked successfully', att);
});

/**
 * @desc    Get raw attendance records
 * @route   GET /api/v1/attendance
 * @access  Private/SuperAdmin/HOD/Faculty/Student
 */
const getAttendance = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const result = await attendanceService.getAttendance(req.query, req.user);
  return successResponse(res, 200, 'Attendance records retrieved successfully', result.data, {
    total: result.meta.total,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

/**
 * @desc    Get attendance summary (HOD)
 * @route   GET /api/v1/attendance/summary
 * @access  Private/SuperAdmin/HOD
 */
const getAttendanceSummary = asyncHandler(async (req, res) => {
  const result = await attendanceService.getAttendanceSummary(req.query.subjectId, req.user);
  return successResponse(res, 200, 'Attendance summary retrieved successfully', result.data || result);
});

/**
 * @desc    Approve medical leave
 * @route   PATCH /api/v1/attendance/:id/approve-medical
 * @access  Private/SuperAdmin/HOD
 */
const approveMedicalLeave = asyncHandler(async (req, res) => {
  const record = await attendanceService.approveMedicalLeave(req.params.id, req.user, req);
  return successResponse(res, 200, 'Medical leave approved successfully', record);
});

module.exports = {
  submitAttendance,
  getAttendanceSheet,
  getStudentAttendanceSummary,
  bulkMarkAttendance,
  markAttendance,
  getAttendance,
  getAttendanceSummary,
  approveMedicalLeave,
};
