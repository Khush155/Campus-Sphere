const express = require('express');
const placementController = require('../controllers/placementController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validate');
const { createPlacementDriveSchema } = require('../validators/placementValidator');
const ROLES = require('../constants/roles');

const router = express.Router();
router.use(authMiddleware);

router.post(
  '/drives',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD),
  validate(createPlacementDriveSchema),
  placementController.createDrive
);

router.get(
  '/drives',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD, ROLES.STUDENT),
  placementController.getDrives
);

router.post(
  '/drives/:driveId/apply',
  roleMiddleware(ROLES.STUDENT),
  placementController.applyForDrive
);

router.patch(
  '/applications/:appId/round',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD),
  placementController.updateApplicationRound
);

router.patch(
  '/applications/:appId/finalize',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD),
  placementController.finalizeApplication
);

router.get(
  '/applications',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD),
  placementController.getApplications
);

router.patch(
  '/applications/:appId/noc',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD),
  placementController.issueNoc
);

module.exports = router;
