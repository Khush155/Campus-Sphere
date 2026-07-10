// client/src/pages/faculty/exams/mockData.js
//
// Mock data for Phase 5.4 (Exams Module UI).
// Intentionally matches backend Mongoose model properties to make
// future React Query integration seamless.

// ─────────────────────────────────────────────────────────────
// 1. Exam Status Options (Conduction Lifecycle)
// ─────────────────────────────────────────────────────────────
export const EXAM_STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft', color: '#6b7280', description: 'Saved as draft, not visible to students.' },
  { value: 'PUBLISHED', label: 'Published', color: '#3b82f6', description: 'Exam scheduled, visible to students.' },
  { value: 'ONGOING', label: 'Ongoing', color: '#f97316', description: 'Exam currently in progress.' },
  { value: 'COMPLETED', label: 'Completed', color: '#10b981', description: 'Exam conducted successfully.' },
  { value: 'ARCHIVED', label: 'Archived', color: '#9ca3af', description: 'Archived historical records.' },
];

// ─────────────────────────────────────────────────────────────
// 2. Exam Type Options
// ─────────────────────────────────────────────────────────────
export const EXAM_TYPE_OPTIONS = [
  { value: 'THEORY', label: 'Theory Exam', color: '#8b5cf6' },
  { value: 'PRACTICAL', label: 'Practical Exam', color: '#06b6d4' },
  { value: 'ONLINE', label: 'Online Exam', color: '#ec4899' },
  { value: 'VIVA', label: 'Viva Voce', color: '#eab308' },
];

// ─────────────────────────────────────────────────────────────
// 3. Mock Exams List
// ─────────────────────────────────────────────────────────────
// An exam belongs to exactly ONE subject, but can be assigned
// to MULTIPLE sections.
export const mockExams = [
  {
    id: 'ex01',
    title: 'DSA End Semester Theory',
    description: 'Final written exam covering Trees, Graphs, Hashing, Sorting, and Greedy/Dynamic Programming paradigms.',
    subjectId: 'sub1', // Data Structures & Algorithms
    subjectCode: 'CSE201',
    subjectName: 'Data Structures & Algorithms',
    sectionIds: ['sec1a'], // Assigned to CSE-A
    sectionNames: ['CSE-A'],
    examDate: '2026-07-15T10:00:00Z',
    durationMinutes: 180, // 3 Hours
    roomNumber: 'LH-301',
    type: 'THEORY',
    totalMarks: 100,
    weightage: 50, // 50% of final grade
    isResultPublished: false,
    status: 'PUBLISHED',
    createdAt: '2026-07-01T09:00:00Z',
  },
  {
    id: 'ex02',
    title: 'DBMS Lab Practical Exam',
    description: 'Hands-on practical exam. Students will write and execute complex queries and design schemas on Live SQL Server.',
    subjectId: 'sub2', // Database Management Systems
    subjectCode: 'CSE305',
    subjectName: 'Database Management Systems',
    sectionIds: ['sec2a', 'sec2b'], // Assigned to CSE-A and CSE-B
    sectionNames: ['CSE-A', 'CSE-B'],
    examDate: '2026-07-18T09:00:00Z',
    durationMinutes: 120, // 2 Hours
    roomNumber: 'Lab-4',
    type: 'PRACTICAL',
    totalMarks: 50,
    weightage: 20,
    isResultPublished: false,
    status: 'PUBLISHED',
    createdAt: '2026-07-02T10:30:00Z',
  },
  {
    id: 'ex03',
    title: 'DSA Internal Viva',
    description: 'Individual verbal assessment covering memory allocations, algorithms design, and code optimization.',
    subjectId: 'sub1', // Data Structures & Algorithms
    subjectCode: 'CSE201',
    subjectName: 'Data Structures & Algorithms',
    sectionIds: ['sec1a'],
    sectionNames: ['CSE-A'],
    examDate: '2026-07-02T14:00:00Z',
    durationMinutes: 15,
    roomNumber: 'Faculty Cabin-12',
    type: 'VIVA',
    totalMarks: 20,
    weightage: 10,
    isResultPublished: true, // Results published
    status: 'COMPLETED',
    createdAt: '2026-06-25T08:00:00Z',
  },
  {
    id: 'ex04',
    title: 'OS Quiz 1',
    description: 'Multiple choice questions on process synchronization, semaphores, and CPU scheduling.',
    subjectId: 'sub3', // Operating Systems
    subjectCode: 'CSE302',
    subjectName: 'Operating Systems',
    sectionIds: ['sec3a'],
    sectionNames: ['CSE-A'],
    examDate: '2026-07-25T11:00:00Z',
    durationMinutes: 30,
    roomNumber: 'Online Portal',
    type: 'ONLINE',
    totalMarks: 30,
    weightage: 10,
    isResultPublished: false,
    status: 'DRAFT', // Saved as draft
    createdAt: '2026-07-07T14:00:00Z',
  },
  {
    id: 'ex05',
    title: 'DBMS Mid Sem Theory',
    description: 'Theory exam covering Entity Relationship modeling, relational algebra, and normalization exercises.',
    subjectId: 'sub2', // Database Management Systems
    subjectCode: 'CSE305',
    subjectName: 'Database Management Systems',
    sectionIds: ['sec2a'],
    sectionNames: ['CSE-A'],
    examDate: '2026-06-15T10:00:00Z',
    durationMinutes: 90, // 1.5 Hours
    roomNumber: 'LH-202',
    type: 'THEORY',
    totalMarks: 50,
    weightage: 20,
    isResultPublished: true, // Results published
    status: 'ARCHIVED', // Archived record
    createdAt: '2026-06-01T09:00:00Z',
  },
];
