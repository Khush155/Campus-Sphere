const express = require('express');
const documentController = require('../controllers/documentController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const ROLES = require('../constants/roles');

const router = express.Router();

router.use(authMiddleware);

router.post('/', roleMiddleware(ROLES.STUDENT), asyncHandler(documentController.createDocumentRequest));
router.get('/', roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD, ROLES.STUDENT), asyncHandler(documentController.getDocumentRequests));
router.patch('/:id/status', roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD), asyncHandler(documentController.updateDocumentStatus));

module.exports = router;
