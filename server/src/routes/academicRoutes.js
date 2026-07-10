const express = require('express');
const router = express.Router();
const academicController = require('../controllers/academicController');
const authMiddleware = require('../middlewares/authMiddleware');

// Require authentication for all academic routes
router.use(authMiddleware);

router.get('/departments', academicController.getAllDepartments);
router.get('/subjects', academicController.getAllSubjects);

module.exports = router;
