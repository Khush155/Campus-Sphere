const express = require('express');
const leaveController = require('../controllers/leaveController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const ROLES = require('../constants/roles');

const router = express.Router();

router.use(authMiddleware);

router.post('/', roleMiddleware(ROLES.FACULTY, ROLES.STUDENT, ROLES.HOD), asyncHandler(leaveController.createLeaveRequest));
router.get('/', roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT), asyncHandler(leaveController.getLeaveRequests));
router.patch('/:id/status', roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD), asyncHandler(leaveController.updateLeaveStatus));

module.exports = router;
