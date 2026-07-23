const Meeting = require('../models/Meeting');
const { assertHODDeptBound } = require('../utils/privilegeGuard');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const ROLES = require('../constants/roles');
const { logAuditEvent } = require('../utils/auditLogger');
const paginate = require('../utils/paginate');

const createMeeting = async (meetingData, actor) => {
  const { title, agenda, participants, meetingDate, location, meetingLink, meetingType } = meetingData;

  if (meetingType === 'VIRTUAL' && !meetingLink) {
    throw new AppError('meetingLink is required for virtual meetings.', 400, ERROR_CODES.BAD_REQUEST);
  }

  // Initialize RSVP entries for all participants
  const attendees = (participants || []).map(userId => ({
    userId,
    rsvpStatus: 'PENDING',
  }));

  const meeting = await Meeting.create({
    title,
    agenda,
    departmentId: actor.departmentId,
    organizerId: actor.id,
    participants: participants || [],
    attendees,
    meetingDate: new Date(meetingDate),
    location,
    meetingLink: meetingLink || null,
    meetingType: meetingType || 'IN_PERSON',
  });

  return meeting;
};

const getMeetings = async (queryOptions, actor) => {
  const { departmentId, status } = queryOptions;
  const filters = {};

  if (departmentId) {
    filters.departmentId = departmentId;
  }
  if (status) {
    filters.status = status;
  }

  // Enforce HOD/Faculty/Student boundaries
  if (actor.role === ROLES.HOD || actor.role === ROLES.FACULTY || actor.role === ROLES.STUDENT) {
    filters.departmentId = actor.departmentId;
  }

  return await paginate(Meeting, filters, {
    ...queryOptions,
    populate: [
      { path: 'organizerId', select: 'name email' },
      { path: 'participants', select: 'name email role' },
      { path: 'attendees.userId', select: 'name email' },
      { path: 'actionItems.assignedTo', select: 'name email' }
    ],
    sort: { meetingDate: -1 }
  });
};

const addMinutes = async (id, minutesOfMeeting, actor) => {
  const meeting = await Meeting.findById(id);
  if (!meeting) {
    throw new AppError('Meeting not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  // Enforce HOD boundaries
  assertHODDeptBound(actor, meeting.departmentId);

  meeting.minutesOfMeeting = minutesOfMeeting;
  meeting.status = 'COMPLETED';
  await meeting.save();

  return meeting;
};

const updateRSVP = async (id, rsvpStatus, actor) => {
  const meeting = await Meeting.findOneAndUpdate(
    { _id: id, 'attendees.userId': actor.id },
    { $set: { 'attendees.$.rsvpStatus': rsvpStatus } },
    { new: true }
  );

  if (!meeting) {
    throw new AppError('Meeting or participant not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  return meeting;
};

const addActionItem = async (id, itemData, actor) => {
  const { description, assignedTo, dueDate } = itemData;

  const meeting = await Meeting.findById(id);
  if (!meeting) {
    throw new AppError('Meeting not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  // Enforce HOD boundaries
  assertHODDeptBound(actor, meeting.departmentId);

  meeting.actionItems.push({
    description,
    assignedTo: assignedTo || null,
    dueDate: dueDate ? new Date(dueDate) : null,
    status: 'PENDING',
  });

  await meeting.save();
  await meeting.populate('actionItems.assignedTo', 'name email');

  return meeting;
};

const updateMeetingStatus = async (id, statusData, actor, req) => {
  const { status, postponedTo, postponedReason } = statusData;

  const meeting = await Meeting.findById(id);
  if (!meeting) {
    throw new AppError('Meeting not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  // Enforce HOD boundaries
  assertHODDeptBound(actor, meeting.departmentId);

  const before = { status: meeting.status };

  meeting.status = status;
  if (postponedTo) {
    meeting.postponedTo = new Date(postponedTo);
  }
  if (postponedReason) {
    meeting.postponedReason = postponedReason;
  }

  await meeting.save();

  // Audit Log
  await logAuditEvent({
    actorId: actor.id,
    action: `MEETING_${status}`,
    targetId: meeting._id,
    targetModel: 'Meeting',
    before,
    after: { status },
    req
  });

  return meeting;
};

module.exports = {
  createMeeting,
  getMeetings,
  addMinutes,
  updateRSVP,
  addActionItem,
  updateMeetingStatus
};
