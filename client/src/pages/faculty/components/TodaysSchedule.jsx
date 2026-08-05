import React, { useMemo } from 'react';
import {
  Paper,
  Typography,
  Box,
  Chip,
  Stack,
  Divider,
  Button,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  AccessTime as TimeIcon,
  Schedule as HeaderIcon,
  Room as RoomIcon,
  Groups as SectionIcon,
  FactCheckOutlined,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export const TodaysSchedule = ({ classes = [] }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === 'dark';

  const validClasses = useMemo(() => {
    return classes.filter(
      (c) => c.id !== 'today-none' && c.subjectCode !== 'FREE' && (c.subjectName || '').toLowerCase() !== 'no scheduled classes today'
    );
  }, [classes]);

  if (validClasses.length === 0) {
    return (
      <Paper sx={{ p: 2.5, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <HeaderIcon color="primary" fontSize="small" />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
              Today&apos;s Lecture Schedule
            </Typography>
            <Chip label="0 Classes Today" size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.68rem' }} />
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            ☕ No lectures scheduled for today. Take time for research, grading, and course preparation!
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
      {/* ── Section Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HeaderIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
            Today&apos;s Lecture Schedule
          </Typography>
          <Chip
            label={`${validClasses.length} class${validClasses.length !== 1 ? 'es' : ''}`}
            size="small"
            color="primary"
            sx={{ fontWeight: 800, fontSize: '0.68rem' }}
          />
        </Box>

        <Button
          size="small"
          variant="outlined"
          startIcon={<FactCheckOutlined />}
          onClick={() => navigate('/attendance')}
          sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem' }}
        >
          Mark Attendance
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* ── Class List ── */}
      <Stack spacing={1.5}>
        {validClasses.map((classItem) => (
          <Box
            key={classItem.id}
            sx={{
              display: 'flex',
              alignItems: 'stretch',
              borderRadius: '12px',
              overflow: 'hidden',
              bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            {/* Left: Time Badge */}
            <Box
              sx={{
                bgcolor: `${theme.palette.primary.main}12`,
                px: 2,
                py: 1.5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 110,
                borderRight: `3px solid ${theme.palette.primary.main}`,
              }}
            >
              <TimeIcon sx={{ fontSize: 16, color: theme.palette.primary.main, mb: 0.5 }} />
              <Typography variant="caption" sx={{ fontWeight: 800, color: theme.palette.primary.main, textAlign: 'center' }}>
                {classItem.time}
              </Typography>
            </Box>

            {/* Right: Class Details */}
            <Box sx={{ p: 2, flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Chip label={classItem.subjectCode || 'SUB'} size="small" color="primary" sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
                    {classItem.subjectName || classItem.subject}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <SectionIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Group {classItem.section}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <RoomIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {classItem.room}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Button
                size="small"
                variant="contained"
                onClick={() => navigate('/attendance')}
                sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 700, fontSize: '0.72rem' }}
              >
                Mark Attendance
              </Button>
            </Box>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
};

export default TodaysSchedule;
