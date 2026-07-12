const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');

router.use(authMiddleware);

// All authenticated users can view events
router.get('/', asyncHandler(calendarController.getEvents));

// Only Admins can create or delete events
router.post(
  '/',
  roleMiddleware('SUPER_ADMIN', 'ADMIN'),
  asyncHandler(calendarController.createEvent)
);

router.delete(
  '/:eventId',
  roleMiddleware('SUPER_ADMIN', 'ADMIN'),
  asyncHandler(calendarController.deleteEvent)
);

module.exports = router;
