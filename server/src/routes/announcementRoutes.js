const express = require('express');
const announcementController = require('../controllers/announcementController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const ROLES = require('../constants/roles');

const router = express.Router();

const creatorGuard = [
  authMiddleware,
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.HOD),
];

router.get('/', authMiddleware, asyncHandler(announcementController.getAnnouncements));
router.post('/', creatorGuard, asyncHandler(announcementController.createAnnouncement));

module.exports = router;
