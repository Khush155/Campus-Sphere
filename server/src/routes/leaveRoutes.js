const express = require('express');
const leaveController = require('../controllers/leaveController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validate');
const { createLeaveRequestSchema } = require('../validators/leaveValidator');
const ROLES = require('../constants/roles');

const router = express.Router();

router.use(authMiddleware);

router.post(
  '/',
  roleMiddleware(ROLES.FACULTY, ROLES.STUDENT, ROLES.HOD),
  validate(createLeaveRequestSchema),
  leaveController.createLeaveRequest
);

router.get(
  '/',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT),
  leaveController.getLeaveRequests
);

router.patch(
  '/:id/status',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD),
  leaveController.updateLeaveStatus
);

module.exports = router;
