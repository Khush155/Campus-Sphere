// client/src/pages/faculty/components/TodaysSchedule.jsx
//
// Displays the faculty member's class schedule for today.
// Shows each class with its time slot, subject, section, and room.
//
// Props:
//   classes — array of class objects from mockTodaysClasses:
//     [
//       {
//         id:       string  — unique identifier
//         subject:  string  — subject name (e.g. "Data Structures & Algorithms")
//         section:  string  — student section (e.g. "CSE-A")
//         time:     string  — time range (e.g. "09:00 AM - 10:00 AM")
//         room:     string  — classroom/lab (e.g. "Room 204")
//       }
//     ]
//
// Future: Data will come from GET /api/v1/timetable?facultyId=xxx&day=today.
// Adding an onClassClick prop will enable navigation to attendance marking.

import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  AccessTime as TimeIcon,
  Schedule as HeaderIcon,
  Room as RoomIcon,
  Groups as SectionIcon,
} from '@mui/icons-material';

export const TodaysSchedule = ({ classes }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      {/* ── Section Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
        <HeaderIcon color="primary" />
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, color: 'text.primary' }}
        >
          Today&apos;s Schedule
        </Typography>
        <Chip
          label={`${classes.length} class${classes.length !== 1 ? 'es' : ''}`}
          size="small"
          sx={{
            fontWeight: 600,
            fontSize: '0.7rem',
            height: 22,
            bgcolor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(79, 70, 229, 0.08)',
            color: 'primary.main',
          }}
        />
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* ── Class List ── */}
      {classes.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No classes scheduled for today.
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            Enjoy your day off! 🎉
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1.5}>
          {classes.map((classItem, index) => (
            <Box
              key={classItem.id}
              sx={{
                display: 'flex',
                alignItems: 'stretch',
                gap: 0,
                borderRadius: 2,
                overflow: 'hidden',
                bgcolor: 'action.hover',
                transition: 'background-color 0.2s ease',
                '&:hover': {
                  bgcolor: 'action.selected',
                },
              }}
            >
              {/* ── Left: Time Badge ── */}
              <Box
                sx={{
                  bgcolor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(79, 70, 229, 0.06)',
                  px: 2,
                  py: 1.5,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: { xs: 80, sm: 100 },
                  borderRight: `2px solid`,
                  borderColor: 'primary.main',
                }}
              >
                <TimeIcon
                  sx={{ fontSize: 16, color: 'primary.main', mb: 0.5 }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    color: 'primary.main',
                    textAlign: 'center',
                    lineHeight: 1.3,
                    fontSize: '0.68rem',
                  }}
                >
                  {classItem.time}
                </Typography>
              </Box>

              {/* ── Right: Class Details ── */}
              <Box
                sx={{
                  flex: 1,
                  px: 2,
                  py: 1.5,
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  justifyContent: 'space-between',
                  gap: 1,
                  minWidth: 0,
                }}
              >
                {/* Subject name — primary info */}
                <Box sx={{ minWidth: 0 }}>
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
                    {classItem.subject}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 500 }}
                  >
                    Class {index + 1} of {classes.length}
                  </Typography>
                </Box>

                {/* Section & Room chips */}
                <Stack
                  direction="row"
                  spacing={0.75}
                  sx={{ flexShrink: 0 }}
                >
                  {classItem.section && (
                    <Chip
                      icon={<SectionIcon sx={{ fontSize: 14 }} />}
                      label={classItem.section}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        height: 24,
                        bgcolor: isDark
                          ? 'rgba(34, 211, 238, 0.12)'
                          : 'rgba(6, 182, 212, 0.1)',
                        color: 'secondary.main',
                        '& .MuiChip-icon': { color: 'secondary.main' },
                      }}
                    />
                  )}
                  {classItem.room && (
                    <Chip
                      icon={<RoomIcon sx={{ fontSize: 14 }} />}
                      label={classItem.room}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        height: 24,
                        bgcolor: isDark
                          ? 'rgba(16, 185, 129, 0.12)'
                          : 'rgba(16, 185, 129, 0.1)',
                        color: '#10b981',
                        '& .MuiChip-icon': { color: '#10b981' },
                      }}
                    />
                  )}
                </Stack>
              </Box>
            </Box>
          ))}
        </Stack>
      )}
    </Paper>
  );
};

export default TodaysSchedule;
