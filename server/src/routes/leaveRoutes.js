const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const leaveController = require('../controllers/leaveController');

router.use(authMiddleware);
router.use(roleMiddleware('STUDENT'));

router.get('/', leaveController.getMyLeaves);
router.post('/', leaveController.applyForLeave);

module.exports = router;
