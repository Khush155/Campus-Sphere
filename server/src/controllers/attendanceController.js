const Attendance = require('../models/Attendance');
const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../middlewares/asyncHandler');
const mongoose = require('mongoose');

const ATTENDANCE_AT_RISK_THRESHOLD = 75; // %

/**
 * @desc    Submit or update bulk attendance for a subject on a date (Faculty)
 * @route   POST /api/v1/attendance
 * @access  Private/Faculty
 */
const submitAttendance = asyncHandler(async (req, res, next) => {
  const { subjectId, date, records } = req.body;

  // 1. Identify the Faculty member submitting this request
  const faculty = await Faculty.findOne({ userId: req.user.id });
  if (!faculty) {
    return next(new AppError('Only registered Faculty members can submit attendance', 403, ERROR_CODES.FORBIDDEN));
  }

  // 2. Normalize the date (strip time details to set it to UTC Midnight)
  const normalizedDate = new Date(date);
  normalizedDate.setUTCHours(0, 0, 0, 0);

  // 3. Prepare the bulk write operations array
  const bulkOperations = records.map((record) => {
    return {
      updateOne: {
        filter: {
          studentId: record.studentId,
          subjectId: subjectId,
          date: normalizedDate,
        },
        update: {
          $set: {
            facultyId: req.user.id,
            status: record.status,
          },
        },
        upsert: true, // If it doesn't exist, create it; if it does, update it
      },
    };
  });

  // 4. Execute the bulk database operation
  try {
    const result = await Attendance.bulkWrite(bulkOperations);
    return successResponse(res, 200, 'Attendance records processed successfully', {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedCount: result.upsertedCount,
    });
  } catch (error) {
    return next(new AppError(`Attendance submission failed: ${error.message}`, 400, ERROR_CODES.BAD_REQUEST));
  }
});

/**
 * @desc    Get attendance percentages for a student across all subjects (Faculty)
 * @route   GET /api/v1/attendance/student/:studentId
 * @access  Private
 */
const getStudentAttendanceSummary = asyncHandler(async (req, res, next) => {
  const { studentId } = req.params;

  // Verify that the student exists in the system
  const student = await User.findById(studentId);
  if (!student) {
    return next(new AppError('Student not found', 404, ERROR_CODES.NOT_FOUND));
  }

  // MongoDB Aggregation Pipeline
  const summary = await Attendance.aggregate([
    // Stage 1: Filter to only include this student's records
    {
      $match: { studentId: new mongoose.Types.ObjectId(studentId) },
    },
    
    // Stage 2: Group records by subjectId
    {
      $group: {
        _id: '$subjectId',
        totalClasses: { $sum: 1 },
        // Count as attended if status is PRESENT or LATE
        attendedClasses: {
          $sum: {
            $cond: [{ $in: ['$status', ['PRESENT', 'LATE']] }, 1, 0],
          },
        },
      },
    },

    // Stage 3: Perform a join (lookup) with the subjects collection to get subject details
    {
      $lookup: {
        from: 'subjects', // Name of the MongoDB collection
        localField: '_id',
        foreignField: '_id',
        as: 'subjectInfo',
      },
    },

    // Stage 4: Flatten the lookup result array
    {
      $unwind: '$subjectInfo',
    },

    // Stage 5: Project (format) the final output shape and compute attendance percentage
    {
      $project: {
        _id: 0,
        subjectId: '$_id',
        subjectName: '$subjectInfo.name',
        subjectCode: '$subjectInfo.code',
        totalClasses: 1,
        attendedClasses: 1,
        attendancePercentage: {
          $round: [
            {
              $multiply: [
                { $divide: ['$attendedClasses', '$totalClasses'] },
                100,
              ],
            },
            1, // Round to 1 decimal place (e.g., 85.5%)
          ],
        },
      },
    },
  ]);

  return successResponse(res, 200, 'Student attendance summary calculated', {
    student: {
      id: student._id,
      name: student.name,
      email: student.email,
    },
    summary,
  });
});

/**
 * POST /api/v1/attendance/bulk (HOD)
 * Bulk mark attendance for an entire class in a single API call.
 */
const bulkMarkAttendance = async (req, res) => {
  const { subjectId, date, sessionType = 'LECTURE', records } = req.body;

  if (!subjectId || !date || !Array.isArray(records) || records.length === 0) {
    throw new AppError('subjectId, date, and records[] are required.', 400);
  }

  const attendanceDate = new Date(date);

  // Upsert each record
  const ops = records.map(({ studentId, status, remarks }) => ({
    updateOne: {
      filter: { studentId, subjectId, date: attendanceDate, sessionType },
      update: {
        $set: {
          studentId,
          subjectId,
          date: attendanceDate,
          sessionType,
          facultyId: req.user.id,
          status,
          remarks: remarks || null,
        },
      },
      upsert: true,
    },
  }));

  const result = await Attendance.bulkWrite(ops);

  res.status(200).json({
    success: true,
    message: `Attendance marked for ${records.length} students.`,
    data: {
      matched: result.matchedCount,
      upserted: result.upsertedCount,
      modified: result.modifiedCount,
    },
  });
};

