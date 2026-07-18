const authService = require('../services/authService');
const { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } = require('../validators/authValidator');
const { successResponse } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const logger = require('../utils/logger');
const env = require('../config/env');

// Standard options for the Refresh Token cookie
const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'Lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  path: '/', // Accessible across the application
};

/**
 * Controller to register a new user (Super Admin / College Admin access only).
 */
const register = async (req, res, _next) => {
  // Validate request body against register Zod schema
  const validatedBody = registerSchema.parse(req.body);

  const registeredUser = await authService.registerUser(validatedBody, req.user.role);

  return successResponse(res, 201, 'User registered successfully.', registeredUser);
};

/**
 * Controller to authenticate user credentials and issue session tokens.
 */
const login = async (req, res, _next) => {
  // Validate request body
  const validatedBody = loginSchema.parse(req.body);

  const { accessToken, refreshToken, user } = await authService.loginUser(
    validatedBody.email,
    validatedBody.password
  );

  // Set the refresh token in HttpOnly cookie
  res.cookie('refreshToken', refreshToken, cookieOptions);

  return successResponse(res, 200, 'Authentication successful.', {
    accessToken,
    user,
  });
};

/**
 * Controller to log out user and invalidate active refresh token.
 */
const logout = async (req, res, _next) => {
  const tokenToClear = req.cookies.refreshToken;
  const userId = req.user.id; // Populated by authMiddleware

  if (tokenToClear) {
    await authService.logoutUser(userId, tokenToClear);
  }

  // Clear cookie from browser client
  res.clearCookie('refreshToken', {
    ...cookieOptions,
    maxAge: 0,
  });

  return successResponse(res, 200, 'Logout successful.');
};

/**
 * Controller to rotate access & refresh tokens.
 */
const refresh = async (req, res, next) => {
  const tokenToRefresh = req.cookies.refreshToken;

  if (!tokenToRefresh) {
    return next(new AppError('Session expired. Please log in again.', 401, ERROR_CODES.UNAUTHORIZED));
  }

  const { accessToken, refreshToken } = await authService.refreshAccessToken(tokenToRefresh);

  // Set rotated refresh token in HttpOnly cookie
  res.cookie('refreshToken', refreshToken, cookieOptions);

  return successResponse(res, 200, 'Session token refreshed successfully.', {
    accessToken,
  });
};

/**
 * Controller to initiate forgot password email flow.
 */
const forgotPassword = async (req, res, _next) => {
  const validatedBody = forgotPasswordSchema.parse(req.body);

  const rawToken = await authService.generateForgotPasswordToken(validatedBody.email);

  // Note: For developer convenience & portfolio setup, if token exists, we print reset link in server console
  let resetLink = null;
  if (rawToken) {
    resetLink = `http://localhost:5173/reset-password/${rawToken}`;
    logger.info(`📧 [PASSWORD RESET LINK SENT]: ${resetLink}`);
  }

  // Enforce same output structure regardless of email existence to prevent email scanning/enumeration
  const data = env.NODE_ENV !== 'production' && resetLink ? { resetLink } : null;

  return successResponse(
    res,
    200,
    'If the email is registered, a password reset link has been generated.',
    data
  );
};

/**
 * Controller to set new password using the validated token.
 */
const resetPassword = async (req, res, next) => {
  const { token } = req.params;
  const validatedBody = resetPasswordSchema.parse(req.body);

  if (!token) {
    return next(new AppError('Reset token is required.', 400, ERROR_CODES.VALIDATION_ERROR));
  }

  await authService.resetPassword(token, validatedBody.password);

  return successResponse(res, 200, 'Password has been reset successfully. Please log in with your new password.');
};

/**
 * Controller to resolve user system role by email/identifier.
 */
const detectRole = async (req, res, _next) => {
  const { identifier } = req.params;
  const role = await authService.detectUserRole(identifier);
  return successResponse(res, 200, 'Role detected.', { role });
};

module.exports = {
  register,
  login,
  logout,
  refresh,
  forgotPassword,
  resetPassword,
  detectRole,
};
