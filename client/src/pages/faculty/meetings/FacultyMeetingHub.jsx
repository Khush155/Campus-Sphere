import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  Button,
  Chip,
  CircularProgress,
  useTheme,
  Avatar,
  Paper,
} from '@mui/material';
import {
  GroupsOutlined,
  VideocamOutlined,
  EventNoteOutlined,
  RefreshOutlined,
  LaunchOutlined,
  DescriptionOutlined,
  CheckCircleOutlined,
} from '@mui/icons-material';

import DataTable from '../../../components/common/DataTable';

import { useMeetingsQuery } from '../../../queries/hodQueries';

export const FacultyMeetingHub = () => {
  const theme = useTheme();

  // Fetch department meetings from backend
  const { data: meetingsData = [], isLoading, refetch } = useMeetingsQuery();

  const meetingsList = useMemo(() => {
    if (!Array.isArray(meetingsData)) return [];
    return meetingsData;
  }, [meetingsData]);

  const stats = useMemo(() => {
    const total = meetingsList.length;
    const upcoming = meetingsList.filter((m) => m.status === 'SCHEDULED').length;
    const completed = meetingsList.filter((m) => m.status === 'COMPLETED').length;
    return { total, upcoming, completed };
  }, [meetingsList]);

  const columns = [
    {
      id: 'title',
      label: 'Meeting Title & Agenda',
      render: (r) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
            {r.title}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {r.agenda || 'Regular department briefing & curriculum sync.'}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'schedule',
      label: 'Date & Time',
      render: (r) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
            {new Date(r.meetingDate || r.date || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {r.startTime || '10:00 AM'} — {r.endTime || '11:00 AM'}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'venue',
      label: 'Venue / Video Link',
      render: (r) => (
        <Chip
          icon={r.meetUrl ? <VideocamOutlined sx={{ fontSize: '0.75rem !important' }} /> : <EventNoteOutlined sx={{ fontSize: '0.75rem !important' }} />}
          label={r.venue || r.location || (r.meetUrl ? 'Google Meet Call' : 'Department Conference Room')}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 700, fontSize: '0.68rem' }}
        />
      ),
    },
    {
      id: 'status',
      label: 'Status',
      render: (r) => (
        <Chip
          label={r.status || 'SCHEDULED'}
          size="small"
          color={r.status === 'SCHEDULED' ? 'primary' : r.status === 'COMPLETED' ? 'success' : 'default'}
          sx={{ fontWeight: 800, fontSize: '0.65rem' }}
        />
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      render: (r) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          {r.meetUrl && (
            <Button
              size="small"
              variant="contained"
              startIcon={<LaunchOutlined />}
              href={r.meetUrl}
              target="_blank"
              sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 700, fontSize: '0.72rem' }}
            >
              Join Call
            </Button>
          )}
          {r.minutesPdfUrl && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<DescriptionOutlined />}
              href={r.minutesPdfUrl}
              target="_blank"
              sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem' }}
            >
              MOM Notes
            </Button>
          )}
        </Box>
      ),
    },
  ];

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
                icon={<GroupsOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="FACULTY DEPARTMENTAL MEETINGS & BRIEFINGS DESK"
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
              Departmental Meetings & Briefings
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              View upcoming department briefings scheduled by HOD, join video conferencing calls, and download official Minutes of Meetings (MOM).
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshOutlined />}
              onClick={() => refetch()}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
            >
              Refresh Meetings
            </Button>
          </Box>
        </Box>
      </Card>

      {/* ── 2. KPI Summary Grid ────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
                  TOTAL SCHEDULED MEETINGS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.ink[900], mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
                  {stats.total}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main }}>
                <GroupsOutlined />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.signal.success }}>
                  UPCOMING BRIEFINGS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.signal.success, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
                  {stats.upcoming}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: `${theme.palette.signal.success}15`, color: theme.palette.signal.success }}>
                <VideocamOutlined />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.info.main }}>
                  COMPLETED MEETINGS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.info.main, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
                  {stats.completed}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: `${theme.palette.info.main}15`, color: theme.palette.info.main }}>
                <CheckCircleOutlined />
              </Avatar>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* ── 3. Meetings Table Roster ───────────────────────────────────────── */}
      <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : meetingsList.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: '12px' }}>
            <Typography variant="body1" color="text.secondary">
              No department meetings currently scheduled by HOD.
            </Typography>
          </Paper>
        ) : (
          <DataTable columns={columns} data={meetingsList} isLoading={isLoading} emptyMessage="No meetings available." />
        )}
      </Card>
    </Box>
  );
};

export default FacultyMeetingHub;
