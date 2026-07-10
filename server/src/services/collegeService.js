const Department = require('../models/Department');
const Course = require('../models/Course');
const Branch = require('../models/Branch');
const Subject = require('../models/Subject');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const logger = require('../utils/logger');
const paginate = require('../utils/paginate');

// ==========================================
// DEPARTMENT CRUD SERVICES
// ==========================================

const createDepartment = async (departmentData) => {
  const { name, code, description } = departmentData;

  // Check unique constraints
  const duplicate = await Department.findOne({ $or: [{ name }, { code: code.toUpperCase() }] });
  if (duplicate) {
    throw new AppError('Department name or code already exists.', 400, ERROR_CODES.DUPLICATE_ENTRY);
  }

  const dept = await Department.create({ name, code, description });
  logger.info(`[Department Created] ID: ${dept._id} - Code: ${dept.code}`);
  return dept;
};

const getAllDepartments = async (queryOptions = {}) => {
  const filter = {};
  if (queryOptions.search) {
    filter.$or = [
      { name: { $regex: queryOptions.search, $options: 'i' } },
      { code: { $regex: queryOptions.search, $options: 'i' } },
    ];
  }
  return await paginate(Department, filter, queryOptions);
};

const getDepartmentById = async (id) => {
  const dept = await Department.findById(id);
  if (!dept) {
    throw new AppError('Department not found.', 404, ERROR_CODES.NOT_FOUND);
  }
  return dept;
};

