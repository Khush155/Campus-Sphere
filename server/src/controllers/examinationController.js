const Examination = require('../models/Examination');
const Result = require('../models/Result');
const AuditLog = require('../models/AuditLog');
const AppError = require('../utils/AppError');

/**
 * Maps percentage to grade and gradePoint using the 10-point scale.
 */
const computeGrade = (percentage, isAbsent) => {
  if (isAbsent) {return { grade: 'AB', gradePoint: 0 };}
  if (percentage >= 91) {return { grade: 'O', gradePoint: 10 };}
  if (percentage >= 81) {return { grade: 'A+', gradePoint: 9 };}
  if (percentage >= 71) {return { grade: 'A', gradePoint: 8 };}
  if (percentage >= 61) {return { grade: 'B+', gradePoint: 7 };}
  if (percentage >= 51) {return { grade: 'B', gradePoint: 6 };}
  if (percentage >= 40) {return { grade: 'C', gradePoint: 5 };}
  return { grade: 'F', gradePoint: 0 };
};

// POOR_GRADES that trigger remedial class requirement
const POOR_GRADES = new Set(['F', 'C', 'AB']);

const Subject = require('../models/Subject');
const User = require('../models/User');

/**
 * POST /api/v1/examinations
 * Create a new examination with course, branch, semester, syllabus and datesheet fields.
 */
