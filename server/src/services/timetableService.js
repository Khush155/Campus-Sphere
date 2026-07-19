const TimetableSlot = require('../models/TimetableSlot');
const FacultyAssignment = require('../models/FacultyAssignment');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const logger = require('../utils/logger');
const { logAuditEvent } = require('../utils/auditLogger');

const checkConflicts = async (newSlot) => {
  const {
    departmentId,
    courseId,
    branchId,
    semester,
    group,
    facultyId,
    dayOfWeek,
    startTime,
    endTime,
    room,
  } = newSlot;

  // Find all slots on the same day in the same department
  // Optimizing by finding overlapping times directly in mongo is tricky with string times, 
  // but since they are 'HH:MM', string comparison actually works perfectly:
  // "09:00" < "10:30" is true.
  
  const overlappingSlots = await TimetableSlot.find({
    departmentId,
    dayOfWeek,
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  }).populate('subjectId', 'name code').populate('facultyId', 'name');

  for (const slot of overlappingSlots) {
    // 1. Faculty Conflict
    if (slot.facultyId._id.toString() === facultyId.toString()) {
      throw new AppError(
        `Faculty Conflict: ${slot.facultyId.name} is already teaching ${slot.subjectId.name} from ${slot.startTime} to ${slot.endTime}.`,
        400,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // 2. Room Conflict
    if (room && slot.room && slot.room === room) {
      throw new AppError(
        `Room Conflict: Room ${room} is already booked for ${slot.subjectId.name} from ${slot.startTime} to ${slot.endTime}.`,
        400,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // 3. Batch Conflict
    if (
      slot.courseId.toString() === courseId.toString() &&
      slot.branchId.toString() === branchId.toString() &&
      slot.semester === semester
    ) {
      // Group collision logic:
      // If either slot has NO group defined, it means it's a full-semester lecture -> Conflict!
      // If both slots have groups, they must be the SAME group to cause a conflict.
      const isFullSem1 = !slot.group;
      const isFullSem2 = !group;
      
      if (isFullSem1 || isFullSem2 || slot.group === group) {
         let batchStr = `Semester ${semester}`;
         if (slot.group) {batchStr += ` Group ${slot.group}`;}
         if (group && !slot.group) {batchStr += ` (Full Batch)`;}
         
         throw new AppError(
           `Batch Conflict: ${batchStr} already has ${slot.subjectId.name} scheduled from ${slot.startTime} to ${slot.endTime}.`,
           400,
           ERROR_CODES.VALIDATION_ERROR
         );
      }
    }
  }
};

const createSlot = async (slotData, createdBy, req) => {
  // 1. Verify that the faculty is actually assigned to this subject
  const assignment = await FacultyAssignment.findOne({
    facultyId: slotData.facultyId,
    subjectId: slotData.subjectId,
    status: 'ACTIVE'
  });

  if (!assignment) {
    throw new AppError('The selected faculty is not officially assigned to this subject.', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  // 2. Run Conflict Detection Engine
  await checkConflicts(slotData);

  // 3. Create Slot
  const slot = await TimetableSlot.create({
    ...slotData,
    createdBy,
  });

  logger.info(`[Timetable Slot Created] Day: ${slot.dayOfWeek}, Time: ${slot.startTime}-${slot.endTime}, Subject: ${slot.subjectId}`);

  await logAuditEvent({
    actorId: createdBy,
    action: 'TIMETABLE_SLOT_CREATED',
    targetId: slot._id,
    targetModel: 'TimetableSlot',
    after: slot.toObject(),
    req,
  });

  return slot;
};

const getSlotsForBatch = async (departmentId, query) => {
  const { courseId, branchId, semester, group } = query;
  
  if (!courseId || !branchId || !semester) {
    throw new AppError('Course, branch, and semester are required to fetch a timetable.', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const filter = {
    departmentId,
    courseId,
    branchId,
    semester: parseInt(semester, 10),
  };

  // If HOD filters by a specific group, we must return:
  // 1. Slots explicitly for that group
  // 2. Slots for the whole semester (where group is null/empty)
  if (group) {
    filter.$or = [
      { group: group },
      { group: { $exists: false } },
      { group: null },
      { group: '' }
    ];
  }

  const slots = await TimetableSlot.find(filter)
    .populate('subjectId', 'name code')
    .populate('facultyId', 'name email')
    .sort({ startTime: 1 });

  return slots;
};

const deleteSlot = async (slotId, departmentId, deletedBy, req) => {
  const slot = await TimetableSlot.findById(slotId);
  if (!slot) {
    throw new AppError('Slot not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  if (slot.departmentId.toString() !== departmentId.toString()) {
    throw new AppError('Forbidden.', 403, ERROR_CODES.FORBIDDEN);
  }

  const beforeState = slot.toObject();
  await TimetableSlot.findByIdAndDelete(slotId);

  await logAuditEvent({
    actorId: deletedBy,
    action: 'TIMETABLE_SLOT_DELETED',
    targetId: slot._id,
    targetModel: 'TimetableSlot',
    before: beforeState,
    req,
  });
};

module.exports = {
  createSlot,
  getSlotsForBatch,
  deleteSlot,
};
