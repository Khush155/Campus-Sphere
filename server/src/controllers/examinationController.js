const Examination = require('../models/Examination');
const Result = require('../models/Result');
const AuditLog = require('../models/AuditLog');
const AppError = require('../utils/AppError');

/**
 * Maps percentage to grade and gradePoint using the 10-point scale.
 */
const computeGrade = (percentage, isAbsent) => {
  if (isAbsent) return { grade: 'AB', gradePoint: 0 };
  if (percentage >= 91) return { grade: 'O', gradePoint: 10 };
  if (percentage >= 81) return { grade: 'A+', gradePoint: 9 };
  if (percentage >= 71) return { grade: 'A', gradePoint: 8 };
  if (percentage >= 61) return { grade: 'B+', gradePoint: 7 };
  if (percentage >= 51) return { grade: 'B', gradePoint: 6 };
  if (percentage >= 40) return { grade: 'C', gradePoint: 5 };
  return { grade: 'F', gradePoint: 0 };
};

// POOR_GRADES that trigger remedial class requirement
const POOR_GRADES = new Set(['F', 'C', 'AB']);

/**
 * POST /api/v1/examinations
 * Create a new examination with syllabus and datesheet fields.
 */
exports.createExamination = async (req, res) => {
  const {
    title, type, subjectId, date, totalMarks, passingMarks,
    venue, duration, syllabus, datesheetSlot, reportingTime, instructions,
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
  if (passingMarks >= totalMarks) {
    throw new AppError('Passing marks must be less than total marks.', 400);
  }

  const exam = await Examination.create({
    title, type,
    departmentId: req.user.departmentId,
    subjectId,
    date: new Date(date),
    totalMarks,
    passingMarks,
    venue,
    duration,
    syllabus: Array.isArray(syllabus) ? syllabus : [],
    datesheetSlot,
    reportingTime,
    instructions,
    datesheetPdfUrl,
    seatingPlanPdfUrl,
  });

  res.status(201).json({ success: true, data: exam });
};

/**
 * GET /api/v1/examinations
 * List exams with pagination.
 */
exports.getExaminations = async (req, res) => {
  const { departmentId, status, type, page = 1, limit = 20 } = req.query;
  const filters = {};
  if (departmentId) filters.departmentId = departmentId;
  else if (req.user.departmentId) filters.departmentId = req.user.departmentId;
  if (status) filters.status = status;
  if (type) filters.type = type;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [exams, total] = await Promise.all([
    Examination.find(filters)
      .populate('subjectId', 'name code credits semester')
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
  if (!exam) throw new AppError('Examination not found.', 404);

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
  if (!exam) throw new AppError('Examination not found.', 404);

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
  if (!exam) throw new AppError('Examination not found.', 404);

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
