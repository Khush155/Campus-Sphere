// client/src/pages/faculty/attendance/mockData.js
//
// TEMPORARY mock data for Phase 5.2 (Attendance Module UI).
// Each export's shape intentionally mirrors the real backend API response
// so that replacing this file with React Query hooks requires zero
// component changes — only the data source in the parent page changes.
//
// This file will be deleted once real APIs are connected.

// ─────────────────────────────────────────────────────────────
// 1. Faculty's Assigned Subjects (for SubjectSelector dropdown)
// ─────────────────────────────────────────────────────────────
// Future API: GET /api/v1/faculty/:id → populated response.data.subjects[]
// Backend model: Subject { _id, name, code, credits, departmentId }
export const mockAttendanceSubjects = [
  { id: 'sub1', name: 'Data Structures & Algorithms', code: 'CSE201', credits: 4 },
  { id: 'sub2', name: 'Database Management Systems', code: 'CSE305', credits: 4 },
  { id: 'sub3', name: 'Operating Systems', code: 'CSE302', credits: 3 },
];

// ─────────────────────────────────────────────────────────────
// 2. Students Enrolled in a Subject (~20 students)
// ─────────────────────────────────────────────────────────────
// Future API: GET /api/v1/students?departmentId=xxx (needs to be built)
// Backend model: User { _id, name, email, role: 'STUDENT' }
//
// rollNumber is a display-only field — not in the User model yet.
// It will likely be added to a future StudentProfile model
// (similar to how Faculty has a separate profile linked via userId).
export const mockStudentsList = [
  { id: 'stu01', name: 'Aarav Patel', rollNumber: '2024CSE001', email: 'aarav.patel@campus.edu' },
  { id: 'stu02', name: 'Priya Sharma', rollNumber: '2024CSE002', email: 'priya.sharma@campus.edu' },
  { id: 'stu03', name: 'Rohan Gupta', rollNumber: '2024CSE003', email: 'rohan.gupta@campus.edu' },
  { id: 'stu04', name: 'Ananya Verma', rollNumber: '2024CSE004', email: 'ananya.verma@campus.edu' },
  { id: 'stu05', name: 'Vikram Singh', rollNumber: '2024CSE005', email: 'vikram.singh@campus.edu' },
  { id: 'stu06', name: 'Sneha Reddy', rollNumber: '2024CSE006', email: 'sneha.reddy@campus.edu' },
  { id: 'stu07', name: 'Arjun Kumar', rollNumber: '2024CSE007', email: 'arjun.kumar@campus.edu' },
  { id: 'stu08', name: 'Meera Nair', rollNumber: '2024CSE008', email: 'meera.nair@campus.edu' },
  { id: 'stu09', name: 'Karthik Iyer', rollNumber: '2024CSE009', email: 'karthik.iyer@campus.edu' },
  { id: 'stu10', name: 'Pooja Deshmukh', rollNumber: '2024CSE010', email: 'pooja.deshmukh@campus.edu' },
  { id: 'stu11', name: 'Rahul Joshi', rollNumber: '2024CSE011', email: 'rahul.joshi@campus.edu' },
  { id: 'stu12', name: 'Ishita Banerjee', rollNumber: '2024CSE012', email: 'ishita.banerjee@campus.edu' },
  { id: 'stu13', name: 'Aditya Malhotra', rollNumber: '2024CSE013', email: 'aditya.malhotra@campus.edu' },
  { id: 'stu14', name: 'Kavya Krishnan', rollNumber: '2024CSE014', email: 'kavya.krishnan@campus.edu' },
  { id: 'stu15', name: 'Nikhil Agarwal', rollNumber: '2024CSE015', email: 'nikhil.agarwal@campus.edu' },
  { id: 'stu16', name: 'Divya Menon', rollNumber: '2024CSE016', email: 'divya.menon@campus.edu' },
  { id: 'stu17', name: 'Siddharth Rao', rollNumber: '2024CSE017', email: 'siddharth.rao@campus.edu' },
  { id: 'stu18', name: 'Tanvi Chauhan', rollNumber: '2024CSE018', email: 'tanvi.chauhan@campus.edu' },
  { id: 'stu19', name: 'Harsh Trivedi', rollNumber: '2024CSE019', email: 'harsh.trivedi@campus.edu' },
  { id: 'stu20', name: 'Riya Kapoor', rollNumber: '2024CSE020', email: 'riya.kapoor@campus.edu' },
];

// ─────────────────────────────────────────────────────────────
// 3. Today's Attendance (not yet marked — fresh session)
// ─────────────────────────────────────────────────────────────
export const mockTodaysAttendance = null;

