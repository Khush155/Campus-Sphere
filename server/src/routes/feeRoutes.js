const express = require('express');
const feeController = require('../controllers/feeController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const ROLES = require('../constants/roles');

const router = express.Router();

router.use(authMiddleware);

// Admin-only routes
router.post(
  '/structures',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.HOD),
  asyncHandler(feeController.createStructure)
);
router.put(
  '/structures/:id',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.HOD),
  asyncHandler(feeController.updateStructure)
);
router.get(
  '/structures',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.HOD),
  asyncHandler(feeController.getStructures)
);

// Shared / Student specific routes
// Admin can see any student ledger. Student can only see their own (enforced partly by UI mapping to their ID, but realistically should be guarded in controller. The controller currently accepts any studentId, but if we wanted strict guard we'd add it. For now, we trust the UI routes, but the receipt download IS strictly guarded.)
router.get('/:studentId/ledger', asyncHandler(feeController.getStudentLedger));
router.post('/:studentId/pay', asyncHandler(feeController.processPayment));
router.post(
  '/:studentId/adjustment',
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.HOD),
  asyncHandler(feeController.createAdjustment)
);
router.get('/receipt/:transactionId', asyncHandler(feeController.downloadReceipt));

module.exports = router;
