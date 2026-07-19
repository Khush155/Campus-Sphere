const timetableService = require('../services/timetableService');
const timetableGeneratorService = require('../services/timetableGeneratorService');
const { createSlotSchema } = require('../validators/timetableValidator');
const { successResponse } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');

const createSlot = async (req, res) => {
  const departmentId = req.user.departmentId;
  
  const parsedData = createSlotSchema.safeParse(req.body);
  if (!parsedData.success) {
    throw new AppError('Validation failed', 400, ERROR_CODES.VALIDATION_ERROR, parsedData.error.errors);
  }

  const slotData = {
    ...parsedData.data,
    departmentId,
  };

  const slot = await timetableService.createSlot(slotData, req.user.id, req);
  return successResponse(res, 201, 'Timetable slot created successfully', slot);
};

const getSlotsForBatch = async (req, res) => {
  if (req.user.role === 'FACULTY') {
    const slots = await timetableService.getSlotsForFaculty(req.user.id);
    return successResponse(res, 200, 'Timetable fetched successfully', slots);
  }
  const departmentId = req.user.departmentId;
  const slots = await timetableService.getSlotsForBatch(departmentId, req.query);
  return successResponse(res, 200, 'Timetable fetched successfully', slots);
};

const deleteSlot = async (req, res) => {
  const departmentId = req.user.departmentId;
  await timetableService.deleteSlot(req.params.id, departmentId, req.user._id, req);
  return successResponse(res, 200, 'Timetable slot deleted successfully');
};

const autoGenerateTimetable = async (req, res) => {
  const departmentId = req.user.departmentId;
  const payload = { ...req.body, departmentId };
  
  const slots = await timetableGeneratorService.generateSmartTimetable(payload, req.user._id, req);
  return successResponse(res, 201, `Smart Timetable generated successfully with ${slots.length} slots.`, slots);
};

module.exports = {
  createSlot,
  getSlotsForBatch,
  deleteSlot,
  autoGenerateTimetable,
};
