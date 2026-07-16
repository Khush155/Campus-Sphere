const express = require('express');
const noticeController = require('../controllers/noticeController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const ROLES = require('../constants/roles');

const router = express.Router();
router.use(authMiddleware);

// Create notice with audience targeting
router.post(
  '/',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD),
  asyncHandler(noticeController.createNotice)
);

// List active, non-expired notices sorted by priority
router.get(
  '/',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT),
  asyncHandler(noticeController.getNotices)
);

// Delete own notice
router.delete(
  '/:id',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD),
  asyncHandler(noticeController.deleteNotice)
);

module.exports = router;
