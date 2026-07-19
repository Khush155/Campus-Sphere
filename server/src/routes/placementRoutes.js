const express = require('express');
const placementController = require('../controllers/placementController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const ROLES = require('../constants/roles');

const router = express.Router();
router.use(authMiddleware);

// Create placement drive
router.post(
  '/drives',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD),
  asyncHandler(placementController.createDrive)
);

// List drives
router.get(
  '/drives',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD, ROLES.STUDENT),
  asyncHandler(placementController.getDrives)
);

// Apply for drive (enforces CGPA/backlog eligibility)
router.post(
  '/drives/:driveId/apply',
  roleMiddleware(ROLES.STUDENT),
  asyncHandler(placementController.applyForDrive)
);

// Update interview round result for a student
router.patch(
  '/applications/:appId/round',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD),
  asyncHandler(placementController.updateApplicationRound)
);

// Finalize application (SELECTED/WAITLISTED with offer package)
router.patch(
  '/applications/:appId/finalize',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD),
  asyncHandler(placementController.finalizeApplication)
);

// List all applications (HOD sees department's applications)
router.get(
  '/applications',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD),
  asyncHandler(placementController.getApplications)
);

// Issue NOC to a selected student
router.patch(
  '/applications/:appId/noc',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.HOD),
  asyncHandler(placementController.issueNoc)
);

module.exports = router;
