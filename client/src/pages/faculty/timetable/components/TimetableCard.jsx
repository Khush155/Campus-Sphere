// client/src/pages/faculty/timetable/components/TimetableCard.jsx
//
// Presentational component displaying details for a scheduled class block.
// Colors the border accent depending on class format type.

import React from 'react';
import { Paper, Box, Typography, Chip } from '@mui/material';
import {
  Room as RoomIcon,
  AccessTime as TimeIcon,
  Class as SectionIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { CLASS_TYPE_OPTIONS } from '../timetableConstants';

export const TimetableCard = ({ slot }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Get configuration style for class formats
  const typeConfig = CLASS_TYPE_OPTIONS.find((opt) => opt.value === slot.classType) || {
    label: slot.classType,
    color: theme.palette.primary.main,
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        height: '100%',
        minHeight: 120,
        boxSizing: 'border-box',
        borderRadius: 2.5,
        border: `1px solid ${theme.palette.divider}`,
        borderLeft: `5px solid ${typeConfig.color}`,
        bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'scale(1.02)',
          boxShadow: isDark
            ? '0 8px 16px rgba(0,0,0,0.5)'
            : '0 8px 16px rgba(79, 70, 229, 0.06)',
          borderColor: theme.palette.divider,
        },
      }}
    >
      <Box>
        {/* Subject Code & Class Type */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography
            variant="caption"
            fontFamily="monospace"
            sx={{
              fontWeight: 800,
              color: typeConfig.color,
              bgcolor: isDark ? 'rgba(255,255,255,0.05)' : `${typeConfig.color}08`,
              px: 0.8,
              py: 0.2,
              borderRadius: '4px',
            }}
          >
            {slot.subjectCode}
          </Typography>
          <Chip
            label={typeConfig.label}
            size="small"
            sx={{
              height: 18,
              fontSize: '0.62rem',
              fontWeight: 700,
              bgcolor: isDark ? 'action.hover' : 'rgba(0, 0, 0, 0.04)',
              color: 'text.secondary',
            }}
          />
        </Box>

        {/* Subject Name */}
        <Typography
          variant="body2"
          sx={{
            fontWeight: 800,
            color: 'text.primary',
            lineHeight: 1.3,
            mb: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {slot.subjectName}
        </Typography>
      </Box>

      {/* Metadata Indicators */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
        {/* Target Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SectionIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            Section: {slot.sectionName}
          </Typography>
        </Box>

        {/* Timing Slot */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            {slot.startTime} - {slot.endTime}
          </Typography>
        </Box>

        {/* Room / Location */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RoomIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            Venue: {slot.roomNumber}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default TimetableCard;
