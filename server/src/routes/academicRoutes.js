const express = require('express');
const academicController = require('../controllers/academicController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const ROLES = require('../constants/roles');

const router = express.Router();

// Admin access guard (Super Admin & College Admin)
const adminGuard = [
  authMiddleware,
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN),
];

router.get('/courses', adminGuard, asyncHandler(academicController.getCourses));
router.post('/courses', adminGuard, asyncHandler(academicController.createCourse));

router.get('/subjects', adminGuard, asyncHandler(academicController.getSubjects));
router.post('/subjects', adminGuard, asyncHandler(academicController.createSubject));

module.exports = router;
