const examService = require('../services/examService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../middlewares/asyncHandler');

/**
 * @desc    Schedule a new exam
 * @route   POST /api/v1/exams
 * @access  Private/Faculty/Admin
 */
const scheduleExam = asyncHandler(async (req, res) => {
  const newExam = await examService.scheduleExam(req.body, req.user, req);
  return successResponse(res, 201, 'Exam scheduled successfully', newExam);
});

/**
 * @desc    Submit or update student exam result
 * @route   POST /api/v1/exams/results
 * @access  Private/Faculty/Admin
 */
const submitExamResult = asyncHandler(async (req, res) => {
  const result = await examService.submitExamResult(req.body, req.user, req);
  return successResponse(res, 200, 'Exam result recorded successfully', result);
});

/**
 * @desc    Calculate GPA for a student
 * @route   GET /api/v1/exams/gpa/:studentId
 * @access  Private/Admin/Faculty/Student
 */
const calculateStudentGPA = asyncHandler(async (req, res) => {
  const summary = await examService.calculateStudentGPA(req.params.studentId);
  return successResponse(res, 200, 'GPA calculated successfully', summary);
});

/**
 * @desc    Get exams list
 * @route   GET /api/v1/exams
 * @access  Private
 */
const getExams = asyncHandler(async (req, res) => {
  const exams = await examService.getExams(req.query, req.user);
  return successResponse(res, 200, 'Exams retrieved successfully', exams);
});

/**
 * @desc    Get results for specific exam
 * @route   GET /api/v1/exams/:examId/results
 * @access  Private/Faculty/Admin
 */
const getExamResults = asyncHandler(async (req, res) => {
  const results = await examService.getExamResults(req.params.examId, req.user);
  return successResponse(res, 200, 'Exam results retrieved successfully', results);
});

module.exports = {
  scheduleExam,
  submitExamResult,
  calculateStudentGPA,
  getExams,
  getExamResults,
};
