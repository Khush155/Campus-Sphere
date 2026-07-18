const fs = require('fs');
const path = require('path');
const collegeProfileService = require('../services/collegeProfileService');
const { collegeProfileUpdateSchema } = require('../validators/collegeProfileValidator');
const { successResponse } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const logger = require('../utils/logger');

/**
 * Helper to delete a logo file from disk safely.
 */
const deleteLogoFile = (logoUrl) => {
  if (!logoUrl) {
    return;
  }
  try {
    // logoUrl is e.g. "/uploads/college/logo-123456.png"
    const relativePath = logoUrl.replace(/^\//, ''); // remove leading slash
    const fullPath = path.resolve(__dirname, '../', relativePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (err) {
    // Log filesystem deletion failures but don't block request
    logger.error(`Failed to delete logo file: ${err.message}`);
  }
};

/**
 * Controller to fetch the singleton College Profile.
 */
const getProfile = async (req, res, _next) => {
  const profile = await collegeProfileService.getProfile();
  return successResponse(res, 200, 'College profile retrieved successfully.', profile);
};

/**
 * Controller to update the text fields of the College Profile.
 */
const updateProfile = async (req, res, _next) => {
  const validatedData = collegeProfileUpdateSchema.parse(req.body);
  const meta = { ipAddress: req.ip || req.headers['x-forwarded-for'], userAgent: req.headers['user-agent'] };
  const profile = await collegeProfileService.updateProfile(validatedData, req.user.id, meta);
  return successResponse(res, 200, 'College profile updated successfully.', profile);
};

/**
 * Controller to upload and replace the college logo.
 */
const uploadLogo = async (req, res, _next) => {
  if (!req.file) {
    throw new AppError('No logo image file provided.', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const profile = await collegeProfileService.getProfile();

  // 1. Delete old logo file from disk if exists (delayed in non-test env to prevent UI race conditions)
  if (profile.logoUrl) {
    if (process.env.NODE_ENV === 'test') {
      deleteLogoFile(profile.logoUrl);
    } else {
      setTimeout(() => {
        deleteLogoFile(profile.logoUrl);
      }, 5000);
    }
  }

  // 2. Save the new logo path (relative URL format: /uploads/college/filename)
  const folder = process.env.NODE_ENV === 'test' ? 'college-test' : 'college';
  const relativeLogoUrl = `/uploads/${folder}/${req.file.filename}`;
  const updatedProfile = await collegeProfileService.updateProfile(
    { logoUrl: relativeLogoUrl },
    req.user.id
  );

  return successResponse(res, 200, 'College logo uploaded successfully.', updatedProfile);
};

module.exports = {
  getProfile,
  updateProfile,
  uploadLogo,
};
