const express = require('express');
const pdfController = require('../controllers/pdfController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const ROLES = require('../constants/roles');

const router = express.Router();

// Apply auth and role restrictions specifically to avoid intercepting other unhandled routes on /api/v1
const superAdminAuth = [authMiddleware, roleMiddleware(ROLES.SUPER_ADMIN)];

// MUST place bulk route before parameterized route to avoid matching "bulk" as a userId
router.get('/id-cards/bulk', superAdminAuth, asyncHandler(pdfController.generateBulkIdCards));
router.get('/id-cards/:userId', superAdminAuth, asyncHandler(pdfController.generateIdCard));

router.post('/certificates/generate', superAdminAuth, asyncHandler(pdfController.generateCertificate));

module.exports = router;
