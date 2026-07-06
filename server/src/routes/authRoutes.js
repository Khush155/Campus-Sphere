const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { authLimiter } = require('../middlewares/rateLimiter');
const asyncHandler = require('../middlewares/asyncHandler');
const ROLES = require('../constants/roles');

const router = express.Router();

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     summary: Log in user
 *     description: Authenticates user credentials and returns JWT access token. Sets HttpOnly refresh token cookie.
 *     responses:
 *       200:
 *         description: Login successful.
 */
router.post('/login', authLimiter, asyncHandler(authController.login));

/**
 * @openapi
 * /api/v1/auth/detect-role/{identifier}:
 *   get:
 *     summary: Resolve user role dynamically
 *     description: Returns the user's role if the account is registered, or null if not. Failing silently.
 *     parameters:
 *       - in: path
 *         name: identifier
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role resolved.
 */
router.get('/detect-role/:identifier', asyncHandler(authController.detectRole));

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user account
 *     description: Accessible only by SUPER_ADMIN or COLLEGE_ADMIN.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: User registered successfully.
 */
router.post(
  '/register',
  authMiddleware,
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN),
  asyncHandler(authController.register)
);

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     summary: Log out current user session
 *     description: Invalidates the current refresh token and clears HTTP cookies.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful.
 */
router.post('/logout', authMiddleware, asyncHandler(authController.logout));

/**
 * @openapi
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Rotates current refresh token cookie and returns a new access token.
 *     responses:
 *       200:
 *         description: Token refreshed.
 */
router.post('/refresh', asyncHandler(authController.refresh));

/**
 * @openapi
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Request password reset link
 *     description: Generates a single-use token and sends/logs reset link.
 *     responses:
 *       200:
 *         description: Link generated.
 */
router.post('/forgot-password', authLimiter, asyncHandler(authController.forgotPassword));

/**
 * @openapi
 * /api/v1/auth/reset-password/{token}:
 *   post:
 *     summary: Set new password
 *     description: Reset password using the hashed token link.
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Password updated.
 */
router.post('/reset-password/:token', authLimiter, asyncHandler(authController.resetPassword));

module.exports = router;
