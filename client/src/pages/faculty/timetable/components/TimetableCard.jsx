// client/src/pages/faculty/timetable/components/TimetableCard.jsx
//
// Presentational component displaying details for a scheduled class block.
// Colors the border accent depending on class format type.
// Supports isOngoing prop for visual highlight when a class is currently running.

import React from 'react';
import { Paper, Box, Typography, Chip } from '@mui/material';
import {
  Room as RoomIcon,
  AccessTime as TimeIcon,
  Class as SectionIcon,
  FiberManualRecord as LiveDotIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { CLASS_TYPE_OPTIONS } from '../timetableConstants';

export const TimetableCard = ({ slot, isOngoing = false }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Get configuration style for class formats
  const typeConfig = CLASS_TYPE_OPTIONS.find((opt) => opt.value === slot.classType) || {
    label: slot.classType || 'LECTURE',
    color: theme.palette.primary.main,
  };

  return (
    <Paper
      elevation={isOngoing ? 4 : 0}
      sx={{
        p: 2,
        height: '100%',
        minHeight: 120,
        boxSizing: 'border-box',
        borderRadius: 2.5,
        border: isOngoing
          ? `2px solid ${theme.palette.success.main}`
          : `1px solid ${theme.palette.divider}`,
        borderLeft: isOngoing
          ? `5px solid ${theme.palette.success.main}`
          : `5px solid ${typeConfig.color}`,
        bgcolor: isOngoing
          ? isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.05)'
          : isDark ? 'rgba(255,255,255,0.02)' : '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        position: 'relative',
        boxShadow: isOngoing
          ? `0 0 0 3px ${theme.palette.success.main}22, 0 8px 24px rgba(16,185,129,0.15)`
          : 'none',
        '&:hover': {
          transform: 'scale(1.02)',
          boxShadow: isDark
            ? '0 8px 16px rgba(0,0,0,0.5)'
            : '0 8px 16px rgba(79, 70, 229, 0.06)',
        },
      }}
    >
      {/* ONGOING NOW badge */}
      {isOngoing && (
        <Chip
          icon={<LiveDotIcon sx={{ fontSize: '10px !important', color: '#fff !important' }} />}
          label="ONGOING NOW"
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            height: 20,
            fontSize: '0.6rem',
            fontWeight: 800,
            bgcolor: theme.palette.success.main,
            color: '#fff',
            letterSpacing: '0.04em',
            '@keyframes pulse': {
              '0%': { opacity: 1 },
              '50%': { opacity: 0.6 },
              '100%': { opacity: 1 },
            },
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
      )}

      <Box>
        {/* Subject Code & Class Type */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, pr: isOngoing ? 8 : 0 }}>
          <Typography
            variant="caption"
            fontFamily="monospace"
            sx={{
              fontWeight: 800,
              color: isOngoing ? theme.palette.success.dark : typeConfig.color,
              bgcolor: isOngoing
                ? isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.08)'
                : isDark ? 'rgba(255,255,255,0.05)' : `${typeConfig.color}08`,
              px: 0.8,
              py: 0.2,
              borderRadius: '4px',
            }}
          >
            {slot.subjectCode || slot.subjectId?.code || 'SUB'}
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
            color: isOngoing ? theme.palette.success.dark : 'text.primary',
            lineHeight: 1.3,
            mb: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {slot.subjectName || slot.subjectId?.name || 'Class Session'}
        </Typography>
      </Box>

      {/* Metadata Indicators */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
        {/* Faculty name */}
        {(slot.facultyName || slot.facultyId?.name) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SectionIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              {slot.facultyName || slot.facultyId?.name}
            </Typography>
          </Box>
        )}

        {/* Timing Slot */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            {slot.startTime} – {slot.endTime}
          </Typography>
        </Box>

        {/* Room / Location */}
        {(slot.roomNumber || slot.room) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <RoomIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              {slot.roomNumber || slot.room}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default TimetableCard;
