// client/src/pages/faculty/components/AssignedSubjects.jsx
//
// Displays the list of subjects assigned to a faculty member.
// Subjects are the root entity for Attendance, Exams, Assignments, and Marks.
//
// Props:
//   subjects — array of subject objects from mockAssignedSubjects:
//     [
//       {
//         id:       string  — unique identifier
//         name:     string  — e.g. "Data Structures & Algorithms"
//         code:     string  — e.g. "CSE201"
//         credits:  number  — credit weight (1–6)
//         semester: string  — e.g. "3rd Sem" (optional, not in backend yet)
//       }
//     ]
//
// Future: subjects will come from GET /api/v1/faculty/:id (populated).
// Adding onSubjectClick prop later will enable navigation to subject views.

import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import {
  MenuBook as SubjectIcon,
  LibraryBooks as HeaderIcon,
} from '@mui/icons-material';

export const AssignedSubjects = ({ subjects }) => {
  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      {/* ── Section Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
        <HeaderIcon color="primary" />
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, color: 'text.primary' }}
        >
          My Subjects
        </Typography>
        {/* Subject count badge */}
        <Chip
          label={subjects.length}
          size="small"
          color="primary"
          sx={{ fontWeight: 700, fontSize: '0.75rem', height: 22, minWidth: 22 }}
        />
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* ── Subject List ── */}
      {subjects.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
          No subjects assigned yet.
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {subjects.map((subject) => (
            <Box
              key={subject.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: 'action.hover',
                transition: 'background-color 0.2s ease',
                '&:hover': {
                  bgcolor: 'action.selected',
                },
              }}
            >
              {/* Subject icon */}
              <Box
                sx={{
                  bgcolor: 'rgba(79, 70, 229, 0.08)',
                  color: 'primary.main',
                  p: 1,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SubjectIcon fontSize="small" />
              </Box>

              {/* Subject details */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: 'text.primary',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {subject.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {subject.code}
                </Typography>
              </Box>

              {/* Metadata chips */}
              <Stack
                direction="row"
                spacing={0.75}
                sx={{ flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end', gap: 0.75 }}
              >
                <Chip
                  label={`${subject.credits} Cr`}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: 24,
                    bgcolor: 'rgba(6, 182, 212, 0.1)',
                    color: 'secondary.main',
                  }}
                />
                {subject.semester && (
                  <Chip
                    label={subject.semester}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      height: 24,
                      bgcolor: 'rgba(16, 185, 129, 0.1)',
                      color: '#10b981',
                    }}
                  />
                )}
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
    </Paper>
  );
};

export default AssignedSubjects;
