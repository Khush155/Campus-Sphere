const express = require('express');
const pdfController = require('../controllers/pdfController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const ROLES = require('../constants/roles');

const router = express.Router();

// Apply auth and role restrictions specifically to avoid intercepting other unhandled routes on /api/v1
const adminAuth = [authMiddleware, roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN)];

// MUST place bulk route before parameterized route to avoid matching "bulk" as a userId
router.get('/id-cards/bulk', adminAuth, asyncHandler(pdfController.generateBulkIdCards));
router.get('/id-cards/:userId', adminAuth, asyncHandler(pdfController.generateIdCard));

router.post('/certificates/generate', adminAuth, asyncHandler(pdfController.generateCertificate));

module.exports = router;
