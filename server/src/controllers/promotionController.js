const promotionService = require('../services/promotionService');
const { promotionSchema } = require('../validators/promotionValidator');
const { successResponse } = require('../utils/apiResponse');

/**
 * POST /api/v1/promotions/preview
 * Returns computed dry-run metrics and warnings before writing any changes.
 */
const previewPromotion = async (req, res, _next) => {
  const validatedBody = promotionSchema.parse(req.body);
  const result = await promotionService.previewPromotion(validatedBody);
  return successResponse(res, 200, 'Promotion preview generated successfully.', result);
};

/**
 * POST /api/v1/promotions/execute
 * Recomputes promotion requirements and applies mutations atomically in a transaction.
 */
const executePromotion = async (req, res, _next) => {
  const validatedBody = promotionSchema.parse(req.body);
  const result = await promotionService.executePromotion(validatedBody, req.user.id);
  return successResponse(res, 200, 'Promotion executed successfully.', result);
};

module.exports = {
  previewPromotion,
  executePromotion,
};
