const promotionService = require('../services/promotionService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../middlewares/asyncHandler');

/**
 * @desc    Dry-run promotion preview
 * @route   POST /api/v1/promotions/preview
 * @access  Private/SuperAdmin
 */
const previewPromotion = asyncHandler(async (req, res) => {
  const result = await promotionService.previewPromotion(req.body);
  return successResponse(res, 200, 'Promotion preview generated successfully.', result);
});

/**
 * @desc    Execute bulk promotion
 * @route   POST /api/v1/promotions/execute
 * @access  Private/SuperAdmin
 */
const executePromotion = asyncHandler(async (req, res) => {
  const result = await promotionService.executePromotion(req.body, req.user.id);
  return successResponse(res, 200, 'Promotion executed successfully.', result);
});

module.exports = {
  previewPromotion,
  executePromotion,
};
