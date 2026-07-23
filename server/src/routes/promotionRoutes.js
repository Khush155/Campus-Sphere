const express = require('express');
const promotionController = require('../controllers/promotionController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validate');
const { promotionSchema } = require('../validators/promotionValidator');
const ROLES = require('../constants/roles');

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware(ROLES.SUPER_ADMIN));

router.post('/preview', validate(promotionSchema), promotionController.previewPromotion);
router.post('/execute', validate(promotionSchema), promotionController.executePromotion);

module.exports = router;
