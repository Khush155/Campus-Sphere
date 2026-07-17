const express = require('express');
const timetableController = require('../controllers/timetableController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const ROLES = require('../constants/roles');

const router = express.Router();

router.use(authMiddleware);

router
  .route('/')
  .get(roleMiddleware(ROLES.HOD, ROLES.FACULTY), asyncHandler(timetableController.getSlotsForBatch))
  .post(roleMiddleware(ROLES.HOD), asyncHandler(timetableController.createSlot));

router.post('/auto-generate', roleMiddleware(ROLES.HOD), asyncHandler(timetableController.autoGenerateTimetable));

router.delete('/:id', roleMiddleware(ROLES.HOD), asyncHandler(timetableController.deleteSlot));

module.exports = router;
