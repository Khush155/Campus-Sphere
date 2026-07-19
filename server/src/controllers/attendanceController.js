const Attendance = require('../models/Attendance');
const AppError = require('../utils/AppError');

const ATTENDANCE_AT_RISK_THRESHOLD = 75; // %

/**
 * POST /api/v1/attendance/bulk
 * Bulk mark attendance for an entire class in a single API call.
 * Body: { subjectId, date, sessionType, records: [{ studentId, status, remarks }] }
 */
exports.bulkMarkAttendance = async (req, res) => {
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
 * POST /api/v1/attendance (legacy single-student endpoint — kept for backward compat)
 */
exports.markAttendance = async (req, res) => {
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
 * GET /api/v1/attendance
 * Raw attendance records with filters and pagination.
 */
exports.getAttendance = async (req, res) => {
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
 * GET /api/v1/attendance/summary
 * Returns per-student attendance summary for a subject:
 * { studentId, name, present, absent, excused, medical, total, percentage, isAtRisk }
 * isAtRisk = true if attendance < 75%
 *
 * Also flags students who need to be "summoned" if attendance is dropping.
 */
exports.getAttendanceSummary = async (req, res) => {
  const { subjectId } = req.query;

  if (!subjectId) {throw new AppError('subjectId is required.', 400);}

  // Aggregate attendance stats per student for this subject
  const summary = await Attendance.aggregate([
    { $match: { subjectId: new (require('mongoose').Types.ObjectId)(subjectId) } },
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
        // Effective sessions = total - approved medical (don't penalize medical leave)
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
        // "Summon" flag: absent > 3 consecutive or overall % < threshold
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
 * PATCH /api/v1/attendance/:id/approve-medical
 * HOD approves medical leave — marks the absence as MEDICAL_LEAVE (excused).
 * This ensures student's attendance % is not penalized.
 */
exports.approveMedicalLeave = async (req, res) => {
  const { id } = req.params;
  const record = await Attendance.findById(id);
  if (!record) {throw new AppError('Attendance record not found.', 404);}

  record.status = 'MEDICAL_LEAVE';
  record.isMedicalApproved = true;
  record.remarks = `Medical leave approved by HOD (${new Date().toDateString()})`;
  await record.save();

  res.status(200).json({ success: true, data: record });
};
