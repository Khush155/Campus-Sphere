const AcademicEvent = require('../models/AcademicEvent');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const { logAuditEvent } = require('../utils/auditLogger');

const createEvent = async (data, actorId, req) => {
  const event = await AcademicEvent.create(data);

  await logAuditEvent({
    actorId,
    action: 'ACADEMIC_EVENT_CREATED',
    targetId: event._id,
    targetModel: 'AcademicEvent',
    after: event.toObject(),
    req,
  });

  return event;
};

const getEvents = async (filters = {}) => {
  // Filters might contain branchId, semester, or type
  const query = {};

  if (filters.branchId || filters.semester) {
    query.$or = [
      { applicableBranch: null, applicableSemester: null },
    ];
    
    // Add specific targeting
    if (filters.branchId) {
      query.$or.push({ applicableBranch: filters.branchId, applicableSemester: null });
    }
    if (filters.semester) {
      query.$or.push({ applicableBranch: null, applicableSemester: filters.semester });
    }
    if (filters.branchId && filters.semester) {
      query.$or.push({ applicableBranch: filters.branchId, applicableSemester: filters.semester });
    }
  }

  if (filters.type) {
    query.type = filters.type;
  }
  
  if (filters.startDate && filters.endDate) {
    query.startDate = { $lte: new Date(filters.endDate) };
    query.endDate = { $gte: new Date(filters.startDate) };
  }

  return await AcademicEvent.find(query).sort({ startDate: 1 });
};

const deleteEvent = async (id, actorId, req) => {
  const event = await AcademicEvent.findByIdAndDelete(id);
  if (!event) {
    throw new AppError('Event not found', 404, ERROR_CODES.NOT_FOUND);
  }

  await logAuditEvent({
    actorId,
    action: 'ACADEMIC_EVENT_DELETED',
    targetId: event._id,
    targetModel: 'AcademicEvent',
    before: event.toObject(),
    req,
  });

  return event;
};

module.exports = {
  createEvent,
  getEvents,
  deleteEvent,
};
