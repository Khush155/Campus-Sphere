const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const profileController = require('../controllers/profileController');

router.use(authMiddleware);
router.use(roleMiddleware('STUDENT'));

router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);

module.exports = router;
