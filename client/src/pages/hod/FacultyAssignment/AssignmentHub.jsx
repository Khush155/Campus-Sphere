import React, { useState, useMemo } from 'react';
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
  FilterListOutlined,
  ClearOutlined,
} from '@mui/icons-material';
import AssignFacultyDrawer from './AssignFacultyDrawer';
import RevokeAssignmentModal from './RevokeAssignmentModal';
import {
  useAssignmentsQuery,
  useCreateAssignmentMutation,
  useRevokeAssignmentMutation,
} from '../../../queries/assignmentQueries';
import { useCoursesQuery, useBranchesQuery } from '../../../queries/collegeQueries';
import { useToast } from '../../../contexts/ToastContext';
import { computeSubjectCode } from '../../../utils/subjectCode';
import EmptyState from '../../../components/common/EmptyState';

export const AssignmentHub = () => {
  const theme = useTheme();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [assignmentToRevoke, setAssignmentToRevoke] = useState(null);

  // Queries & Mutations
  const { data: assignmentsRes, isLoading, refetch } = useAssignmentsQuery({ limit: 200 });
  const assignments = useMemo(() => assignmentsRes?.data || [], [assignmentsRes]);

  const { data: coursesData } = useCoursesQuery();
  const { data: branchesData } = useBranchesQuery();

  const createMutation = useCreateAssignmentMutation();
  const revokeMutation = useRevokeAssignmentMutation();

  // Courses & Branches lists
  const availableCourses = useMemo(() => {
    if (coursesData && Array.isArray(coursesData)) return coursesData;
    const courseMap = new Map();
    assignments.forEach((a) => {
      const c = a.subjectId?.branchId?.courseId;
      if (c && (c._id || c.id)) courseMap.set(c._id || c.id, c);
    });
    return Array.from(courseMap.values());
  }, [coursesData, assignments]);

  const availableBranches = useMemo(() => {
    const allBranches = Array.isArray(branchesData) ? branchesData : (branchesData?.data || []);
    if (allBranches.length > 0) {
      if (!courseFilter) return allBranches;
      return allBranches.filter((b) => {
        const cId = b.courseId?._id || b.courseId?.id || b.courseId;
        return String(cId) === String(courseFilter);
      });
    }

    const branchMap = new Map();
    assignments.forEach((a) => {
      const b = a.subjectId?.branchId;
      if (b && (b._id || b.id)) {
        const cId = b.courseId?._id || b.courseId?.id || b.courseId;
        if (!courseFilter || String(cId) === String(courseFilter)) {
          branchMap.set(String(b._id || b.id), b);
        }
      }
    });
    return Array.from(branchMap.values());
  }, [branchesData, assignments, courseFilter]);

  // Filtered List
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const subj = a.subjectId || {};
      const subjName = subj.name || '';
      const subjCode = computeSubjectCode(subj, subj.branchId).toLowerCase();
      const facName = a.facultyId?.name || '';
      const facEmail = a.facultyId?.email || '';

      const lowerSearch = search.trim().toLowerCase();
      const matchesSearch =
        !lowerSearch ||
        subjName.toLowerCase().includes(lowerSearch) ||
        subjCode.includes(lowerSearch) ||
        facName.toLowerCase().includes(lowerSearch) ||
        facEmail.toLowerCase().includes(lowerSearch);

      const cId = subj.branchId?.courseId?._id || subj.branchId?.courseId?.id || subj.branchId?.courseId;
      const matchesCourse = !courseFilter || String(cId) === String(courseFilter);

      const bId = subj.branchId?._id || subj.branchId?.id;
      const matchesBranch = !branchFilter || String(bId) === String(branchFilter);

      const matchesSem = !semesterFilter || String(subj.semester) === String(semesterFilter);

      const matchesStatus = !statusFilter || a.status === statusFilter;

      return matchesSearch && matchesCourse && matchesBranch && matchesSem && matchesStatus;
    });
  }, [assignments, search, courseFilter, branchFilter, semesterFilter, statusFilter]);

  // Metrics
  const totalAssignments = assignmentsRes?.meta?.total ?? assignments.length;
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

  const handleClearFilters = () => {
    setSearch('');
    setCourseFilter('');
    setBranchFilter('');
    setSemesterFilter('');
    setStatusFilter('');
  };

  const hasActiveFilters = Boolean(search || courseFilter || branchFilter || semesterFilter || statusFilter);

  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* ── 1. Hero Identity Banner ────────────────────────────────────────── */}
      <Card
        sx={{
          p: { xs: 2.5, md: 3.5 },
          borderRadius: '22px',
          border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
          background: isDark
            ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.14) 0%, rgba(184, 134, 62, 0.08) 100%)'
            : 'linear-gradient(135deg, rgba(79, 70, 229, 0.06) 0%, rgba(184, 134, 62, 0.04) 100%)',
          backdropFilter: 'blur(12px)',
          boxShadow: isDark
            ? '0 18px 40px -15px rgba(0,0,0,0.5)'
            : '0 18px 40px -15px rgba(79, 70, 229, 0.08)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Chip
                icon={<AssignmentIndOutlined sx={{ fontSize: '0.85rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="FACULTY ALLOCATION & TEACHING WORKLOAD DESK"
                size="small"
                sx={{
                  bgcolor: `${theme.palette.primary.main}18`,
                  color: theme.palette.primary.main,
                  fontWeight: 800,
                  fontSize: '0.68rem',
                  letterSpacing: '0.04em',
                }}
              />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.ink[900], letterSpacing: '-0.02em' }}>
              Faculty Subject Allocations
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5, maxWidth: 650 }}>
              Assign department curriculum subjects to faculty members, manage section workloads, and balance teaching coverage.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshOutlined />}
              onClick={() => refetch()}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddOutlined />}
              onClick={() => setDrawerOpen(true)}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 700,
                px: 2.5,
                background: theme.palette.primary.gradient || theme.palette.primary.main,
                color: '#ffffff',
                boxShadow: `0 4px 14px ${theme.palette.primary.main}35`,
              }}
            >
              Assign Faculty Member
            </Button>
          </Box>
        </Box>
      </Card>

      {/* ── 2. KPI Summary Grid ────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={4}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: '18px',
              border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
              borderTop: `4px solid ${theme.palette.primary.main}`,
              bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
              boxShadow: theme.custom?.elevation?.raised || 'none',
              transition: 'all 0.25s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: isDark ? '0 12px 28px rgba(0,0,0,0.3)' : '0 12px 28px rgba(0,0,0,0.06)',
                borderColor: theme.palette.primary.main,
              },
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
              TOTAL ASSIGNMENTS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.ink[900], mt: 0.5, fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
              {isLoading ? <CircularProgress size={22} /> : totalAssignments}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
              All recorded subject allocations
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: '18px',
              border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
              borderTop: `4px solid ${theme.palette.success.main}`,
              bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
              boxShadow: theme.custom?.elevation?.raised || 'none',
              transition: 'all 0.25s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: isDark ? '0 12px 28px rgba(0,0,0,0.3)' : '0 12px 28px rgba(0,0,0,0.06)',
                borderColor: theme.palette.success.main,
              },
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
              ACTIVE ALLOCATIONS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.success.main, mt: 0.5, fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
              {isLoading ? <CircularProgress size={22} /> : activeCount}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
              Currently teaching & active
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: '18px',
              border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
              borderTop: `4px solid ${theme.palette.error.main}`,
              bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
              boxShadow: theme.custom?.elevation?.raised || 'none',
              transition: 'all 0.25s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: isDark ? '0 12px 28px rgba(0,0,0,0.3)' : '0 12px 28px rgba(0,0,0,0.06)',
                borderColor: theme.palette.error.main,
              },
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
              REVOKED / INACTIVE
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.error.main, mt: 0.5, fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
              {isLoading ? <CircularProgress size={22} /> : revokedCount}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
              Relieved subject allocations
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* ── 3. Filter Bar (Search, Course, Branch, Semester, Status) ──────────── */}
      <Card sx={{ p: { xs: 2, md: 2.5 }, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterListOutlined sx={{ color: theme.palette.primary.main, fontSize: 18 }} /> Filter Workload Allocations
          </Typography>

          {hasActiveFilters && (
            <Button
              size="small"
              onClick={handleClearFilters}
              startIcon={<ClearOutlined />}
              sx={{ textTransform: 'none', fontWeight: 700, color: theme.palette.text.secondary }}
            >
              Clear Filters
            </Button>
          )}
        </Box>

        <Grid container spacing={2}>
          {/* Search */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search subject or faculty..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchOutlined fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>

          {/* Course Filter */}
          <Grid item xs={12} sm={6} md={2.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Course Program"
              value={courseFilter}
              onChange={(e) => {
                setCourseFilter(e.target.value);
                setBranchFilter('');
              }}
            >
              <MenuItem value="">All Courses</MenuItem>
              {availableCourses.map((c) => (
                <MenuItem key={c._id || c.id} value={c._id || c.id}>
                  {c.name} ({c.code})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Branch Filter */}
          <Grid item xs={12} sm={6} md={2.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Branch Specialization"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
            >
              <MenuItem value="">All Branches</MenuItem>
              {availableBranches.map((b) => (
                <MenuItem key={b._id || b.id} value={b._id || b.id}>
                  {b.name} ({b.code})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Semester Filter */}
          <Grid item xs={6} sm={3} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Semester"
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
            >
              <MenuItem value="">All Semesters</MenuItem>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <MenuItem key={sem} value={sem}>
                  Semester {sem}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Status Filter */}
          <Grid item xs={6} sm={3} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="ACTIVE">Active Only</MenuItem>
              <MenuItem value="REVOKED">Revoked Only</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        {/* Table Container */}
        <Box sx={{ mt: 3 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress size={32} />
            </Box>
          ) : filteredAssignments.length === 0 ? (
            <EmptyState
              type="users"
              title="No Faculty Assignments Found"
              description={hasActiveFilters ? "No faculty subject allocations match your active filters." : "No faculty subject assignments recorded yet."}
              actionText={hasActiveFilters ? "Clear All Filters" : "Assign Faculty"}
              onAction={hasActiveFilters ? handleClearFilters : () => setDrawerOpen(true)}
            />
          ) : (
            <TableContainer sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '14px' }}>
              <Table size="medium">
                <TableHead sx={{ bgcolor: `${theme.palette.primary.main}06` }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem' }}>CURRICULUM SUBJECT</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem' }}>COURSE & BRANCH</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem' }}>ASSIGNED FACULTY</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem' }}>TARGET GROUP / SECTION</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem' }}>STATUS</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem' }}>ACTIONS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAssignments.map((row) => {
                    const subj = row.subjectId || {};
                    const courseObj = subj.branchId?.courseId;
                    const branchObj = subj.branchId;
                    const codeStr = computeSubjectCode(subj, branchObj);

                    return (
                      <TableRow key={row._id} hover>
                        {/* Subject */}
                        <TableCell sx={{ py: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 34, height: 34, bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main }}>
                              <SchoolOutlined sx={{ fontSize: 18 }} />
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.ink[900], lineHeight: 1.3 }}>
                                {subj.name || 'N/A'}
                              </Typography>
                              <Chip
                                label={codeStr}
                                size="small"
                                sx={{
                                  mt: 0.3,
                                  fontFamily: theme.typography.mono?.fontFamily || 'monospace',
                                  fontWeight: 700,
                                  fontSize: '0.62rem',
                                  height: 18,
                                  bgcolor: `${theme.palette.primary.main}12`,
                                  color: theme.palette.primary.main,
                                }}
                              />
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Course & Branch */}
                        <TableCell sx={{ py: 2 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.ink?.[800] || 'text.primary' }}>
                              {branchObj?.name || 'General Branch'}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'center' }}>
                              <Chip
                                label={courseObj?.name || courseObj?.code || 'Course'}
                                size="small"
                                variant="outlined"
                                sx={{ fontWeight: 600, fontSize: '0.65rem', height: 18 }}
                              />
                              {subj.semester && (
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                                  Sem {subj.semester}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Assigned Faculty */}
                        <TableCell sx={{ py: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 30, height: 30, bgcolor: `${theme.palette.primary.main}18`, color: theme.palette.primary.main, fontSize: '0.8rem', fontWeight: 700 }}>
                              {row.facultyId?.name?.charAt(0) || 'F'}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.ink[900] }}>
                                {row.facultyId?.name || 'Unassigned'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {row.facultyId?.email || 'N/A'}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Target Group */}
                        <TableCell sx={{ py: 2 }}>
                          <Chip
                            label={row.group ? `Group ${row.group}` : 'All Groups / Full Batch'}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 700, fontSize: '0.68rem', height: 22 }}
                          />
                        </TableCell>

                        {/* Status */}
                        <TableCell sx={{ py: 2 }}>
                          <Chip
                            icon={row.status === 'ACTIVE' ? <CheckCircleOutlined sx={{ fontSize: '0.8rem !important' }} /> : undefined}
                            label={row.status || 'ACTIVE'}
                            size="small"
                            color={row.status === 'ACTIVE' ? 'success' : 'error'}
                            sx={{ fontWeight: 800, fontSize: '0.65rem', height: 22 }}
                          />
                        </TableCell>

                        {/* Action */}
                        <TableCell align="right" sx={{ py: 2 }}>
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
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
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
