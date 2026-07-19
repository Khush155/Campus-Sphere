const Meeting = require('../models/Meeting');
const AuditLog = require('../models/AuditLog');
const AppError = require('../utils/AppError');

/**
 * POST /api/v1/meetings
 * Create a meeting with optional virtual link, RSVP init, and participants.
 */
exports.createMeeting = async (req, res) => {
  const { title, agenda, participants, meetingDate, location, meetingLink, meetingType } = req.body;

  if (!title || !agenda || !meetingDate || !location) {
    throw new AppError('title, agenda, meetingDate, and location are required.', 400);
  }
  if (meetingType === 'VIRTUAL' && !meetingLink) {
    throw new AppError('meetingLink is required for virtual meetings.', 400);
  }

  // Initialize RSVP entries for all participants
  const attendees = (participants || []).map(userId => ({
    userId,
    rsvpStatus: 'PENDING',
  }));

  const meeting = await Meeting.create({
    title,
    agenda,
    departmentId: req.user.departmentId,
    organizerId: req.user.id,
    participants: participants || [],
    attendees,
    meetingDate: new Date(meetingDate),
    location,
    meetingLink: meetingLink || null,
    meetingType: meetingType || 'IN_PERSON',
  });

  res.status(201).json({ success: true, data: meeting });
};

/**
 * GET /api/v1/meetings
 * List meetings with filters and pagination.
 */
exports.getMeetings = async (req, res) => {
  const { departmentId, status, page = 1, limit = 20 } = req.query;
  const filters = {};
  if (departmentId) {filters.departmentId = departmentId;}
  if (status) {filters.status = status;}

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [meetings, total] = await Promise.all([
    Meeting.find(filters)
      .populate('organizerId', 'name email')
      .populate('participants', 'name email role')
      .populate('attendees.userId', 'name email')
      .populate('actionItems.assignedTo', 'name email')
      .sort({ meetingDate: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Meeting.countDocuments(filters),
  ]);

  res.status(200).json({
    success: true,
    data: meetings,
    meta: { total, page: parseInt(page), limit: parseInt(limit) },
  });
};

/**
 * PATCH /api/v1/meetings/:id/minutes
 * Add minutes of meeting after it concludes.
 */
exports.addMinutes = async (req, res) => {
  const { id } = req.params;
  const { minutesOfMeeting } = req.body;
  if (!minutesOfMeeting) {throw new AppError('minutesOfMeeting is required.', 400);}

  const meeting = await Meeting.findByIdAndUpdate(
    id,
    { minutesOfMeeting, status: 'COMPLETED' },
    { new: true }
  );
  if (!meeting) {throw new AppError('Meeting not found.', 404);}

  res.status(200).json({ success: true, data: meeting });
};

/**
 * PATCH /api/v1/meetings/:id/rsvp
 * Participant updates their RSVP status.
 * Body: { rsvpStatus: 'ACCEPTED' | 'DECLINED' | 'TENTATIVE' }
 */
exports.updateRSVP = async (req, res) => {
  const { id } = req.params;
  const { rsvpStatus } = req.body;
  const userId = req.user.id;

  if (!rsvpStatus) {throw new AppError('rsvpStatus is required.', 400);}

  const meeting = await Meeting.findOneAndUpdate(
    { _id: id, 'attendees.userId': userId },
    { $set: { 'attendees.$.rsvpStatus': rsvpStatus } },
    { new: true }
  );

  if (!meeting) {throw new AppError('Meeting or participant not found.', 404);}

  res.status(200).json({ success: true, data: meeting });
};

/**
 * POST /api/v1/meetings/:id/action-items
 * HOD adds a follow-up action item to the meeting record.
 * Body: { description, assignedTo, dueDate }
 */
exports.addActionItem = async (req, res) => {
  const { id } = req.params;
  const { description, assignedTo, dueDate } = req.body;

  if (!description) {throw new AppError('description is required.', 400);}

  const meeting = await Meeting.findByIdAndUpdate(
    id,
    {
      $push: {
        actionItems: {
          description,
          assignedTo: assignedTo || null,
          dueDate: dueDate ? new Date(dueDate) : null,
          status: 'PENDING',
        },
      },
    },
    { new: true }
  ).populate('actionItems.assignedTo', 'name email');

  if (!meeting) {throw new AppError('Meeting not found.', 404);}

  res.status(200).json({ success: true, data: meeting });
};

/**
 * PATCH /api/v1/meetings/:id/status
 * Update meeting status: SCHEDULED → IN_PROGRESS → COMPLETED | CANCELLED | POSTPONED
 */
exports.updateMeetingStatus = async (req, res) => {
  const { id } = req.params;
  const { status, postponedTo, postponedReason } = req.body;

  if (!status) {throw new AppError('status is required.', 400);}
  if (status === 'POSTPONED' && !postponedTo) {throw new AppError('postponedTo date is required when postponing.', 400);}

  const update = { status };
  if (postponedTo) {update.postponedTo = new Date(postponedTo);}
  if (postponedReason) {update.postponedReason = postponedReason;}

  const meeting = await Meeting.findByIdAndUpdate(id, update, { new: true });
  if (!meeting) {throw new AppError('Meeting not found.', 404);}

  await AuditLog.create({
    actorId: req.user.id,
    action: `MEETING_${status}`,
    targetId: meeting._id,
    targetModel: 'Meeting',
    after: { status },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json({ success: true, data: meeting });
};
