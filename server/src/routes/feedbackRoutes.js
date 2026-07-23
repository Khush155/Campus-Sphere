const express = require('express');
const feedbackController = require('../controllers/feedbackController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validate');
const { createFeedbackSchema } = require('../validators/feedbackValidator');
const ROLES = require('../constants/roles');

const router = express.Router();
router.use(authMiddleware);

router.get('/analytics', roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD), feedbackController.getFeedbackAnalytics);

router.route('/')
  .get(feedbackController.getAllFeedback)
  .post(
    roleMiddleware(ROLES.FACULTY, ROLES.STUDENT),
    validate(createFeedbackSchema),
    feedbackController.createFeedback
  );

module.exports = router;
