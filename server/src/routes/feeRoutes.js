const express = require('express');
const feeController = require('../controllers/feeController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const ROLES = require('../constants/roles');

const router = express.Router();

// Super Admin access guard
const superAdminGuard = [
  authMiddleware,
  roleMiddleware(ROLES.SUPER_ADMIN),
];

/**
 * @openapi
 * /api/v1/fees/structures:
 *   get:
 *     summary: List all fee structures (filterable)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: courseId
 *         schema: { type: string }
 *       - in: query
 *         name: semester
 *         schema: { type: integer }
 *       - in: query
 *         name: academicYear
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of fee structures.
 */
router.get('/structures', superAdminGuard, asyncHandler(feeController.getFeeStructures));

/**
 * @openapi
 * /api/v1/fees/structures:
 *   post:
 *     summary: Create a new fee structure
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Fee structure created.
 */
router.post('/structures', superAdminGuard, asyncHandler(feeController.createFeeStructure));

/**
 * @openapi
 * /api/v1/fees/student/{studentId}:
 *   get:
 *     summary: Get all fee payments for a student
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student payment history.
 */
router.get('/student/:studentId', superAdminGuard, asyncHandler(feeController.getStudentFees));

/**
 * @openapi
 * /api/v1/fees/payments:
 *   post:
 *     summary: Record a new fee payment (idempotent)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Payment recorded.
 *       409:
 *         description: Duplicate transactionReference rejected.
 */
router.post('/payments', superAdminGuard, asyncHandler(feeController.recordPayment));

/**
 * @openapi
 * /api/v1/fees/payments/{paymentId}/receipt:
 *   get:
 *     summary: Download PDF receipt for a payment
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: PDF file stream.
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/payments/:paymentId/receipt', superAdminGuard, asyncHandler(feeController.downloadReceipt));

module.exports = router;
