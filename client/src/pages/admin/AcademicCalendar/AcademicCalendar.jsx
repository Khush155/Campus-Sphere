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
} from '@mui/material';
import { AddOutlined, PlayArrowOutlined } from '@mui/icons-material';

import {
  useActiveSessionQuery,
  useAcademicSessionsQuery,
  useCreateAcademicSessionMutation,
  useActivateAcademicSessionMutation,
} from '../../../queries/academicSessionQueries';
import Pagination from '../../../components/common/Pagination';
import ConfirmDeleteModal from '../../../components/common/ConfirmDeleteModal';
import EmptyState from '../../../components/common/EmptyState';

const sessionFormSchema = z.object({
  academicYear: z
    .string()
    .min(1, 'Academic year is required')
    .regex(/^\d{4}-\d{2}$/, 'Format must be YYYY-YY (e.g., 2026-27)')
    .trim(),
  semesterType: z.enum(['ODD', 'EVEN'], { required_error: 'Semester type is required' }),
  termStartDate: z.string().min(1, 'Start date is required'),
  termEndDate: z.string().min(1, 'End date is required'),
  status: z.enum(['ACTIVE', 'ARCHIVED']).default('ACTIVE'),
}).refine(
  (data) => new Date(data.termEndDate) > new Date(data.termStartDate),
  {
    message: 'Term end date must be after term start date',
    path: ['termEndDate'],
  }
);

