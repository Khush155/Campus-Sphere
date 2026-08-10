import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  useTheme,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  FreeBreakfastOutlined as LunchIcon,
  WbSunnyOutlined as MorningIcon,
  NightsStayOutlined as EveningIcon,
} from '@mui/icons-material';
import TimetableCard from './TimetableCard';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

// Morning Shift: 09:00 AM - 04:00 PM (60 mins per period, Lunch 01:00 PM - 02:00 PM)
const MORNING_PERIODS = [
  { id: 'm1', label: 'Period 1', time: '09:00 AM - 10:00 AM', start: 9, end: 10, startStr: '09:00', endStr: '10:00' },
  { id: 'm2', label: 'Period 2', time: '10:00 AM - 11:00 AM', start: 10, end: 11, startStr: '10:00', endStr: '11:00' },
  { id: 'm3', label: 'Period 3', time: '11:00 AM - 12:00 PM', start: 11, end: 12, startStr: '11:00', endStr: '12:00' },
  { id: 'm4', label: 'Period 4', time: '12:00 PM - 01:00 PM', start: 12, end: 13, startStr: '12:00', endStr: '13:00' },
  { id: 'm_lunch', label: 'Lunch Break ☕', time: '01:00 PM - 02:00 PM', start: 13, end: 14, isBreak: true },
  { id: 'm5', label: 'Period 5', time: '02:00 PM - 03:00 PM', start: 14, end: 15, startStr: '14:00', endStr: '15:00' },
  { id: 'm6', label: 'Period 6', time: '03:00 PM - 04:00 PM', start: 15, end: 16, startStr: '15:00', endStr: '16:00' },
];

// Evening Shift: 04:10 PM - 09:30 PM (50 mins per period, Recess 07:30 PM - 07:50 PM)
const EVENING_PERIODS = [
  { id: 'e1', label: 'Period 1', time: '04:10 PM - 05:00 PM', start: 16.166, end: 17, startStr: '16:10', endStr: '17:00' },
  { id: 'e2', label: 'Period 2', time: '05:00 PM - 05:50 PM', start: 17, end: 17.833, startStr: '17:00', endStr: '17:50' },
  { id: 'e3', label: 'Period 3', time: '05:50 PM - 06:40 PM', start: 17.833, end: 18.666, startStr: '17:50', endStr: '18:40' },
  { id: 'e4', label: 'Period 4', time: '06:40 PM - 07:30 PM', start: 18.666, end: 19.5, startStr: '18:40', endStr: '19:30' },
  { id: 'e_recess', label: 'Evening Recess Break ☕', time: '07:30 PM - 07:50 PM', start: 19.5, end: 19.833, isBreak: true },
  { id: 'e5', label: 'Period 5', time: '07:50 PM - 08:40 PM', start: 19.833, end: 20.666, startStr: '19:50', endStr: '20:40' },
  { id: 'e6', label: 'Period 6', time: '08:40 PM - 09:30 PM', start: 20.666, end: 21.5, startStr: '20:40', endStr: '21:30' },
];

const timeToHours = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, mins] = timeStr.split(':').map(Number);
  return (hours || 0) + (mins || 0) / 60;
};

