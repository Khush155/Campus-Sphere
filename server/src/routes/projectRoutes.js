const express = require('express');
const projectController = require('../controllers/projectController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const ROLES = require('../constants/roles');

const router = express.Router();

router.use(authMiddleware);

router.post('/', roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD, ROLES.FACULTY), asyncHandler(projectController.createProject));
router.get('/', roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT), asyncHandler(projectController.getProjects));
router.patch('/:id/status', roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD), asyncHandler(projectController.updateProjectStatus));

module.exports = router;
