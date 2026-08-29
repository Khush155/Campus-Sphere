const Assignment = require('../models/Assignment');
const Faculty = require('../models/Faculty');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../middlewares/asyncHandler');

/**
 * @desc    Create / schedule a new Homework Assignment
 * @route   POST /api/v1/faculty-assignments
 * @access  Private/Faculty
 */
const createAssignment = asyncHandler(async (req, res, next) => {
  const { title, description, subjectId, semester, group, dueDate, maxMarks, status = 'PUBLISHED' } = req.body;

  // Verify uploader is registered Faculty
  const faculty = await Faculty.findOne({ userId: req.user.id });
  if (!faculty) {
    return next(new AppError('Only registered Faculty members can create assignments', 403, ERROR_CODES.FORBIDDEN));
  }

  const newAssignment = await Assignment.create({
    title,
    description,
    subjectId,
    semester: parseInt(semester, 10) || 1,
    group,
    dueDate,
    maxMarks: parseInt(maxMarks, 10) || 100,
    status: ['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED'].includes(status) ? status : 'PUBLISHED',
    uploadedBy: req.user.id,
  });

  const populated = await newAssignment.populate([
    { path: 'subjectId', select: 'name code' },
    { path: 'uploadedBy', select: 'name' }
  ]);

  return successResponse(res, 201, 'Assignment created successfully', populated);
});

/**
 * @desc    Get Homework Assignments (filtered by subject and group/section)
 * @route   GET /api/v1/faculty-assignments
 * @access  Private
 */
const getAssignments = asyncHandler(async (req, res, _next) => {
  const { subjectId, group, status, semester } = req.query;
  const filter = {};

  if (subjectId) {
    filter.subjectId = subjectId;
  }
  if (group && group !== 'ALL') {
    filter.group = group;
  }
  if (status && status !== 'ALL') {
    filter.status = status;
  }
  if (semester) {
    filter.semester = parseInt(semester, 10);
  }

  // If requesting user is STUDENT, show assignments matching their cohort
  if (req.user && req.user.role === 'STUDENT') {
    const User = require('../models/User');
    const student = await User.findById(req.user.id);
    if (student) {
      if (!semester && student.semester) {
        filter.semester = student.semester;
      }
      if (student.group) {
        filter.$or = [
          { group: student.group },
          { group: 'ALL' },
          { group: null },
          { group: '' },
          { group: 'FULL_BATCH' }
        ];
      }
    }
    // Students only see published or closed assignments (not drafts)
    if (!status || status === 'ALL') {
      filter.status = { $in: ['PUBLISHED', 'CLOSED'] };
    }
  }

  const assignments = await Assignment.find(filter)
    .populate('subjectId', 'name code credits')
    .populate('uploadedBy', 'name email')
    .sort({ createdAt: -1 });

  // For students, attach helper fields so frontend can easily identify submission state
  if (req.user && req.user.role === 'STUDENT') {
    const studentIdStr = String(req.user.id);
    const enriched = assignments.map((a) => {
      const aObj = a.toObject();
      const mySub = a.submissions?.find((s) => String(s.studentId) === studentIdStr);
      aObj.mySubmission = mySub || null;
      if (mySub) {
        aObj.submissionStatus = mySub.status || 'SUBMITTED';
      }
      return aObj;
    });
    return successResponse(res, 200, 'Assignments retrieved successfully', enriched);
  }

  return successResponse(res, 200, 'Assignments retrieved successfully', assignments);
});

/**
 * @desc    Update Homework Assignment details
 * @route   PUT /api/v1/faculty-assignments/:id
 * @access  Private/Faculty/Admin
 */
const updateAssignment = asyncHandler(async (req, res, next) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    return next(new AppError('Assignment not found', 404, ERROR_CODES.NOT_FOUND));
  }

  if (String(assignment.uploadedBy) !== String(req.user.id) && req.user.role !== 'SUPER_ADMIN') {
    return next(new AppError('Unauthorized to edit this assignment', 403, ERROR_CODES.FORBIDDEN));
  }

  const { title, description, dueDate, maxMarks, group, status } = req.body;
  if (title) {
    assignment.title = title;
  }
  if (description) {
    assignment.description = description;
  }
  if (dueDate) {
    assignment.dueDate = dueDate;
  }
  if (maxMarks) {
    assignment.maxMarks = parseInt(maxMarks, 10);
  }
  if (group) {
    assignment.group = group;
  }
  if (status && ['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED'].includes(status)) {
    assignment.status = status;
  }

  await assignment.save();
  const populated = await assignment.populate([
    { path: 'subjectId', select: 'name code' },
    { path: 'uploadedBy', select: 'name' }
  ]);

  return successResponse(res, 200, 'Assignment updated successfully', populated);
});

