const express = require('express');
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const ROLES = require('../constants/roles');

const router = express.Router();

router.use(authMiddleware);

// HOD specific reports
router.get(
  '/hod',
  roleMiddleware(ROLES.HOD),
  asyncHandler(reportController.getHodMetrics)
);

module.exports = router;
