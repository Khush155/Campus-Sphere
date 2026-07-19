const express = require('express');
const opportunityController = require('../controllers/opportunityController');
const authMiddleware = require('../middlewares/authMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');

const router = express.Router();

router.use(authMiddleware);

router.get('/', asyncHandler(opportunityController.getExternalOpportunities));

module.exports = router;
