const AuditLog = require('../models/AuditLog');
const logger = require('./logger');

/**
 * Utility to write sensitive actions to the AuditLog collection in MongoDB.
 *
 * @param {Object} params
 * @param {string} params.actorId - MongoDB ID of the user performing the action.
 * @param {string} params.action - Name of the action (e.g. 'ROLE_CHANGE', 'FEE_PAYMENT').
 * @param {string} [params.targetId] - MongoDB ID of the affected document.
 * @param {string} [params.targetModel] - Model name of the target document.
 * @param {Object} [params.before] - Object state before the change.
 * @param {Object} [params.after] - Object state after the change.
 * @param {Object} [params.req] - Express request object to parse ip and user-agent.
 */
const logAuditEvent = async ({ actorId, action, targetId, targetModel, before, after, req }) => {
  try {
    let ipAddress = null;
    let userAgent = null;

    if (req) {
      ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      userAgent = req.headers['user-agent'];
    }

    const logEntry = new AuditLog({
      actorId,
      action,
      targetId,
      targetModel,
      before,
      after,
      ipAddress,
      userAgent,
    });

    await logEntry.save();
    logger.info(`[AuditLog Saved] Actor: ${actorId} - Action: ${action}`);
  } catch (error) {
    logger.error(`❌ Failed to save AuditLog entry: ${error.message}`);
    // Operational/non-blocking error: do not crash main request lifecycle if audit logging fails,
    // but in production, we might want to alert/retry. For now, log the error.
  }
};

module.exports = {
  logAuditEvent,
};