/**
 * @desc    Update Homework Assignment Status (Draft, Publish, Close, Archive)
 * @route   PATCH /api/v1/faculty-assignments/:id/status
 * @access  Private/Faculty/Admin
 */
const updateAssignmentStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  if (!['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED'].includes(status)) {
    return next(new AppError('Invalid status value', 400, ERROR_CODES.BAD_REQUEST));
  }

  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    return next(new AppError('Assignment not found', 404, ERROR_CODES.NOT_FOUND));
  }

  if (String(assignment.uploadedBy) !== String(req.user.id) && req.user.role !== 'SUPER_ADMIN') {
    return next(new AppError('Unauthorized to update this assignment status', 403, ERROR_CODES.FORBIDDEN));
  }

  assignment.status = status;
  await assignment.save();

  const populated = await assignment.populate([
    { path: 'subjectId', select: 'name code' },
    { path: 'uploadedBy', select: 'name' }
  ]);

  return successResponse(res, 200, `Assignment status updated to ${status}`, populated);
});

/**
 * @desc    Delete a Homework Assignment
 * @route   DELETE /api/v1/faculty-assignments/:id
 * @access  Private/Faculty/Admin
 */
const deleteAssignment = asyncHandler(async (req, res, next) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    return next(new AppError('Assignment not found', 404, ERROR_CODES.NOT_FOUND));
  }

  if (String(assignment.uploadedBy) !== String(req.user.id) && req.user.role !== 'SUPER_ADMIN') {
    return next(new AppError('Unauthorized to delete this assignment', 403, ERROR_CODES.FORBIDDEN));
  }

  await Assignment.findByIdAndDelete(req.params.id);

  return successResponse(res, 200, 'Assignment deleted successfully', null);
});

/**
 * @desc    Submit homework / coursework solution as a Student
 * @route   POST /api/v1/faculty-assignments/:id/submit
 * @access  Private/Student
 */
const submitAssignment = asyncHandler(async (req, res, next) => {
  let fileUrl = req.body.submissionUrl ? req.body.submissionUrl.trim() : '';
  if (req.file) {
    fileUrl = `/uploads/${req.file.filename}`;
  }

  if (!fileUrl) {
    return next(new AppError('Submission file or URL link is required', 400, ERROR_CODES.VALIDATION_ERROR));
  }

  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    return next(new AppError('Assignment not found', 404, ERROR_CODES.NOT_FOUND));
  }

  if (assignment.status === 'DRAFT' || assignment.status === 'ARCHIVED') {
    return next(new AppError('This assignment is not accepting submissions', 400, ERROR_CODES.BAD_REQUEST));
  }

  const studentId = req.user.id;
  const isLate = assignment.dueDate && new Date() > new Date(assignment.dueDate);

  // Check if student already submitted - if so, update their existing submission
  if (!assignment.submissions) {
    assignment.submissions = [];
  }

  const existingSubIndex = assignment.submissions.findIndex(
    (s) => String(s.studentId) === String(studentId)
  );

  const submissionData = {
    studentId,
    submissionUrl: fileUrl,
    notes: req.body.notes ? req.body.notes.trim() : '',
    submittedAt: new Date(),
    status: isLate ? 'LATE' : 'SUBMITTED',
  };

  if (existingSubIndex >= 0) {
    const prevMarks = assignment.submissions[existingSubIndex].marksObtained;
    const prevFeedback = assignment.submissions[existingSubIndex].feedback;
    assignment.submissions[existingSubIndex] = {
      ...assignment.submissions[existingSubIndex].toObject(),
      ...submissionData,
      marksObtained: prevMarks,
      feedback: prevFeedback,
    };
  } else {
    assignment.submissions.push(submissionData);
  }

  await assignment.save();

  const mySub = assignment.submissions.find(
    (s) => String(s.studentId) === String(studentId)
  );

  return successResponse(res, 200, 'Assignment submitted successfully', mySub);
});

module.exports = {
  createAssignment,
  getAssignments,
  updateAssignment,
  updateAssignmentStatus,
  deleteAssignment,
  submitAssignment,
};
