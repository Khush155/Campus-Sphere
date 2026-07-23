const express = require('express');
const requestController = require('../controllers/requestController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validate');
const { createRequestSchema, respondRequestSchema, finalizeRequestSchema } = require('../validators/requestValidator');
const ROLES = require('../constants/roles');

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware(ROLES.HOD));

router.post('/', validate(createRequestSchema), requestController.createRequest);
router.get('/sent', requestController.getSentRequests);
router.get('/received', requestController.getReceivedRequests);
router.post('/:id/respond', validate(respondRequestSchema), requestController.respondToRequest);
router.post('/:id/finalize', validate(finalizeRequestSchema), requestController.finalizeRequest);

module.exports = router;
