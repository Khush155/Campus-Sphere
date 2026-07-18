const express = require('express');
const complaintController = require('../controllers/complaintController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const ROLES = require('../constants/roles');

const router = express.Router();

router.use(authMiddleware);

router.post('/', roleMiddleware(ROLES.STUDENT, ROLES.FACULTY, ROLES.HOD), asyncHandler(complaintController.createComplaint));
router.get('/', roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD), asyncHandler(complaintController.getComplaints));
router.patch('/:id/status', roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD), asyncHandler(complaintController.updateComplaintStatus));

module.exports = router;
