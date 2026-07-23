const express = require('express');
const documentController = require('../controllers/documentController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validate');
const { createDocumentRequestSchema } = require('../validators/documentValidator');
const ROLES = require('../constants/roles');

const router = express.Router();

router.use(authMiddleware);

router.post(
  '/',
  roleMiddleware(ROLES.STUDENT),
  validate(createDocumentRequestSchema),
  documentController.createDocumentRequest
);

router.get(
  '/',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD, ROLES.STUDENT),
  documentController.getDocumentRequests
);

router.patch(
  '/:id/status',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD),
  documentController.updateDocumentStatus
);

module.exports = router;
