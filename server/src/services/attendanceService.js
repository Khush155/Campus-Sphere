const Attendance = require('../models/Attendance');
const AcademicEvent = require('../models/AcademicEvent');
const Subject = require('../models/Subject');
const User = require('../models/User');
const FacultyAssignment = require('../models/FacultyAssignment');
const TimetableSlot = require('../models/TimetableSlot');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const { logAuditEvent } = require('../utils/auditLogger');
const mongoose = require('mongoose');

const getAssignedSubjects = async (facultyId) => {
  const assignments = await FacultyAssignment.find({ facultyId, status: 'ACTIVE' }).populate('subjectId');
  return assignments.map(a => a.subjectId);
};

const getEnrolledStudents = async (subjectId) => {
  const subject = await Subject.findById(subjectId);
  if (!subject) throw new AppError('Subject not found', 404, ERROR_CODES.NOT_FOUND);

  return await User.find({
    role: 'STUDENT',
    branchId: subject.branchId,
    semester: subject.semester,
    status: 'ACTIVE'
  }).select('_id name email rollNumber');
};

const markAttendance = async (facultyId, subjectId, date, records, actorId, req) => {
  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);

  // Validate the faculty has this subject assigned
  const isAssigned = await FacultyAssignment.exists({ facultyId, subjectId, status: 'ACTIVE' });
  if (!isAssigned) throw new AppError('Faculty is not assigned to this subject', 403, ERROR_CODES.FORBIDDEN);

  let attendance = await Attendance.findOne({ subjectId, date: attendanceDate });
  let isNew = false;
  let before = null;

  if (attendance) {
    before = attendance.toObject();
    attendance.records = records;
    attendance.facultyId = facultyId; // Might have been updated by another faculty
  } else {
    isNew = true;
    attendance = new Attendance({
      subjectId,
      facultyId,
      date: attendanceDate,
      records
    });
  }

  await attendance.save();

  await logAuditEvent({
    actorId,
    action: isNew ? 'ATTENDANCE_MARKED' : 'ATTENDANCE_UPDATED',
    targetId: attendance._id,
    targetModel: 'Attendance',
    before,
    after: attendance.toObject(),
    req,
  });

  return attendance;
};

const getStudentAttendanceSummary = async (studentId) => {
  const student = await User.findById(studentId);
  if (!student) throw new AppError('Student not found', 404, ERROR_CODES.USER_NOT_FOUND);

  // Get all subjects for this student's current semester and branch
  const subjects = await Subject.find({ branchId: student.branchId, semester: student.semester });
  
  // Get all attendance records involving this student
  const attendances = await Attendance.find({ 'records.studentId': studentId }).populate('subjectId');

  let totalClasses = 0;
  let totalAttended = 0;

  const subjectSummary = subjects.map(subject => {
    const subjAttendances = attendances.filter(a => a.subjectId && a.subjectId._id.toString() === subject._id.toString());
    let subjectTotal = 0;
    let subjectAttended = 0;

    subjAttendances.forEach(a => {
      const rec = a.records.find(r => r.studentId.toString() === studentId.toString());
      if (rec) {
        subjectTotal++;
        if (['PRESENT', 'LATE', 'EXCUSED'].includes(rec.status)) {
          subjectAttended++;
        }
      }
    });

    totalClasses += subjectTotal;
    totalAttended += subjectAttended;

    return {
      subject,
      totalClasses: subjectTotal,
      attendedClasses: subjectAttended,
      percentage: subjectTotal === 0 ? 100 : Math.round((subjectAttended / subjectTotal) * 100)
    };
  });

  return {
    overallPercentage: totalClasses === 0 ? 100 : Math.round((totalAttended / totalClasses) * 100),
    totalClasses,
    totalAttended,
    subjectBreakdown: subjectSummary
  };
};

const predictHolidayImpact = async (studentId, startDate, endDate) => {
  const student = await User.findById(studentId);
  if (!student) throw new AppError('Student not found', 404, ERROR_CODES.USER_NOT_FOUND);

  const start = new Date(startDate);
  start.setHours(0,0,0,0);
  const end = new Date(endDate);
  end.setHours(23,59,59,999);

  if (start > end) throw new AppError('Invalid date range', 400, ERROR_CODES.VALIDATION_ERROR);

  // 1. Fetch relevant Academic Events
  const events = await AcademicEvent.find({
    startDate: { $lte: end },
    endDate: { $gte: start },
    $or: [
      { applicableBranch: null, applicableSemester: null },
      { applicableBranch: student.branchId, applicableSemester: student.semester }
    ]
  });

  const conflicts = events.filter(e => e.type === 'EXAM' || e.type === 'EVENT');
  const holidayEvents = events.filter(e => e.type === 'HOLIDAY' || e.type === 'BREAK');

  // Helper to check if a specific date is a holiday
  const isDateHoliday = (date) => {
    return holidayEvents.some(e => date >= new Date(e.startDate).setHours(0,0,0,0) && date <= new Date(e.endDate).setHours(23,59,59,999));
  };

  // 2. Fetch Timetable for the student
  const timetableSlots = await TimetableSlot.find({ branchId: student.branchId, semester: student.semester });

  let expectedMissedClasses = 0;
  const missingDates = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Skip weekends (assuming Sat/Sun are off)
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    
    // Skip public holidays
    if (isDateHoliday(d)) continue;

    // Map JS getDay (0=Sun, 1=Mon) to TimetableSlot format ('MONDAY', 'TUESDAY')
    const daysMap = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const dayName = daysMap[dayOfWeek];

    // Find slots for this day
    const daySlots = timetableSlots.filter(t => t.dayOfWeek === dayName);
    if (daySlots.length > 0) {
      expectedMissedClasses += daySlots.length;
      missingDates.push({ date: new Date(d), missedClasses: daySlots.length });
    }
  }

  // 3. Current Summary
  const currentSummary = await getStudentAttendanceSummary(studentId);

  // 4. Projected Summary
  const projectedTotal = currentSummary.totalClasses + expectedMissedClasses;
  const projectedAttended = currentSummary.totalAttended; // Because they are absent for the missed ones
  const projectedPercentage = projectedTotal === 0 ? 100 : Math.round((projectedAttended / projectedTotal) * 100);

  return {
    startDate: start,
    endDate: end,
    conflicts, // Array of exams/important events during this time
    holidays: holidayEvents,
    expectedMissedClasses,
    missingDates,
    currentPercentage: currentSummary.overallPercentage,
    projectedPercentage,
    willDropBelowThreshold: projectedPercentage < 75
  };
};

module.exports = {
  getAssignedSubjects,
  getEnrolledStudents,
  markAttendance,
  getStudentAttendanceSummary,
  predictHolidayImpact
};
