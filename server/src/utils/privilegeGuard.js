const AppError = require('./AppError');
const ERROR_CODES = require('../constants/errorCodes');

const ADMIN_TIER_ROLES = ['SUPER_ADMIN', 'COLLEGE_ADMIN'];

/**
 * Throws if a COLLEGE_ADMIN actor is attempting to act on or assign an admin-tier role.
 * SUPER_ADMIN actors are never restricted by this check.
 */
const assertNoPrivilegeEscalation = ({ actorRole, targetCurrentRole, targetNewRole }) => {
  if (actorRole !== 'COLLEGE_ADMIN') {
    return;
  }

  if (targetCurrentRole && ADMIN_TIER_ROLES.includes(targetCurrentRole)) {
    throw new AppError(
      'College Admins cannot modify Super Admin or College Admin accounts.',
      403,
      ERROR_CODES.FORBIDDEN
    );
  }
  if (targetNewRole && ADMIN_TIER_ROLES.includes(targetNewRole)) {
    throw new AppError(
      'College Admins cannot assign Super Admin or College Admin roles.',
      403,
      ERROR_CODES.FORBIDDEN
    );
  }
};

module.exports = { assertNoPrivilegeEscalation, ADMIN_TIER_ROLES };
