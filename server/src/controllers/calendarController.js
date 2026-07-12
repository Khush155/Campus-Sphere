const z = require('zod');
const calendarService = require('../services/calendarService');
const { successResponse } = require('../utils/apiResponse');

const eventSchema = z.object({
  title: z.string().min(1).max(100),
  type: z.enum(['HOLIDAY', 'EXAM', 'EVENT', 'BREAK']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  description: z.string().max(500).optional(),
  applicableBranch: z.string().optional().nullable(),
  applicableSemester: z.number().optional().nullable(),
});

const createEvent = async (req, res) => {
  const parsedData = eventSchema.parse(req.body);
  const event = await calendarService.createEvent(parsedData, req.user.id, req);
  return successResponse(res, 201, 'Academic event created', event);
};

const getEvents = async (req, res) => {
  const filters = {
    branchId: req.query.branchId || null,
    semester: req.query.semester ? parseInt(req.query.semester) : null,
    type: req.query.type || null,
    startDate: req.query.startDate || null,
    endDate: req.query.endDate || null,
  };

  const events = await calendarService.getEvents(filters);
  return successResponse(res, 200, 'Academic events fetched', events);
};

const deleteEvent = async (req, res) => {
  const eventId = req.params.eventId;
  await calendarService.deleteEvent(eventId, req.user.id, req);
  return successResponse(res, 200, 'Academic event deleted successfully', null);
};

module.exports = {
  createEvent,
  getEvents,
  deleteEvent,
};
