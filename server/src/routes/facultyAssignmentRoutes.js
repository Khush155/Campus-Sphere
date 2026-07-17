const express = require('express');
const router = express.Router();
const facultyAssignmentController = require('../controllers/facultyAssignmentController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

router
  .route('/')
  .get(facultyAssignmentController.getAssignments)
  .post(roleMiddleware('FACULTY', 'ADMIN'), facultyAssignmentController.createAssignment);

router.delete('/:id', roleMiddleware('FACULTY', 'ADMIN'), facultyAssignmentController.deleteAssignment);

module.exports = router;
