const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const complaintController = require('../controllers/complaintController');

router.use(authMiddleware);
router.use(roleMiddleware('STUDENT'));

router.get('/', complaintController.getMyComplaints);
router.post('/', complaintController.raiseComplaint);

module.exports = router;
