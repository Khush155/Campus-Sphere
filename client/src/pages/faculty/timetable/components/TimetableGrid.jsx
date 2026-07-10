// client/src/pages/faculty/timetable/components/TimetableGrid.jsx
//
// Presentational component rendering a 2D calendar table.
// Maps Weekdays as columns and Period time slots as rows, plotting slots.

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import TimetableCard from './TimetableCard';
import { WEEKDAYS, TIME_SLOTS } from '../mockData';

export const TimetableGrid = ({ timetableData = [] }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Helper to match a schedule entry with a weekday column & period row
  const getSlotForIntersection = (dayValue, period) => {
    return timetableData.find((slot) => {
      const dayMatch = slot.dayOfWeek === dayValue;
      
      // A slot falls into this period if it starts at the period's startTime
      const timeMatch = slot.startTime === period.startTime;

      return dayMatch && timeMatch;
    });
  };

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      variant="outlined"
      sx={{
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden',
        bgcolor: isDark ? 'background.paper' : '#ffffff',
      }}
    >
      <Table
        sx={{
          minWidth: 900,
          tableLayout: 'fixed',
          borderCollapse: 'collapse',
          '& td, & th': {
            border: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        {/* Table Head: Day Headers */}
        <TableHead>
          <TableRow
            sx={{
              bgcolor: isDark ? 'action.hover' : 'rgba(79, 70, 229, 0.04)',
            }}
          >
            {/* Header: Periods Column */}
            <TableCell
              align="center"
              sx={{
                fontWeight: 800,
                width: '15%',
                py: 2.5,
                color: 'text.primary',
              }}
            >
              Time Period
            </TableCell>

            {/* Headers: Monday to Friday */}
            {WEEKDAYS.map((day) => (
              <TableCell
                key={day.value}
                align="center"
                sx={{
                  fontWeight: 800,
                  width: '17%',
                  py: 2.5,
                  color: 'text.primary',
                }}
              >
                {day.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        {/* Table Body: Periods Rows */}
        <TableBody>
          {TIME_SLOTS.map((period) => (
            <TableRow key={period.id}>
              {/* Period row label cell */}
              <TableCell
                align="center"
                sx={{
                  bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)',
                  py: 3,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  {period.startTime} - {period.endTime}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mt: 0.5, display: 'block' }}>
                  {period.id.toUpperCase()}
                </Typography>
              </TableCell>

              {/* Intersecting slots for each day */}
              {WEEKDAYS.map((day) => {
                const slot = getSlotForIntersection(day.value, period);

                return (
                  <TableCell
                    key={`${day.value}-${period.id}`}
                    sx={{
                      p: slot ? 1.5 : 1,
                      verticalAlign: 'middle',
                      height: 150,
                      boxSizing: 'border-box',
                      bgcolor: !slot ? (isDark ? 'transparent' : 'rgba(250, 250, 250, 0.4)') : 'inherit',
                    }}
                  >
                    {slot ? (
                      <TimetableCard slot={slot} />
                    ) : (
                      /* Empty Slot Display */
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '100%',
                          minHeight: 120,
                          borderRadius: 2,
                          border: `1px dashed ${theme.palette.divider}`,
                          bgcolor: isDark ? 'rgba(0,0,0,0.1)' : 'rgba(0, 0, 0, 0.01)',
                        }}
                      >
                        <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600 }}>
                          No Class
                        </Typography>
                      </Box>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TimetableGrid;
