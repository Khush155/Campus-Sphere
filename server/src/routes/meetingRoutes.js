const express = require('express');
const meetingController = require('../controllers/meetingController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validate');
const { createMeetingSchema } = require('../validators/meetingValidator');
const ROLES = require('../constants/roles');

const router = express.Router();
router.use(authMiddleware);

router.post(
  '/',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD),
  validate(createMeetingSchema),
  meetingController.createMeeting
);

router.get(
  '/',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT),
  meetingController.getMeetings
);

router.patch(
  '/:id/minutes',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD),
  meetingController.addMinutes
);

router.patch(
  '/:id/rsvp',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT),
  meetingController.updateRSVP
);

router.post(
  '/:id/action-items',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD),
  meetingController.addActionItem
);

router.patch(
  '/:id/status',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD),
  meetingController.updateMeetingStatus
);

module.exports = router;
