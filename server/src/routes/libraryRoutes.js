const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const libraryController = require('../controllers/libraryController');

router.use(authMiddleware);
router.use(roleMiddleware('STUDENT'));

router.get('/', libraryController.getLibraryData);

module.exports = router;
