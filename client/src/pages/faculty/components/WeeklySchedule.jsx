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
  Button,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  CalendarMonth as HeaderIcon,
  Circle as DotIcon,
  ArrowForward as ArrowIcon,
  DateRangeOutlined as TimetableIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export const WeeklySchedule = ({ schedule = [] }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === 'dark';

  const todayName = useMemo(() => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' });
  }, []);

  const MAX_DAYS = 4;
  const displayedSchedule = useMemo(() => {
    if (!Array.isArray(schedule)) return [];
    // Prioritize today's entry and upcoming days, or first 4 days
    return schedule.slice(0, MAX_DAYS);
  }, [schedule]);

  return (
    <Paper sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
      {/* ── Section Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HeaderIcon color="primary" />
          <Typography
            variant="h6"
            sx={{ fontWeight: 800, color: 'text.primary' }}
          >
            Weekly Schedule Overview
          </Typography>
        </Box>

        <Button
          size="small"
          variant="outlined"
          startIcon={<TimetableIcon />}
          onClick={() => navigate('/timetable')}
          sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem' }}
        >
          Full Matrix
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* ── Schedule Grid (Scrollable) ── */}
      {displayedSchedule.length === 0 ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ py: 3, textAlign: 'center' }}
        >
          No schedule data available.
        </Typography>
      ) : (
        <Box
          sx={{
            maxHeight: 270,
            overflowY: 'auto',
            pr: 0.5,
            '&::-webkit-scrollbar': { width: '5px' },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': { background: (theme) => theme.palette.divider, borderRadius: '4px' },
          }}
        >
          <Stack spacing={0}>
          {displayedSchedule.map((dayEntry) => {
            const isToday = dayEntry.day === todayName;

            return (
              <Box
                key={dayEntry.day}
                sx={{
                  display: 'flex',
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: { xs: 1, sm: 2 },
                  py: 1.25,
                  px: 2,
                  borderRadius: 2,
                  bgcolor: isToday
                    ? isDark
                      ? 'rgba(99, 102, 241, 0.1)'
                      : 'rgba(79, 70, 229, 0.05)'
                    : 'transparent',
                  borderLeft: isToday ? '3px solid' : '3px solid transparent',
                  borderColor: isToday ? 'primary.main' : 'transparent',
                  transition: 'background-color 0.2s ease',
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
                      fontWeight: isToday ? 800 : 600,
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
                          fontWeight: 800,
                          color: 'primary.main',
                          fontSize: '0.65rem',
                        }}
                      >
                        TODAY
                      </Typography>
                    )}
                  </Typography>
                </Box>

                {/* Class chips */}
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 0.75,
                    flex: 1,
                    pl: { xs: 2.5, sm: 0 },
                  }}
                >
                  {dayEntry.classes && dayEntry.classes.length > 0 ? (
                    dayEntry.classes.map((className, index) => (
                      <Chip
                        key={`${dayEntry.day}-${index}`}
                        label={className}
                        size="small"
                        variant="outlined"
                        sx={{
                          fontWeight: 600,
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
                      No lectures scheduled
                    </Typography>
                  )}
                </Box>

                {/* Class count badge */}
                <Chip
                  label={dayEntry.classes ? dayEntry.classes.length : 0}
                  size="small"
                  sx={{
                    display: { xs: 'none', sm: 'flex' },
                    fontWeight: 800,
                    fontSize: '0.7rem',
                    height: 22,
                    minWidth: 22,
                    bgcolor: dayEntry.classes && dayEntry.classes.length > 0
                      ? isToday
                        ? isDark
                          ? 'rgba(99, 102, 241, 0.15)'
                          : 'rgba(79, 70, 229, 0.08)'
                        : 'action.hover'
                      : 'transparent',
                    color: dayEntry.classes && dayEntry.classes.length > 0
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
        </Box>
      )}

      {/* Footer link to dedicated timetable page */}
      <Box sx={{ mt: 2, pt: 1.5, borderTop: (theme) => `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          Previewing 4 of 6 weekdays
        </Typography>
        <Button
          size="small"
          color="primary"
          endIcon={<ArrowIcon fontSize="small" />}
          onClick={() => navigate('/timetable')}
          sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.78rem' }}
        >
          Open Full Interactive Timetable Grid
        </Button>
      </Box>
    </Paper>
  );
};

export default WeeklySchedule;
