import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Grid,
  Card,
  Chip,
  useTheme,
  Avatar,
} from '@mui/material';
import {
  RefreshOutlined,
  CalendarMonthOutlined,
  MenuBookOutlined,
  AccessTimeOutlined,
  BiotechOutlined,
} from '@mui/icons-material';

// Child components
import TimetableGrid from './components/TimetableGrid';
import { useTimetableQuery } from '../../../queries/timetableQueries';

export const TimetablePage = () => {
  const theme = useTheme();

  // Fetch timetable slots specifically for Faculty
  const { data: rawTimetable = [], isLoading, refetch } = useTimetableQuery({ isFaculty: true });

  // Map backend timetable slots to display format expectations
  const formattedTimetable = useMemo(() => {
    return rawTimetable.map((s) => ({
      id: s._id,
      dayOfWeek: s.dayOfWeek || s.day || 'MONDAY',
      day: s.dayOfWeek || s.day || 'MONDAY',
      startTime: s.startTime || '09:00',
      endTime: s.endTime || '10:00',
      room: s.room || 'LH-201',
      group: s.group || 'CSE-A',
      subjectId: s.subjectId?._id || s.subjectId,
      subjectCode: s.subjectId?.code || 'CS301',
      subjectName: s.subjectId?.name || 'Assigned Subject',
      classType: s.type || s.classType || 'LECTURE',
    }));
  }, [rawTimetable]);

  // Compute Statistics
  const stats = useMemo(() => {
    const totalSlots = formattedTimetable.length;
    const subjects = new Set(formattedTimetable.map((s) => s.subjectCode)).size;
    const practicals = formattedTimetable.filter((s) => (s.classType || '').toUpperCase().includes('LAB') || (s.classType || '').toUpperCase().includes('PRACTICAL')).length;
    // Calculate total hours
    const totalHours = formattedTimetable.reduce((acc, s) => {
      if (!s.startTime || !s.endTime) return acc + 1;
      const [startH, startM] = s.startTime.split(':').map(Number);
      const [endH, endM] = s.endTime.split(':').map(Number);
      const duration = (endH + endM / 60) - (startH + startM / 60);
      return acc + (duration > 0 ? duration : 1);
    }, 0);

    return { totalSlots, subjects, practicals, totalHours: Math.round(totalHours) };
  }, [formattedTimetable]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* ── 1. Hero Identity Banner ────────────────────────────────────────── */}
      <Card
        sx={{
          p: 3.5,
          borderRadius: '16px',
          border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}0D 0%, ${theme.palette.brass?.[500] || '#b8863e'}0A 100%)`,
          boxShadow: 'none',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Chip
                icon={<CalendarMonthOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="FACULTY WEEKLY LECTURE & TIMETABLE SCHEDULE"
                size="small"
                sx={{
                  bgcolor: `${theme.palette.primary.main}15`,
                  color: theme.palette.primary.main,
                  fontWeight: 800,
                  fontFamily: theme.typography.mono.fontFamily,
                  letterSpacing: '0.05em',
                  fontSize: '0.7rem',
                }}
              />
            </Box>
            <Typography variant="h4" sx={{ fontFamily: theme.typography.h1.fontFamily, fontWeight: 800, color: theme.palette.ink[900] }}>
              Weekly Timetable & Lecture Schedule
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              View scheduled weekly lectures, labs, practicals, and tutorials for your assigned department subjects.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshOutlined />}
              onClick={() => refetch()}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
            >
              Refresh Schedule
            </Button>
          </Box>
        </Box>
      </Card>

      {/* ── 2. KPI Summary Grid ────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
                  WEEKLY LECTURE SLOTS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.ink[900], mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
                  {stats.totalSlots}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main }}>
                <CalendarMonthOutlined />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.signal.success }}>
                  ACTIVE SUBJECTS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.signal.success, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
                  {stats.subjects}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: `${theme.palette.signal.success}15`, color: theme.palette.signal.success }}>
                <MenuBookOutlined />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.info.main }}>
                  TOTAL HOURS / WEEK
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.info.main, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
                  {stats.totalHours} hrs
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: `${theme.palette.info.main}15`, color: theme.palette.info.main }}>
                <AccessTimeOutlined />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.warning.main }}>
                  LABS & PRACTICALS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.warning.main, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
                  {stats.practicals}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: `${theme.palette.warning.main}15`, color: theme.palette.warning.main }}>
                <BiotechOutlined />
              </Avatar>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* ── 3. Weekly Schedule Matrix Grid ─────────────────────────────────── */}
      <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <TimetableGrid timetableData={formattedTimetable} />
        )}
      </Card>
    </Box>
  );
};

export default TimetablePage;