export const TimetableGrid = ({ timetableData = [], defaultShift = 'MORNING', hideShiftToggle = false }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [activeShift, setActiveShift] = useState(defaultShift);

  React.useEffect(() => {
    if (defaultShift) {
      setActiveShift(defaultShift);
    }
  }, [defaultShift]);

  const activePeriods = activeShift === 'MORNING' ? MORNING_PERIODS : EVENING_PERIODS;

  return (
    <Paper id="timetable-print-area" sx={{ borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', overflowX: 'auto', bgcolor: isDark ? 'background.paper' : '#ffffff' }}>
      <Box sx={{ minWidth: 1000, p: 2.5 }}>
        {/* Shift Selector Toolbar */}
        {!hideShiftToggle && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, className: 'no-print' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary' }}>
              ACADEMIC SHIFT:
            </Typography>
            <ToggleButtonGroup
              value={activeShift}
              exclusive
              onChange={(_, val) => val && setActiveShift(val)}
              size="small"
              sx={{
                bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                p: 0.5,
                borderRadius: '10px',
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <ToggleButton
                value="MORNING"
                sx={{
                  px: 2,
                  py: 0.75,
                  borderRadius: '8px !important',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  textTransform: 'none',
                  gap: 1,
                  '&.Mui-selected': {
                    bgcolor: `${theme.palette.primary.main}18`,
                    color: theme.palette.primary.main,
                  },
                }}
              >
                <MorningIcon fontSize="small" />
                ☀️ Morning Shift (9 AM – 4 PM)
              </ToggleButton>

              <ToggleButton
                value="EVENING"
                sx={{
                  px: 2,
                  py: 0.75,
                  borderRadius: '8px !important',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  textTransform: 'none',
                  gap: 1,
                  '&.Mui-selected': {
                    bgcolor: `${theme.palette.secondary.main}18`,
                    color: theme.palette.secondary.main,
                  },
                }}
              >
                <EveningIcon fontSize="small" />
                🌙 Evening Shift (4:10 PM – 9:30 PM)
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
            {activeShift === 'MORNING' ? '60 Mins per Class • Lunch 1-2 PM' : '50 Mins per Class • Recess 7:30-7:50 PM'}
          </Typography>
        </Box>
        )}

        {/* Header Row: Period Title + Days of Week */}
        <Box sx={{ display: 'grid', gridTemplateColumns: `160px repeat(${DAYS.length}, 1fr)`, gap: 1.5, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', px: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.05em' }}>
              PERIOD / TIME
            </Typography>
          </Box>
          {DAYS.map((day) => (
            <Typography key={day} variant="subtitle2" sx={{ textAlign: 'center', fontWeight: 800, color: 'text.primary', py: 1.5, bgcolor: isDark ? 'action.hover' : 'rgba(79, 70, 229, 0.04)', borderRadius: 2 }}>
              {day}
            </Typography>
          ))}
        </Box>

        {/* Period Rows */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {activePeriods.map((period) => {
            if (period.isBreak) {
              return (
                <Paper
                  key={period.id}
                  variant="outlined"
                  sx={{
                    p: 1.25,
                    borderRadius: '12px',
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                    borderStyle: 'dashed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1.5,
                  }}
                >
                  <LunchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                    {period.label} ({period.time})
                  </Typography>
                </Paper>
              );
            }

            return (
              <Box key={period.id} sx={{ display: 'grid', gridTemplateColumns: `160px repeat(${DAYS.length}, 1fr)`, gap: 1.5, alignItems: 'stretch' }}>
                {/* Period Label Column */}
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: '12px',
                    bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(79, 70, 229, 0.03)',
                    border: `1px solid ${theme.palette.divider}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.82rem' }}>
                    {period.label}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.7rem' }}>
                    {period.time}
                  </Typography>
                </Box>

                {/* Days Cells */}
                {DAYS.map((day) => {
                  const matchingSlots = timetableData.filter((slot) => {
                    const slotDay = (slot.dayOfWeek || slot.day || '').toUpperCase();
                    if (slotDay !== day) return false;
                    const startH = timeToHours(slot.startTime);
                    const endH = timeToHours(slot.endTime);
                    return startH < period.end && endH > period.start;
                  });

                  return (
                    <Box
                      key={`${day}-${period.id}`}
                      sx={{
                        borderRadius: '12px',
                        minHeight: 85,
                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.015)' : 'rgba(0, 0, 0, 0.01)',
                        border: `1px solid ${theme.palette.divider}`,
                        p: matchingSlots.length > 0 ? 0.75 : 0,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                      }}
                    >
                      {matchingSlots.length > 0 ? (
                        matchingSlots.map((slot) => (
                          <Box key={slot.id || slot._id} sx={{ height: '100%' }}>
                            <TimetableCard slot={slot} />
                          </Box>
                        ))
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', py: 2 }}>
                          <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600 }}>
                            —
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>
            );
          })}
        </Box>
      </Box>
    </Paper>
  );
};

export default TimetableGrid;
