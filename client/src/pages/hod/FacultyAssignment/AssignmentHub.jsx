import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  useTheme,
  Tooltip,
  IconButton,
  Card,
  Grid,
  Chip,
  TextField,
  MenuItem,
  CircularProgress,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  AddOutlined,
  CancelOutlined,
  AssignmentIndOutlined,
  SearchOutlined,
  RefreshOutlined,
  CheckCircleOutlined,
  SchoolOutlined,
} from '@mui/icons-material';
import AssignFacultyDrawer from './AssignFacultyDrawer';
import RevokeAssignmentModal from './RevokeAssignmentModal';
import {
  useAssignmentsQuery,
  useCreateAssignmentMutation,
  useRevokeAssignmentMutation,
} from '../../../queries/assignmentQueries';
import { useToast } from '../../../contexts/ToastContext';
import EmptyState from '../../../components/common/EmptyState';

export const AssignmentHub = () => {
  const theme = useTheme();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [assignmentToRevoke, setAssignmentToRevoke] = useState(null);

  // Queries & Mutations
  const { data: assignmentsRes, isLoading, refetch } = useAssignmentsQuery({ limit: 100 });
  const assignments = assignmentsRes?.data || [];

  const createMutation = useCreateAssignmentMutation();
  const revokeMutation = useRevokeAssignmentMutation();

  // Filtered List
  const filteredAssignments = assignments.filter((a) => {
    const subjName = a.subjectId?.name || '';
    const facName = a.facultyId?.name || '';
    const facEmail = a.facultyId?.email || '';

    const matchesSearch =
      search === '' ||
      subjName.toLowerCase().includes(search.toLowerCase()) ||
      facName.toLowerCase().includes(search.toLowerCase()) ||
      facEmail.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === '' || a.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Metrics
  const totalAssignments = assignments.length;
  const activeCount = assignments.filter((a) => a.status === 'ACTIVE').length;
  const revokedCount = assignments.filter((a) => a.status === 'REVOKED').length;

  const handleCreateAssignment = async (data) => {
    try {
      await createMutation.mutateAsync(data);
      showToast('Faculty subject assignment created successfully.');
      setDrawerOpen(false);
      refetch();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to assign faculty', { severity: 'error' });
    }
  };

  const handleOpenRevoke = (assignment) => {
    setAssignmentToRevoke(assignment);
    setRevokeModalOpen(true);
  };

  const handleRevokeConfirm = async (assignmentId) => {
    try {
      await revokeMutation.mutateAsync({
        assignmentId,
        revokedReason: 'Revoked manually from HOD Assignment Desk.',
      });
      showToast('Faculty subject assignment revoked.');
      setRevokeModalOpen(false);
      setAssignmentToRevoke(null);
      refetch();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to revoke assignment', { severity: 'error' });
    }
  };

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
                icon={<AssignmentIndOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="FACULTY ALLOCATION & TEACHING WORKLOAD DESK"
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
              Faculty Subject Assignments
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              Assign curriculum subjects to department professors, balance teaching workloads, and manage subject coverage.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshOutlined />}
              onClick={() => refetch()}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
            >
              Refresh Roster
            </Button>
            <Button
              variant="contained"
              startIcon={<AddOutlined />}
              onClick={() => setDrawerOpen(true)}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 700,
                background: theme.palette.primary.gradient || theme.palette.primary.main,
                color: '#ffffff',
              }}
            >
              Assign Faculty
            </Button>
          </Box>
        </Box>
      </Card>

      {/* ── 2. KPI Summary Grid ────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
              TOTAL ASSIGNMENTS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.ink[900], mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {isLoading ? <CircularProgress size={24} /> : totalAssignments}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              All recorded allocations
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.signal.success }}>
              ACTIVE ALLOCATIONS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.signal.success, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {isLoading ? <CircularProgress size={24} /> : activeCount}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Currently assigned & teaching
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.signal.error }}>
              REVOKED / INACTIVE
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.signal.error, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {isLoading ? <CircularProgress size={24} /> : revokedCount}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Relieved subject assignments
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* ── 3. Filters & Assignment Directory Table ───────────────────────── */}
      <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by subject name, faculty name, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchOutlined sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} />,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              size="small"
              label="Assignment Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              SelectProps={{ displayEmpty: true }}
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="ACTIVE">Active Only</MenuItem>
              <MenuItem value="REVOKED">Revoked Only</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : filteredAssignments.length === 0 ? (
          <EmptyState
            type="users"
            title="No Faculty Assignments Found"
            description="No faculty subject allocations match the active search or status filter."
            actionText="Assign Faculty"
            onAction={() => setDrawerOpen(true)}
          />
        ) : (
          <TableContainer>
            <Table size="medium">
              <TableHead sx={{ bgcolor: theme.custom?.surface?.sunken || 'rgba(0,0,0,0.02)' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>CURRICULUM SUBJECT</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>ASSIGNED FACULTY</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>TARGET GROUP / SECTION</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>STATUS</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAssignments.map((row) => (
                  <TableRow key={row._id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main }}>
                          <SchoolOutlined sx={{ fontSize: 18 }} />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.ink[900] }}>
                            {row.subjectId?.name || 'N/A'}
                          </Typography>
                          <Typography variant="caption" sx={{ fontFamily: theme.typography.mono.fontFamily, color: theme.palette.text.secondary }}>
                            {row.subjectId?.code ? `Code: ${row.subjectId.code}` : 'Department Course'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: `${theme.palette.brass?.[500] || '#b8863e'}18`, color: theme.palette.brass?.[500] || '#b8863e', fontSize: '0.75rem', fontWeight: 700 }}>
                          {row.facultyId?.name?.charAt(0) || 'F'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.ink[900] }}>
                            {row.facultyId?.name || 'Unassigned'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {row.facultyId?.email || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell sx={{ fontSize: '0.82rem' }}>
                      <Chip
                        label={row.group || 'All Groups'}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                      />
                    </TableCell>

                    <TableCell>
                      <Chip
                        icon={row.status === 'ACTIVE' ? <CheckCircleOutlined sx={{ fontSize: '0.8rem !important' }} /> : undefined}
                        label={row.status || 'ACTIVE'}
                        size="small"
                        color={row.status === 'ACTIVE' ? 'success' : 'error'}
                        sx={{ fontWeight: 800, fontSize: '0.65rem', height: 22 }}
                      />
                    </TableCell>

                    <TableCell align="right">
                      {row.status === 'ACTIVE' && (
                        <Tooltip title="Revoke Subject Assignment">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleOpenRevoke(row)}
                            disabled={revokeMutation.isPending}
                          >
                            <CancelOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* ── 4. Assign Drawer & Revoke Modal ───────────────────────────────── */}
      <AssignFacultyDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleCreateAssignment}
        isSubmitting={createMutation.isPending}
      />

      {assignmentToRevoke && (
        <RevokeAssignmentModal
          open={revokeModalOpen}
          onClose={() => {
            setRevokeModalOpen(false);
            setAssignmentToRevoke(null);
          }}
          onConfirm={handleRevokeConfirm}
          assignment={assignmentToRevoke}
        />
      )}
    </Box>
  );
};

export default AssignmentHub;
