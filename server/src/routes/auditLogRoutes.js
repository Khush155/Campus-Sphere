const express = require('express');
const auditLogController = require('../controllers/auditLogController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const ROLES = require('../constants/roles');

const router = express.Router();

// Guard route for SUPER_ADMIN only
const superAdminGuard = [authMiddleware, roleMiddleware(ROLES.SUPER_ADMIN)];

router.get('/', superAdminGuard, asyncHandler(auditLogController.getAuditLogs));
router.get('/actions', superAdminGuard, asyncHandler(auditLogController.getDistinctActions));

module.exports = router;
