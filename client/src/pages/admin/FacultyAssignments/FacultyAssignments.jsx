import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Chip,
  Button,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Drawer,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  AssignmentIndOutlined,
  SearchOutlined,
  SwapHorizOutlined,
  WarningAmberOutlined,
  BusinessOutlined,
  RefreshOutlined,
} from '@mui/icons-material';
import { useUsersQuery, useUpdateUserMutation } from '../../../queries/userQueries';
import { useDepartmentsQuery } from '../../../queries/collegeQueries';
import { useToast } from '../../../contexts/ToastContext';
import EmptyState from '../../../components/common/EmptyState';

export const FacultyAssignments = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { showToast } = useToast();

  // State filters
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [allocationFilter, setAllocationFilter] = useState('');

  // Reassignment Drawer State
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [targetDeptId, setTargetDeptId] = useState('');
  const [reassignReason, setReassignReason] = useState('');

  // Queries
  const { data: facultyData, isLoading: loadingFaculty, refetch } = useUsersQuery({
    role: 'FACULTY',
    limit: 200,
  });
  const { data: deptsData, isLoading: loadingDepts } = useDepartmentsQuery();

  const updateUserMutation = useUpdateUserMutation();

  const allFaculty = facultyData?.data || [];
  const depts = deptsData || [];

  // Metrics computation
  const totalFaculty = allFaculty.length;
  const assignedFaculty = allFaculty.filter((f) => f.departmentId).length;
  const unassignedFaculty = totalFaculty - assignedFaculty;
  const coverageRatio = depts.length > 0
    ? Math.round((new Set(allFaculty.map((f) => f.departmentId).filter(Boolean)).size / depts.length) * 100)
    : 0;

  // Filtered faculty list
  const filteredFaculty = allFaculty.filter((f) => {
    const matchesSearch =
      search === '' ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.email.toLowerCase().includes(search.toLowerCase());

    const matchesDept =
      deptFilter === '' || String(f.departmentId?._id || f.departmentId) === String(deptFilter);

    const matchesAllocation =
      allocationFilter === '' ||
      (allocationFilter === 'ASSIGNED' && f.departmentId) ||
      (allocationFilter === 'UNASSIGNED' && !f.departmentId);

    return matchesSearch && matchesDept && matchesAllocation;
  });

  // Handle Transfer submit
  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFaculty) return;

    try {
      await updateUserMutation.mutateAsync({
        id: selectedFaculty.id || selectedFaculty._id,
        data: {
          departmentId: targetDeptId || null,
          reason: reassignReason || 'Reassigned by College Admin',
        },
      });

      const newDeptObj = depts.find((d) => String(d._id) === String(targetDeptId));
      showToast(
        `${selectedFaculty.name} re-allocated to ${newDeptObj ? newDeptObj.name : 'Unassigned (Pool)'} successfully.`
      );
      setSelectedFaculty(null);
      setTargetDeptId('');
      setReassignReason('');
      refetch();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update faculty allocation.', {
        severity: 'error',
      });
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* ── 1. Hero Banner Card ───────────────────────────────────────────── */}
      <Card
        sx={{
          p: 3.5,
          borderRadius: '22px',
          border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
          background: isDark
            ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.12) 0%, rgba(184, 134, 62, 0.06) 100%)'
            : 'linear-gradient(135deg, rgba(79, 70, 229, 0.06) 0%, rgba(184, 134, 62, 0.04) 100%)',
          backdropFilter: 'blur(12px)',
          boxShadow: theme.custom?.elevation?.raised || '0 8px 24px rgba(0,0,0,0.03)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Chip
                icon={<AssignmentIndOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="FACULTY ALLOCATION & STAFFING DESK"
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
              Faculty Workload & Allocation Desk
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              Assign faculty members across academic departments, balance teaching coverage, and resolve staffing gaps.
            </Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={<RefreshOutlined />}
            onClick={() => refetch()}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
          >
            Refresh Roster
          </Button>
        </Box>
      </Card>

      {/* ── 2. KPI Metrics Grid ───────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 3,
              borderRadius: '18px',
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: 'none',
              bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
              borderTop: `4px solid ${theme.palette.primary.main}`,
              transition: 'all 0.25s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: isDark ? '0 12px 28px rgba(0,0,0,0.3)' : '0 12px 28px rgba(0,0,0,0.06)',
              },
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
              TOTAL FACULTY STAFF
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.ink[900], mt: 1, fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
              {loadingFaculty ? <CircularProgress size={24} /> : totalFaculty}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Registered academic educators
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 3,
              borderRadius: '18px',
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: 'none',
              bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
              borderTop: `4px solid ${theme.palette.signal?.success || '#10b981'}`,
              transition: 'all 0.25s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: isDark ? '0 12px 28px rgba(0,0,0,0.3)' : '0 12px 28px rgba(0,0,0,0.06)',
              },
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.signal?.success || '#10b981' }}>
              ALLOCATED TO DEPTS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.signal?.success || '#10b981', mt: 1, fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
              {loadingFaculty ? <CircularProgress size={24} /> : assignedFaculty}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Active department teaching load
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 3,
              borderRadius: '18px',
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: 'none',
              bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
              borderTop: `4px solid ${theme.palette.brass?.[500] || '#f59e0b'}`,
              transition: 'all 0.25s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: isDark ? '0 12px 28px rgba(0,0,0,0.3)' : '0 12px 28px rgba(0,0,0,0.06)',
              },
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.brass?.[500] || '#f59e0b' }}>
              UNASSIGNED POOL
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.brass?.[500] || '#f59e0b', mt: 1, fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
              {loadingFaculty ? <CircularProgress size={24} /> : unassignedFaculty}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Faculty requiring department assignment
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 3,
              borderRadius: '18px',
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: 'none',
              bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
              borderTop: `4px solid ${theme.palette.signal?.info || '#3b82f6'}`,
              transition: 'all 0.25s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: isDark ? '0 12px 28px rgba(0,0,0,0.3)' : '0 12px 28px rgba(0,0,0,0.06)',
              },
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.signal?.info || '#3b82f6' }}>
              DEPT COVERAGE RATIO
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.signal?.info || '#3b82f6', mt: 1, fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
              {loadingDepts ? <CircularProgress size={24} /> : `${coverageRatio}%`}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Departments staffed with faculty
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* ── 3. Filters & Roster Table ───────────────────────────────────────── */}
      <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
          <Grid item xs={12} sm={5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search faculty by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchOutlined sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={3.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Department Filter"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              SelectProps={{ displayEmpty: true }}
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="">All Departments</MenuItem>
              {depts.map((d) => (
                <MenuItem key={d._id} value={d._id}>
                  {d.name} ({d.code})
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Allocation Status"
              value={allocationFilter}
              onChange={(e) => setAllocationFilter(e.target.value)}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="ASSIGNED">Assigned to Dept</MenuItem>
              <MenuItem value="UNASSIGNED">Unassigned Pool</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        {loadingFaculty ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : filteredFaculty.length === 0 ? (
          <EmptyState
            type="users"
            title="No Faculty Members Found"
            description="No faculty records match your active search or department filter."
            actionText="Reset Filters"
            onAction={() => {
              setSearch('');
              setDeptFilter('');
              setAllocationFilter('');
            }}
          />
        ) : (
          <TableContainer>
            <Table size="medium">
              <TableHead sx={{ bgcolor: theme.custom?.surface?.sunken || 'rgba(0,0,0,0.02)' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>FACULTY NAME</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>EMAIL</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>ASSIGNED DEPARTMENT</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>STATUS</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>ACTION</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredFaculty.map((fac) => {
                  const deptObj = depts.find(
                    (d) => String(d._id) === String(fac.departmentId?._id || fac.departmentId)
                  );
                  const isAssigned = Boolean(deptObj || fac.department);

                  return (
                    <TableRow key={fac.id || fac._id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: `${theme.palette.primary.main}18`, color: theme.palette.primary.main, fontSize: '0.85rem', fontWeight: 700 }}>
                            {fac.name?.charAt(0) || 'F'}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.ink[900] }}>
                            {fac.name}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ fontFamily: theme.typography.mono.fontFamily, fontSize: '0.8rem', color: 'text.secondary' }}>
                        {fac.email}
                      </TableCell>

                      <TableCell>
                        {isAssigned ? (
                          <Chip
                            icon={<BusinessOutlined sx={{ fontSize: '0.85rem !important' }} />}
                            label={deptObj ? `${deptObj.name} (${deptObj.code})` : fac.department || 'Assigned'}
                            size="small"
                            sx={{
                              bgcolor: `${theme.palette.primary.main}12`,
                              color: theme.palette.primary.main,
                              fontWeight: 700,
                              fontSize: '0.72rem',
                            }}
                          />
                        ) : (
                          <Chip
                            icon={<WarningAmberOutlined sx={{ fontSize: '0.85rem !important' }} />}
                            label="Unassigned Pool"
                            size="small"
                            color="warning"
                            variant="outlined"
                            sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                          />
                        )}
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={fac.status || 'ACTIVE'}
                          size="small"
                          color={fac.status === 'ACTIVE' ? 'success' : 'default'}
                          sx={{ fontSize: '0.65rem', fontWeight: 700 }}
                        />
                      </TableCell>

                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<SwapHorizOutlined />}
                          onClick={() => {
                            setSelectedFaculty(fac);
                            setTargetDeptId(fac.departmentId?._id || fac.departmentId || '');
                            setReassignReason('');
                          }}
                          sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.75rem' }}
                        >
                          {isAssigned ? 'Reassign' : 'Assign Dept'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* ── 4. Reassignment Action Drawer ─────────────────────────────────── */}
      <Drawer
        anchor="right"
        open={Boolean(selectedFaculty)}
        onClose={() => setSelectedFaculty(null)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 440 }, p: 4, bgcolor: theme.palette.background.paper } }}
      >
        {selectedFaculty && (
          <Box component="form" onSubmit={handleTransferSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, height: '100%', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography variant="h5" sx={{ fontFamily: theme.typography.h1.fontFamily, fontWeight: 700, color: theme.palette.ink[900], mb: 0.5 }}>
                  Reassign Faculty Member
                </Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                  Assign or transfer {selectedFaculty.name} to an academic department.
                </Typography>
              </Box>

              <Card sx={{ p: 2.5, bgcolor: theme.custom?.surface?.sunken || 'rgba(0,0,0,0.02)', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.ink[900] }}>
                  {selectedFaculty.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontFamily: theme.typography.mono.fontFamily }}>
                  {selectedFaculty.email}
                </Typography>
              </Card>

              <Box>
                <Typography component="label" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                  Target Academic Department
                </Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={targetDeptId}
                  onChange={(e) => setTargetDeptId(e.target.value)}
                >
                  <MenuItem value="">Unassigned Pool (Remove from Department)</MenuItem>
                  {depts.map((d) => (
                    <MenuItem key={d._id} value={d._id}>
                      {d.name} ({d.code})
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <Box>
                <Typography component="label" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                  Reasoning / Transfer Note
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                  placeholder="e.g. Faculty load rebalancing for upcoming semester..."
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" fullWidth onClick={() => setSelectedFaculty(null)} sx={{ color: theme.palette.text.secondary }}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={updateUserMutation.isPending}
                sx={{
                  background: theme.palette.primary.gradient || theme.palette.primary.main,
                  color: '#ffffff',
                  fontWeight: 700,
                }}
              >
                {updateUserMutation.isPending ? 'Saving...' : 'Confirm Allocation'}
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>
    </Box>
  );
};

export default FacultyAssignments;
