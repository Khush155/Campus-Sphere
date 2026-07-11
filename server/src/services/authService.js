const crypto = require('crypto');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { checkHodConflict } = require('./userService');

const MAX_CONCURRENT_SESSIONS = 5;

/**
 * Register a new user in the system.
 * Typically invoked by SUPER_ADMIN or COLLEGE_ADMIN.
 */
const registerUser = async (userData) => {
  const { name, email, password, role, departmentId, courseId, branchId, semester, shift } = userData;

  // 1. Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Email address is already in use.', 400, ERROR_CODES.DUPLICATE_ENTRY);
  }

  // Check HOD conflict if role is HOD
  if (role === 'HOD') {
    if (!departmentId) {
      throw new AppError('An HOD must be assigned to a department.', 400, ERROR_CODES.VALIDATION_ERROR);
    }
    if (!shift) {
      throw new AppError('An HOD must be assigned a shift scope.', 400, ERROR_CODES.VALIDATION_ERROR);
    }
    await checkHodConflict(departmentId, shift);
  }

  // 2. Create the user
  const newUser = await User.create({
    name,
    email,
    password,
    role,
    departmentId: departmentId || null,
    courseId: courseId || null,
    branchId: branchId || null,
    semester: role === 'STUDENT' ? (semester || 1) : null,
    shift: role === 'HOD' ? shift : null,
  });

  logger.info(`[User Registered] ID: ${newUser._id} - Role: ${newUser.role} - Created By Admin`);

  return {
    id: newUser._id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    departmentId: newUser.departmentId,
    courseId: newUser.courseId,
    branchId: newUser.branchId,
    semester: newUser.semester,
    shift: newUser.shift,
    status: newUser.status,
  };
};

/**
 * Log in a user by verifying email and password.
 * Generates and returns access & refresh tokens.
 */
const loginUser = async (email, password) => {
  // 1. Find user and explicitly select password field
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new AppError('Invalid email or password.', 401, ERROR_CODES.UNAUTHORIZED);
  }

  // 2. Check if user account is deactivated
  if (user.status === 'INACTIVE') {
    throw new AppError('Your account has been deactivated. Please contact administration.', 403, ERROR_CODES.FORBIDDEN);
  }

  // 3. Verify password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password.', 401, ERROR_CODES.UNAUTHORIZED);
  }

  // 4. Generate tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // Update last login timestamp
  user.lastLoginAt = new Date();

  // 5. Manage active sessions list (FIFO eviction if count exceeds limit)
  if (user.refreshTokens.length >= MAX_CONCURRENT_SESSIONS) {
    user.refreshTokens.shift(); // Evict the oldest session
  }
  user.refreshTokens.push(refreshToken);
  await user.save();

  logger.info(`[User Logged In] ID: ${user._id} - Sessions: ${user.refreshTokens.length}`);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
    },
  };
};

/**
 * Logs out a user by removing their active refresh token session.
 */
const logoutUser = async (userId, tokenToClear) => {
  const user = await User.findById(userId);
  if (user) {
    user.refreshTokens = user.refreshTokens.filter((token) => token !== tokenToClear);
    await user.save();
    logger.info(`[User Logged Out] ID: ${userId} - Remaining Sessions: ${user.refreshTokens.length}`);
  }
};

/**
 * Refreshes an expired access token using a valid, rotated refresh token.
 * Detects and prevents token replay attacks.
 */
const refreshAccessToken = async (providedRefreshToken) => {
  let decoded;
  try {
    decoded = jwt.verify(providedRefreshToken, env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new AppError('Invalid or expired refresh token.', 401, ERROR_CODES.INVALID_TOKEN);
  }

  const user = await User.findById(decoded.id);
  if (!user || user.status === 'INACTIVE') {
    throw new AppError('User session no longer valid.', 401, ERROR_CODES.UNAUTHORIZED);
  }

  // Detection: Check if the provided token exists in active list
  const tokenIndex = user.refreshTokens.indexOf(providedRefreshToken);

  // Replay Attack Detection: Token is verified but NOT in the database, meaning it was already rotated/reused
  if (tokenIndex === -1) {
    // SECURITY ACTION: Immediately invalidate all active sessions for this user
    user.refreshTokens = [];
    await user.save();
    logger.error(`🚨 [TOKEN REPLAY ATTACK DETECTED] User: ${user._id}. All sessions revoked!`);
    throw new AppError('Compromised session. Please sign in again.', 401, ERROR_CODES.INVALID_TOKEN);
  }

  // Remove the used refresh token from the active list
  user.refreshTokens.splice(tokenIndex, 1);

  // Generate new Access and Refresh tokens (Rotation)
  const newAccessToken = user.generateAccessToken();
  const newRefreshToken = user.generateRefreshToken();

  // Push new refresh token into active sessions list
  user.refreshTokens.push(newRefreshToken);
  await user.save();

  logger.info(`[Token Rotated] User ID: ${user._id}`);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

/**
 * Initiates forgot password flow: generates, hashes, and stores single-use reset token.
 * Prevents account enumeration by returning dummy success indicator if email doesn't exist.
 */
const generateForgotPasswordToken = async (email) => {
  const user = await User.findOne({ email });
  if (!user || user.status === 'INACTIVE') {
    logger.warn(`[Forgot Password request] Email ${email} not found or inactive. Enforcing dummy success response.`);
    return null; // Return null so controller can act normally to avoid email scanning
  }

  // 1. Generate cryptographically secure random token
  const rawToken = crypto.randomBytes(32).toString('hex');

  // 2. Hash token and save to database with 15-minute expiration
  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');
  user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 mins from now

  await user.save();
  logger.info(`[Password Reset Generated] User: ${user._id} - Expiry: 15 mins`);

  return rawToken;
};

/**
 * Completes forgot password flow by validating hashed token and setting new password.
 */
const resetPassword = async (rawToken, newPassword) => {
  // 1. Hash the incoming raw token to match database SHA-256 format
  const hashedToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  // 2. Find user with matching token and valid expiration date
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select('+password');

  if (!user) {
    throw new AppError('The password reset link is invalid or has expired.', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  // 3. Set the new password, clear reset token details
  user.password = newPassword; // Pre-save hook will hash it automatically
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  logger.info(`[Password Reset Completed] User: ${user._id}`);
};

/**
 * Resolves the role profile of a user by email/identifier.
 * Fails silently for non-existent users (returns null).
 */
const detectUserRole = async (identifier) => {
  if (!identifier) {
    return null;
  }
  const normalized = identifier.trim().toLowerCase();
  const user = await User.findOne({ email: normalized });
  return user ? user.role : null;
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  generateForgotPasswordToken,
  resetPassword,
  detectUserRole,
};
