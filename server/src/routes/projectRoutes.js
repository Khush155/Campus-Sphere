const express = require('express');
const projectController = require('../controllers/projectController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validate');
const { createProjectSchema } = require('../validators/projectValidator');
const ROLES = require('../constants/roles');

const router = express.Router();

router.use(authMiddleware);

router.post(
  '/',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD, ROLES.FACULTY),
  validate(createProjectSchema),
  projectController.createProject
);

router.get(
  '/',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT),
  projectController.getProjects
);

router.patch(
  '/:id/status',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD),
  projectController.updateProjectStatus
);

module.exports = router;
