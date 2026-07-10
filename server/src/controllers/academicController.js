const Department = require('../models/Department');
const Subject = require('../models/Subject');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../middlewares/asyncHandler');

/**
 * @desc    Get all departments
 * @route   GET /api/v1/academics/departments
 * @access  Private
 */
const getAllDepartments = asyncHandler(async (req, res, next) => {
  const departments = await Department.find({});
  return successResponse(res, 200, 'Departments retrieved successfully', departments);
});

/**
 * @desc    Get all subjects (optionally filtered by departmentId)
 * @route   GET /api/v1/academics/subjects
 * @access  Private
 */
const getAllSubjects = asyncHandler(async (req, res, next) => {
  const { departmentId } = req.query;
  const filter = {};

  if (departmentId) {
    filter.departmentId = departmentId;
  }

  const subjects = await Subject.find(filter).populate('departmentId', 'name code');
  return successResponse(res, 200, 'Subjects retrieved successfully', subjects);
});

module.exports = {
  getAllDepartments,
  getAllSubjects,
};
