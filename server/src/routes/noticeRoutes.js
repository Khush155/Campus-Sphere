const express = require('express');
const noticeController = require('../controllers/noticeController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const ROLES = require('../constants/roles');

const router = express.Router();

// Route-based guards for administration
const adminGuard = [
  authMiddleware,
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.HOD, ROLES.FACULTY),
];

const authGuard = [authMiddleware];

// Notice Feed (Any authenticated role)
router.get('/feed', authGuard, asyncHandler(noticeController.getFeed));

// Admin CRUD operations
router.post('/', adminGuard, asyncHandler(noticeController.createNotice));
router.get('/', adminGuard, asyncHandler(noticeController.getNotices));
router.get('/:id', adminGuard, asyncHandler(noticeController.getNoticeById));
router.put('/:id', adminGuard, asyncHandler(noticeController.updateNotice));
router.delete('/:id', adminGuard, asyncHandler(noticeController.archiveNotice));

module.exports = router;
