const express = require('express');
const router = express.Router();
const facultyAssignmentController = require('../controllers/facultyAssignmentController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const ROLES = require('../constants/roles');

router.use(authMiddleware);

router
  .route('/')
  .get(facultyAssignmentController.getAssignments)
  .post(
    roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.FACULTY),
    facultyAssignmentController.createAssignment
  );

router
  .route('/:id')
  .put(
    roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.FACULTY),
    facultyAssignmentController.updateAssignment
  )
  .delete(
    roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.FACULTY),
    facultyAssignmentController.deleteAssignment
  );

router.patch(
  '/:id/status',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.FACULTY),
  facultyAssignmentController.updateAssignmentStatus
);

module.exports = router;
