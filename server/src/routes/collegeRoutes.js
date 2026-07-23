const express = require('express');
const collegeController = require('../controllers/collegeController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const ROLES = require('../constants/roles');

const router = express.Router();

// Role-based Access Guards
const adminGuard = [
  authMiddleware,
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN),
];
const subjectManageGuard = [
  authMiddleware,
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.HOD),
];
const authGuard = [authMiddleware];

// ==========================================
// DEPARTMENT ROUTES
// ==========================================
router.post('/departments', adminGuard, asyncHandler(collegeController.createDepartment));
router.get('/departments', authGuard, asyncHandler(collegeController.getAllDepartments));
router.get('/departments/:id', authGuard, asyncHandler(collegeController.getDepartmentById));
router.put('/departments/:id', adminGuard, asyncHandler(collegeController.updateDepartment));
router.delete('/departments/:id', adminGuard, asyncHandler(collegeController.deleteDepartment));

// ==========================================
// COURSE ROUTES
// ==========================================
router.post('/courses', adminGuard, asyncHandler(collegeController.createCourse));
router.get('/courses', authGuard, asyncHandler(collegeController.getAllCourses));
router.get('/courses/:id', authGuard, asyncHandler(collegeController.getCourseById));
router.put('/courses/:id', adminGuard, asyncHandler(collegeController.updateCourse));
router.delete('/courses/:id', adminGuard, asyncHandler(collegeController.deleteCourse));

// ==========================================
// BRANCH ROUTES
// ==========================================
router.post('/branches', adminGuard, asyncHandler(collegeController.createBranch));
router.get('/branches', authGuard, asyncHandler(collegeController.getAllBranches));
router.get('/branches/:id', authGuard, asyncHandler(collegeController.getBranchById));
router.put('/branches/:id', adminGuard, asyncHandler(collegeController.updateBranch));
router.delete('/branches/:id', adminGuard, asyncHandler(collegeController.deleteBranch));

// ==========================================
// SUBJECT ROUTES
// ==========================================
router.post('/subjects', subjectManageGuard, asyncHandler(collegeController.createSubject));
router.get('/subjects', authGuard, asyncHandler(collegeController.getAllSubjects));
router.get('/subjects/:id', authGuard, asyncHandler(collegeController.getSubjectById));
router.put('/subjects/:id', subjectManageGuard, asyncHandler(collegeController.updateSubject));
router.delete('/subjects/:id', subjectManageGuard, asyncHandler(collegeController.deleteSubject));

module.exports = router;
