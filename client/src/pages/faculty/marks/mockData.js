// client/src/pages/faculty/marks/mockData.js
//
// Mock data for Phase 5.5 (Marks Module UI).
// Intentionally matches backend Mongoose model structures to make
// future React Query integration seamless.

// ─────────────────────────────────────────────────────────────
// 1. Assessment Type Options
// ─────────────────────────────────────────────────────────────
export const ASSESSMENT_TYPE_OPTIONS = [
  { value: 'ASSIGNMENT', label: 'Assignment' },
  { value: 'EXAM', label: 'Semester Exam' },
  { value: 'QUIZ', label: 'Class Quiz' },
  { value: 'PRACTICAL', label: 'Lab Practical' },
  { value: 'VIVA', label: 'Viva Voce' },
  { value: 'PROJECT', label: 'Project Review' },
];

// ─────────────────────────────────────────────────────────────
// 2. Gradebook Status Options (Administrative Lifecycle)
// ─────────────────────────────────────────────────────────────
export const GRADEBOOK_STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft', color: '#6b7280', description: 'Grades saved locally, visible only to faculty.' },
  { value: 'SUBMITTED', label: 'Submitted', color: '#3b82f6', description: 'Grades submitted to HOD/Admin for review.' },
  { value: 'APPROVED', label: 'Approved', color: '#a855f7', description: 'Grades approved by HOD, ready to publish.' },
  { value: 'PUBLISHED', label: 'Published', color: '#10b981', description: 'Grades published, visible on student portal.' },
  { value: 'ARCHIVED', label: 'Archived', color: '#9ca3af', description: 'Grades locked as historical records.' },
];

// ─────────────────────────────────────────────────────────────
// 3. Mock Available Assessments
// ─────────────────────────────────────────────────────────────
// When a faculty selects a subject and section, they select which
// specific assessment they want to enter marks for.
export const mockAssessments = [
  {
    id: 'asg01',
    title: 'Binary Search Tree Implementation',
    assessmentType: 'ASSIGNMENT',
    subjectId: 'sub1', // Data Structures & Algorithms
    sectionId: 'sec1a', // CSE-A
    maxMarks: 50,
  },
  {
    id: 'asg02',
    title: 'SQL Schema Design',
    assessmentType: 'ASSIGNMENT',
    subjectId: 'sub2', // Database Management Systems
    sectionId: 'sec2a', // CSE-A
    maxMarks: 30,
  },
  {
    id: 'ex01',
    title: 'DSA End Semester Theory',
    assessmentType: 'EXAM',
    subjectId: 'sub1', // Data Structures & Algorithms
    sectionId: 'sec1a',
    maxMarks: 100,
  },
  {
    id: 'ex02',
    title: 'DBMS Lab Practical',
    assessmentType: 'PRACTICAL',
    subjectId: 'sub2',
    sectionId: 'sec2a',
    maxMarks: 50,
  },
  {
    id: 'viv01',
    title: 'DSA Internal Viva',
    assessmentType: 'VIVA',
    subjectId: 'sub1',
    sectionId: 'sec1a',
    maxMarks: 20,
  },
  {
    id: 'proj01',
    title: 'ERP Term Project Presentation',
    assessmentType: 'PROJECT',
    subjectId: 'sub2',
    sectionId: 'sec2a',
    maxMarks: 100,
  },
];

// Helper to resolve student display name and roll number
const STUDENTS_MAP = {
  stu01: { name: 'Aarav Patel', rollNumber: '2024CSE001' },
  stu02: { name: 'Priya Sharma', rollNumber: '2024CSE002' },
  stu03: { name: 'Rohan Gupta', rollNumber: '2024CSE003' },
  stu04: { name: 'Ananya Verma', rollNumber: '2024CSE004' },
  stu05: { name: 'Vikram Singh', rollNumber: '2024CSE005' },
  stu06: { name: 'Sneha Reddy', rollNumber: '2024CSE006' },
  stu07: { name: 'Arjun Kumar', rollNumber: '2024CSE007' },
  stu08: { name: 'Meera Nair', rollNumber: '2024CSE008' },
  stu09: { name: 'Karthik Iyer', rollNumber: '2024CSE009' },
  stu10: { name: 'Pooja Deshmukh', rollNumber: '2024CSE010' },
  stu11: { name: 'Rahul Joshi', rollNumber: '2024CSE011' },
  stu12: { name: 'Ishita Banerjee', rollNumber: '2024CSE012' },
  stu13: { name: 'Aditya Malhotra', rollNumber: '2024CSE013' },
  stu14: { name: 'Kavya Krishnan', rollNumber: '2024CSE014' },
  stu15: { name: 'Nikhil Agarwal', rollNumber: '2024CSE015' },
  stu16: { name: 'Divya Menon', rollNumber: '2024CSE016' },
  stu17: { name: 'Siddharth Rao', rollNumber: '2024CSE017' },
  stu18: { name: 'Tanvi Chauhan', rollNumber: '2024CSE018' },
  stu19: { name: 'Harsh Trivedi', rollNumber: '2024CSE019' },
  stu20: { name: 'Riya Kapoor', rollNumber: '2024CSE020' },
};

