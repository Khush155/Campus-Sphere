const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const ROLES = require('../constants/roles');

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.use(authMiddleware);

router
  .route('/')
  .get(materialController.getMaterials)
  .post(
    roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.HOD, ROLES.FACULTY),
    upload.single('file'),
    materialController.createMaterial
  );

router.delete(
  '/:id',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.HOD, ROLES.FACULTY),
  materialController.deleteMaterial
);

module.exports = router;
