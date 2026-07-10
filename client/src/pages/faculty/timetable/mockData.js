// client/src/pages/faculty/timetable/mockData.js
//
// Mock data for Phase 5.6 (Timetable Module UI).
// Intentionally matches backend Mongoose model structures to make
// future React Query integration seamless.

// ─────────────────────────────────────────────────────────────
// 1. Day & Period Setup (Grid Configuration)
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// 2. Class Type Options
// ─────────────────────────────────────────────────────────────
export const CLASS_TYPE_OPTIONS = [
  { value: 'LECTURE', label: 'Lecture', color: '#10b981' }, // Green
  { value: 'PRACTICAL', label: 'Practical', color: '#06b6d4' }, // Cyan
  { value: 'LAB', label: 'Lab Session', color: '#3b82f6' }, // Blue
  { value: 'TUTORIAL', label: 'Tutorial', color: '#f59e0b' }, // Amber
];

// ─────────────────────────────────────────────────────────────
// 3. Mock Timetable Schedules
// ─────────────────────────────────────────────────────────────
// Maps academic periods assigned to the default faculty.
// Prevents scheduling overlaps on room, section, and faculty.
export const mockTimetable = [
  // ── Monday ──
  {
    id: 'tt01',
    dayOfWeek: 'MONDAY',
    startTime: '09:00',
    endTime: '10:30',
    subjectId: 'sub1', // Data Structures & Algorithms
    subjectCode: 'CSE201',
    subjectName: 'Data Structures & Algorithms',
    sectionId: 'sec1a',
    sectionName: 'CSE-A',
    facultyId: 'fac01', // Dr. Ananya Sharma
    roomNumber: 'LH-301',
    classType: 'LECTURE',
  },
  {
    id: 'tt02',
    dayOfWeek: 'MONDAY',
    startTime: '14:00',
    endTime: '15:30',
    subjectId: 'sub2', // Database Management Systems
    subjectCode: 'CSE305',
    subjectName: 'Database Management Systems',
    sectionId: 'sec2a',
    sectionName: 'CSE-A',
    facultyId: 'fac01',
    roomNumber: 'LH-202',
    classType: 'LECTURE',
  },

  // ── Tuesday ──
  {
    id: 'tt03',
    dayOfWeek: 'TUESDAY',
    startTime: '11:00',
    endTime: '12:30',
    subjectId: 'sub3', // Operating Systems
    subjectCode: 'CSE302',
    subjectName: 'Operating Systems',
    sectionId: 'sec3a',
    sectionName: 'CSE-A',
    facultyId: 'fac01',
    roomNumber: 'LH-302',
    classType: 'LECTURE',
  },
  {
    id: 'tt04',
    dayOfWeek: 'TUESDAY',
    startTime: '16:00',
    endTime: '17:30',
    subjectId: 'sub2', // Database Management Systems
    subjectCode: 'CSE305',
    subjectName: 'Database Management Systems',
    sectionId: 'sec2b',
    sectionName: 'CSE-B',
    facultyId: 'fac01',
    roomNumber: 'LH-203',
    classType: 'TUTORIAL',
  },

  // ── Wednesday ──
  {
    id: 'tt05',
    dayOfWeek: 'WEDNESDAY',
    startTime: '09:00',
    endTime: '10:30',
    subjectId: 'sub1', // Data Structures & Algorithms
    subjectCode: 'CSE201',
    subjectName: 'Data Structures & Algorithms',
    sectionId: 'sec1a',
    sectionName: 'CSE-A',
    facultyId: 'fac01',
    roomNumber: 'LH-301',
    classType: 'LECTURE',
  },
  {
    id: 'tt06',
    dayOfWeek: 'WEDNESDAY',
    startTime: '11:00',
    endTime: '12:30',
    subjectId: 'sub2', // Database Management Systems
    subjectCode: 'CSE305',
    subjectName: 'Database Management Systems',
    sectionId: 'sec2a',
    sectionName: 'CSE-A',
    facultyId: 'fac01',
    roomNumber: 'Lab-4',
    classType: 'LAB',
  },

  // ── Thursday ──
  {
    id: 'tt07',
    dayOfWeek: 'THURSDAY',
    startTime: '11:00',
    endTime: '12:30',
    subjectId: 'sub3', // Operating Systems
    subjectCode: 'CSE302',
    subjectName: 'Operating Systems',
    sectionId: 'sec3a',
    sectionName: 'CSE-A',
    facultyId: 'fac01',
    roomNumber: 'LH-302',
    classType: 'LECTURE',
  },
  {
    id: 'tt08',
    dayOfWeek: 'THURSDAY',
    startTime: '14:00',
    endTime: '15:30',
    subjectId: 'sub1', // Data Structures & Algorithms
    subjectCode: 'CSE201',
    subjectName: 'Data Structures & Algorithms',
    sectionId: 'sec1a',
    sectionName: 'CSE-A',
    facultyId: 'fac01',
    roomNumber: 'Faculty Cabin-12',
    classType: 'TUTORIAL',
  },

  // ── Friday ──
  {
    id: 'tt09',
    dayOfWeek: 'FRIDAY',
    startTime: '09:00',
    endTime: '10:30',
    subjectId: 'sub2', // Database Management Systems
    subjectCode: 'CSE305',
    subjectName: 'Database Management Systems',
    sectionId: 'sec2b',
    sectionName: 'CSE-B',
    facultyId: 'fac01',
    roomNumber: 'LH-202',
    classType: 'LECTURE',
  },
  {
    id: 'tt10',
    dayOfWeek: 'FRIDAY',
    startTime: '14:00',
    endTime: '15:30',
    subjectId: 'sub1', // Data Structures & Algorithms
    subjectCode: 'CSE201',
    subjectName: 'Data Structures & Algorithms',
    sectionId: 'sec1a',
    sectionName: 'CSE-A',
    facultyId: 'fac01',
    roomNumber: 'Lab-1',
    classType: 'PRACTICAL',
  },
];
