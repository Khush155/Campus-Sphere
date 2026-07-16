
const express = require('express');
const feedbackController = require('../controllers/feedbackController');
const protect = require('../middlewares/authMiddleware');

const router = express.Router();
router.use(protect);

router.route('/')
  .get(feedbackController.getAllFeedback)
  .post(feedbackController.createFeedback);

module.exports = router;

