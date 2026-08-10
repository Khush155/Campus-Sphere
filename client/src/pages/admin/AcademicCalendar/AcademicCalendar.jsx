import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Chip,
  Button,
  Drawer,
  Alert,
  useTheme,
  Skeleton,
  MenuItem,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  IconButton,
} from '@mui/material';
import { AddOutlined, PlayArrowOutlined, DateRangeOutlined, CheckCircleOutlined, DeleteOutline, EditOutlined } from '@mui/icons-material';

import {
  useActiveSessionQuery,
  useAcademicSessionsQuery,
  useCreateAcademicSessionMutation,
  useActivateAcademicSessionMutation,
  useDeleteAcademicSessionMutation,
  useUpdateAcademicSessionMutation,
} from '../../../queries/academicSessionQueries';
import Pagination from '../../../components/common/Pagination';
import ConfirmDeleteModal from '../../../components/common/ConfirmDeleteModal';
import EmptyState from '../../../components/common/EmptyState';
import { useToast } from '../../../contexts/ToastContext';

const sessionFormSchema = z.object({
  academicYear: z
    .string()
    .min(1, 'Academic year is required')
    .regex(/^\d{4}-\d{2}$/, 'Format must be YYYY-YY (e.g., 2026-27)')
    .trim(),
  semesterType: z.enum(['ODD', 'EVEN'], { required_error: 'Semester type is required' }),
  termStartDate: z.string().min(1, 'Start date is required'),
  termEndDate: z.string().min(1, 'End date is required'),
  status: z.enum(['ACTIVE', 'UPCOMING', 'ARCHIVED']).default('UPCOMING'),
}).refine(
  (data) => new Date(data.termEndDate) > new Date(data.termStartDate),
  {
    message: 'Term end date must be after term start date',
    path: ['termEndDate'],
  }
);