export const AcademicCalendar = () => {
  const theme = useTheme();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Modal / Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activateTargetId, setActivateTargetId] = useState(null);

  // Queries
  const { data: activeSession, isLoading: loadingActive } = useActiveSessionQuery();
  const { data: sessionsData, isLoading: loadingList, error, refetch } = useAcademicSessionsQuery({
    page,
    limit,
  });

  const createSession = useCreateAcademicSessionMutation();
  const activateSession = useActivateAcademicSessionMutation();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      academicYear: '',
      semesterType: 'ODD',
      termStartDate: '',
      termEndDate: '',
      status: 'ACTIVE',
    },
  });

  const handleOpenCreate = () => {
    reset({
      academicYear: '',
      semesterType: 'ODD',
      termStartDate: '',
      termEndDate: '',
      status: 'ACTIVE',
    });
    setDrawerOpen(true);
  };

  const handleFormSubmit = async (data) => {
    try {
      await createSession.mutateAsync(data);
      setDrawerOpen(false);
      setPage(1);
    } catch (err) {
      // Handled by global handlers
    }
  };

  const handleActivateConfirm = async () => {
    if (activateTargetId) {
      try {
        await activateSession.mutateAsync(activateTargetId);
        setActivateTargetId(null);
      } catch (err) {
        // Handled globally
      }
    }
  };

  const getStatusChipStyle = (status) => {
    if (status === 'ACTIVE') {
      return {
        bgcolor: 'rgba(16, 185, 129, 0.1)',
        color: theme.palette.signal.success,
      };
    }
    return {
      bgcolor: 'rgba(107, 114, 128, 0.15)',
      color: theme.palette.text.secondary,
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, p: 4 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontFamily: theme.typography.h1.fontFamily,
              fontWeight: 700,
              color: theme.palette.ink[900],
              mb: 0.5,
            }}
          >
            Academic Sessions & Calendar
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure terms, active academic years, and toggle semester boundaries.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddOutlined />}
          onClick={handleOpenCreate}
          sx={{
            bgcolor: theme.palette.primary.main,
            color: theme.palette.ink[900],
            fontWeight: 700,
            textTransform: 'none',
            borderRadius: '8px',
            '&:hover': { bgcolor: theme.palette.primary.light },
          }}
        >
          Create Session
        </Button>
      </Box>

      {/* Prominent Active Session Card */}
      {loadingActive ? (
        <Card sx={{ p: 3, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: '12px' }}>
          <Skeleton variant="text" width="40%" height={32} />
          <Skeleton variant="text" width="60%" height={24} sx={{ mt: 1 }} />
        </Card>
      ) : activeSession ? (
        <Card
          sx={{
            p: 4,
            border: `1px solid ${theme.palette.primary.main}`,
            background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(217, 184, 118, 0.05) 100%)`,
            boxShadow: 'none',
            borderRadius: '16px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
            <Chip
              label="CURRENT ACTIVE SESSION"
              color="success"
              size="small"
              sx={{ fontWeight: 800, fontSize: '0.7rem', borderRadius: '6px' }}
            />
          </Box>
          <Typography
            variant="h5"
            sx={{
              fontFamily: theme.typography.h1.fontFamily,
              fontWeight: 700,
              color: theme.palette.ink[900],
              mb: 1,
            }}
          >
            {activeSession.semesterType === 'ODD' ? 'Odd Semester' : 'Even Semester'} {activeSession.academicYear}
          </Typography>
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
            Term Duration: <strong>{formatDate(activeSession.termStartDate)}</strong> to{' '}
            <strong>{formatDate(activeSession.termEndDate)}</strong>
          </Typography>
        </Card>
      ) : (
        <Alert severity="warning" sx={{ borderRadius: '12px' }}>
          No active academic session set. Configure one below to initialize the calendar scope.
        </Alert>
      )}

      {/* Error Alert with Retry */}
      {error && (
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => refetch()}>Retry</Button>} sx={{ borderRadius: '12px' }}>
          Failed to load academic session history.
        </Alert>
      )}

      {/* Session History Table */}
      {loadingList ? (
        <TableContainer component={Card} sx={{ border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: '12px' }}>
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
      ) : !sessionsData?.data || sessionsData.data.length === 0 ? (
        <EmptyState
          type="calendar"
          title="No Academic Session Configured"
          description="Create the first academic session to set the start and end dates of terms."
          actionText="Create Session"
          onAction={handleOpenCreate}
        />
      ) : (
        <TableContainer component={Card} sx={{ border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: '12px' }}>
          <Table aria-label="academic sessions directory table">
            <TableHead sx={{ bgcolor: 'rgba(28, 46, 69, 0.02)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>ACADEMIC YEAR</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>SEMESTER TYPE</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>START DATE</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>END DATE</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>STATUS</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sessionsData.data.map((sess) => (
                <TableRow key={sess._id} sx={{ '&:hover': { bgcolor: theme.custom.interaction.hoverTint } }}>
                  <TableCell sx={{ fontWeight: 600 }}>{sess.academicYear}</TableCell>
                  <TableCell>{sess.semesterType === 'ODD' ? 'Odd' : 'Even'}</TableCell>
                  <TableCell>{formatDate(sess.termStartDate)}</TableCell>
                  <TableCell>{formatDate(sess.termEndDate)}</TableCell>
                  <TableCell>
                    <Chip
                      label={sess.status}
                      size="small"
                      sx={{
                        ...getStatusChipStyle(sess.status),
                        fontWeight: 700,
                        fontSize: '0.68rem',
                        borderRadius: '6px',
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {sess.status === 'ARCHIVED' && (
                      <Button
                        size="small"
                        startIcon={<PlayArrowOutlined />}
                        onClick={() => setActivateTargetId(sess._id)}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                      >
                        Activate
                      </Button>
                    )}
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

      {/* Confirmation Modal */}
      <ConfirmDeleteModal
        open={!!activateTargetId}
        onClose={() => setActivateTargetId(null)}
        onConfirm={handleActivateConfirm}
        title="Activate Academic Session"
        description="Activating this academic session will automatically archive the currently active session. Are you sure you want to proceed?"
        actionText="Activate"
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
                New Academic Session
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Register a new academic session with term boundaries.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* Academic Year */}
              <Box>
                <Typography component="label" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                  Academic Year
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="e.g., 2026-27"
                  {...register('academicYear')}
                  error={!!errors.academicYear}
                  helperText={errors.academicYear?.message}
                />
              </Box>

              {/* Semester Type */}
              <Box>
                <Typography component="label" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                  Semester Type
                </Typography>
                <Controller
                  name="semesterType"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth size="small">
                      <MenuItem value="ODD">Odd Semester</MenuItem>
                      <MenuItem value="EVEN">Even Semester</MenuItem>
                    </TextField>
                  )}
                />
              </Box>

              {/* Term Start Date */}
              <Box>
                <Typography component="label" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                  Term Start Date
                </Typography>
                <TextField
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
                <Typography component="label" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                  Term End Date
                </Typography>
                <TextField
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
                <Typography component="label" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                  Status Configuration
                </Typography>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth size="small">
                      <MenuItem value="ACTIVE">Activate on Creation</MenuItem>
                      <MenuItem value="ARCHIVED">Draft (Archived)</MenuItem>
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
              sx={{
                py: 1,
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: '8px',
                bgcolor: theme.palette.primary.main,
                color: theme.palette.ink[900],
                '&:hover': { bgcolor: theme.palette.primary.light },
              }}
            >
              Create
            </Button>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};