// ─────────────────────────────────────────────────────────────
// 4. Past Attendance (already marked — for edit/review mode)
// ─────────────────────────────────────────────────────────────
export const mockPastAttendance = {
  subjectId: 'sub1',
  date: '2026-07-05',
  markedBy: 'Dr. Ananya Sharma',
  markedAt: '2026-07-05T09:45:00Z',
  records: [
    { studentId: 'stu01', status: 'PRESENT' },
    { studentId: 'stu02', status: 'PRESENT' },
    { studentId: 'stu03', status: 'ABSENT' },
    { studentId: 'stu04', status: 'PRESENT' },
    { studentId: 'stu05', status: 'MEDICAL_LEAVE' },
    { studentId: 'stu06', status: 'PRESENT' },
    { studentId: 'stu07', status: 'PRESENT' },
    { studentId: 'stu08', status: 'ABSENT' },
    { studentId: 'stu09', status: 'PRESENT' },
    { studentId: 'stu10', status: 'PRESENT' },
    { studentId: 'stu11', status: 'PRESENT' },
    { studentId: 'stu12', status: 'DUTY_LEAVE' },
    { studentId: 'stu13', status: 'PRESENT' },
    { studentId: 'stu14', status: 'PRESENT' },
    { studentId: 'stu15', status: 'ABSENT' },
    { studentId: 'stu16', status: 'PRESENT' },
    { studentId: 'stu17', status: 'PRESENT' },
    { studentId: 'stu18', status: 'PRESENT' },
    { studentId: 'stu19', status: 'PRESENT' },
    { studentId: 'stu20', status: 'PRESENT' },
  ],
};

// ─────────────────────────────────────────────────────────────
// 5. Attendance History (for AttendanceHistory view)
// ─────────────────────────────────────────────────────────────
export const mockAttendanceHistory = [
  {
    id: 'ah1',
    date: '2026-07-07',
    subjectId: 'sub1',
    subjectName: 'Data Structures & Algorithms',
    subjectCode: 'CSE201',
    totalStudents: 20,
    present: 17,
    absent: 2,
    medicalLeave: 1,
    dutyLeave: 0,
    markedAt: '2026-07-07T09:15:00Z',
  },
  {
    id: 'ah2',
    date: '2026-07-07',
    subjectId: 'sub2',
    subjectName: 'Database Management Systems',
    subjectCode: 'CSE305',
    totalStudents: 20,
    present: 18,
    absent: 1,
    medicalLeave: 0,
    dutyLeave: 1,
    markedAt: '2026-07-07T11:20:00Z',
  },
  {
    id: 'ah3',
    date: '2026-07-05',
    subjectId: 'sub1',
    subjectName: 'Data Structures & Algorithms',
    subjectCode: 'CSE201',
    totalStudents: 20,
    present: 15,
    absent: 3,
    medicalLeave: 1,
    dutyLeave: 1,
    markedAt: '2026-07-05T09:45:00Z',
  },
  {
    id: 'ah4',
    date: '2026-07-04',
    subjectId: 'sub3',
    subjectName: 'Operating Systems',
    subjectCode: 'CSE302',
    totalStudents: 20,
    present: 19,
    absent: 1,
    medicalLeave: 0,
    dutyLeave: 0,
    markedAt: '2026-07-04T14:10:00Z',
  },
  {
    id: 'ah5',
    date: '2026-07-03',
    subjectId: 'sub2',
    subjectName: 'Database Management Systems',
    subjectCode: 'CSE305',
    totalStudents: 20,
    present: 16,
    absent: 3,
    medicalLeave: 1,
    dutyLeave: 0,
    markedAt: '2026-07-03T11:05:00Z',
  },
  {
    id: 'ah6',
    date: '2026-07-02',
    subjectId: 'sub1',
    subjectName: 'Data Structures & Algorithms',
    subjectCode: 'CSE201',
    totalStudents: 20,
    present: 18,
    absent: 1,
    medicalLeave: 0,
    dutyLeave: 1,
    markedAt: '2026-07-02T09:30:00Z',
  },
  {
    id: 'ah7',
    date: '2026-07-01',
    subjectId: 'sub1',
    subjectName: 'Data Structures & Algorithms',
    subjectCode: 'CSE201',
    totalStudents: 20,
    present: 20,
    absent: 0,
    medicalLeave: 0,
    dutyLeave: 0,
    markedAt: '2026-07-01T09:10:00Z',
  },
];

// ─────────────────────────────────────────────────────────────
// 6. Attendance Status Options
// ─────────────────────────────────────────────────────────────
export const ATTENDANCE_STATUS = [
  { value: 'PRESENT', label: 'Present', color: '#10b981', shortLabel: 'P' },
  { value: 'ABSENT', label: 'Absent', color: '#ef4444', shortLabel: 'A' },
  { value: 'MEDICAL_LEAVE', label: 'Medical Leave', color: '#3b82f6', shortLabel: 'ML' },
  { value: 'DUTY_LEAVE', label: 'Duty Leave', color: '#f97316', shortLabel: 'DL' },
];
