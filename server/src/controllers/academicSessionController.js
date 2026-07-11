const academicSessionService = require('../services/academicSessionService');
const { academicSessionSchema } = require('../validators/academicSessionValidator');
const { successResponse } = require('../utils/apiResponse');

/**
 * Controller to create a new Academic Session.
 */
const createSession = async (req, res, _next) => {
  const validatedBody = academicSessionSchema.parse(req.body);
  const meta = { ipAddress: req.ip || req.headers['x-forwarded-for'], userAgent: req.headers['user-agent'] };
  const session = await academicSessionService.createSession(validatedBody, req.user.id, meta);
  return successResponse(res, 201, 'Academic session created successfully.', session);
};

/**
 * Controller to retrieve paginated academic sessions.
 */
const getSessions = async (req, res, _next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;

  const result = await academicSessionService.getSessionsList({ page, limit });
  return successResponse(
    res,
    200,
    'Academic sessions retrieved successfully.',
    result.sessions,
    result.meta
  );
};

/**
 * Controller to retrieve currently active session profile.
 */
const getActiveSession = async (req, res, _next) => {
  const session = await academicSessionService.getActiveSession();
  return successResponse(res, 200, 'Active academic session retrieved successfully.', session);
};

/**
 * Controller to explicitly activate an existing academic session.
 */
const activateSession = async (req, res, _next) => {
  const meta = { ipAddress: req.ip || req.headers['x-forwarded-for'], userAgent: req.headers['user-agent'] };
  const session = await academicSessionService.activateSession(req.params.id, req.user.id, meta);
  return successResponse(res, 200, 'Academic session activated successfully.', session);
};

module.exports = {
  createSession,
  getSessions,
  getActiveSession,
  activateSession,
};
