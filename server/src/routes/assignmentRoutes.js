const express = require('express');
const assignmentController = require('../controllers/assignmentController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const ROLES = require('../constants/roles');

const router = express.Router();

// All assignment routes are restricted to HODs
// All assignment routes are restricted to HODs
router.use(authMiddleware);
router.use(roleMiddleware(ROLES.HOD));

router
  .route('/')
  .get(assignmentController.getAssignments)
  .post(assignmentController.createAssignment);

router.post('/:id/revoke', assignmentController.revokeAssignment);

module.exports = router;
