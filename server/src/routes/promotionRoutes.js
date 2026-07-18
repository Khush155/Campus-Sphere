const express = require('express');
const promotionController = require('../controllers/promotionController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const ROLES = require('../constants/roles');

const router = express.Router();

// Enforce authentication and SUPER_ADMIN authorization on all promotion actions
router.use(authMiddleware);
router.use(roleMiddleware(ROLES.SUPER_ADMIN));

// Computed dry-run preview endpoint
router.post('/preview', asyncHandler(promotionController.previewPromotion));

// Transaction-wrapped execute endpoint
router.post('/execute', asyncHandler(promotionController.executePromotion));

module.exports = router;
