const Exam = require('../models/Exam');
const ExamResult = require('../models/ExamResult');
const Subject = require('../models/Subject');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../middlewares/asyncHandler');

/**
 * @desc    Schedule a new exam
 * @route   POST /api/v1/exams
 * @access  Private/Faculty/Admin
 */
const scheduleExam = asyncHandler(async (req, res, next) => {
  const { name, subjectId, examType, date, maxMarks, passingMarks } = req.body;

  // Verify that the subject exists
  const subjectExists = await Subject.findById(subjectId);
  if (!subjectExists) {
    return next(new AppError('The specified subject does not exist', 404, ERROR_CODES.NOT_FOUND));
  }

  const newExam = await Exam.create({
    name,
    subjectId,
    examType,
    date,
    maxMarks,
    passingMarks,
  });

  return successResponse(res, 201, 'Exam scheduled successfully', newExam);
});

/**
 * @desc    Submit or update a grade for a student's exam
 * @route   POST /api/v1/exams/results
 * @access  Private/Faculty/Admin
 */
const submitExamResult = asyncHandler(async (req, res, next) => {
  const { examId, studentId, marksObtained, absent, remarks, isPublished } = req.body;

  // 1. Verify the exam exists
  const exam = await Exam.findById(examId);
  if (!exam) {
    return next(new AppError('Exam schedule not found', 404, ERROR_CODES.NOT_FOUND));
  }

  // 2. Verify the student exists
  const student = await User.findById(studentId);
  if (!student) {
    return next(new AppError('Student account not found', 404, ERROR_CODES.NOT_FOUND));
  }

  // 3. Find existing result or initialize a new one
  let resultRecord = await ExamResult.findOne({ examId, studentId });

  if (resultRecord) {
    // Update existing record
    resultRecord.marksObtained = absent ? 0 : (marksObtained ?? 0);
    resultRecord.absent = absent ?? false;
    resultRecord.remarks = remarks ?? '';
    if (isPublished !== undefined) {
      resultRecord.isPublished = isPublished;
    }
  } else {
    // Create new document
    resultRecord = new ExamResult({
      examId,
      studentId,
      marksObtained: absent ? 0 : (marksObtained ?? 0),
      absent: absent ?? false,
      remarks: remarks ?? '',
      isPublished: isPublished ?? false,
    });
  }

  // 4. Save the document. This triggers the pre-save hook that automatically computes the grade!
  await resultRecord.save();

  // Populate references for a rich response
  const populatedResult = await resultRecord.populate([
    { path: 'studentId', select: 'name email' },
    { path: 'examId', select: 'name examType maxMarks' }
  ]);

  return successResponse(res, 200, 'Exam result recorded successfully', populatedResult);
});

/**
 * @desc    GPA Calculation Engine: Calculate credit-weighted average for a student
 * @route   GET /api/v1/exams/gpa/:studentId
 * @access  Private
 */
const calculateStudentGPA = asyncHandler(async (req, res, next) => {
  const { studentId } = req.params;

  // Verify student exists
  const student = await User.findById(studentId);
  if (!student) {
    return next(new AppError('Student not found', 404, ERROR_CODES.NOT_FOUND));
  }

  // 1. Find all results for this student where grades are officially PUBLISHED
  // This filters out draft or in-progress subjects safely
  const publishedResults = await ExamResult.find({
    studentId,
    isPublished: true,
  }).populate({
    path: 'examId',
    populate: { path: 'subjectId' }, // Double populate to reach Subject credits
  });

  if (publishedResults.length === 0) {
    return successResponse(res, 200, 'No published results available to compute GPA.', {
      student: { name: student.name, email: student.email },
      gpa: 0,
      totalCredits: 0,
      message: 'GPA is 0 because there are no published exam results yet.',
    });
  }

  let totalCredits = 0;
  let weightedPointsSum = 0;
  const gradeBreakdown = [];

  // 2. Loop through results and calculate sum of (GradePoints * Credits)
  for (const result of publishedResults) {
    const exam = result.examId;
    if (!exam) continue;

    const subject = exam.subjectId;
    if (!subject) continue; // Safety guard if subject is somehow missing

    const credits = subject.credits;
    const gradePoint = result.gradePoint;

    weightedPointsSum += (gradePoint * credits);
    totalCredits += credits;

    gradeBreakdown.push({
      subjectName: subject.name,
      subjectCode: subject.code,
      credits,
      grade: result.grade,
      gradePoint,
    });
  }

  // 3. Compute final GPA
  const gpa = totalCredits > 0 ? (weightedPointsSum / totalCredits) : 0;
  const roundedGPA = Math.round(gpa * 100) / 100; // Round to 2 decimal places

  return successResponse(res, 200, 'GPA calculated successfully', {
    student: {
      id: student._id,
      name: student.name,
      email: student.email,
    },
    gpa: roundedGPA,
    totalCredits,
    gradeBreakdown,
  });
});

/**
 * @desc    Get exams list, optionally filtered by subjectId
 * @route   GET /api/v1/exams
 * @access  Private
 */
const getExams = asyncHandler(async (req, res, next) => {
  const { subjectId } = req.query;
  const filter = {};
  
  if (subjectId) {
    filter.subjectId = subjectId;
  }
  
  const exams = await Exam.find(filter).populate('subjectId', 'name code').sort({ date: 1 });
  
  return successResponse(res, 200, 'Exams retrieved successfully', exams);
});

/**
 * @desc    Get results for a specific exam
 * @route   GET /api/v1/exams/:examId/results
 * @access  Private/Faculty/Admin
 */
const getExamResults = asyncHandler(async (req, res, next) => {
  const { examId } = req.params;
  const results = await ExamResult.find({ examId }).populate('studentId', 'name email');
  return successResponse(res, 200, 'Exam results retrieved successfully', results);
});

module.exports = {
  scheduleExam,
  submitExamResult,
  calculateStudentGPA,
  getExams,
  getExamResults,
};
