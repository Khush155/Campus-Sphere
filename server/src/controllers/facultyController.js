const User = require('../models/User');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');
const Subject = require('../models/Subject');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../middlewares/asyncHandler');

/**
 * @desc    Create a new Faculty profile & User account
 * @route   POST /api/v1/faculty
 * @access  Private/Admin
 */
const createFaculty = asyncHandler(async (req, res, next) => {
  const { name, email, password, departmentId, designation, phoneNumber, officeHours, subjects } = req.body;

  // 1. Verify that the assigned department exists
  const departmentExists = await Department.findById(departmentId);
  if (!departmentExists) {
    return next(new AppError('The specified department does not exist', 404, ERROR_CODES.NOT_FOUND));
  }

  // 2. Check if a user with this email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('A user with this email already exists', 400, ERROR_CODES.BAD_REQUEST));
  }

  // 3. Create the User record (the Auth account)
  let newUser;
  try {
    newUser = await User.create({
      name,
      email,
      password,
      role: 'FACULTY',
    });
  } catch (error) {
    return next(error);
  }

  // 4. Create the Faculty record
  try {
    const newFaculty = await Faculty.create({
      userId: newUser._id,
      departmentId,
      designation,
      phoneNumber,
      officeHours,
      subjects,
    });

    // Populate user and department info to return a rich response
    const populatedFaculty = await newFaculty.populate([
      { path: 'userId', select: 'name email role status' },
      { path: 'departmentId', select: 'name code' },
      { path: 'subjects', select: 'name code credits' }
    ]);

    return successResponse(res, 201, 'Faculty profile created successfully', populatedFaculty);
  } catch (facultyError) {
    // MANUAL CLEANUP: If faculty profile creation fails, delete the created User record
    if (newUser) {
      await User.findByIdAndDelete(newUser._id);
    }
    return next(new AppError(`Faculty creation failed: ${facultyError.message}`, 400, ERROR_CODES.BAD_REQUEST));
  }
});

/**
 * @desc    Get all faculty profiles
 * @route   GET /api/v1/faculty
 * @access  Private
 */
const getAllFaculty = asyncHandler(async (req, res, next) => {
  const { departmentId } = req.query;
  const filter = {};

  // If a departmentId query is passed, filter results
  if (departmentId) {
    filter.departmentId = departmentId;
  }

  // Find all faculty and populate relationships
  const faculties = await Faculty.find(filter).populate([
    { path: 'userId', select: 'name email role status' },
    { path: 'departmentId', select: 'name code' },
    { path: 'subjects', select: 'name code' }
  ]);

  return successResponse(res, 200, 'Faculty profiles retrieved successfully', faculties);
});

/**
 * @desc    Get a single faculty profile by ID
 * @route   GET /api/v1/faculty/:id
 * @access  Private
 */
const getFacultyById = asyncHandler(async (req, res, next) => {
  const faculty = await Faculty.findById(req.params.id).populate([
    { path: 'userId', select: 'name email role status' },
    { path: 'departmentId', select: 'name code' },
    { path: 'subjects', select: 'name code credits' }
  ]);

  if (!faculty) {
    return next(new AppError('Faculty profile not found', 404, ERROR_CODES.NOT_FOUND));
  }

  return successResponse(res, 200, 'Faculty profile retrieved successfully', faculty);
});

/**
 * @desc    Update a Faculty profile and/or User details
 * @route   PATCH /api/v1/faculty/:id
 * @access  Private/Admin
 */
const updateFaculty = asyncHandler(async (req, res, next) => {
  const { name, email, designation, phoneNumber, officeHours, subjects } = req.body;

  // Find the faculty profile first
  const faculty = await Faculty.findById(req.params.id);
  if (!faculty) {
    return next(new AppError('Faculty profile not found', 404, ERROR_CODES.NOT_FOUND));
  }

  // 1. Update User fields if provided
  if (name || email) {
    const userUpdate = {};
    if (name) userUpdate.name = name;
    if (email) {
      // Check if email is already taken by someone else
      const emailTaken = await User.findOne({ email, _id: { $ne: faculty.userId } });
      if (emailTaken) {
        return next(new AppError('Email is already taken by another user', 400, ERROR_CODES.BAD_REQUEST));
      }
      userUpdate.email = email;
    }
    await User.findByIdAndUpdate(faculty.userId, userUpdate, { runValidators: true });
  }

  // 2. Update Faculty fields
  const facultyUpdate = {};
  if (designation) facultyUpdate.designation = designation;
  if (phoneNumber !== undefined) facultyUpdate.phoneNumber = phoneNumber;
  if (officeHours !== undefined) facultyUpdate.officeHours = officeHours;
  if (subjects) facultyUpdate.subjects = subjects;

  const updatedFaculty = await Faculty.findByIdAndUpdate(req.params.id, facultyUpdate, {
    new: true, // Returns the updated document instead of the old one
    runValidators: true,
  }).populate([
    { path: 'userId', select: 'name email role status' },
    { path: 'departmentId', select: 'name code' },
    { path: 'subjects', select: 'name code' }
  ]);

  return successResponse(res, 200, 'Faculty profile updated successfully', updatedFaculty);
});

/**
 * @desc    Delete a Faculty profile and its associated User account
 * @route   DELETE /api/v1/faculty/:id
 * @access  Private/Admin
 */
const deleteFaculty = asyncHandler(async (req, res, next) => {
  const faculty = await Faculty.findById(req.params.id);
  if (!faculty) {
    return next(new AppError('Faculty profile not found', 404, ERROR_CODES.NOT_FOUND));
  }

  // Delete the User account and then the Faculty profile
  await User.findByIdAndDelete(faculty.userId);
  await Faculty.findByIdAndDelete(req.params.id);

  return successResponse(res, 200, 'Faculty profile and user account deleted successfully', null);
});

/**
 * @desc    Assign subjects to a Faculty member
 * @route   PUT /api/v1/faculty/:id/subjects
 * @access  Private/Admin
 */
const assignSubjects = asyncHandler(async (req, res, next) => {
  const { subjects } = req.body; // Expects an array of Subject IDs

  if (!Array.isArray(subjects)) {
    return next(new AppError('Subjects must be an array of IDs', 400, ERROR_CODES.BAD_REQUEST));
  }

  // Verify that all subject IDs exist in the database
  const validSubjectsCount = await Subject.countDocuments({ _id: { $in: subjects } });
  if (validSubjectsCount !== subjects.length) {
    return next(new AppError('One or more subject IDs are invalid or do not exist', 400, ERROR_CODES.BAD_REQUEST));
  }

  const updatedFaculty = await Faculty.findByIdAndUpdate(
    req.params.id,
    { subjects },
    { new: true, runValidators: true }
  ).populate([
    { path: 'userId', select: 'name' },
    { path: 'subjects', select: 'name code' }
  ]);

  if (!updatedFaculty) {
    return next(new AppError('Faculty profile not found', 404, ERROR_CODES.NOT_FOUND));
  }

  return successResponse(res, 200, 'Subjects assigned to faculty successfully', updatedFaculty);
});

module.exports = {
  createFaculty,
  getAllFaculty,
  getFacultyById,
  updateFaculty,
  deleteFaculty,
  assignSubjects,
};
