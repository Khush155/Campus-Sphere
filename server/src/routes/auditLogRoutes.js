const express = require('express');
const auditLogController = require('../controllers/auditLogController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const ROLES = require('../constants/roles');

const router = express.Router();

// Guard route for Admin access (SUPER_ADMIN and COLLEGE_ADMIN)
const adminGuard = [
  authMiddleware,
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN),
];

router.get('/', adminGuard, asyncHandler(auditLogController.getAuditLogs));
router.get('/actions', adminGuard, asyncHandler(auditLogController.getDistinctActions));
router.get('/targets', adminGuard, asyncHandler(auditLogController.getDistinctTargetModels));

module.exports = router;
