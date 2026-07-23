const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Subject = require('../models/Subject');
const { assertHODDeptBound, assertFacultyAssigned } = require('../utils/privilegeGuard');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const ROLES = require('../constants/roles');
const { logAuditEvent } = require('../utils/auditLogger');
const paginate = require('../utils/paginate');
const mongoose = require('mongoose');

const ATTENDANCE_AT_RISK_THRESHOLD = 75;

const submitAttendance = async (attendanceData, actor, req) => {
  const { subjectId, date, records } = attendanceData;

  const subject = await Subject.findById(subjectId);
  if (!subject) {
    throw new AppError('Subject not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  // 1. Verify Faculty workload assignment
  await assertFacultyAssigned(actor, subjectId);

  // 2. Normalize date to midnight UTC
  const normalizedDate = new Date(date);
  normalizedDate.setUTCHours(0, 0, 0, 0);

  // 3. Prepare bulk operations
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
            facultyId: actor.id,
            status: record.status,
          },
        },
        upsert: true,
      },
    };
  });

  const result = await Attendance.bulkWrite(bulkOperations);

  // Audit Log
  await logAuditEvent({
    actorId: actor.id,
    action: 'ATTENDANCE_SUBMITTED',
    targetId: subjectId,
    targetModel: 'Subject',
    after: { count: records.length, date: normalizedDate },
    req
  });

  return {
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
    upsertedCount: result.upsertedCount,
  };
};

const getAttendanceSheet = async ({ subjectId, date, group }) => {
  const queryFilter = { role: 'STUDENT' };
  if (group && group !== 'ALL') {
    queryFilter.group = group;
  }
  const students = await User.find(queryFilter);
  const studentIds = students.map((s) => s._id);

  const normalizedDate = new Date(date);
  normalizedDate.setUTCHours(0, 0, 0, 0);

  const records = await Attendance.find({
    subjectId: new mongoose.Types.ObjectId(subjectId),
    date: normalizedDate,
    studentId: { $in: studentIds },
  });

  return records;
};

const getStudentAttendanceSummary = async (studentId) => {
  const student = await User.findById(studentId);
  if (!student) {
    throw new AppError('Student not found', 404, ERROR_CODES.NOT_FOUND);
  }

  const summary = await Attendance.aggregate([
    {
      $match: { studentId: new mongoose.Types.ObjectId(studentId) },
    },
    {
      $group: {
        _id: '$subjectId',
        totalClasses: { $sum: 1 },
        attendedClasses: {
          $sum: {
            $cond: [{ $in: ['$status', ['PRESENT', 'LATE']] }, 1, 0],
          },
        },
      },
    },
    {
      $lookup: {
        from: 'subjects',
        localField: '_id',
        foreignField: '_id',
        as: 'subjectInfo',
      },
    },
    {
      $unwind: '$subjectInfo',
    },
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
            1,
          ],
        },
      },
    },
  ]);

  return {
    student: {
      id: student._id,
      name: student.name,
      email: student.email,
    },
    summary,
  };
};

