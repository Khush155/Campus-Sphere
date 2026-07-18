const express = require('express');
const requestController = require('../controllers/requestController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const ROLES = require('../constants/roles');

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware(ROLES.HOD));

router.post('/', asyncHandler(requestController.createRequest));
router.get('/sent', asyncHandler(requestController.getSentRequests));
router.get('/received', asyncHandler(requestController.getReceivedRequests));
router.post('/:id/respond', asyncHandler(requestController.respondToRequest));
router.post('/:id/finalize', asyncHandler(requestController.finalizeRequest));

module.exports = router;