/**
 * POST /api/v1/attendance (legacy HOD single-student endpoint)
 */
const markAttendance = async (req, res) => {
  const { studentId, subjectId, date, sessionType = 'LECTURE', status, remarks } = req.body;

  if (!studentId || !subjectId || !date || !status) {
    throw new AppError('studentId, subjectId, date, and status are required.', 400);
  }

  const att = await Attendance.findOneAndUpdate(
    { studentId, subjectId, date: new Date(date), sessionType },
    { studentId, subjectId, date: new Date(date), sessionType, facultyId: req.user.id, status, remarks },
    { new: true, upsert: true }
  );

  res.status(200).json({ success: true, data: att });
};

/**
 * GET /api/v1/attendance (HOD)
 * Raw attendance records with filters and pagination.
 */
const getAttendance = async (req, res) => {
  const { studentId, subjectId, date, sessionType, page = 1, limit = 50 } = req.query;
  const filters = {};
  if (studentId) {filters.studentId = studentId;}
  if (subjectId) {filters.subjectId = subjectId;}
  if (date) {filters.date = new Date(date);}
  if (sessionType) {filters.sessionType = sessionType;}

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [records, total] = await Promise.all([
    Attendance.find(filters)
      .populate('subjectId', 'name code')
      .populate('facultyId', 'name')
      .populate('studentId', 'name email')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Attendance.countDocuments(filters),
  ]);

  res.status(200).json({
    success: true,
    data: records,
    meta: { total, page: parseInt(page), limit: parseInt(limit) },
  });
};

/**
 * GET /api/v1/attendance/summary (HOD)
 * Returns per-student attendance summary for a subject
 */
const getAttendanceSummary = async (req, res) => {
  const { subjectId } = req.query;

  if (!subjectId) {throw new AppError('subjectId is required.', 400);}

  // Aggregate attendance stats per student for this subject
  const summary = await Attendance.aggregate([
    { $match: { subjectId: new mongoose.Types.ObjectId(subjectId) } },
    {
      $group: {
        _id: '$studentId',
        present: { $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ['$status', 'ABSENT'] }, 1, 0] } },
        excused: { $sum: { $cond: [{ $eq: ['$status', 'EXCUSED'] }, 1, 0] } },
        medicalLeave: { $sum: { $cond: [{ $eq: ['$status', 'MEDICAL_LEAVE'] }, 1, 0] } },
        total: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'student',
      },
    },
    { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        studentId: '$_id',
        name: '$student.name',
        email: '$student.email',
        present: 1,
        absent: 1,
        excused: 1,
        medicalLeave: 1,
        total: 1,
        // Effective sessions = total - approved medical
        effectiveTotal: { $subtract: ['$total', { $cond: [{ $eq: ['$student.medicalApproved', true] }, '$medicalLeave', 0] }] },
        percentage: {
          $round: [
            {
              $multiply: [
                { $divide: ['$present', { $max: ['$total', 1] }] },
                100,
              ],
            },
            2,
          ],
        },
      },
    },
    {
      $addFields: {
        isAtRisk: { $lt: ['$percentage', ATTENDANCE_AT_RISK_THRESHOLD] },
        requiresSummon: { $lt: ['$percentage', ATTENDANCE_AT_RISK_THRESHOLD] },
      },
    },
    { $sort: { percentage: 1 } }, // At-risk students first
  ]);

  const atRiskCount = summary.filter(s => s.isAtRisk).length;

  res.status(200).json({
    success: true,
    data: {
      summary,
      stats: {
        totalStudents: summary.length,
        atRiskCount,
        atRiskPercentage: summary.length > 0 ? Math.round((atRiskCount / summary.length) * 100) : 0,
        threshold: ATTENDANCE_AT_RISK_THRESHOLD,
      },
    },
  });
};

/**
 * PATCH /api/v1/attendance/:id/approve-medical (HOD)
 * HOD approves medical leave
 */
const approveMedicalLeave = async (req, res) => {
  const { id } = req.params;
  const record = await Attendance.findById(id);
  if (!record) {throw new AppError('Attendance record not found.', 404);}

  record.status = 'MEDICAL_LEAVE';
  record.isMedicalApproved = true;
  record.remarks = `Medical leave approved by HOD (${new Date().toDateString()})`;
  await record.save();

  res.status(200).json({ success: true, data: record });
};

module.exports = {
  submitAttendance,
  getStudentAttendanceSummary,
  bulkMarkAttendance,
  markAttendance,
  getAttendance,
  getAttendanceSummary,
  approveMedicalLeave,
};
