// client/src/pages/faculty/timetable/timetableConstants.js
//
// Shared constants for Faculty Timetable module.

export const WEEKDAYS = [
  { value: 'MONDAY', label: 'Monday' },
  { value: 'TUESDAY', label: 'Tuesday' },
  { value: 'WEDNESDAY', label: 'Wednesday' },
  { value: 'THURSDAY', label: 'Thursday' },
  { value: 'FRIDAY', label: 'Friday' },
];

export const TIME_SLOTS = [
  { id: 'p1', startTime: '09:00', endTime: '10:30', label: 'Period 1 (09:00 - 10:30)' },
  { id: 'p2', startTime: '11:00', endTime: '12:30', label: 'Period 2 (11:00 - 12:30)' },
  { id: 'p3', startTime: '14:00', endTime: '15:30', label: 'Period 3 (14:00 - 15:30)' },
  { id: 'p4', startTime: '16:00', endTime: '17:30', label: 'Period 4 (16:00 - 17:30)' },
];

export const CLASS_TYPE_OPTIONS = [
  { value: 'LECTURE', label: 'Lecture', color: '#10b981' },
  { value: 'PRACTICAL', label: 'Practical', color: '#06b6d4' },
  { value: 'LAB', label: 'Lab Session', color: '#3b82f6' },
  { value: 'TUTORIAL', label: 'Tutorial', color: '#f59e0b' },
];
