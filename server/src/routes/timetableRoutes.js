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
  .get(roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT), timetableController.getSlotsForBatch)
  .post(
    roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.HOD),
    validate(createSlotSchema),
    timetableController.createSlot
  );

router.post(
  '/auto-generate',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.HOD),
  validate(autoGenerateTimetableSchema),
  timetableController.autoGenerateTimetable
);

router.delete(
  '/:id',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.HOD),
  timetableController.deleteSlot
);

module.exports = router;
