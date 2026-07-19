const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

router
  .route('/')
  .get(materialController.getMaterials)
  .post(roleMiddleware('FACULTY', 'ADMIN'), materialController.createMaterial);

router.delete('/:id', roleMiddleware('FACULTY', 'ADMIN'), materialController.deleteMaterial);

module.exports = router;