export const AcademicCalendar = () => {
  const theme = useTheme();
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusTab, setStatusTab] = useState('UPCOMING_ACTIVE'); // 'UPCOMING_ACTIVE', 'ARCHIVED', 'ALL'

  // Modal / Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [activateTargetId, setActivateTargetId] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // Queries
  const { data: activeSession, isLoading: loadingActive } = useActiveSessionQuery();
  const { data: sessionsData, isLoading: loadingList, error, refetch } = useAcademicSessionsQuery({
    page,
    limit,
  });

  const createSession = useCreateAcademicSessionMutation();
  const updateSession = useUpdateAcademicSessionMutation();
  const activateSession = useActivateAcademicSessionMutation();
  const deleteSession = useDeleteAcademicSessionMutation();

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      academicYear: '',
      semesterType: 'ODD',
      termStartDate: '',
      termEndDate: '',
      status: 'UPCOMING',
    },
  });

  const yearValue = watch('academicYear');

  // Auto-format YYYY input to YYYY-YY (e.g. "2026" -> "2026-27")
  const handleYearChange = (e) => {
    const val = e.target.value;
    if (/^\d{4}$/.test(val)) {
      const nextYr = (parseInt(val.slice(2), 10) + 1).toString().padStart(2, '0');
      setValue('academicYear', `${val}-${nextYr}`);
    } else {
      setValue('academicYear', val);
    }
  };

  const handleOpenCreate = () => {
    setEditingSessionId(null);
    reset({
      academicYear: '',
      semesterType: 'ODD',
      termStartDate: '',
      termEndDate: '',
      status: 'UPCOMING',
    });
    setDrawerOpen(true);
  };

  const handleOpenEdit = (sess) => {
    setEditingSessionId(sess._id);
    reset({
      academicYear: sess.academicYear,
      semesterType: sess.semesterType,
      termStartDate: sess.termStartDate ? new Date(sess.termStartDate).toISOString().slice(0, 10) : '',
      termEndDate: sess.termEndDate ? new Date(sess.termEndDate).toISOString().slice(0, 10) : '',
      status: sess.status,
    });
    setDrawerOpen(true);
  };

  const handleFormSubmit = async (data) => {
    try {
      if (editingSessionId) {
        await updateSession.mutateAsync({ id: editingSessionId, data });
        showToast('Academic session updated successfully.');
      } else {
        await createSession.mutateAsync(data);
        showToast('Academic session registered successfully.');
      }
      setDrawerOpen(false);
      setEditingSessionId(null);
      setPage(1);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save academic session.', { severity: 'error' });
    }
  };

  const handleActivateConfirm = async () => {
    if (activateTargetId) {
      try {
        await activateSession.mutateAsync(activateTargetId);
        showToast('Academic session activated successfully.');
        setActivateTargetId(null);
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to activate session.', { severity: 'error' });
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteTargetId) {
      try {
        await deleteSession.mutateAsync(deleteTargetId);
        showToast('Academic session deleted successfully.');
        setDeleteTargetId(null);
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to delete session.', { severity: 'error' });
      }
    }
  };

  const getStatusChipStyle = (status) => {
    switch (status) {
      case 'ACTIVE':
        return {
          bgcolor: 'rgba(16, 185, 129, 0.12)',
          color: theme.palette.signal.success,
        };
      case 'UPCOMING':
        return {
          bgcolor: 'rgba(139, 92, 246, 0.12)',
          color: 'rgb(124, 58, 237)',
        };
      case 'ARCHIVED':
      default:
        return {
          bgcolor: 'rgba(107, 114, 128, 0.15)',
          color: theme.palette.text.secondary,
        };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Filter sessions based on selected status tab
  const sessionsList = sessionsData?.data;
  const rawSessions = sessionsList || [];
  const activeUpcomingCount = rawSessions.filter((s) => s.status === 'ACTIVE' || s.status === 'UPCOMING').length;
  const archivedCount = rawSessions.filter((s) => s.status === 'ARCHIVED').length;

  const filteredSessions = React.useMemo(() => {
    const list = sessionsList || [];
    if (statusTab === 'UPCOMING_ACTIVE') {
      return list.filter((s) => s.status === 'ACTIVE' || s.status === 'UPCOMING');
    }
    if (statusTab === 'ARCHIVED') {
      return list.filter((s) => s.status === 'ARCHIVED');
    }
    return list;
  }, [sessionsList, statusTab]);

  // Calculate progress percentage of active term
  const calculateTermProgress = (startStr, endStr) => {
    if (!startStr || !endStr) return { percentage: 0, weeksPassed: 0, totalWeeks: 0 };
    const start = new Date(startStr).getTime();
    const end = new Date(endStr).getTime();
    const now = new Date().getTime();

    if (now <= start) return { percentage: 0, weeksPassed: 0, totalWeeks: Math.ceil((end - start) / (1000 * 60 * 60 * 24 * 7)) };
    if (now >= end) {
      const weeks = Math.ceil((end - start) / (1000 * 60 * 60 * 24 * 7));
      return { percentage: 100, weeksPassed: weeks, totalWeeks: weeks };
    }

    const totalDuration = end - start;
    const elapsed = now - start;
    const percentage = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
    const totalWeeks = Math.ceil(totalDuration / (1000 * 60 * 60 * 24 * 7));
    const weeksPassed = Math.ceil(elapsed / (1000 * 60 * 60 * 24 * 7));

    return { percentage, weeksPassed, totalWeeks };
  };

  const activeProgress = activeSession ? calculateTermProgress(activeSession.termStartDate, activeSession.termEndDate) : null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* ── 1. Hero Header Banner Card ─────────────────────────────────────── */}
      <Card
        sx={{
          p: 3.5,
          borderRadius: '16px',
          border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}0F 0%, ${theme.palette.brass?.[500] || '#b8863e'}08 100%)`,
          boxShadow: theme.custom?.elevation?.raised || 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
            <Chip
              icon={<DateRangeOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
              label="ACADEMIC SESSION TIMELINE"
              size="small"
              sx={{
                bgcolor: `${theme.palette.primary.main}15`,
                color: theme.palette.primary.main,
                fontFamily: theme.typography.mono.fontFamily,
                fontWeight: 700,
                fontSize: '0.68rem',
                letterSpacing: '0.06em',
                borderRadius: '6px',
              }}
            />
            {activeSession && (
              <Chip
                label={`${activeSession.academicYear} (${activeSession.semesterType} Sem)`}
                size="small"
                sx={{
                  bgcolor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  fontFamily: theme.typography.mono.fontFamily,
                  fontSize: '0.72rem',
                  fontWeight: 600,
                }}
              />
            )}
          </Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontFamily: theme.typography.h1.fontFamily,
              fontWeight: 600,
              color: theme.palette.ink[900],
              lineHeight: 1.15,
              mb: 0.5,
            }}
          >
            Academic Sessions & Calendar
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontFamily: theme.typography.body2.fontFamily,
              color: theme.palette.text.secondary,
              maxWidth: 640,
            }}
          >
            Configure academic terms, active academic years, and toggle semester boundaries.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddOutlined />}
          onClick={handleOpenCreate}
          sx={{
            background: theme.palette.primary.gradient || theme.palette.primary.main,
            color: '#ffffff',
            fontWeight: 700,
            px: 3,
            py: 1.25,
            borderRadius: '8px',
            textTransform: 'none',
            boxShadow: `0 4px 16px ${theme.palette.primary.main}40`,
            '&:hover': {
              filter: 'brightness(1.1)',
            },
          }}
        >
          Create Session
        </Button>
      </Card>

      {/* ── 2. Prominent Active Session Card with Progress Bar ──────────────── */}
      {loadingActive ? (
        <Card sx={{ p: 3, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: '12px' }}>
          <Skeleton variant="text" width="40%" height={32} />
          <Skeleton variant="text" width="60%" height={24} sx={{ mt: 1 }} />
        </Card>
      ) : activeSession ? (
        <Card
          sx={{
            p: 3.5,
            border: `1px solid ${theme.palette.primary.main}40`,
            background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.primary.main}08 100%)`,
            boxShadow: 'none',
            borderRadius: '16px',
            position: 'relative',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontFamily: theme.typography.h1.fontFamily,
                  fontWeight: 700,
                  color: theme.palette.ink[900],
                  mb: 0.5,
                }}
              >
                {activeSession.semesterType === 'ODD' ? 'Odd Semester' : 'Even Semester'} {activeSession.academicYear}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Term Duration: <strong>{formatDate(activeSession.termStartDate)}</strong> to{' '}
                <strong>{formatDate(activeSession.termEndDate)}</strong>
              </Typography>
            </Box>
            <Chip
              icon={<CheckCircleOutlined sx={{ fontSize: '0.85rem !important' }} />}
              label="CURRENT ACTIVE SESSION"
              color="success"
              size="small"
              sx={{ fontWeight: 800, fontSize: '0.7rem', borderRadius: '6px' }}
            />
          </Box>

          {/* Term Timeline Progress */}
          {activeProgress && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.ink[900], fontFamily: theme.typography.mono.fontFamily }}>
                  Term Progress: Week {activeProgress.weeksPassed} of {activeProgress.totalWeeks}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.primary.main, fontFamily: theme.typography.mono.fontFamily }}>
                  {activeProgress.percentage}% Completed
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={activeProgress.percentage}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: `${theme.palette.primary.main}20`,
                  '& .MuiLinearProgress-bar': {
                    bgcolor: theme.palette.primary.main,
                    borderRadius: 4,
                  },
                }}
              />
            </Box>
          )}
        </Card>
      ) : (
        <Alert severity="warning" sx={{ borderRadius: '12px' }}>
          No active academic session set. Configure one below to initialize the calendar scope.
        </Alert>
      )}

      {/* Auto-Sync Informational Alert Banner */}
      <Alert severity="info" icon={<CheckCircleOutlined />} sx={{ borderRadius: '12px', bgcolor: 'rgba(59, 130, 246, 0.08)', color: theme.palette.ink[900] }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          ⚡ Automatic Time-Based Progression Active
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '0.82rem', mt: 0.25 }}>
          Academic sessions automatically transition based on their scheduled term start & end dates. When a term finishes, it is automatically moved to <strong>ARCHIVED</strong> status and the next scheduled <strong>UPCOMING</strong> term automatically takes over as <strong>ACTIVE</strong>.
        </Typography>
      </Alert>

      {/* Error Alert with Retry */}
      {error && (
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => refetch()}>Retry</Button>} sx={{ borderRadius: '12px' }}>
          Failed to load academic session history.
        </Alert>
      )}

      {/* ── 3. Session Directory & Status Filtering ──────────────────────────── */}
      <Card sx={{ p: 2.5, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: theme.typography.h1.fontFamily, color: theme.palette.ink[900] }}>
            Academic Terms Directory
          </Typography>

          <ToggleButtonGroup
            value={statusTab}
            exclusive
            onChange={(e, val) => {
              if (val) setStatusTab(val);
            }}
            size="small"
          >
            <ToggleButton value="UPCOMING_ACTIVE" aria-label="upcoming and active sessions">
              <Tooltip title="View Current Active & Scheduled Upcoming Terms">
                <Typography variant="caption" sx={{ fontWeight: 700, px: 1 }}>
                  🚀 Current & Upcoming ({activeUpcomingCount})
                </Typography>
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="ARCHIVED" aria-label="archived sessions">
              <Tooltip title="View Completed Past Terms">
                <Typography variant="caption" sx={{ fontWeight: 700, px: 1 }}>
                  📦 Archived ({archivedCount})
                </Typography>
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="ALL" aria-label="all sessions">
              <Tooltip title="View All Academic Sessions">
                <Typography variant="caption" sx={{ fontWeight: 700, px: 1 }}>
                  🌐 All ({rawSessions.length})
                </Typography>
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {loadingList ? (
          <TableContainer>
            <Table>
              <TableBody>
                {[1, 2, 3].map((i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                    <TableCell><Skeleton variant="text" width="40%" /></TableCell>
                    <TableCell><Skeleton variant="text" width="80%" /></TableCell>
                    <TableCell><Skeleton variant="text" width="30%" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : filteredSessions.length === 0 ? (
          <EmptyState
            type="calendar"
            title={statusTab === 'ARCHIVED' ? 'No Archived Sessions' : 'No Academic Sessions Found'}
            description={
              statusTab === 'ARCHIVED'
                ? 'There are currently no completed/archived past academic sessions.'
                : 'Create an academic session to define semester timelines.'
            }
            actionText={statusTab === 'ARCHIVED' ? null : 'Create Session'}
            onAction={statusTab === 'ARCHIVED' ? null : handleOpenCreate}
          />
        ) : (
          <TableContainer>
            <Table aria-label="academic sessions directory table" size="small">
              <TableHead sx={{ bgcolor: theme.custom?.surface?.sunken || 'rgba(28, 46, 69, 0.02)' }}>
                <TableRow>
                  <TableCell sx={{ py: 1.5, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>ACADEMIC YEAR</TableCell>
                  <TableCell sx={{ py: 1.5, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>SEMESTER TYPE</TableCell>
                  <TableCell sx={{ py: 1.5, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>START DATE</TableCell>
                  <TableCell sx={{ py: 1.5, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>END DATE</TableCell>
                  <TableCell sx={{ py: 1.5, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>STATUS</TableCell>
                  <TableCell align="right" sx={{ py: 1.5, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSessions.map((sess) => (
                  <TableRow
                    key={sess._id}
                    sx={{
                      '&:hover': { bgcolor: theme.custom?.interaction?.hoverTint || 'rgba(0,0,0,0.02)' },
                    }}
                  >
                    <TableCell sx={{ py: 1.5, fontWeight: 600, fontFamily: theme.typography.mono.fontFamily }}>{sess.academicYear}</TableCell>
                    <TableCell sx={{ py: 1.5 }}>{sess.semesterType === 'ODD' ? 'Odd' : 'Even'}</TableCell>
                    <TableCell sx={{ py: 1.5 }}>{formatDate(sess.termStartDate)}</TableCell>
                    <TableCell sx={{ py: 1.5 }}>{formatDate(sess.termEndDate)}</TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Chip
                        label={sess.status}
                        size="small"
                        sx={{
                          ...getStatusChipStyle(sess.status),
                          fontFamily: theme.typography.mono.fontFamily,
                          fontWeight: 700,
                          fontSize: '0.68rem',
                          borderRadius: '6px',
                        }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
                        {sess.status !== 'ACTIVE' && (
                          <Button
                            size="small"
                            startIcon={<PlayArrowOutlined />}
                            onClick={() => setActivateTargetId(sess._id)}
                            sx={{ textTransform: 'none', fontWeight: 600 }}
                          >
                            Set Active
                          </Button>
                        )}
                        <Tooltip title="Edit Academic Session Timeline">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEdit(sess)}
                          >
                            <EditOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Academic Session">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteTargetId(sess._id)}
                            sx={{ borderRadius: '6px' }}
                          >
                            <DeleteOutline fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <Box sx={{ p: 2 }}>
              <Pagination
                page={page}
                totalPages={sessionsData.meta?.totalPages || 1}
                total={sessionsData.meta?.total || 0}
                limit={limit}
                onPageChange={setPage}
              />
            </Box>
          </TableContainer>
        )}
      </Card>

      {/* Activation Confirmation Modal */}
      <ConfirmDeleteModal
        open={!!activateTargetId}
        onClose={() => setActivateTargetId(null)}
        onConfirm={handleActivateConfirm}
        title="Activate Academic Session"
        description="Activating this academic session will automatically archive the currently active session. Are you sure you want to proceed?"
        actionText="Activate"
        typedConfirmation={false}
      />

      {/* Delete Session Confirmation Modal */}
      <ConfirmDeleteModal
        open={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Academic Session"
        description="Are you sure you want to permanently delete this academic session? This action cannot be undone."
        actionText="Delete Session"
        typedConfirmation={false}
      />

      {/* Form Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 460 }, p: 4, bgcolor: theme.palette.background.paper } }}
      >
        <Box
          component="form"
          onSubmit={handleSubmit(handleFormSubmit)}
          sx={{ display: 'flex', flexDirection: 'column', gap: 4, height: '100%', justifyContent: 'space-between' }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="h5" sx={{ fontFamily: theme.typography.h1.fontFamily, fontWeight: 700, color: theme.palette.ink[900], mb: 0.5 }}>
                {editingSessionId ? 'Edit Academic Session' : 'New Academic Session'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {editingSessionId ? 'Modify term dates and status configuration.' : 'Register a new academic session with term boundaries.'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* Academic Year */}
              <Box>
                <Typography component="label" htmlFor="year-input" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                  Academic Year
                </Typography>
                <TextField
                  id="year-input"
                  fullWidth
                  size="small"
                  placeholder="e.g., 2026-27 (or type 2026)"
                  value={yearValue}
                  onChange={handleYearChange}
                  error={!!errors.academicYear}
                  helperText={errors.academicYear?.message}
                />
              </Box>

              {/* Semester Type */}
              <Box>
                <Typography component="label" htmlFor="sem-type-input" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                  Semester Type
                </Typography>
                <Controller
                  name="semesterType"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} id="sem-type-input" select fullWidth size="small">
                      <MenuItem value="ODD">Odd Semester</MenuItem>
                      <MenuItem value="EVEN">Even Semester</MenuItem>
                    </TextField>
                  )}
                />
              </Box>

              {/* Term Start Date */}
              <Box>
                <Typography component="label" htmlFor="start-date-input" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                  Term Start Date
                </Typography>
                <TextField
                  id="start-date-input"
                  type="date"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  {...register('termStartDate')}
                  error={!!errors.termStartDate}
                  helperText={errors.termStartDate?.message}
                />
              </Box>

              {/* Term End Date */}
              <Box>
                <Typography component="label" htmlFor="end-date-input" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                  Term End Date
                </Typography>
                <TextField
                  id="end-date-input"
                  type="date"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  {...register('termEndDate')}
                  error={!!errors.termEndDate}
                  helperText={errors.termEndDate?.message}
                />
              </Box>

              {/* Status */}
              <Box>
                <Typography component="label" htmlFor="status-input" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                  Status Configuration
                </Typography>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} id="status-input" select fullWidth size="small">
                      <MenuItem value="UPCOMING">Upcoming (Scheduled)</MenuItem>
                      <MenuItem value="ACTIVE">Active (Current Term)</MenuItem>
                      <MenuItem value="ARCHIVED">Archived (Past Term)</MenuItem>
                    </TextField>
                  )}
                />
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setDrawerOpen(false)}
              sx={{ py: 1, textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={createSession.isPending || updateSession.isPending}
              sx={{
                py: 1,
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: '8px',
                background: theme.palette.primary.gradient || theme.palette.primary.main,
                color: '#ffffff',
              }}
            >
              {editingSessionId
                ? updateSession.isPending
                  ? 'Updating...'
                  : 'Update Session'
                : createSession.isPending
                ? 'Saving...'
                : 'Create Session'}
            </Button>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default AcademicCalendar;