const updateDepartment = async (id, updateData) => {
  const dept = await Department.findById(id);
  if (!dept) {
    throw new AppError('Department not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  // Check unique constraints if name or code is changing
  if (updateData.name || updateData.code) {
    const filter = {
      _id: { $ne: id },
      $or: [],
    };
    if (updateData.name) {
      filter.$or.push({ name: updateData.name });
    }
    if (updateData.code) {
      filter.$or.push({ code: updateData.code.toUpperCase() });
    }

    const duplicate = await Department.findOne(filter);
    if (duplicate) {
      throw new AppError('Department name or code already in use by another department.', 400, ERROR_CODES.DUPLICATE_ENTRY);
    }
  }

  Object.assign(dept, updateData);
  await dept.save();
  logger.info(`[Department Updated] ID: ${id}`);
  return dept;
};

const deleteDepartment = async (id) => {
  const dept = await Department.findByIdAndDelete(id);
  if (!dept) {
    throw new AppError('Department not found.', 404, ERROR_CODES.NOT_FOUND);
  }
  logger.info(`[Department Deleted] ID: ${id}`);
  return dept;
};

// ==========================================
// COURSE CRUD SERVICES
// ==========================================

const createCourse = async (courseData) => {
  const { name, code, durationYears } = courseData;

  const duplicate = await Course.findOne({ $or: [{ name }, { code: code.toUpperCase() }] });
  if (duplicate) {
    throw new AppError('Course name or code already exists.', 400, ERROR_CODES.DUPLICATE_ENTRY);
  }

  const course = await Course.create({ name, code, durationYears });
  logger.info(`[Course Created] ID: ${course._id} - Code: ${course.code}`);
  return course;
};

const getAllCourses = async (queryOptions = {}) => {
  const filter = {};
  if (queryOptions.search) {
    filter.$or = [
      { name: { $regex: queryOptions.search, $options: 'i' } },
      { code: { $regex: queryOptions.search, $options: 'i' } },
    ];
  }
  return await paginate(Course, filter, queryOptions);
};

const getCourseById = async (id) => {
  const course = await Course.findById(id);
  if (!course) {
    throw new AppError('Course not found.', 404, ERROR_CODES.NOT_FOUND);
  }
  return course;
};

const updateCourse = async (id, updateData) => {
  const course = await Course.findById(id);
  if (!course) {
    throw new AppError('Course not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  if (updateData.name || updateData.code) {
    const filter = {
      _id: { $ne: id },
      $or: [],
    };
    if (updateData.name) {
      filter.$or.push({ name: updateData.name });
    }
    if (updateData.code) {
      filter.$or.push({ code: updateData.code.toUpperCase() });
    }

    const duplicate = await Course.findOne(filter);
    if (duplicate) {
      throw new AppError('Course name or code already in use.', 400, ERROR_CODES.DUPLICATE_ENTRY);
    }
  }

  Object.assign(course, updateData);
  await course.save();
  logger.info(`[Course Updated] ID: ${id}`);
  return course;
};

const deleteCourse = async (id) => {
  const course = await Course.findByIdAndDelete(id);
  if (!course) {
    throw new AppError('Course not found.', 404, ERROR_CODES.NOT_FOUND);
  }
  logger.info(`[Course Deleted] ID: ${id}`);
  return course;
};

// ==========================================
// BRANCH CRUD SERVICES
// ==========================================

const createBranch = async (branchData) => {
  const { name, code, courseId } = branchData;

  // 1. Verify parent Course exists
  const parentCourse = await Course.findById(courseId);
  if (!parentCourse) {
    throw new AppError('Parent Course not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  // 2. Check compound unique index (courseId + code)
  const duplicate = await Branch.findOne({ courseId, code: code.toUpperCase() });
  if (duplicate) {
    throw new AppError('Branch code already exists under this course.', 400, ERROR_CODES.DUPLICATE_ENTRY);
  }

  const branch = await Branch.create({ name, code, courseId });
  logger.info(`[Branch Created] ID: ${branch._id} - Code: ${branch.code} under Course: ${courseId}`);
  return branch;
};

const getAllBranches = async (queryOptions = {}) => {
  const filter = {};
  if (queryOptions.courseId) {
    filter.courseId = queryOptions.courseId;
  }
  if (queryOptions.search) {
    filter.$or = [
      { name: { $regex: queryOptions.search, $options: 'i' } },
      { code: { $regex: queryOptions.search, $options: 'i' } },
    ];
  }
  return await paginate(Branch, filter, {
    ...queryOptions,
    populate: 'courseId',
  });
};

const getBranchById = async (id) => {
  const branch = await Branch.findById(id).populate('courseId');
  if (!branch) {
    throw new AppError('Branch not found.', 404, ERROR_CODES.NOT_FOUND);
  }
  return branch;
};

const updateBranch = async (id, updateData) => {
  const branch = await Branch.findById(id);
  if (!branch) {
    throw new AppError('Branch not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  const courseId = updateData.courseId || branch.courseId;
  const code = updateData.code ? updateData.code.toUpperCase() : branch.code;

  // Verify parent course if modified
  if (updateData.courseId && updateData.courseId !== branch.courseId.toString()) {
    const parentCourse = await Course.findById(updateData.courseId);
    if (!parentCourse) {
      throw new AppError('Parent Course not found.', 404, ERROR_CODES.NOT_FOUND);
    }
  }

  // Check duplicate compound index
  if (updateData.code || updateData.courseId) {
    const duplicate = await Branch.findOne({
      _id: { $ne: id },
      courseId,
      code,
    });
    if (duplicate) {
      throw new AppError('Branch code already in use under this course.', 400, ERROR_CODES.DUPLICATE_ENTRY);
    }
  }

  Object.assign(branch, updateData);
  await branch.save();
  logger.info(`[Branch Updated] ID: ${id}`);
  return branch;
};

const deleteBranch = async (id) => {
  const branch = await Branch.findByIdAndDelete(id);
  if (!branch) {
    throw new AppError('Branch not found.', 404, ERROR_CODES.NOT_FOUND);
  }
  logger.info(`[Branch Deleted] ID: ${id}`);
  return branch;
};

// ==========================================
// SUBJECT CRUD SERVICES
// ==========================================

const assertSubjectSemestersValid = async (branchId, semester) => {
  const branch = await Branch.findById(branchId).populate('courseId');
  if (!branch) {
    throw new AppError('Parent Branch not found.', 404, ERROR_CODES.NOT_FOUND);
  }
  if (!branch.courseId) {
    throw new AppError('Course details linked to branch are missing.', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  // Duration in years * 2 gives total academic semesters (e.g. 4 years = 8 semesters)
  const maxSemesters = branch.courseId.durationYears * 2;
  if (semester > maxSemesters) {
    throw new AppError(
      `Invalid semester. Subject semester (${semester}) exceeds the maximum semesters allowed for ${branch.courseId.code} (${maxSemesters} semesters).`,
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
  }
};

const createSubject = async (subjectData) => {
  const { name, code, credits, type, branchId, departmentId, semester } = subjectData;

  // 1. Verify parent Department exists
  const parentDept = await Department.findById(departmentId);
  if (!parentDept) {
    throw new AppError('Department reference not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  // 2. Verify parent Branch exists and semester is within limits (user suggestion check!)
  await assertSubjectSemestersValid(branchId, semester);

  // 3. Verify compound unique constraints (branchId + code)
  const duplicate = await Subject.findOne({ branchId, code: code.toUpperCase() });
  if (duplicate) {
    throw new AppError('Subject code already registered under this branch.', 400, ERROR_CODES.DUPLICATE_ENTRY);
  }

  const subject = await Subject.create({
    name,
    code,
    credits,
    type,
    branchId,
    departmentId,
    semester,
  });
  logger.info(`[Subject Created] ID: ${subject._id} - Code: ${subject.code} under Branch: ${branchId}`);
  return subject;
};

const getAllSubjects = async (queryOptions = {}) => {
  const filter = {};
  if (queryOptions.branchId) {
    filter.branchId = queryOptions.branchId;
  }
  if (queryOptions.departmentId) {
    filter.departmentId = queryOptions.departmentId;
  }
  if (queryOptions.semester) {
    filter.semester = queryOptions.semester;
  }
  if (queryOptions.search) {
    filter.$or = [
      { name: { $regex: queryOptions.search, $options: 'i' } },
      { code: { $regex: queryOptions.search, $options: 'i' } },
    ];
  }
  return await paginate(Subject, filter, {
    ...queryOptions,
    populate: ['branchId', 'departmentId'],
  });
};

const getSubjectById = async (id) => {
  const subject = await Subject.findById(id).populate(['branchId', 'departmentId']);
  if (!subject) {
    throw new AppError('Subject not found.', 404, ERROR_CODES.NOT_FOUND);
  }
  return subject;
};

const updateSubject = async (id, updateData) => {
  const subject = await Subject.findById(id);
  if (!subject) {
    throw new AppError('Subject not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  const branchId = updateData.branchId || subject.branchId;
  const semester = updateData.semester !== undefined ? updateData.semester : subject.semester;
  const code = updateData.code ? updateData.code.toUpperCase() : subject.code;

  // Verify department reference if changing
  if (updateData.departmentId && updateData.departmentId !== subject.departmentId.toString()) {
    const parentDept = await Department.findById(updateData.departmentId);
    if (!parentDept) {
      throw new AppError('Department reference not found.', 404, ERROR_CODES.NOT_FOUND);
    }
  }

  // Verify branch reference and semester limits if changing
  if (updateData.branchId || updateData.semester !== undefined) {
    await assertSubjectSemestersValid(branchId, semester);
  }

  // Check duplicate compound unique constraint
  if (updateData.code || updateData.branchId) {
    const duplicate = await Subject.findOne({
      _id: { $ne: id },
      branchId,
      code,
    });
    if (duplicate) {
      throw new AppError('Subject code already registered under this branch.', 400, ERROR_CODES.DUPLICATE_ENTRY);
    }
  }

  Object.assign(subject, updateData);
  await subject.save();
  logger.info(`[Subject Updated] ID: ${id}`);
  return subject;
};

const deleteSubject = async (id) => {
  const subject = await Subject.findByIdAndDelete(id);
  if (!subject) {
    throw new AppError('Subject not found.', 404, ERROR_CODES.NOT_FOUND);
  }
  logger.info(`[Subject Deleted] ID: ${id}`);
  return subject;
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
