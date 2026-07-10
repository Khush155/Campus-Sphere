const express = require('express');
const timetableController = require('../controllers/timetableController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const ROLES = require('../constants/roles');

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware(ROLES.HOD));

router
  .route('/')
  .get(asyncHandler(timetableController.getSlotsForBatch))
  .post(asyncHandler(timetableController.createSlot));

router.post('/auto-generate', asyncHandler(timetableController.autoGenerateTimetable));

router.delete('/:id', asyncHandler(timetableController.deleteSlot));

module.exports = router;
