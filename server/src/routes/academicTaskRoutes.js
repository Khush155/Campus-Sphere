const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const academicTaskController = require('../controllers/academicTaskController');

router.use(authMiddleware);
router.use(roleMiddleware('STUDENT'));

router.get('/', academicTaskController.getMyAssignments);
router.post('/:id/submit', academicTaskController.submitAssignment);

module.exports = router;
