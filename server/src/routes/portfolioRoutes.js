const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const portfolioController = require('../controllers/portfolioController');

router.use(authMiddleware);
router.use(roleMiddleware('STUDENT'));

router.get('/', portfolioController.getPortfolio);
router.post('/projects', portfolioController.addProject);
router.post('/achievements', portfolioController.addAchievement);

module.exports = router;
