const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const studentController = require('../controllers/studentController');

// All routes require authentication and STUDENT role
router.use(protect);
router.use(restrictTo('STUDENT'));

router.get('/dashboard/summary', studentController.getDashboardSummary);

module.exports = router;