const bulkMarkAttendance = async (attendanceData, actor, req) => {
  const { subjectId, date, sessionType = 'LECTURE', records } = attendanceData;

  const subject = await Subject.findById(subjectId);
  if (!subject) {
    throw new AppError('Subject not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  // Enforce HOD boundaries or Faculty workload checks
  if (actor.role === ROLES.HOD) {
    assertHODDeptBound(actor, subject.departmentId);
  } else {
    await assertFacultyAssigned(actor, subjectId);
  }

  const attendanceDate = new Date(date);

  const ops = records.map(({ studentId, status, remarks }) => ({
    updateOne: {
      filter: { studentId, subjectId, date: attendanceDate, sessionType },
      update: {
        $set: {
          studentId,
          subjectId,
          date: attendanceDate,
          sessionType,
          facultyId: actor.id,
          status,
          remarks: remarks || null,
        },
      },
      upsert: true,
    },
  }));

  const result = await Attendance.bulkWrite(ops);

  // Audit Log
  await logAuditEvent({
    actorId: actor.id,
    action: 'ATTENDANCE_BULK_MARKED',
    targetId: subjectId,
    targetModel: 'Subject',
    after: { count: records.length, date: attendanceDate, sessionType },
    req
  });

  return {
    matched: result.matchedCount,
    upserted: result.upsertedCount,
    modified: result.modifiedCount,
  };
};

const markAttendance = async (attendanceData, actor, req) => {
  const { studentId, subjectId, date, sessionType = 'LECTURE', status, remarks } = attendanceData;

  const subject = await Subject.findById(subjectId);
  if (!subject) {
    throw new AppError('Subject not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  // Enforce HOD boundaries or Faculty workload checks
  if (actor.role === ROLES.HOD) {
    assertHODDeptBound(actor, subject.departmentId);
  } else {
    await assertFacultyAssigned(actor, subjectId);
  }

  const attDate = new Date(date);
  const before = await Attendance.findOne({ studentId, subjectId, date: attDate, sessionType });

  const att = await Attendance.findOneAndUpdate(
    { studentId, subjectId, date: attDate, sessionType },
    { studentId, subjectId, date: attDate, sessionType, facultyId: actor.id, status, remarks },
    { new: true, upsert: true }
  );

  // Audit Log
  await logAuditEvent({
    actorId: actor.id,
    action: 'ATTENDANCE_MARKED',
    targetId: att._id,
    targetModel: 'Attendance',
    before: before ? before.toObject() : null,
    after: att.toObject(),
    req
  });

  return att;
};

const getAttendance = async (queryOptions, actor) => {
  const { studentId, subjectId, date, sessionType, status } = queryOptions;
  const filters = {};
  if (studentId) {
    filters.studentId = studentId;
  }
  if (subjectId) {
    filters.subjectId = subjectId;
  }
  if (date) {
    filters.date = new Date(date);
  }
  if (sessionType) {
    filters.sessionType = sessionType;
  }
  if (status) {
    filters.status = status;
  }

  // Enforce HOD or Faculty/Student boundaries
  if (actor.role === ROLES.HOD || actor.role === ROLES.FACULTY || actor.role === ROLES.STUDENT) {
    // If student, force filter by studentId
    if (actor.role === ROLES.STUDENT) {
      filters.studentId = actor.id;
    } else {
      // For HOD/Faculty, filter subjects belonging to their department
      const userDeptId = actor.departmentId?._id || actor.departmentId;
      const deptsSubject = await Subject.find({ departmentId: userDeptId }).select('_id');
      const subjectIds = deptsSubject.map(s => s._id);
      filters.subjectId = { $in: subjectIds };
      if (subjectId && subjectIds.some(id => id.toString() === subjectId.toString())) {
        filters.subjectId = subjectId;
      }
    }
  }

  return await paginate(Attendance, filters, {
    ...queryOptions,
    populate: [
      { path: 'subjectId', select: 'name code' },
      { path: 'facultyId', select: 'name' },
      { path: 'studentId', select: 'name email' }
    ],
    sort: { date: -1 }
  });
};

const getAttendanceSummary = async (subjectId, actor) => {
  const matchFilter = {};
  if (subjectId) {
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      throw new AppError('Subject not found.', 404, ERROR_CODES.NOT_FOUND);
    }
    if (actor.role === ROLES.HOD) {
      assertHODDeptBound(actor, subject.departmentId);
    }
    matchFilter.subjectId = new mongoose.Types.ObjectId(subjectId);
  } else {
    const userDeptId = actor.departmentId?._id || actor.departmentId;
    if (userDeptId) {
      const deptsSubject = await Subject.find({ departmentId: userDeptId }).select('_id');
      const subjectIds = deptsSubject.map(s => s._id);
      matchFilter.subjectId = { $in: subjectIds };
    }
  }

  const summary = await Attendance.aggregate([
    { $match: matchFilter },
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
    { $sort: { percentage: 1 } },
  ]);

  const atRiskCount = summary.filter(s => s.isAtRisk).length;

  return {
    summary,
    stats: {
      totalStudents: summary.length,
      atRiskCount,
      atRiskPercentage: summary.length > 0 ? Math.round((atRiskCount / summary.length) * 100) : 0,
      threshold: ATTENDANCE_AT_RISK_THRESHOLD,
    },
  };
};

const approveMedicalLeave = async (id, actor, req) => {
  const record = await Attendance.findById(id).populate('subjectId');
  if (!record) {
    throw new AppError('Attendance record not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  // Enforce HOD boundaries
  assertHODDeptBound(actor, record.subjectId.departmentId);

  const before = record.toObject();

  record.status = 'MEDICAL_LEAVE';
  record.isMedicalApproved = true;
  record.remarks = `Medical leave approved by HOD (${new Date().toDateString()})`;
  await record.save();

  // Audit Log
  await logAuditEvent({
    actorId: actor.id,
    action: 'ATTENDANCE_MEDICAL_APPROVED',
    targetId: record._id,
    targetModel: 'Attendance',
    before,
    after: record.toObject(),
    req
  });

  return record;
};

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
