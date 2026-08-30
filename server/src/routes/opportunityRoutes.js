const express = require('express');
const opportunityController = require('../controllers/opportunityController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const ROLES = require('../constants/roles');

const router = express.Router();

router.use(authMiddleware);

router.get('/', asyncHandler(opportunityController.getExternalOpportunities));

router.post(
  '/',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD),
  asyncHandler(opportunityController.createOpportunity)
);

router.delete(
  '/:id',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD),
  asyncHandler(opportunityController.deleteOpportunity)
);

module.exports = router;
