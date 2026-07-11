const auditLogService = require('../services/auditLogService');
const { auditLogQuerySchema } = require('../validators/auditLogValidator');
const { successResponse } = require('../utils/apiResponse');

/**
 * Controller to fetch paginated audit logs with optional filters and text search.
 */
const getAuditLogs = async (req, res, _next) => {
  const validatedQuery = auditLogQuerySchema.parse(req.query);
  
  const { logs, total } = await auditLogService.getAuditLogs(validatedQuery);

  return successResponse(res, 200, 'Audit logs retrieved successfully.', {
    logs,
    total,
    page: validatedQuery.page,
    limit: validatedQuery.limit,
  });
};

/**
 * Controller to fetch all distinct actions currently present in the collection.
 */
const getDistinctActions = async (req, res, _next) => {
  const actions = await auditLogService.getDistinctActions();
  return successResponse(res, 200, 'Distinct actions retrieved successfully.', actions);
};

module.exports = {
  getAuditLogs,
  getDistinctActions,
};
