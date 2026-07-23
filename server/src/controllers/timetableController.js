const timetableService = require('../services/timetableService');
const timetableGeneratorService = require('../services/timetableGeneratorService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../middlewares/asyncHandler');

/**
 * @desc    Create a timetable slot
 * @route   POST /api/v1/timetable
 * @access  Private/HOD
 */
const createSlot = asyncHandler(async (req, res) => {
  const departmentId = req.user.departmentId;
  const slotData = {
    ...req.body,
    departmentId,
  };

  const slot = await timetableService.createSlot(slotData, req.user.id, req);
  return successResponse(res, 201, 'Timetable slot created successfully', slot);
});

/**
 * @desc    Get slots for cohort/batch
 * @route   GET /api/v1/timetable
 * @access  Private/HOD/Faculty
 */
const getSlotsForBatch = asyncHandler(async (req, res) => {
  if (req.user.role === 'FACULTY') {
    const slots = await timetableService.getSlotsForFaculty(req.user.id);
    return successResponse(res, 200, 'Timetable fetched successfully', slots);
  }
  const departmentId = req.user.departmentId;
  const slots = await timetableService.getSlotsForBatch(departmentId, req.query);
  return successResponse(res, 200, 'Timetable fetched successfully', slots);
});

/**
 * @desc    Delete timetable slot
 * @route   DELETE /api/v1/timetable/:id
 * @access  Private/HOD
 */
const deleteSlot = asyncHandler(async (req, res) => {
  const departmentId = req.user.departmentId;
  await timetableService.deleteSlot(req.params.id, departmentId, req.user.id, req);
  return successResponse(res, 200, 'Timetable slot deleted successfully');
});

/**
 * @desc    Auto generate smart timetable
 * @route   POST /api/v1/timetable/auto-generate
 * @access  Private/HOD
 */
const autoGenerateTimetable = asyncHandler(async (req, res) => {
  const departmentId = req.user.departmentId;
  const payload = { ...req.body, departmentId };
  
  const slots = await timetableGeneratorService.generateSmartTimetable(payload, req.user.id);
  return successResponse(res, 201, `Smart Timetable generated successfully with ${slots.length} slots.`, slots);
});

module.exports = {
  createSlot,
  getSlotsForBatch,
  deleteSlot,
  autoGenerateTimetable,
};
