// client/src/pages/faculty/assignments/mockData.js
//
// Mock data for Phase 5.3 (Assignments Module UI).
// Intentionally matches backend Mongoose model properties to make
// future React Query integration seamless.

// ─────────────────────────────────────────────────────────────
// 1. Assignment Status Options (Lifecycle configuration)
// ─────────────────────────────────────────────────────────────
export const ASSIGNMENT_STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft', color: '#6b7280', description: 'Saved as draft, not visible to students.' },
  { value: 'PUBLISHED', label: 'Published', color: '#10b981', description: 'Active assignment, accepting submissions.' },
  { value: 'CLOSED', label: 'Closed', color: '#ef4444', description: 'Due date passed, no longer accepting submissions.' },
  { value: 'ARCHIVED', label: 'Archived', color: '#3b82f6', description: 'Archived historical records, read-only.' },
];

// ─────────────────────────────────────────────────────────────
// 2. Mock Assignments List
// ─────────────────────────────────────────────────────────────
// An assignment belongs to exactly ONE subject, but can be assigned
// to MULTIPLE sections.
export const mockAssignments = [
  {
    id: 'asg01',
    title: 'Binary Search Tree Implementation',
    description: 'Implement a Binary Search Tree (BST) class in JavaScript or C++ supporting insert, delete, search, and pre/in/post-order traversals. Submit complete source code and a brief explanation document.',
    subjectId: 'sub1', // Data Structures & Algorithms
    subjectCode: 'CSE201',
    subjectName: 'Data Structures & Algorithms',
    sectionIds: ['sec1a'], // Assigned to CSE-A
    sectionNames: ['CSE-A'],
    dueDate: '2026-07-15T23:59:59Z',
    maxMarks: 100,
    status: 'PUBLISHED',
    attachments: [
      { name: 'BST_Guidelines.pdf', url: 'https://campus.edu/resources/BST_Guidelines.pdf' },
      { name: 'BST_TestCases.zip', url: 'https://campus.edu/resources/BST_TestCases.zip' },
    ],
    createdAt: '2026-07-05T09:00:00Z',
  },
  {
    id: 'asg02',
    title: 'SQL Joins and Normalization Exercises',
    description: 'Solve the normalization worksheet up to 3NF/BCNF. Write SQL queries for complex joins, aggregations, and subqueries on the provided university database schema.',
    subjectId: 'sub2', // Database Management Systems
    subjectCode: 'CSE305',
    subjectName: 'Database Management Systems',
    sectionIds: ['sec2a', 'sec2b'], // Assigned to BOTH CSE-A and CSE-B
    sectionNames: ['CSE-A', 'CSE-B'],
    dueDate: '2026-07-20T23:59:59Z',
    maxMarks: 50,
    status: 'PUBLISHED',
    attachments: [
      { name: 'Database_Normalization_Sheet.pdf', url: 'https://campus.edu/resources/Database_Normalization_Sheet.pdf' },
    ],
    createdAt: '2026-07-06T10:30:00Z',
  },
  {
    id: 'asg03',
    title: 'Recursion Basics and Induction Proofs',
    description: 'Complete the recursion worksheet containing 5 programming challenges and write mathematical induction proofs for their time complexities.',
    subjectId: 'sub1', // Data Structures & Algorithms
    subjectCode: 'CSE201',
    subjectName: 'Data Structures & Algorithms',
    sectionIds: ['sec1a'],
    sectionNames: ['CSE-A'],
    dueDate: '2026-07-01T23:59:59Z',
    maxMarks: 25,
    status: 'CLOSED', // Past due date, no submissions allowed
    attachments: [],
    createdAt: '2026-06-20T08:00:00Z',
  },
  {
    id: 'asg04',
    title: 'CPU Scheduling Algorithms Simulation',
    description: 'Write a simulation script in Python to compare FCFS, SJF, Priority, and Round Robin scheduling algorithms. Generate tables comparing average waiting and turnaround times.',
    subjectId: 'sub3', // Operating Systems
    subjectCode: 'CSE302',
    subjectName: 'Operating Systems',
    sectionIds: ['sec3a'],
    sectionNames: ['CSE-A'],
    dueDate: '2026-07-30T23:59:59Z',
    maxMarks: 100,
    status: 'DRAFT', // Hidden from students
    attachments: [],
    createdAt: '2026-07-07T14:00:00Z',
  },
  {
    id: 'asg05',
    title: 'Entity Relationship Diagram Mini Project',
    description: 'Design a comprehensive Entity Relationship Diagram for an e-commerce platform schema, highlighting all entities, relationships, attributes, primary/foreign keys, and cardinalities.',
    subjectId: 'sub2', // Database Management Systems
    subjectCode: 'CSE305',
    subjectName: 'Database Management Systems',
    sectionIds: ['sec2a'],
    sectionNames: ['CSE-A'],
    dueDate: '2026-06-25T18:00:00Z',
    maxMarks: 100,
    status: 'ARCHIVED', // Archived historical record
    attachments: [],
    createdAt: '2026-06-10T09:00:00Z',
  },
];

