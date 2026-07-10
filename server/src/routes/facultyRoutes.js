const express = require('express');
const router = express.Router();

// Import controllers
const facultyController = require('../controllers/facultyController');

// Import authentication and authorization middlewares
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Import validation middleware and schemas
const validate = require('../middlewares/validate');
const { createFacultySchema, updateFacultySchema } = require('../validations/facultyValidation');

// 1. Apply authentication globally to all faculty routes
// Anyone accessing these endpoints must be logged in.
router.use(authMiddleware);

// 2. Define routes
router
  .route('/')
  .get(facultyController.getAllFaculty) // Get all profiles (e.g., for a student or faculty directory)
  .post(
    roleMiddleware('ADMIN'), // Only admins can create new faculty profiles
    validate(createFacultySchema), // Validate input before running controller
    facultyController.createFaculty
  );

router
  .route('/:id')
  .get(facultyController.getFacultyById) // Get single faculty profile details
  .patch(
    roleMiddleware('ADMIN'), // Only admins can update faculty details
    validate(updateFacultySchema), // Validate update inputs
    facultyController.updateFaculty
  )
  .delete(
    roleMiddleware('ADMIN'), // Only admins can delete faculty profiles
    facultyController.deleteFaculty
  );

// Subject-to-Faculty assignments specifically
router.put(
  '/:id/subjects',
  roleMiddleware('ADMIN'), // Only admins can change subjects assignments
  facultyController.assignSubjects
);

module.exports = router;
