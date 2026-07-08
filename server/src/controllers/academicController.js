const Course = require('../models/Course');
const Branch = require('../models/Branch');
const Subject = require('../models/Subject');
const AppError = require('../utils/AppError');
const { successResponse } = require('../utils/apiResponse');

// @desc    Get all courses with their branches
// @route   GET /api/v1/academics/courses
// @access  Private (College Admin, Super Admin)
exports.getCourses = async (req, res, next) => {
  const courses = await Course.find().lean();
  const branches = await Branch.find().lean();

  const formattedCourses = courses.map(course => ({
    id: course._id,
    name: course.name,
    code: course.code,
    duration: `${course.durationYears} Years`,
    type: course.durationYears >= 4 ? 'Undergraduate' : 'Postgraduate', // basic heuristic
    branches: branches.filter(b => b.courseId.toString() === course._id.toString()).map(b => b.name)
  }));

  return successResponse(res, 200, 'Courses retrieved successfully', formattedCourses);
};

// @desc    Create a course
// @route   POST /api/v1/academics/courses
// @access  Private
exports.createCourse = async (req, res, next) => {
  const course = await Course.create(req.body);
  return successResponse(res, 201, 'Course created successfully', course);
};

// @desc    Get all subjects
// @route   GET /api/v1/academics/subjects
// @access  Private
exports.getSubjects = async (req, res, next) => {
  const subjects = await Subject.find().populate('branchId').populate('departmentId').lean();

  const formattedSubjects = subjects.map(sub => ({
    id: sub._id,
    code: sub.code,
    name: sub.name,
    credits: sub.credits,
    semester: sub.semester,
    type: sub.type === 'THEORY' ? 'Core' : sub.type === 'PRACTICAL' ? 'Practical' : sub.type === 'SESSIONAL' ? 'Sessional' : 'Elective',
    branch: sub.branchId ? sub.branchId.name : 'Unknown',
    department: sub.departmentId ? sub.departmentId.name : 'Unknown'
  }));

  return successResponse(res, 200, 'Subjects retrieved successfully', formattedSubjects);
};

// @desc    Create a subject
// @route   POST /api/v1/academics/subjects
// @access  Private
exports.createSubject = async (req, res, next) => {
  const subject = await Subject.create(req.body);
  return successResponse(res, 201, 'Subject created successfully', subject);
};