// ─────────────────────────────────────────────────────────────
// 3. Mock Student Submissions List
// ─────────────────────────────────────────────────────────────
// Submissions linked to 'asg01' (Binary Search Tree Implementation)
// Student details match the core mockStudentsList from the Attendance module.
export const mockSubmissions = [
  {
    id: 'subm01',
    assignmentId: 'asg01',
    studentId: 'stu01',
    studentName: 'Aarav Patel',
    rollNumber: '2024CSE001',
    submittedAt: '2026-07-08T10:15:00Z',
    status: 'GRADED',
    fileUrl: 'https://campus.edu/submissions/stu01_bst.zip',
    fileName: 'stu01_bst.zip',
    marksObtained: 95,
    feedback: 'Excellent BST implementation. Clean code layout, correct delete node balancing logic, and comprehensive test suite.',
    gradedBy: 'Dr. Ananya Sharma',
  },
  {
    id: 'subm02',
    assignmentId: 'asg01',
    studentId: 'stu02',
    studentName: 'Priya Sharma',
    rollNumber: '2024CSE002',
    submittedAt: '2026-07-08T11:00:00Z',
    status: 'SUBMITTED', // Awaiting grading
    fileUrl: 'https://campus.edu/submissions/priya_s_bst.zip',
    fileName: 'priya_s_bst.zip',
    marksObtained: null,
    feedback: '',
    gradedBy: null,
  },
  {
    id: 'subm03',
    assignmentId: 'asg01',
    studentId: 'stu03',
    studentName: 'Rohan Gupta',
    rollNumber: '2024CSE003',
    submittedAt: '2026-07-16T02:30:00Z', // Submitted AFTER due date (2026-07-15)
    status: 'LATE', // Marked as late submission
    fileUrl: 'https://campus.edu/submissions/rohan_g_bst.zip',
    fileName: 'rohan_g_bst.zip',
    marksObtained: null,
    feedback: '',
    gradedBy: null,
  },
  {
    id: 'subm04',
    assignmentId: 'asg01',
    studentId: 'stu04',
    studentName: 'Ananya Verma',
    rollNumber: '2024CSE004',
    submittedAt: '2026-07-07T14:20:00Z',
    status: 'GRADED',
    fileUrl: 'https://campus.edu/submissions/ananya_bst.zip',
    fileName: 'ananya_bst.zip',
    marksObtained: 80,
    feedback: 'Correct implementation, but check standard tree traversals. In-order traversal did not print nodes sorted.',
    gradedBy: 'Dr. Ananya Sharma',
  },
];

// Helper mapping to translate student IDs to usernames easily
export const getStudentName = (studentId) => {
  const students = {
    stu01: 'Aarav Patel',
    stu02: 'Priya Sharma',
    stu03: 'Rohan Gupta',
    stu04: 'Ananya Verma',
    stu05: 'Vikram Singh',
    stu06: 'Sneha Reddy',
    stu07: 'Arjun Kumar',
    stu08: 'Meera Nair',
    stu09: 'Karthik Iyer',
    stu10: 'Pooja Deshmukh',
  };
  return students[studentId] || 'Unknown Student';
};
