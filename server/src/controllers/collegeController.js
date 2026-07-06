const collegeService = require('../services/collegeService');
const { successResponse } = require('../utils/apiResponse');
const {
  createDepartmentSchema,
  updateDepartmentSchema,
  createCourseSchema,
  updateCourseSchema,
  createBranchSchema,
  updateBranchSchema,
  createSubjectSchema,
  updateSubjectSchema,
} = require('../validators/collegeValidator');

// ==========================================
// DEPARTMENT CONTROLLERS
// ==========================================

const createDepartment = async (req, res, _next) => {
  const validatedBody = createDepartmentSchema.parse(req.body);
  const dept = await collegeService.createDepartment(validatedBody);
  return successResponse(res, 201, 'Department created successfully.', dept);
};

const getAllDepartments = async (req, res, _next) => {
  const depts = await collegeService.getAllDepartments(req.query);
  return successResponse(res, 200, 'Departments retrieved successfully.', depts.data, depts.meta);
};

const getDepartmentById = async (req, res, _next) => {
  const dept = await collegeService.getDepartmentById(req.params.id);
  return successResponse(res, 200, 'Department retrieved successfully.', dept);
};

const updateDepartment = async (req, res, _next) => {
  const validatedBody = updateDepartmentSchema.parse(req.body);
  const dept = await collegeService.updateDepartment(req.params.id, validatedBody);
  return successResponse(res, 200, 'Department updated successfully.', dept);
};

const deleteDepartment = async (req, res, _next) => {
  const dept = await collegeService.deleteDepartment(req.params.id);
  return successResponse(res, 200, 'Department deleted successfully.', dept);
};

// ==========================================
// COURSE CONTROLLERS
// ==========================================

const createCourse = async (req, res, _next) => {
  const validatedBody = createCourseSchema.parse(req.body);
  const course = await collegeService.createCourse(validatedBody);
  return successResponse(res, 201, 'Course created successfully.', course);
};

const getAllCourses = async (req, res, _next) => {
  const courses = await collegeService.getAllCourses(req.query);
  return successResponse(res, 200, 'Courses retrieved successfully.', courses.data, courses.meta);
};

const getCourseById = async (req, res, _next) => {
  const course = await collegeService.getCourseById(req.params.id);
  return successResponse(res, 200, 'Course retrieved successfully.', course);
};

const updateCourse = async (req, res, _next) => {
  const validatedBody = updateCourseSchema.parse(req.body);
  const course = await collegeService.updateCourse(req.params.id, validatedBody);
  return successResponse(res, 200, 'Course updated successfully.', course);
};

const deleteCourse = async (req, res, _next) => {
  const course = await collegeService.deleteCourse(req.params.id);
  return successResponse(res, 200, 'Course deleted successfully.', course);
};

// ==========================================
// BRANCH CONTROLLERS
// ==========================================

const createBranch = async (req, res, _next) => {
  const validatedBody = createBranchSchema.parse(req.body);
  const branch = await collegeService.createBranch(validatedBody);
  return successResponse(res, 201, 'Branch created successfully.', branch);
};

const getAllBranches = async (req, res, _next) => {
  const branches = await collegeService.getAllBranches(req.query);
  return successResponse(res, 200, 'Branches retrieved successfully.', branches.data, branches.meta);
};

const getBranchById = async (req, res, _next) => {
  const branch = await collegeService.getBranchById(req.params.id);
  return successResponse(res, 200, 'Branch retrieved successfully.', branch);
};

const updateBranch = async (req, res, _next) => {
  const validatedBody = updateBranchSchema.parse(req.body);
  const branch = await collegeService.updateBranch(req.params.id, validatedBody);
  return successResponse(res, 200, 'Branch updated successfully.', branch);
};

const deleteBranch = async (req, res, _next) => {
  const branch = await collegeService.deleteBranch(req.params.id);
  return successResponse(res, 200, 'Branch deleted successfully.', branch);
};

// ==========================================
// SUBJECT CONTROLLERS
// ==========================================

const createSubject = async (req, res, _next) => {
  const validatedBody = createSubjectSchema.parse(req.body);
  const subject = await collegeService.createSubject(validatedBody);
  return successResponse(res, 201, 'Subject created successfully.', subject);
};

const getAllSubjects = async (req, res, _next) => {
  const subjects = await collegeService.getAllSubjects(req.query);
  return successResponse(res, 200, 'Subjects retrieved successfully.', subjects.data, subjects.meta);
};

const getSubjectById = async (req, res, _next) => {
  const subject = await collegeService.getSubjectById(req.params.id);
  return successResponse(res, 200, 'Subject retrieved successfully.', subject);
};

const updateSubject = async (req, res, _next) => {
  const validatedBody = updateSubjectSchema.parse(req.body);
  const subject = await collegeService.updateSubject(req.params.id, validatedBody);
  return successResponse(res, 200, 'Subject updated successfully.', subject);
};

const deleteSubject = async (req, res, _next) => {
  const subject = await collegeService.deleteSubject(req.params.id);
  return successResponse(res, 200, 'Subject deleted successfully.', subject);
};

module.exports = {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  createBranch,
  getAllBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
};