// ─────────────────────────────────────────────────────────────
// 4. Mock Gradebooks Records
// ─────────────────────────────────────────────────────────────
// Gradebooks are keyed by assessmentId. If no gradebook exists,
// the UI will render an empty entry sheet.
export const mockGradebooks = {
  // ── Assignment 1 (Published & Visible to Students) ──
  asg01: {
    assessmentId: 'asg01',
    subjectId: 'sub1',
    sectionId: 'sec1a',
    maxMarks: 50,
    status: 'PUBLISHED',
    isPublished: true,
    records: [
      { studentId: 'stu01', marksObtained: 45, maxMarks: 50, grade: 'A', remarks: 'Excellent traversal logic.' },
      { studentId: 'stu02', marksObtained: 48, maxMarks: 50, grade: 'A+', remarks: 'Flawless code with detailed README.' },
      { studentId: 'stu03', marksObtained: null, maxMarks: 50, grade: 'F', remarks: 'Absent (Submissions closed).' }, // Absent
      { studentId: 'stu04', marksObtained: 38, maxMarks: 50, grade: 'B', remarks: 'Tree balance check missing.' },
      { studentId: 'stu05', marksObtained: 42, maxMarks: 50, grade: 'A', remarks: 'Well-structured recursive methods.' },
      { studentId: 'stu06', marksObtained: 28, maxMarks: 50, grade: 'C', remarks: 'Compilation warnings on insert operations.' },
      { studentId: 'stu07', marksObtained: 40, maxMarks: 50, grade: 'B+', remarks: 'Good implementation, clean formatting.' },
      { studentId: 'stu08', marksObtained: 15, maxMarks: 50, grade: 'F', remarks: 'Incomplete codebase submitted.' }, // Failed
      { studentId: 'stu09', marksObtained: 35, maxMarks: 50, grade: 'B', remarks: 'Missing deletion logic completely.' },
      { studentId: 'stu10', marksObtained: 46, maxMarks: 50, grade: 'A', remarks: 'Very clean implementation.' },
      { studentId: 'stu11', marksObtained: 39, maxMarks: 50, grade: 'B+', remarks: 'Edge cases handled well.' },
      { studentId: 'stu12', marksObtained: 43, maxMarks: 50, grade: 'A', remarks: 'Strong OOP foundations visible.' },
      { studentId: 'stu13', marksObtained: 32, maxMarks: 50, grade: 'C', remarks: 'Memory management issues.' },
      { studentId: 'stu14', marksObtained: 47, maxMarks: 50, grade: 'A+', remarks: 'Top notch code performance.' },
      { studentId: 'stu15', marksObtained: null, maxMarks: 50, grade: 'F', remarks: 'Absent.' }, // Absent
      { studentId: 'stu16', marksObtained: 41, maxMarks: 50, grade: 'A', remarks: 'Great visualization drawings.' },
      { studentId: 'stu17', marksObtained: 36, maxMarks: 50, grade: 'B', remarks: 'Iterative solutions used correctly.' },
      { studentId: 'stu18', marksObtained: 44, maxMarks: 50, grade: 'A', remarks: 'Correct Big-O evaluations.' },
      { studentId: 'stu19', marksObtained: 30, maxMarks: 50, grade: 'C', remarks: 'Struggled with tree rotations.' },
      { studentId: 'stu20', marksObtained: 45, maxMarks: 50, grade: 'A', remarks: 'Well documented node structures.' },
    ].map(rec => ({ ...rec, ...STUDENTS_MAP[rec.studentId] })),
  },

  // ── Exam 1 (Draft Mode - Visible only to Faculty) ──
  ex01: {
    assessmentId: 'ex01',
    subjectId: 'sub1',
    sectionId: 'sec1a',
    maxMarks: 100,
    status: 'DRAFT',
    isPublished: false,
    records: [
      { studentId: 'stu01', marksObtained: 82, maxMarks: 100, grade: 'A', remarks: 'Solid paper. Lost marks in AVL tree calculations.' },
      { studentId: 'stu02', marksObtained: 95, maxMarks: 100, grade: 'O', remarks: 'Outstanding performance.' },
      { studentId: 'stu03', marksObtained: 52, maxMarks: 100, grade: 'D', remarks: 'Needs to focus on algorithmic analysis.' },
      { studentId: 'stu04', marksObtained: 74, maxMarks: 100, grade: 'B+', remarks: 'Correct answers but lacks detail.' },
      { studentId: 'stu05', marksObtained: 88, maxMarks: 100, grade: 'A', remarks: 'Excellent explanations on heap properties.' },
      { studentId: 'stu06', marksObtained: 46, maxMarks: 100, grade: 'E', remarks: 'Barely passing. Revise sorting algorithms.' },
      { studentId: 'stu07', marksObtained: 80, maxMarks: 100, grade: 'A', remarks: 'Good conceptual understanding.' },
      { studentId: 'stu08', marksObtained: 34, maxMarks: 100, grade: 'F', remarks: 'Failed. Insufficient preparation.' }, // Failed
      { studentId: 'stu09', marksObtained: 68, maxMarks: 100, grade: 'B', remarks: 'Average answers.' },
      { studentId: 'stu10', marksObtained: 90, maxMarks: 100, grade: 'O', remarks: 'Very clear answers.' },
      { studentId: 'stu11', marksObtained: 71, maxMarks: 100, grade: 'B', remarks: 'Revise graph searches.' },
      { studentId: 'stu12', marksObtained: 85, maxMarks: 100, grade: 'A', remarks: 'Well-structured paper.' },
      { studentId: 'stu13', marksObtained: 60, maxMarks: 100, grade: 'C', remarks: 'Lost marks on complex proofs.' },
      { studentId: 'stu14', marksObtained: 92, maxMarks: 100, grade: 'O', remarks: 'Excellent analysis of hash functions.' },
      { studentId: 'stu15', marksObtained: 58, maxMarks: 100, grade: 'C', remarks: 'Struggled with runtime notations.' },
      { studentId: 'stu16', marksObtained: 81, maxMarks: 100, grade: 'A', remarks: 'Good grasp of dynamic programming.' },
      { studentId: 'stu17', marksObtained: 76, maxMarks: 100, grade: 'B+', remarks: 'Good answers, revise greedy setups.' },
      { studentId: 'stu18', marksObtained: 89, maxMarks: 100, grade: 'A', remarks: 'Excellent recursion tree breakdowns.' },
      { studentId: 'stu19', marksObtained: 40, maxMarks: 100, grade: 'F', remarks: 'Failed. Weak fundamentals.' }, // Failed
      { studentId: 'stu20', marksObtained: 84, maxMarks: 100, grade: 'A', remarks: 'Good paper.' },
    ].map(rec => ({ ...rec, ...STUDENTS_MAP[rec.studentId] })),
  },

  // ── Viva 1 (Approved by HOD but not yet Published to Students) ──
  viv01: {
    assessmentId: 'viv01',
    subjectId: 'sub1',
    sectionId: 'sec1a',
    maxMarks: 20,
    status: 'APPROVED',
    isPublished: false,
    records: [
      { studentId: 'stu01', marksObtained: 18, maxMarks: 20, grade: 'A+', remarks: 'Clear and quick responses.' },
      { studentId: 'stu02', marksObtained: 20, maxMarks: 20, grade: 'O', remarks: 'Exceptional verbal performance.' },
      { studentId: 'stu03', marksObtained: 12, maxMarks: 20, grade: 'B', remarks: 'Struggled with stack definitions.' },
      { studentId: 'stu04', marksObtained: 15, maxMarks: 20, grade: 'A', remarks: 'Answered graph questions correctly.' },
      { studentId: 'stu05', marksObtained: 17, maxMarks: 20, grade: 'A+', remarks: 'Confidently explained memory stack frames.' },
      { studentId: 'stu06', marksObtained: 10, maxMarks: 20, grade: 'C', remarks: 'Lacks confidence in binary tree traversals.' },
      { studentId: 'stu07', marksObtained: 16, maxMarks: 20, grade: 'A', remarks: 'Good explanations.' },
      { studentId: 'stu08', marksObtained: 8, maxMarks: 20, grade: 'F', remarks: 'Unable to explain time complexity definitions.' }, // Failed
      { studentId: 'stu09', marksObtained: 14, maxMarks: 20, grade: 'B+', remarks: 'Good grasp of arrays vs linked lists.' },
      { studentId: 'stu10', marksObtained: 19, maxMarks: 20, grade: 'O', remarks: 'Flawless answers.' },
      { studentId: 'stu11', marksObtained: 15, maxMarks: 20, grade: 'A', remarks: 'Explained queue buffering correctly.' },
      { studentId: 'stu12', marksObtained: 17, maxMarks: 20, grade: 'A+', remarks: 'Excellent understanding of recursion depth.' },
      { studentId: 'stu13', marksObtained: 11, maxMarks: 20, grade: 'C', remarks: 'Struggled with sorting bounds.' },
      { studentId: 'stu14', marksObtained: 19, maxMarks: 20, grade: 'O', remarks: 'Extremely strong pointers understanding.' },
      { studentId: 'stu15', marksObtained: null, maxMarks: 20, grade: 'F', remarks: 'Absent.' }, // Absent
      { studentId: 'stu16', marksObtained: 16, maxMarks: 20, grade: 'A', remarks: 'Good responses on hashing.' },
      { studentId: 'stu17', marksObtained: 14, maxMarks: 20, grade: 'B+', remarks: 'Decent, understand heap queues.' },
      { studentId: 'stu18', marksObtained: 18, maxMarks: 20, grade: 'A+', remarks: 'Answers were accurate and detailed.' },
      { studentId: 'stu19', marksObtained: 9, maxMarks: 20, grade: 'D', remarks: 'Weak answers on basic lists.' },
      { studentId: 'stu20', marksObtained: 17, maxMarks: 20, grade: 'A+', remarks: 'Very clear conceptual understanding.' },
    ].map(rec => ({ ...rec, ...STUDENTS_MAP[rec.studentId] })),
  },
};
