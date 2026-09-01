const express = require('express');
const complaintController = require('../controllers/complaintController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validate');
const { createComplaintSchema } = require('../validators/complaintValidator');
const ROLES = require('../constants/roles');

const router = express.Router();

router.use(authMiddleware);

router.post(
  '/',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT),
  validate(createComplaintSchema),
  complaintController.createComplaint
);

router.get(
  '/',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT),
  complaintController.getComplaints
);

router.patch(
  '/:id/status',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.HOD),
  complaintController.updateComplaintStatus
);

module.exports = router;
