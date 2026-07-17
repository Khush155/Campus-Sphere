// client/src/pages/faculty/marks/marksConstants.js
//
// Shared constants for Faculty Marks module.

export const ASSESSMENT_TYPE_OPTIONS = [
  { value: 'ASSIGNMENT', label: 'Assignment' },
  { value: 'EXAM', label: 'Semester Exam' },
  { value: 'QUIZ', label: 'Class Quiz' },
  { value: 'PRACTICAL', label: 'Lab Practical' },
  { value: 'VIVA', label: 'Viva Voce' },
  { value: 'PROJECT', label: 'Project Review' },
];

export const GRADEBOOK_STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft', color: '#6b7280', description: 'Grades saved locally, visible only to faculty.' },
  { value: 'SUBMITTED', label: 'Submitted', color: '#3b82f6', description: 'Grades submitted to HOD/Admin for review.' },
  { value: 'APPROVED', label: 'Approved', color: '#a855f7', description: 'Grades approved by HOD, ready to publish.' },
  { value: 'PUBLISHED', label: 'Published', color: '#10b981', description: 'Grades published, visible on student portal.' },
  { value: 'ARCHIVED', label: 'Archived', color: '#9ca3af', description: 'Grades locked as historical records.' },
];
