import React, { useState, useMemo } from 'react';
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
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
} from '@mui/material';
import {
  GroupsOutlined,
  VideocamOutlined,
  EventNoteOutlined,
  RefreshOutlined,
  LaunchOutlined,
  DescriptionOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';

import DataTable from '../../../components/common/DataTable';
import EmptyState from '../../../components/common/EmptyState';

import { useMeetingsQuery } from '../../../queries/hodQueries';

export const FacultyMeetingHub = () => {
  const theme = useTheme();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  // Fetch department meetings from backend
  const { data: meetingsData = [], isLoading, refetch } = useMeetingsQuery();

  const meetingsList = useMemo(() => {
    if (!Array.isArray(meetingsData)) return [];
    return meetingsData;
  }, [meetingsData]);

  const filteredMeetings = useMemo(() => {
    let list = meetingsList;
    if (statusFilter) {
      list = list.filter((m) => m.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (m) => (m.title || '').toLowerCase().includes(q) || (m.agenda || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [meetingsList, statusFilter, search]);

  const stats = useMemo(() => {
    const total = meetingsList.length;
    const upcoming = meetingsList.filter((m) => m.status === 'SCHEDULED' || !m.status).length;
    const completed = meetingsList.filter((m) => m.status === 'COMPLETED').length;
    const momCount = meetingsList.filter((m) => Boolean(m.minutesPdfUrl || m.mom)).length;
    return { total, upcoming, completed, momCount };
  }, [meetingsList]);

  const columns = [
    {
      id: 'title',
      label: 'Meeting Title & Agenda',
      render: (r) => (
        <Box onClick={() => setSelectedMeeting(r)} sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
          <Typography variant="body2" sx={{ fontWeight: 800, color: theme.palette.ink ? theme.palette.ink[900] : 'text.primary' }}>
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
          <Button
            size="small"
            variant="outlined"
            startIcon={<VisibilityOutlined />}
            onClick={() => setSelectedMeeting(r)}
            sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem' }}
          >
            Details
          </Button>
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
                  fontFamily: theme.typography.mono?.fontFamily || 'monospace',
                  letterSpacing: '0.05em',
                  fontSize: '0.7rem',
                }}
              />
            </Box>
            <Typography variant="h4" sx={{ fontFamily: theme.typography.h1?.fontFamily, fontWeight: 800, color: theme.palette.ink ? theme.palette.ink[900] : 'text.primary' }}>
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

      {/* ── 2. KPI Summary Grid (Faculty Roster Card Style) ───────────────── */}
      <Grid container spacing={2.5}>
        {/* 1. Total Meetings Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '14px',
              border: `1px solid ${theme.palette.divider}`,
              borderTop: `4px solid ${theme.palette.primary.main}`,
              boxShadow: 'none',
              bgcolor: theme.palette.background.paper,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
                  TOTAL MEETINGS
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: theme.palette.ink ? theme.palette.ink[900] : 'text.primary',
                    mt: 1,
                    fontFamily: theme.typography.mono?.fontFamily || 'monospace',
                  }}
                >
                  {stats.total}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main }}>
                <GroupsOutlined />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        {/* 2. Upcoming Briefings Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '14px',
              border: `1px solid ${theme.palette.divider}`,
              borderTop: `4px solid ${theme.palette.signal?.success || '#10b981'}`,
              boxShadow: 'none',
              bgcolor: theme.palette.background.paper,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.signal?.success || '#10b981' }}
                >
                  UPCOMING BRIEFINGS
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: theme.palette.signal?.success || '#10b981',
                    mt: 1,
                    fontFamily: theme.typography.mono?.fontFamily || 'monospace',
                  }}
                >
                  {stats.upcoming}
                </Typography>
              </Box>
              <Avatar
                sx={{
                  bgcolor: `${theme.palette.signal?.success || '#10b981'}15`,
                  color: theme.palette.signal?.success || '#10b981',
                }}
              >
                <VideocamOutlined />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        {/* 3. Completed Meetings Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '14px',
              border: `1px solid ${theme.palette.divider}`,
              borderTop: `4px solid ${theme.palette.info?.main || '#3b82f6'}`,
              boxShadow: 'none',
              bgcolor: theme.palette.background.paper,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.info?.main || '#3b82f6' }}
                >
                  COMPLETED MEETINGS
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: theme.palette.info?.main || '#3b82f6',
                    mt: 1,
                    fontFamily: theme.typography.mono?.fontFamily || 'monospace',
                  }}
                >
                  {stats.completed}
                </Typography>
              </Box>
              <Avatar
                sx={{
                  bgcolor: `${theme.palette.info?.main || '#3b82f6'}15`,
                  color: theme.palette.info?.main || '#3b82f6',
                }}
              >
                <CheckCircleOutlined />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        {/* 4. MOM Notes Available Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '14px',
              border: `1px solid ${theme.palette.divider}`,
              borderTop: `4px solid ${theme.palette.warning?.main || '#f59e0b'}`,
              boxShadow: 'none',
              bgcolor: theme.palette.background.paper,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.warning?.main || '#f59e0b' }}
                >
                  MOM NOTES AVAILABLE
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: theme.palette.warning?.main || '#f59e0b',
                    mt: 1,
                    fontFamily: theme.typography.mono?.fontFamily || 'monospace',
                  }}
                >
                  {stats.momCount}
                </Typography>
              </Box>
              <Avatar
                sx={{
                  bgcolor: `${theme.palette.warning?.main || '#f59e0b'}15`,
                  color: theme.palette.warning?.main || '#f59e0b',
                }}
              >
                <DescriptionOutlined />
              </Avatar>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* ── 3. Meetings Table Roster ───────────────────────────────────────── */}
      <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search meeting title or agenda..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: 260,
              '& .MuiOutlinedInput-root': { borderRadius: '10px' },
            }}
          />

          <TextField
            select
            size="small"
            label="Filter Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{
              minWidth: 180,
              '& .MuiOutlinedInput-root': { borderRadius: '10px' },
            }}
          >
            <MenuItem value="">All Meeting Statuses</MenuItem>
            <MenuItem value="SCHEDULED">Scheduled Briefings</MenuItem>
            <MenuItem value="COMPLETED">Completed Meetings</MenuItem>
          </TextField>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : filteredMeetings.length === 0 ? (
          <EmptyState type="reports" title="No Meetings Found" description="No department meetings match your search query." />
        ) : (
          <DataTable columns={columns} data={filteredMeetings} isLoading={isLoading} emptyMessage="No meetings available." />
        )}
      </Card>

      {/* Meeting Detail Modal */}
      <Dialog
        open={Boolean(selectedMeeting)}
        onClose={() => setSelectedMeeting(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        {selectedMeeting && (
          <>
            <DialogTitle sx={{ fontWeight: 800 }}>{selectedMeeting.title}</DialogTitle>
            <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip label={selectedMeeting.status || 'SCHEDULED'} color={selectedMeeting.status === 'COMPLETED' ? 'success' : 'primary'} size="small" sx={{ fontWeight: 800 }} />
                <Typography variant="caption" color="text.secondary">
                  {new Date(selectedMeeting.meetingDate || selectedMeeting.date || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} • {selectedMeeting.startTime || '10:00 AM'} — {selectedMeeting.endTime || '11:00 AM'}
                </Typography>
              </Box>

              <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                {selectedMeeting.agenda || 'Regular department briefing & curriculum sync.'}
              </Typography>

              {selectedMeeting.meetUrl && (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: '8px', bgcolor: 'rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ wordBreak: 'break-all', maxWidth: '70%' }}>
                    {selectedMeeting.meetUrl}
                  </Typography>
                  <Button variant="contained" size="small" href={selectedMeeting.meetUrl} target="_blank" startIcon={<LaunchOutlined />}>
                    Join Call
                  </Button>
                </Paper>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setSelectedMeeting(null)} variant="contained" sx={{ borderRadius: '8px', fontWeight: 700 }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default FacultyMeetingHub;

