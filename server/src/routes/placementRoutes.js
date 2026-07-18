const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const placementController = require('../controllers/placementController');

router.use(authMiddleware);
router.use(roleMiddleware('STUDENT'));

router.get('/', placementController.getPlacements);
router.post('/apply/:id', placementController.applyForDrive);

module.exports = router;
