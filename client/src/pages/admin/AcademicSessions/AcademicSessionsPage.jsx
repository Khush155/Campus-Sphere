import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  CircularProgress,
  useTheme,
  Avatar,
  Paper,
} from '@mui/material';
import {
  AddOutlined,
  CalendarMonthOutlined,
  CheckCircleOutlined,
  LockOutlined,
  RefreshOutlined,
  DateRangeOutlined,
  TimelineOutlined,
  PlayCircleOutlineOutlined,
} from '@mui/icons-material';

import DataTable from '../../../components/common/DataTable';
import EmptyState from '../../../components/common/EmptyState';

import {
  useAcademicSessionsQuery,
  useActiveSessionQuery,
  useCreateAcademicSessionMutation,
  useActivateAcademicSessionMutation,
} from '../../../queries/academicSessionQueries';
import { useToast } from '../../../contexts/ToastContext';

export const AcademicSessionsPage = () => {
  const theme = useTheme();
  const { showToast } = useToast();

  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    academicYear: '2025-2026',
    semesterType: 'ODD',
    termStartDate: new Date().toISOString().split('T')[0],
    termEndDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  // Queries & Mutations
  const { data: activeSession, isLoading: isActiveLoading } = useActiveSessionQuery();
  const { data: sessionsResponse, isLoading: isSessionsLoading, refetch } = useAcademicSessionsQuery({ limit: 100 });
  const createMutation = useCreateAcademicSessionMutation();
  const activateMutation = useActivateAcademicSessionMutation();

  const sessionList = useMemo(() => {
    if (!sessionsResponse) return [];
    if (Array.isArray(sessionsResponse)) return sessionsResponse;
    return sessionsResponse.data || [];
  }, [sessionsResponse]);

  const stats = useMemo(() => {
    const total = sessionList.length;
    const activeCount = sessionList.filter((s) => s.status === 'ACTIVE').length;
    const archivedCount = sessionList.filter((s) => s.status === 'ARCHIVED').length;
    return { total, activeCount, archivedCount };
  }, [sessionList]);

  const handleOpenCreate = () => {
    setFormData({
      academicYear: '2025-2026',
      semesterType: 'ODD',
      termStartDate: new Date().toISOString().split('T')[0],
      termEndDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setOpenCreateModal(true);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!formData.academicYear || !formData.termStartDate || !formData.termEndDate) {
      showToast('Please fill all required fields.', { severity: 'error' });
      return;
    }

    createMutation.mutate(
      {
        academicYear: formData.academicYear.trim(),
        semesterType: formData.semesterType,
        termStartDate: formData.termStartDate,
        termEndDate: formData.termEndDate,
      },
      {
        onSuccess: () => {
          setOpenCreateModal(false);
          showToast('New Academic Session created and set as active!');
          refetch();
        },
        onError: (err) => showToast(err.response?.data?.message || 'Failed to create session.', { severity: 'error' }),
      }
    );
  };

  const handleActivate = (id, year, type) => {
    activateMutation.mutate(id, {
      onSuccess: () => {
        showToast(`Academic Session ${year} (${type} SEMESTER) is now ACTIVE!`);
        refetch();
      },
      onError: (err) => showToast(err.response?.data?.message || 'Failed to activate session.', { severity: 'error' }),
    });
  };

  const columns = [
    {
      id: 'academicYear',
      label: 'Academic Year',
      render: (r) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 800, color: theme.palette.ink[900], fontFamily: theme.typography.mono.fontFamily }}>
            {r.academicYear}
          </Typography>
          {r.status === 'ACTIVE' && (
            <Chip label="CURRENT ACTIVE" size="small" color="success" sx={{ fontWeight: 800, fontSize: '0.62rem', height: 18 }} />
          )}
        </Box>
      ),
    },
    {
      id: 'semesterType',
      label: 'Semester Term',
      render: (r) => (
        <Chip
          label={`${r.semesterType} SEMESTER`}
          size="small"
          color={r.semesterType === 'ODD' ? 'primary' : 'secondary'}
          sx={{ fontWeight: 800, fontSize: '0.68rem' }}
        />
      ),
    },
    {
      id: 'dates',
      label: 'Term Start & End Dates',
      render: (r) => (
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
          {new Date(r.termStartDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} — {new Date(r.termEndDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      render: (r) => (
        <Chip
          label={r.status || 'ARCHIVED'}
          size="small"
          color={r.status === 'ACTIVE' ? 'success' : 'default'}
          sx={{ fontWeight: 800, fontSize: '0.65rem' }}
        />
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      render: (r) => (
        <Button
          size="small"
          variant={r.status === 'ACTIVE' ? 'outlined' : 'contained'}
          disabled={r.status === 'ACTIVE' || activateMutation.isPending}
          startIcon={r.status === 'ACTIVE' ? <CheckCircleOutlined /> : <PlayCircleOutlineOutlined />}
          onClick={() => handleActivate(r._id || r.id, r.academicYear, r.semesterType)}
          sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 700, fontSize: '0.72rem' }}
        >
          {r.status === 'ACTIVE' ? 'Active Term' : 'Activate & Switch'}
        </Button>
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
                icon={<CalendarMonthOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="ACADEMIC SESSION & SEMESTER LOCK CONTROL"
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
              Academic Sessions &amp; Term Manager
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              Create institutional academic years, set active semester terms (Odd / Even), lock archived academic sessions, and control university timeline.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshOutlined />}
              onClick={() => refetch()}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
            >
              Refresh Feed
            </Button>
            <Button
              variant="contained"
              startIcon={<AddOutlined />}
              onClick={handleOpenCreate}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 700,
                background: theme.palette.primary.gradient || theme.palette.primary.main,
                color: '#ffffff',
              }}
            >
              Create Academic Session
            </Button>
          </Box>
        </Box>
      </Card>

      {/* ── 2. Active Session Spotlight Card ─────────────────────────────── */}
      {!isActiveLoading && activeSession && (
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: '16px',
            border: `1px solid ${theme.palette.signal.success}`,
            bgcolor: `${theme.palette.signal.success}0A`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: `${theme.palette.signal.success}20`, color: theme.palette.signal.success, width: 48, height: 48 }}>
              <LockOutlined />
            </Avatar>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
                  CURRENT ACTIVE ACADEMIC TERM: {activeSession.academicYear} ({activeSession.semesterType} SEMESTER)
                </Typography>
                <Chip label="ACTIVE & ENFORCED" size="small" color="success" sx={{ fontWeight: 800, fontSize: '0.65rem' }} />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.2 }}>
                Term Start Date: <strong>{new Date(activeSession.termStartDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong> | End Date: <strong>{new Date(activeSession.termEndDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* ── 3. KPI Summary Grid ────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
                  TOTAL ACADEMIC SESSIONS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.ink[900], mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
                  {stats.total}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main }}>
                <TimelineOutlined />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.signal.success }}>
                  CURRENT ACTIVE TERM
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.signal.success, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
                  {stats.activeCount}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: `${theme.palette.signal.success}15`, color: theme.palette.signal.success }}>
                <CheckCircleOutlined />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.info.main }}>
                  ARCHIVED SESSIONS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.info.main, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
                  {stats.archivedCount}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: `${theme.palette.info.main}15`, color: theme.palette.info.main }}>
                <DateRangeOutlined />
              </Avatar>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* ── 4. Sessions Table ──────────────────────────────────────────────── */}
      <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        {isSessionsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : sessionList.length === 0 ? (
          <EmptyState type="reports" title="No Academic Sessions Configured" description="Create an academic session to manage university term dates." />
        ) : (
          <DataTable columns={columns} data={sessionList} isLoading={isSessionsLoading} emptyMessage="No academic sessions available." />
        )}
      </Card>

      {/* ── 5. Create Academic Session Modal ───────────────────────────────── */}
      <Dialog open={openCreateModal} onClose={() => setOpenCreateModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Create New Academic Session</DialogTitle>
        <form onSubmit={handleCreateSubmit}>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Academic Year"
                  placeholder="e.g. 2025-2026"
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Semester Term Type"
                  value={formData.semesterType}
                  onChange={(e) => setFormData({ ...formData, semesterType: e.target.value })}
                  fullWidth
                  required
                >
                  <MenuItem value="ODD">ODD Semester (1st, 3rd, 5th, 7th)</MenuItem>
                  <MenuItem value="EVEN">EVEN Semester (2nd, 4th, 6th, 8th)</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  type="date"
                  label="Term Start Date"
                  value={formData.termStartDate}
                  onChange={(e) => setFormData({ ...formData, termStartDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  type="date"
                  label="Term End Date"
                  value={formData.termEndDate}
                  onChange={(e) => setFormData({ ...formData, termEndDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  required
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpenCreateModal(false)} variant="outlined" sx={{ borderRadius: '8px' }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending} sx={{ borderRadius: '8px', fontWeight: 700 }}>
              {createMutation.isPending ? 'Creating...' : 'Create & Activate Session'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default AcademicSessionsPage;
