// client/src/pages/faculty/attendance/components/AttendanceSummaryCard.jsx
//
// Live statistics panel showing attendance counts and percentage.
// Updates in real-time as faculty toggles student statuses.
//
// This is a PURE PRESENTATIONAL component:
//   - Zero useState, zero useEffect.
//   - All values come from props.
//   - All computation happens in the parent (AttendancePage).
//   - This component only RENDERS numbers it receives.

import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Divider,
  LinearProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Assessment as HeaderIcon } from '@mui/icons-material';

/**
 * Returns a color based on attendance percentage thresholds.
 * Follows Indian college minimum attendance policy:
 *   >= 75% → green (safe)
 *   >= 50% → amber (warning)
 *   <  50% → red (critical)
 */
const getPercentageColor = (percentage) => {
  if (percentage >= 75) return '#10b981';
  if (percentage >= 50) return '#f59e0b';
  return '#ef4444';
};

/**
 * Individual stat block used inside the summary grid.
 */
const StatBlock = ({ value, label, color, isDark, sx }) => (
  <Box
    sx={{
      textAlign: 'center',
      py: 1.5,
      px: 1,
      borderRadius: 2,
      bgcolor: isDark
        ? `${color}10`
        : `${color}08`,
      border: '1px solid',
      borderColor: isDark
        ? `${color}20`
        : `${color}15`,
      ...sx,
    }}
  >
    <Typography
      variant="h5"
      sx={{
        fontWeight: 800,
        color,
        lineHeight: 1.2,
      }}
    >
      {value}
    </Typography>
    <Typography
      variant="caption"
      sx={{
        fontWeight: 700,
        color: 'text.secondary',
        fontSize: '0.68rem',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      }}
    >
      {label}
    </Typography>
  </Box>
);

export const AttendanceSummaryCard = ({
  totalStudents,
  present,
  absent,
  medicalLeave,
  dutyLeave,
  attendancePercentage,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const percentageColor = getPercentageColor(attendancePercentage);
  const roundedPercentage = Math.round(attendancePercentage * 10) / 10;

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      {/* ── Section Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
        <HeaderIcon color="primary" />
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, color: 'text.primary' }}
        >
          Attendance Summary
        </Typography>
      </Box>

      <Divider sx={{ mb: 2.5 }} />

      {/* ── Stat Blocks (CSS Grid to handle 5-column layout responsively) ── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(5, 1fr)',
          },
          gap: 1.5,
          mb: 2.5,
        }}
      >
        <StatBlock
          value={totalStudents}
          label="Total"
          color="#4f46e5"
          isDark={isDark}
          sx={{ gridColumn: { xs: 'span 2', sm: 'span 1' } }}
        />
        <StatBlock
          value={present}
          label="Present"
          color="#10b981"
          isDark={isDark}
        />
        <StatBlock
          value={absent}
          label="Absent"
          color="#ef4444"
          isDark={isDark}
        />
        <StatBlock
          value={medicalLeave}
          label="Med. Leave"
          color="#3b82f6"
          isDark={isDark}
        />
        <StatBlock
          value={dutyLeave}
          label="Duty Leave"
          color="#f97316"
          isDark={isDark}
        />
      </Box>

      {/* ── Attendance Percentage Bar ── */}
      <Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            mb: 1,
          }}
        >
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, color: 'text.primary' }}
          >
            Attendance Rate
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              color: percentageColor,
              lineHeight: 1,
            }}
          >
            {roundedPercentage}%
          </Typography>
        </Box>

        <LinearProgress
          variant="determinate"
          value={Math.min(attendancePercentage, 100)}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: isDark
              ? 'rgba(255, 255, 255, 0.06)'
              : 'rgba(0, 0, 0, 0.06)',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              bgcolor: percentageColor,
              transition: 'transform 0.3s ease, background-color 0.3s ease',
            },
          }}
        />

        {/* Threshold indicator */}
        {attendancePercentage < 75 && totalStudents > 0 && (
          <Typography
            variant="caption"
            sx={{
              mt: 0.75,
              display: 'block',
              color: attendancePercentage < 50 ? '#ef4444' : '#f59e0b',
              fontWeight: 600,
              fontSize: '0.7rem',
            }}
          >
            {attendancePercentage < 50
              ? '⚠ Critical — Below 50% attendance threshold'
              : '⚠ Warning — Below 75% minimum attendance requirement'}
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default AttendanceSummaryCard;
