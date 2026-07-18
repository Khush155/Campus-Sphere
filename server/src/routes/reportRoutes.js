const express = require('express');
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const ROLES = require('../constants/roles');

const router = express.Router();

// Enforce auth and admin roles across all reports endpoints
router.use(authMiddleware);
router.use(roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN));

// Retrieve available types
router.get('/types', asyncHandler(reportController.getReportTypes));

// Generate and stream report attachment
router.post('/generate', asyncHandler(reportController.generateReport));

module.exports = router;
