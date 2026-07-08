const express = require('express');
const approvalController = require('../controllers/approvalController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const ROLES = require('../constants/roles');

const router = express.Router();

const adminGuard = [
  authMiddleware,
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN),
];

router.get('/', adminGuard, asyncHandler(approvalController.getApprovals));
router.patch('/:id', adminGuard, asyncHandler(approvalController.updateApprovalStatus));

module.exports = router;
