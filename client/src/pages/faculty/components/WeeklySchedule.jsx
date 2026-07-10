// client/src/pages/faculty/components/WeeklySchedule.jsx
//
// Compact weekly overview of the faculty member's teaching schedule.
// Shows each day of the week with its classes as chips.
// Highlights today's row for quick orientation.
//
// Props:
//   schedule — array from mockWeeklySchedule:
//     [
//       {
//         day:     string    — e.g. "Monday"
//         classes: string[]  — e.g. ["DSA - 9:00 AM", "DBMS - 11:00 AM"]
//       }
//     ]
//
// Future: Data will come from GET /api/v1/timetable?facultyId=xxx,
// mapped by FacultyDashboard into this shape.

import React, { useMemo } from 'react';
import {
  Paper,
  Typography,
  Box,
  Chip,
  Divider,
  Stack,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  CalendarMonth as HeaderIcon,
  Circle as DotIcon,
} from '@mui/icons-material';

export const WeeklySchedule = ({ schedule }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Compute today's day name once per render — does not change during session.
  // useMemo with empty deps = compute on mount, reuse on re-renders.
  const todayName = useMemo(() => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' });
  }, []);

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      {/* ── Section Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
        <HeaderIcon color="primary" />
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, color: 'text.primary' }}
        >
          Weekly Schedule
        </Typography>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* ── Schedule Grid ── */}
      {schedule.length === 0 ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ py: 3, textAlign: 'center' }}
        >
          No schedule data available.
        </Typography>
      ) : (
        <Stack spacing={0}>
          {schedule.map((dayEntry) => {
            const isToday = dayEntry.day === todayName;

            return (
              <Box
                key={dayEntry.day}
                sx={{
                  display: 'flex',
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: { xs: 1, sm: 2 },
                  py: 1.5,
                  px: 2,
                  borderRadius: 2,
                  // Highlight today's row
                  bgcolor: isToday
                    ? isDark
                      ? 'rgba(99, 102, 241, 0.1)'
                      : 'rgba(79, 70, 229, 0.05)'
                    : 'transparent',
                  borderLeft: isToday ? '3px solid' : '3px solid transparent',
                  borderColor: isToday ? 'primary.main' : 'transparent',
                  transition: 'background-color 0.2s ease',
                  // Subtle separator between days
                  '&:not(:last-child)': {
                    borderBottom: '1px solid',
                    borderBottomColor: 'divider',
                  },
                }}
              >
                {/* Day name */}
                <Box
                  sx={{
                    minWidth: { xs: 'auto', sm: 100 },
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <DotIcon
                    sx={{
                      fontSize: 8,
                      color: isToday ? 'primary.main' : 'text.secondary',
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isToday ? 700 : 600,
                      color: isToday ? 'primary.main' : 'text.primary',
                      minWidth: 80,
                    }}
                  >
                    {dayEntry.day}
                    {isToday && (
                      <Typography
                        component="span"
                        variant="caption"
                        sx={{
                          ml: 0.75,
                          fontWeight: 600,
                          color: 'primary.main',
                          fontSize: '0.65rem',
                        }}
                      >
                        TODAY
                      </Typography>
                    )}
                  </Typography>
                </Box>

                {/* Class chips or empty indicator */}
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 0.75,
                    flex: 1,
                    pl: { xs: 2.5, sm: 0 },
                  }}
                >
                  {dayEntry.classes.length > 0 ? (
                    dayEntry.classes.map((className, index) => (
                      <Chip
                        key={`${dayEntry.day}-${index}`}
                        label={className}
                        size="small"
                        variant="outlined"
                        sx={{
                          fontWeight: 500,
                          fontSize: '0.7rem',
                          height: 24,
                          borderColor: isToday
                            ? 'primary.main'
                            : 'divider',
                          color: isToday
                            ? 'primary.main'
                            : 'text.secondary',
                        }}
                      />
                    ))
                  ) : (
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        fontStyle: 'italic',
                        py: 0.25,
                      }}
                    >
                      No classes
                    </Typography>
                  )}
                </Box>

                {/* Class count badge — visible on desktop */}
                <Chip
                  label={dayEntry.classes.length}
                  size="small"
                  sx={{
                    display: { xs: 'none', sm: 'flex' },
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    height: 22,
                    minWidth: 22,
                    bgcolor: dayEntry.classes.length > 0
                      ? isToday
                        ? isDark
                          ? 'rgba(99, 102, 241, 0.15)'
                          : 'rgba(79, 70, 229, 0.08)'
                        : 'action.hover'
                      : 'transparent',
                    color: dayEntry.classes.length > 0
                      ? isToday
                        ? 'primary.main'
                        : 'text.secondary'
                      : 'text.disabled',
                  }}
                />
              </Box>
            );
          })}
        </Stack>
      )}
    </Paper>
  );
};

export default WeeklySchedule;
