const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validate');
const { createFacultySchema, updateFacultySchema } = require('../validators/facultyValidator');
const ROLES = require('../constants/roles');

router.use(authMiddleware);

router
  .route('/')
  .get(facultyController.getAllFaculty)
  .post(
    roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN),
    validate(createFacultySchema),
    facultyController.createFaculty
  );

router.get('/dashboard/stats', roleMiddleware(ROLES.FACULTY), facultyController.getFacultyDashboard);
router.get('/analytics/dashboard', roleMiddleware(ROLES.FACULTY), facultyController.getFacultyAnalytics);

router
  .route('/:id')
  .get(facultyController.getFacultyById)
  .patch(
    roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN),
    validate(updateFacultySchema),
    facultyController.updateFaculty
  )
  .delete(
    roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN),
    facultyController.deleteFaculty
  );

router.put(
  '/:id/subjects',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN),
  facultyController.assignSubjects
);

module.exports = router;
