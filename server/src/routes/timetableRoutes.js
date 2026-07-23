const express = require('express');
const timetableController = require('../controllers/timetableController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validate');
const { createSlotSchema, autoGenerateTimetableSchema } = require('../validators/timetableValidator');
const ROLES = require('../constants/roles');

const router = express.Router();

router.use(authMiddleware);

router
  .route('/')
  .get(roleMiddleware(ROLES.HOD, ROLES.FACULTY), timetableController.getSlotsForBatch)
  .post(
    roleMiddleware(ROLES.HOD),
    validate(createSlotSchema),
    timetableController.createSlot
  );

router.post(
  '/auto-generate',
  roleMiddleware(ROLES.HOD),
  validate(autoGenerateTimetableSchema),
  timetableController.autoGenerateTimetable
);

router.delete(
  '/:id',
  roleMiddleware(ROLES.HOD),
  timetableController.deleteSlot
);

module.exports = router;
