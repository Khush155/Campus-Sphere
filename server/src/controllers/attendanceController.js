const z = require('zod');
const attendanceService = require('../services/attendanceService');
const { successResponse } = require('../utils/apiResponse');

const attendanceRecordSchema = z.object({
  studentId: z.string(),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
  remarks: z.string().max(200).optional(),
});

const markAttendanceSchema = z.object({
  subjectId: z.string(),
  date: z.string().datetime(),
  records: z.array(attendanceRecordSchema),
});

const holidayPlannerSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

const getAssignedSubjects = async (req, res) => {
  const subjects = await attendanceService.getAssignedSubjects(req.user.id);
  return successResponse(res, 200, 'Assigned subjects fetched', subjects);
};

const getEnrolledStudents = async (req, res) => {
  const subjectId = req.params.subjectId;
  const students = await attendanceService.getEnrolledStudents(subjectId);
  return successResponse(res, 200, 'Enrolled students fetched', students);
};

const markAttendance = async (req, res) => {
  const parsedData = markAttendanceSchema.parse(req.body);
  const attendance = await attendanceService.markAttendance(
    req.user.id,
    parsedData.subjectId,
    parsedData.date,
    parsedData.records,
    req.user.id,
    req
  );
  return successResponse(res, 201, 'Attendance marked successfully', attendance);
};

const getStudentSummary = async (req, res) => {
  const summary = await attendanceService.getStudentAttendanceSummary(req.user.id);
  return successResponse(res, 200, 'Student attendance summary fetched', summary);
};

const predictHolidayImpact = async (req, res) => {
  const parsedData = holidayPlannerSchema.parse(req.body);
  const prediction = await attendanceService.predictHolidayImpact(
    req.user.id,
    parsedData.startDate,
    parsedData.endDate
  );
  return successResponse(res, 200, 'Holiday prediction calculated', prediction);
};

module.exports = {
  getAssignedSubjects,
  getEnrolledStudents,
  markAttendance,
  getStudentSummary,
  predictHolidayImpact,
};
