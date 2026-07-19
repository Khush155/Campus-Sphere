import React from 'react';
import { Box, Typography, Paper, useTheme, IconButton } from '@mui/material';
import { DeleteOutline as DeleteIcon } from '@mui/icons-material';
import { useDeleteSlotMutation } from '../../../queries/timetableQueries';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

// Helper to convert HH:MM to a fractional number of hours for positioning (e.g. 09:30 -> 9.5)
const timeToHours = (timeStr) => {
  const [hours, mins] = timeStr.split(':').map(Number);
  return hours + mins / 60;
};

const TimetableGrid = ({ slots }) => {
  const theme = useTheme();
  const deleteMutation = useDeleteSlotMutation();

  const handleRemove = (slotId) => {
    if (window.confirm('Are you sure you want to remove this slot?')) {
      deleteMutation.mutate(slotId);
    }
  };

  // UI Grid Settings
  const dayStartHour = 8; // 8:00 AM
  const dayEndHour = 18; // 6:00 PM
  const totalHours = dayEndHour - dayStartHour;

  return (
    <Paper sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', overflowX: 'auto' }}>
      <Box sx={{ minWidth: 800, p: 2 }}>
        {/* Header Row */}
        <Box sx={{ display: 'grid', gridTemplateColumns: `100px repeat(${DAYS.length}, 1fr)`, gap: 1, mb: 2 }}>
          <Box /> {/* Empty top-left cell */}
          {DAYS.map((day) => (
            <Typography key={day} variant="subtitle2" sx={{ textAlign: 'center', fontWeight: 700, color: 'text.secondary' }}>
              {day}
            </Typography>
          ))}
        </Box>

        {/* Grid Body */}
        <Box sx={{ display: 'grid', gridTemplateColumns: `100px repeat(${DAYS.length}, 1fr)`, gap: 1, position: 'relative' }}>
          
          {/* Time Labels Column */}
          <Box sx={{ position: 'relative', height: totalHours * 60 }}>
            {Array.from({ length: totalHours + 1 }).map((_, i) => {
              const hour = dayStartHour + i;
              const displayHour = hour > 12 ? hour - 12 : hour;
              const ampm = hour >= 12 ? 'PM' : 'AM';
              return (
                <Typography
                  key={hour}
                  variant="caption"
                  sx={{
                    position: 'absolute',
                    top: i * 60 - 10,
                    right: 16,
                    color: 'text.secondary',
                    fontWeight: 500,
                  }}
                >
                  {`${displayHour}:00 ${ampm}`}
                </Typography>
              );
            })}
          </Box>

          {/* Day Columns */}
          {DAYS.map((day) => {
            const daySlots = slots.filter((s) => s.dayOfWeek === day);

            return (
              <Box key={day} sx={{ position: 'relative', height: totalHours * 60, borderLeft: `1px dashed ${theme.palette.divider}` }}>
                {/* Render background grid lines */}
                {Array.from({ length: totalHours }).map((_, i) => (
                  <Box key={`grid-${i}`} sx={{ position: 'absolute', top: (i + 1) * 60, left: 0, right: 0, height: 1, bgcolor: theme.palette.divider, opacity: 0.5 }} />
                ))}

                {/* Render Slots */}
                {daySlots.map((slot) => {
                  const startHour = timeToHours(slot.startTime);
                  const endHour = timeToHours(slot.endTime);
                  
                  const top = (startHour - dayStartHour) * 60;
                  const height = (endHour - startHour) * 60;

                  return (
                    <Paper
                      key={slot._id}
                      sx={{
                        position: 'absolute',
                        top,
                        height,
                        left: 4,
                        right: 4,
                        p: 1,
                        bgcolor: theme.palette.mode === 'light' ? 'primary.50' : 'rgba(144, 202, 249, 0.08)',
                        borderLeft: `4px solid ${theme.palette.primary.main}`,
                        borderRadius: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        '&:hover .delete-btn': {
                          opacity: 1,
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main', display: 'block' }}>
                          {slot.subjectId?.code || 'Unknown'}
                        </Typography>
                        <IconButton 
                          className="delete-btn"
                          size="small" 
                          color="error" 
                          sx={{ opacity: 0, transition: 'opacity 0.2s', p: 0 }}
                          onClick={() => handleRemove(slot._id)}
                        >
                          <DeleteIcon fontSize="inherit" />
                        </IconButton>
                      </Box>
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5, lineHeight: 1.1 }}>
                        {slot.subjectId?.name}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', mt: 'auto', color: 'text.secondary', fontSize: '0.65rem' }}>
                        {slot.startTime} - {slot.endTime} • {slot.room || 'TBD'}
                      </Typography>
                      {slot.group && (
                        <Typography variant="caption" sx={{ display: 'block', color: 'secondary.main', fontSize: '0.65rem', fontWeight: 700 }}>
                          Group: {slot.group}
                        </Typography>
                      )}
                    </Paper>
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
