const CollegeProfile = require('../models/CollegeProfile');
const { logAuditEvent } = require('../utils/auditLogger');
const logger = require('../utils/logger');

/**
 * Retrieves the singleton CollegeProfile document.
 * If none exists, creates one default record with placeholder settings.
 */
const getProfile = async () => {
  let profile = await CollegeProfile.findOne();
  if (!profile) {
    profile = await CollegeProfile.create({ name: 'My College' });
    logger.info(`[College Profile Created] Initial singleton profile created.`);
  }
  return profile;
};

/**
 * Updates the singleton CollegeProfile document and logs audit trail.
 */
const updateProfile = async (updates, actorId, meta) => {
  const before = await getProfile();
  
  const updated = await CollegeProfile.findByIdAndUpdate(
    before._id,
    updates,
    { new: true, runValidators: true }
  );

  await logAuditEvent({
    actorId,
    action: 'COLLEGE_PROFILE_UPDATED',
    targetId: updated._id,
    targetModel: 'CollegeProfile',
    before,
    after: updated,
    meta,
  });

  logger.info(`[College Profile Updated] Settings updated by Actor: ${actorId}`);
  return updated;
};

module.exports = {
  getProfile,
  updateProfile,
};
