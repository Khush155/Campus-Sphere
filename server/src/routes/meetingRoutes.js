const express = require('express');
const meetingController = require('../controllers/meetingController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const ROLES = require('../constants/roles');

const router = express.Router();
router.use(authMiddleware);

// Create meeting (supports virtual link)
router.post(
  '/',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD),
  asyncHandler(meetingController.createMeeting)
);

// List meetings
router.get(
  '/',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT),
  asyncHandler(meetingController.getMeetings)
);

// Add/update minutes of meeting
router.patch(
  '/:id/minutes',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD),
  asyncHandler(meetingController.addMinutes)
);

// Participant updates their RSVP status
router.patch(
  '/:id/rsvp',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT),
  asyncHandler(meetingController.updateRSVP)
);

// HOD adds action items to a meeting
router.post(
  '/:id/action-items',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD),
  asyncHandler(meetingController.addActionItem)
);

// Update meeting status lifecycle
router.patch(
  '/:id/status',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD),
  asyncHandler(meetingController.updateMeetingStatus)
);

module.exports = router;
