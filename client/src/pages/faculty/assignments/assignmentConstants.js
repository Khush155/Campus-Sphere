// client/src/pages/faculty/assignments/assignmentConstants.js
//
// Shared constants for Faculty Assignments module.

export const ASSIGNMENT_STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft', color: '#6b7280', description: 'Saved as draft, not visible to students.' },
  { value: 'PUBLISHED', label: 'Published', color: '#10b981', description: 'Active assignment, accepting submissions.' },
  { value: 'CLOSED', label: 'Closed', color: '#ef4444', description: 'Due date passed, no longer accepting submissions.' },
  { value: 'ARCHIVED', label: 'Archived', color: '#3b82f6', description: 'Archived historical records, read-only.' },
];
