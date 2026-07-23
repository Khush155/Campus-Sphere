const TimetableSlot = require('../models/TimetableSlot');
const Subject = require('../models/Subject');
const FacultyAssignment = require('../models/FacultyAssignment');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
const TIMESLOTS = [
  { start: '09:00', end: '10:00' },
  { start: '10:00', end: '11:00' },
  { start: '11:00', end: '12:00' },
  // Lunch 12:00 - 13:00
  { start: '13:00', end: '14:00' },
  { start: '14:00', end: '15:00' },
  { start: '15:00', end: '16:00' },
];

/**
 * Shuffles an array in place.
 */
function shuffle(array) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

const generateSmartTimetable = async ({ departmentId, courseId, branchId, semester, group }, createdBy) => {
  if (!courseId || !branchId || !semester) {
    throw new AppError('Course, branch, and semester are required.', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Clear existing slots for this exact cohort
    const filter = {
      departmentId,
      courseId,
      branchId,
      semester: parseInt(semester, 10),
    };
    if (group) {
      filter.group = group;
    } else {
      filter.group = { $in: [null, '', undefined] };
    }
    
    await TimetableSlot.deleteMany(filter, { session });
    logger.info(`[Smart Timetable] Cleared existing slots for Course: ${courseId}, Branch: ${branchId}, Sem: ${semester}`);

    // 2. Fetch all subjects for this semester
    const subjects = await Subject.find({ departmentId, branchId, semester: parseInt(semester, 10) }).session(session);

    // 3. For each subject, find the assigned faculty that matches the targeted group (or full batch)
    const validRequirements = [];
    for (const subject of subjects) {
      const assignmentQuery = {
        subjectId: subject._id,
        status: 'ACTIVE',
      };
      if (group) {
        assignmentQuery.$or = [{ group: group }, { group: null }];
      } else {
        assignmentQuery.group = null;
      }
      
      const assignment = await FacultyAssignment.findOne(assignmentQuery).session(session);
      if (assignment) {
        validRequirements.push({
          subject,
          facultyId: assignment.facultyId,
          credits: subject.credits,
        });
      } else {
        logger.warn(`[Smart Timetable] Skipping Subject ${subject.code} - No active faculty assignment found for group ${group || 'FULL_BATCH'}.`);
      }
    }

    // 4. Create an array of all possible time blocks
    const allBlocks = [];
    for (const day of DAYS) {
      for (const time of TIMESLOTS) {
        allBlocks.push({ dayOfWeek: day, startTime: time.start, endTime: time.end });
      }
    }

    // 5. Greedy matching algorithm
    const createdSlots = [];
    
    for (const req of validRequirements) {
      let slotsNeeded = req.credits;
      const blocksToTry = shuffle([...allBlocks]);
      
      for (let i = 0; i < blocksToTry.length && slotsNeeded > 0; i++) {
        const block = blocksToTry[i];
        
        const newSlotData = {
          departmentId,
          courseId,
          branchId,
          semester: parseInt(semester, 10),
          group: group || null,
          subjectId: req.subject._id,
          facultyId: req.facultyId,
          dayOfWeek: block.dayOfWeek,
          startTime: block.startTime,
          endTime: block.endTime,
          room: null,
        };

        try {
          // Manual conflict check within active transaction session
          const conflictFilter = {
            dayOfWeek: block.dayOfWeek,
            startTime: { $lt: block.endTime },
            endTime: { $gt: block.startTime },
          };
          const overlappingSlots = await TimetableSlot.find(conflictFilter).session(session);
          
          let conflict = false;
          for (const slot of overlappingSlots) {
            // Check faculty collision
            if (slot.facultyId.toString() === req.facultyId.toString()) {
              conflict = true;
              break;
            }
            // Check batch collision
            if (
              slot.courseId.toString() === courseId.toString() &&
              slot.branchId.toString() === branchId.toString() &&
              slot.semester === parseInt(semester, 10)
            ) {
              const isFullSem1 = !slot.group;
              const isFullSem2 = !group;
              if (isFullSem1 || isFullSem2 || slot.group === group) {
                conflict = true;
                break;
              }
            }
          }

          if (conflict) {
            continue;
          }

          // Create the slot inside transaction session
          const [slot] = await TimetableSlot.create([{
            ...newSlotData,
            createdBy
          }], { session });

          createdSlots.push(slot);
          slotsNeeded--;
        } catch (err) {
          continue;
        }
      }
      
      if (slotsNeeded > 0) {
        logger.warn(`[Smart Timetable] Could not schedule ${slotsNeeded} slots for ${req.subject.code}. No conflict-free time found.`);
      }
    }

    await session.commitTransaction();
    session.endSession();
    return createdSlots;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

module.exports = {
  generateSmartTimetable,
};
