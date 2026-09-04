const express = require('express');
const feeController = require('../controllers/feeController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const ROLES = require('../constants/roles');

const router = express.Router();
router.use(authMiddleware);

router.get('/receipts', roleMiddleware(ROLES.STUDENT, ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.HOD), feeController.getStudentReceipts);
router.get('/receipts/:receiptId', roleMiddleware(ROLES.STUDENT, ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.HOD), feeController.getReceiptById);
router.post('/pay', roleMiddleware(ROLES.STUDENT), feeController.payStudentFee);
router.post('/generate', roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN), feeController.generateBulkFees);

module.exports = router;
