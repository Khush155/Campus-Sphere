// client/src/pages/faculty/mockData.js
//
// TEMPORARY placeholder data for Phase 5 (Faculty Dashboard UI only).
// Shapes intentionally mirror the real backend models (Faculty, Subject,
// Department, User) so this file can be deleted and replaced by real
// React Query hooks later WITHOUT changing any component's props shape.

export const mockFacultyProfile = {
  // Mirrors: User + Faculty (populated) from the backend
  name: 'Dr. Ananya Sharma',
  email: 'ananya.sharma@campussphere.edu',
  designation: 'Associate Professor', // matches Faculty.designation enum
  department: {
    name: 'Computer Science',
    code: 'CSE',
  },
  phoneNumber: '+91 98765 43210',
  officeHours: 'Mon, Wed 2:00 PM - 4:00 PM',
  joiningDate: '2019-07-15',
  employeeId: 'FAC-CSE-014', // display-only placeholder, not yet a real schema field
};

export const mockAssignedSubjects = [
  // Mirrors: Subject documents referenced in Faculty.subjects[]
  { id: 'sub1', name: 'Data Structures & Algorithms', code: 'CSE201', credits: 4, semester: '3rd Sem' },
  { id: 'sub2', name: 'Database Management Systems', code: 'CSE305', credits: 4, semester: '5th Sem' },
  { id: 'sub3', name: 'Operating Systems', code: 'CSE302', credits: 3, semester: '5th Sem' },
];

export const mockTodaysClasses = [
  { id: 'c1', subject: 'Data Structures & Algorithms', section: 'CSE-A', time: '09:00 AM - 10:00 AM', room: 'Room 204' },
  { id: 'c2', subject: 'Database Management Systems', section: 'CSE-B', time: '11:00 AM - 12:00 PM', room: 'Room 118' },
  { id: 'c3', subject: 'Operating Systems', section: 'CSE-A', time: '02:00 PM - 03:00 PM', room: 'Lab 3' },
];

export const mockWeeklySchedule = [
  { day: 'Monday', classes: ['DSA - 9:00 AM', 'DBMS - 11:00 AM'] },
  { day: 'Tuesday', classes: ['OS - 10:00 AM'] },
  { day: 'Wednesday', classes: ['DSA - 9:00 AM', 'DBMS - 11:00 AM', 'OS - 2:00 PM'] },
  { day: 'Thursday', classes: ['DBMS - 11:00 AM'] },
  { day: 'Friday', classes: ['DSA - 9:00 AM', 'OS - 2:00 PM'] },
  { day: 'Saturday', classes: [] },
];

export const mockRecentNotices = [
  { id: 'n1', title: 'End Semester Examinations Schedule Released', date: 'July 05, 2026', category: 'Exam', priority: 'high' },
  { id: 'n2', title: 'Faculty Meeting - Department Coordination', date: 'July 03, 2026', category: 'General', priority: 'medium' },
  { id: 'n3', title: 'Submit Internal Assessment Marks by July 15', date: 'July 01, 2026', category: 'Exam', priority: 'high' },
];

export const mockUpcomingEvents = [
  { id: 'e1', title: 'Annual Cultural Fest - CampusSphere 2026', date: 'July 15, 2026' },
  { id: 'e2', title: 'Faculty Development Program on AI in Education', date: 'July 20, 2026' },
  { id: 'e3', title: 'Parent-Teacher Meeting - 3rd Semester', date: 'July 25, 2026' },
];

export const mockQuickStats = [
  { title: 'Assigned Subjects', value: '3' },
  { title: "Today's Classes", value: '3' },
  { title: 'Avg. Attendance Marked', value: '96%' },
  { title: 'Pending Evaluations', value: '12' },
];