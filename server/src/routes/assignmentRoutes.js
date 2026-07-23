const express = require('express');
const assignmentController = require('../controllers/assignmentController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validate');
const { createAssignmentSchema, revokeAssignmentSchema } = require('../validators/assignmentValidator');
const ROLES = require('../constants/roles');

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware(ROLES.HOD));

router
  .route('/')
  .get(assignmentController.getAssignments)
  .post(validate(createAssignmentSchema), assignmentController.createAssignment);

router.post('/:id/revoke', validate(revokeAssignmentSchema), assignmentController.revokeAssignment);

module.exports = router;