exports.createExamination = async (req, res) => {
  const {
    title, type, subjectId, date, totalMarks, passingMarks,
    venue, duration, syllabus, datesheetSlot, reportingTime, instructions,
    courseId, branchId, semester, academicYear,
  } = req.body;

  let { datesheetPdfUrl, seatingPlanPdfUrl } = req.body;

  // If files were uploaded, use their paths instead of URLs
  if (req.files?.datesheet?.[0]) {
    datesheetPdfUrl = `/uploads/${req.files.datesheet[0].filename}`;
  }
  if (req.files?.seatingPlan?.[0]) {
    seatingPlanPdfUrl = `/uploads/${req.files.seatingPlan[0].filename}`;
  }

  if (!title || !type || !subjectId || !date || !totalMarks || !passingMarks) {
    throw new AppError('title, type, subjectId, date, totalMarks, and passingMarks are required.', 400);
  }
  
  const parsedTotalMarks = Number(totalMarks);
  const parsedPassingMarks = Number(passingMarks);

  if (parsedPassingMarks >= parsedTotalMarks) {
    throw new AppError('Passing marks must be less than total marks.', 400);
  }

  // Lookup subject to validate existence and auto-derive academic hierarchy if omitted
  const subject = await Subject.findById(subjectId).populate('branchId');
  if (!subject) {
    throw new AppError('The specified subject does not exist.', 404);
  }

  const resolvedBranchId = branchId || subject.branchId?._id || subject.branchId;
  const resolvedCourseId = courseId || subject.branchId?.courseId;
  const resolvedSemester = semester ? Number(semester) : subject.semester;

  // Handle syllabus array since frontend might send syllabus or syllabus[] depending on FormData handling
  const syllabusArray = req.body['syllabus[]'] ? 
    (Array.isArray(req.body['syllabus[]']) ? req.body['syllabus[]'] : [req.body['syllabus[]']]) : 
    (Array.isArray(syllabus) ? syllabus : []);

  const exam = await Examination.create({
    title,
    type,
    departmentId: req.user.departmentId,
    courseId: resolvedCourseId,
    branchId: resolvedBranchId,
    semester: resolvedSemester,
    academicYear: academicYear || '2025-2026',
    subjectId,
    date: new Date(date),
    totalMarks: parsedTotalMarks,
    passingMarks: parsedPassingMarks,
    venue,
    duration: duration ? Number(duration) : undefined,
    syllabus: syllabusArray,
    datesheetSlot,
    reportingTime,
    instructions,
    datesheetPdfUrl,
    seatingPlanPdfUrl,
  });

  await AuditLog.create({
    actorId: req.user.id,
    action: 'EXAM_SCHEDULED',
    targetId: exam._id,
    targetModel: 'Examination',
    after: { title: exam.title, date: exam.date, subjectId: exam.subjectId },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(201).json({ success: true, data: exam });
};

/**
 * GET /api/v1/examinations
 * List exams with filters and pagination.
 */
exports.getExaminations = async (req, res) => {
  const {
    departmentId, courseId, branchId, semester, academicYear,
    status, type, subjectId, page = 1, limit = 50,
  } = req.query;

  const filters = {};

  if (departmentId) {
    filters.departmentId = departmentId;
  } else if (req.user.departmentId && req.user.role !== 'STUDENT' && !subjectId && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'COLLEGE_ADMIN') {
    filters.departmentId = req.user.departmentId;
  }

  // Academic hierarchy filters
  if (courseId) {
    filters.courseId = courseId;
  }
  if (branchId) {
    filters.branchId = branchId;
  }
  if (semester) {
    filters.semester = Number(semester);
  }
  if (academicYear) {
    filters.academicYear = academicYear;
  }
  if (subjectId) {
    filters.subjectId = subjectId;
  }
  if (status && status !== 'ALL') {
    filters.status = status;
  }
  if (type && type !== 'ALL') {
    filters.type = type;
  }

  // For students, auto-filter to their enrolled branch and semester if set
  if (req.user.role === 'STUDENT') {
    if (req.user.departmentId) {
      filters.departmentId = req.user.departmentId;
    }
    if (req.user.branchId) {
      filters.branchId = req.user.branchId;
    }
    if (req.user.semester) {
      filters.semester = req.user.semester;
    }
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [exams, total] = await Promise.all([
    Examination.find(filters)
      .populate('subjectId', 'name code credits semester type')
      .populate('courseId', 'name code durationYears')
      .populate('branchId', 'name code')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Examination.countDocuments(filters),
  ]);

  res.status(200).json({
    success: true,
    data: exams,
    meta: { total, page: parseInt(page), limit: parseInt(limit) },
  });
};

/**
 * POST /api/v1/examinations/:examId/results/batch
 * Batch-publish results for all students in one call.
 * Body: { results: [{ studentId, marksObtained, isAbsent }] }
 * Auto-computes: percentage, grade, gradePoint, status, requiresRemedialClass
 */
exports.batchPublishResults = async (req, res) => {
  const { examId } = req.params;
  const { results } = req.body;

  if (!Array.isArray(results) || results.length === 0) {
    throw new AppError('results[] array is required.', 400);
  }

  const exam = await Examination.findById(examId);
  if (!exam) {throw new AppError('Examination not found.', 404);}

  // Check marks entry permission for FACULTY
  if (req.user.role === 'FACULTY' && !exam.marksEntryEnabled) {
    throw new AppError('Marks entry for this examination is locked by HOD. Contact your HOD to grant marks markup permission.', 403);
  }

  const processedResults = results.map(({ studentId, marksObtained = 0, isAbsent = false }) => {
    const marks = isAbsent ? 0 : Math.min(marksObtained, exam.totalMarks);
    const pct = isAbsent ? 0 : Math.round((marks / exam.totalMarks) * 100 * 100) / 100;
    const { grade, gradePoint } = computeGrade(pct, isAbsent);
    const isPassing = !isAbsent && marks >= exam.passingMarks;

    return {
      studentId,
      examinationId: examId,
      marksObtained: marks,
      isAbsent,
      percentage: pct,
      grade,
      gradePoint,
      status: isAbsent ? 'ABSENT' : (isPassing ? 'PASS' : 'FAIL'),
      requiresRemedialClass: POOR_GRADES.has(grade), // Triggers extra class scheduling
      remedialClassScheduled: false,
      publishedBy: req.user.id,
      publishedAt: new Date(),
    };
  });

  // Upsert all results
  const ops = processedResults.map(r => ({
    updateOne: {
      filter: { studentId: r.studentId, examinationId: r.examinationId },
      update: { $set: r },
      upsert: true,
    },
  }));

  await Result.bulkWrite(ops);

  // Mark exam as RESULTS_PUBLISHED
  exam.status = 'RESULTS_PUBLISHED';
  await exam.save();

  await AuditLog.create({
    actorId: req.user.id,
    action: 'EXAM_RESULTS_PUBLISHED',
    targetId: exam._id,
    targetModel: 'Examination',
    after: { count: results.length, examTitle: exam.title },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  // Identify students requiring remedial classes
  const remedialStudents = processedResults.filter(r => r.requiresRemedialClass);

  res.status(200).json({
    success: true,
    message: `Results published for ${processedResults.length} students.`,
    data: {
      total: processedResults.length,
      passed: processedResults.filter(r => r.status === 'PASS').length,
      failed: processedResults.filter(r => r.status === 'FAIL').length,
      absent: processedResults.filter(r => r.status === 'ABSENT').length,
      requiresRemedialClass: remedialStudents.length,
      // Return list of students needing extra classes
      remedialStudentIds: remedialStudents.map(r => r.studentId),
    },
  });
};

/**
 * GET /api/v1/examinations/:examId/stats
 * Class-level analytics: average, highest, lowest, pass %, grade distribution.
 */
exports.getExamStats = async (req, res) => {
  const { examId } = req.params;

  const exam = await Examination.findById(examId).populate('subjectId', 'name code');
  if (!exam) {throw new AppError('Examination not found.', 404);}

  const stats = await Result.aggregate([
    { $match: { examinationId: new (require('mongoose').Types.ObjectId)(examId) } },
    {
      $group: {
        _id: null,
        totalStudents: { $sum: 1 },
        passed: { $sum: { $cond: [{ $eq: ['$status', 'PASS'] }, 1, 0] } },
        failed: { $sum: { $cond: [{ $eq: ['$status', 'FAIL'] }, 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ['$status', 'ABSENT'] }, 1, 0] } },
        avgMarks: { $avg: '$marksObtained' },
        highestMarks: { $max: '$marksObtained' },
        lowestMarks: { $min: '$marksObtained' },
        avgPercentage: { $avg: '$percentage' },
        requiresRemedial: { $sum: { $cond: ['$requiresRemedialClass', 1, 0] } },
      },
    },
    {
      $project: {
        _id: 0,
        totalStudents: 1,
        passed: 1,
        failed: 1,
        absent: 1,
        passPercentage: { $round: [{ $multiply: [{ $divide: ['$passed', { $max: ['$totalStudents', 1] }] }, 100] }, 2] },
        avgMarks: { $round: ['$avgMarks', 2] },
        highestMarks: 1,
        lowestMarks: 1,
        avgPercentage: { $round: ['$avgPercentage', 2] },
        requiresRemedial: 1,
      },
    },
  ]);

  // Grade distribution
  const gradeDistribution = await Result.aggregate([
    { $match: { examinationId: new (require('mongoose').Types.ObjectId)(examId) } },
    { $group: { _id: '$grade', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  res.status(200).json({
    success: true,
    data: {
      examination: { title: exam.title, totalMarks: exam.totalMarks, passingMarks: exam.passingMarks, subject: exam.subjectId },
      classStats: stats[0] || {},
      gradeDistribution,
    },
  });
};

/**
 * POST /api/v1/examinations/:examId/results (legacy single-student — backward compat)
 */
exports.publishResult = async (req, res) => {
  const { examId } = req.params;
  const { studentId, marksObtained, isAbsent } = req.body;

  const exam = await Examination.findById(examId);
  if (!exam) {throw new AppError('Examination not found.', 404);}

  if (req.user.role === 'FACULTY' && !exam.marksEntryEnabled) {
    throw new AppError('Marks entry for this examination is locked by HOD. Contact your HOD to grant marks markup permission.', 403);
  }

  const marks = isAbsent ? 0 : Math.min(marksObtained || 0, exam.totalMarks);
  const pct = isAbsent ? 0 : Math.round((marks / exam.totalMarks) * 100 * 100) / 100;
  const { grade, gradePoint } = computeGrade(pct, isAbsent);
  const isPassing = !isAbsent && marks >= exam.passingMarks;

  const result = await Result.findOneAndUpdate(
    { studentId, examinationId: examId },
    {
      studentId, examinationId: examId,
      marksObtained: marks, isAbsent: !!isAbsent, percentage: pct,
      grade, gradePoint,
      status: isAbsent ? 'ABSENT' : (isPassing ? 'PASS' : 'FAIL'),
      requiresRemedialClass: POOR_GRADES.has(grade),
      publishedBy: req.user.id,
      publishedAt: new Date(),
    },
    { new: true, upsert: true }
  );

  res.status(200).json({ success: true, data: result });
};

/**
 * PATCH /api/v1/examinations/:examId/toggle-marks-entry
 * Toggle HOD permission for faculty to enter/update marks.
 */
exports.toggleMarksEntryPermission = async (req, res) => {
  const { examId } = req.params;
  const { marksEntryEnabled } = req.body;

  const exam = await Examination.findById(examId);
  if (!exam) {
    throw new AppError('Examination not found.', 404);
  }

  exam.marksEntryEnabled = typeof marksEntryEnabled === 'boolean' ? marksEntryEnabled : !exam.marksEntryEnabled;
  await exam.save();

  res.status(200).json({
    success: true,
    message: `Marks entry permission updated to ${exam.marksEntryEnabled ? 'UNLOCKED' : 'LOCKED'}`,
    data: exam,
  });
};

/**
 * DELETE /api/v1/examinations/:examId
 * HOD / Admin deletes an examination and cascades deletion of its results.
 */
exports.deleteExamination = async (req, res) => {
  const { examId } = req.params;

  const exam = await Examination.findById(examId);
  if (!exam) {
    throw new AppError('Examination not found.', 404);
  }

  // Enforce HOD department boundary
  if (req.user.role === 'HOD' && exam.departmentId.toString() !== req.user.departmentId.toString()) {
    throw new AppError('Access denied. This examination does not belong to your department.', 403);
  }

  // Cascade delete results
  await Result.deleteMany({ examinationId: exam._id });
  await Examination.findByIdAndDelete(examId);

  await AuditLog.create({
    actorId: req.user.id,
    action: 'EXAM_DELETED',
    targetId: exam._id,
    targetModel: 'Examination',
    before: { title: exam.title, date: exam.date, subjectId: exam.subjectId },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json({
    success: true,
    message: 'Examination and associated evaluation records deleted successfully.',
  });
};

/**
 * GET /api/v1/examinations/:examId/students
 * Retrieves enrolled student roster for this exam's cohort along with any existing grades.
 */
exports.getExamStudentsForGrading = async (req, res) => {
  const { examId } = req.params;

  const exam = await Examination.findById(examId)
    .populate('subjectId', 'name code credits semester')
    .populate('courseId', 'name code')
    .populate('branchId', 'name code');

  if (!exam) {
    throw new AppError('Examination not found.', 404);
  }

  // Find enrolled students in this branch/department and semester
  const studentFilter = { role: 'STUDENT' };
  if (exam.branchId) {
    studentFilter.branchId = exam.branchId._id || exam.branchId;
  } else if (exam.departmentId) {
    studentFilter.departmentId = exam.departmentId;
  }
  if (exam.semester) {
    studentFilter.semester = exam.semester;
  }
  if (req.query.group && req.query.group !== 'ALL') {
    studentFilter.group = req.query.group;
  }

  const [students, existingResults] = await Promise.all([
    User.find(studentFilter).select('name email rollNumber group branchId semester').sort({ rollNumber: 1, name: 1 }),
    Result.find({ examinationId: exam._id }),
  ]);

  const resultMap = new Map(existingResults.map((r) => [r.studentId.toString(), r]));

  const roster = students.map((s) => {
    const resRec = resultMap.get(s._id.toString());
    return {
      studentId: s._id,
      name: s.name,
      email: s.email,
      rollNumber: s.rollNumber || 'N/A',
      group: s.group || 'A',
      marksObtained: resRec ? resRec.marksObtained : '',
      isAbsent: resRec ? Boolean(resRec.isAbsent) : false,
      percentage: resRec ? resRec.percentage : null,
      grade: resRec ? resRec.grade : null,
      gradePoint: resRec ? resRec.gradePoint : null,
      status: resRec ? resRec.status : null,
      requiresRemedialClass: resRec ? Boolean(resRec.requiresRemedialClass) : false,
    };
  });

  res.status(200).json({
    success: true,
    data: {
      examination: exam,
      students: roster,
      totalEnrolled: roster.length,
      evaluatedCount: existingResults.length,
    },
  });
};
