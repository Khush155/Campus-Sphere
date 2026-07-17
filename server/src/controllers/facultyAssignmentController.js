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
  const { title, description, subjectId, semester, group, dueDate, maxMarks } = req.body;

  // Verify uploader is registered Faculty
  const faculty = await Faculty.findOne({ userId: req.user.id });
  if (!faculty) {
    return next(new AppError('Only registered Faculty members can create assignments', 403, ERROR_CODES.FORBIDDEN));
  }

  const newAssignment = await Assignment.create({
    title,
    description,
    subjectId,
    semester: parseInt(semester, 10),
    group,
    dueDate,
    maxMarks: parseInt(maxMarks, 10),
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
const getAssignments = asyncHandler(async (req, res, next) => {
  const { subjectId, group } = req.query;
  const filter = {};

  if (subjectId) filter.subjectId = subjectId;
  if (group) filter.group = group;

  const assignments = await Assignment.find(filter)
    .populate('subjectId', 'name code')
    .populate('uploadedBy', 'name')
    .sort({ createdAt: -1 });

  return successResponse(res, 200, 'Assignments retrieved successfully', assignments);
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

module.exports = {
  createAssignment,
  getAssignments,
  deleteAssignment,
};
