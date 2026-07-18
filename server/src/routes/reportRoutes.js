const express = require('express');
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const ROLES = require('../constants/roles');

const router = express.Router();

// Enforce auth
router.use(authMiddleware);

// HOD Overview metrics
router.get('/hod', roleMiddleware(ROLES.HOD, ROLES.COLLEGE_ADMIN, ROLES.SUPER_ADMIN), asyncHandler(reportController.getHodReports));

// Enforce SUPER_ADMIN roles for remaining reports endpoints
router.use(roleMiddleware(ROLES.SUPER_ADMIN));

// Retrieve available types
router.get('/types', asyncHandler(reportController.getReportTypes));

// Generate and stream report attachment
router.post('/generate', asyncHandler(reportController.generateReport));

module.exports = router;
