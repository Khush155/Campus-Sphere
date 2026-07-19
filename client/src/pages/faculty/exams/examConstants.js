// client/src/pages/faculty/exams/examConstants.js
//
// Shared constants for Faculty Exams module.

export const EXAM_STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft', color: '#6b7280', description: 'Saved as draft, not visible to students.' },
  { value: 'PUBLISHED', label: 'Published', color: '#3b82f6', description: 'Exam scheduled, visible to students.' },
  { value: 'ONGOING', label: 'Ongoing', color: '#f97316', description: 'Exam currently in progress.' },
  { value: 'COMPLETED', label: 'Completed', color: '#10b981', description: 'Exam conducted successfully.' },
  { value: 'ARCHIVED', label: 'Archived', color: '#9ca3af', description: 'Archived historical records.' },
];

export const EXAM_TYPE_OPTIONS = [
  { value: 'THEORY', label: 'Theory Exam', color: '#8b5cf6' },
  { value: 'PRACTICAL', label: 'Practical Exam', color: '#06b6d4' },
  { value: 'ONLINE', label: 'Online Exam', color: '#ec4899' },
  { value: 'VIVA', label: 'Viva Voce', color: '#eab308' },
];
