import React, { useState, useMemo } from 'react';
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
  Chip,
  CircularProgress,
  TextField,
  useTheme,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Avatar,
  Paper,
  Divider,
} from '@mui/material';
import {
  SearchOutlined,
  AssignmentIndOutlined,
  SchoolOutlined,
  FilterListOutlined,
  ClearOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  MenuBookOutlined,
} from '@mui/icons-material';
import { useSubjectsQuery, useUpdateSubjectMutation, useCoursesQuery, useBranchesQuery } from '../../queries/collegeQueries';
import { useUsersQuery } from '../../queries/userQueries';
import { useToast } from '../../contexts/ToastContext';
import { computeSubjectCode } from '../../utils/subjectCode';
import EmptyState from '../../components/common/EmptyState';

const SubjectAllocation = () => {
  const theme = useTheme();
  const { showToast } = useToast();

  // Filter States
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // 'ASSIGNED', 'UNASSIGNED', ''

  // Modal State
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');

  // Queries
  const { data: subjectData, isLoading: loadingSubjects, refetch: refetchSubjects } = useSubjectsQuery();
  const { data: facultyData, isLoading: loadingFaculty } = useUsersQuery({ role: 'FACULTY' });
  const { data: coursesData } = useCoursesQuery();
  const { data: branchesData } = useBranchesQuery();

  // Mutation
  const updateSubject = useUpdateSubjectMutation();

  const facultiesList = useMemo(() => {
    if (!facultyData) return [];
    return Array.isArray(facultyData) ? facultyData : facultyData?.data || [];
  }, [facultyData]);

  // Extract unique Courses & Branches present in subjects
  const availableCourses = useMemo(() => {
    if (coursesData && Array.isArray(coursesData)) return coursesData;
    // Fallback extract from subjects
    if (!subjectData) return [];
    const courseMap = new Map();
    subjectData.forEach((sub) => {
      const c = sub.branchId?.courseId;
      if (c && (c._id || c.id)) {
        courseMap.set(c._id || c.id, c);
      }
    });
    return Array.from(courseMap.values());
  }, [coursesData, subjectData]);

  const availableBranches = useMemo(() => {
    const allBranches = Array.isArray(branchesData) ? branchesData : (branchesData?.data || []);
    if (allBranches.length > 0) {
      if (!courseFilter) return allBranches;
      return allBranches.filter((b) => {
        const cId = b.courseId?._id || b.courseId?.id || b.courseId;
        return String(cId) === String(courseFilter);
      });
    }

    if (!subjectData) return [];
    const branchMap = new Map();
    subjectData.forEach((sub) => {
      const b = sub.branchId;
      if (b && (b._id || b.id)) {
        const courseId = b.courseId?._id || b.courseId?.id || b.courseId;
        if (!courseFilter || String(courseId) === String(courseFilter)) {
          branchMap.set(String(b._id || b.id), b);
        }
      }
    });
    return Array.from(branchMap.values());
  }, [branchesData, subjectData, courseFilter]);

  // Filtered Subjects List
  const filteredSubjects = useMemo(() => {
    if (!subjectData) return [];

    return subjectData.filter((sub) => {
      const code = computeSubjectCode(sub, sub.branchId).toLowerCase();
      const name = (sub.name || '').toLowerCase();
      const lowerSearch = search.trim().toLowerCase();

      // Search match
      const matchesSearch = !lowerSearch || name.includes(lowerSearch) || code.includes(lowerSearch);

      // Course match
      const cId = sub.branchId?.courseId?._id || sub.branchId?.courseId?.id || sub.branchId?.courseId;
      const matchesCourse = !courseFilter || String(cId) === String(courseFilter);

      // Branch match
      const bId = sub.branchId?._id || sub.branchId?.id;
      const matchesBranch = !branchFilter || String(bId) === String(branchFilter);

      // Semester match
      const matchesSemester = !semesterFilter || String(sub.semester) === String(semesterFilter);

      // Status match
      const isAssigned = Boolean(sub.facultyId);
      const matchesStatus =
        !statusFilter ||
        (statusFilter === 'ASSIGNED' && isAssigned) ||
        (statusFilter === 'UNASSIGNED' && !isAssigned);

      return matchesSearch && matchesCourse && matchesBranch && matchesSemester && matchesStatus;
    });
  }, [subjectData, search, courseFilter, branchFilter, semesterFilter, statusFilter]);

  // KPI Metrics
  const totalCount = subjectData?.length || 0;
  const assignedCount = useMemo(() => subjectData?.filter((s) => Boolean(s.facultyId)).length || 0, [subjectData]);
  const unassignedCount = totalCount - assignedCount;

  const handleOpenAllocationModal = (subject) => {
    setSelectedSubject(subject);
    setSelectedFacultyId(subject.facultyId?._id || subject.facultyId?.id || subject.facultyId || '');
    setAllocationModalOpen(true);
  };

  const handleCloseModal = () => {
    setAllocationModalOpen(false);
    setSelectedSubject(null);
    setSelectedFacultyId('');
  };

  const handleSaveAllocation = async () => {
    if (!selectedSubject) return;

    try {
      await updateSubject.mutateAsync({
        id: selectedSubject._id || selectedSubject.id,
        data: { facultyId: selectedFacultyId || null },
      });
      showToast(
        selectedFacultyId
          ? `Allocated subject "${selectedSubject.name}" successfully.`
          : `Removed faculty allocation for "${selectedSubject.name}".`
      );
      handleCloseModal();
      refetchSubjects();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update subject allocation', { severity: 'error' });
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* ── 1. Hero Identity Banner ────────────────────────────────────────── */}
      <Card
        sx={{
          p: { xs: 2.5, md: 3.5 },
          borderRadius: '16px',
          border: `1px solid ${theme.palette.divider}`,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}12 0%, ${theme.palette.primary.main}04 100%)`,
          boxShadow: 'none',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Chip
                icon={<AssignmentIndOutlined sx={{ fontSize: '0.85rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="FACULTY WORKLOAD ALLOCATION"
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
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.ink?.[900] || 'text.primary', letterSpacing: '-0.02em' }}>
              Subject Allocation Studio
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5, maxWidth: 650 }}>
              Assign department professors to curriculum subjects across courses, branches, and semesters.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              onClick={() => setStatusFilter(statusFilter === 'UNASSIGNED' ? '' : 'UNASSIGNED')}
              startIcon={<WarningOutlined sx={{ color: theme.palette.warning.main }} />}
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
            >
              {statusFilter === 'UNASSIGNED' ? 'Show All Subjects' : `Unassigned Only (${unassignedCount})`}
            </Button>
          </Box>
        </Box>
      </Card>

      {/* ── 2. KPI Summary Cards ───────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: '14px',
              border: `1px solid ${theme.palette.divider}`,
              borderTop: `4px solid ${theme.palette.primary.main}`,
              boxShadow: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
                TOTAL SUBJECTS
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.ink?.[900] || 'text.primary', mt: 0.5 }}>
                {loadingSubjects ? <CircularProgress size={22} /> : totalCount}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
                In active department curriculum
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main, width: 44, height: 44 }}>
              <MenuBookOutlined />
            </Avatar>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: '14px',
              border: `1px solid ${theme.palette.divider}`,
              borderTop: `4px solid ${theme.palette.success.main}`,
              boxShadow: 'none',
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              cursor: 'pointer',
              '&:hover': { bgcolor: `${theme.palette.success.main}04` },
            }}
            onClick={() => setStatusFilter(statusFilter === 'ASSIGNED' ? '' : 'ASSIGNED')}
          >
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
                ALLOCATED SUBJECTS
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.success.main, mt: 0.5 }}>
                {loadingSubjects ? <CircularProgress size={22} /> : assignedCount}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
                Faculty assigned
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: `${theme.palette.success.main}15`, color: theme.palette.success.main, width: 44, height: 44 }}>
              <CheckCircleOutlined />
            </Avatar>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: '14px',
              border: `1px solid ${theme.palette.divider}`,
              borderTop: `4px solid ${theme.palette.warning.main}`,
              boxShadow: 'none',
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              cursor: 'pointer',
              '&:hover': { bgcolor: `${theme.palette.warning.main}04` },
            }}
            onClick={() => setStatusFilter(statusFilter === 'UNASSIGNED' ? '' : 'UNASSIGNED')}
          >
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
                UNASSIGNED SUBJECTS
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.warning.main, mt: 0.5 }}>
                {loadingSubjects ? <CircularProgress size={22} /> : unassignedCount}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
                Needs faculty allocation
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: `${theme.palette.warning.main}15`, color: theme.palette.warning.main, width: 44, height: 44 }}>
              <WarningOutlined />
            </Avatar>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: '14px',
              border: `1px solid ${theme.palette.divider}`,
              borderTop: `4px solid ${theme.palette.info.main}`,
              boxShadow: 'none',
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
                AVAILABLE FACULTY
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.info.main, mt: 0.5 }}>
                {loadingFaculty ? <CircularProgress size={22} /> : facultiesList.length}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
                Professors in department
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: `${theme.palette.info.main}15`, color: theme.palette.info.main, width: 44, height: 44 }}>
              <SchoolOutlined />
            </Avatar>
          </Card>
        </Grid>
      </Grid>

      {/* ── 3. Filter Bar (Course, Branch, Semester, Search, Status) ──────────── */}
      <Card sx={{ p: { xs: 2, md: 2.5 }, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterListOutlined sx={{ color: theme.palette.primary.main, fontSize: 18 }} /> Filter Subjects by Program & Semester
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
              placeholder="Search name or code..."
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
                setBranchFilter(''); // Reset branch on course change
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

          {/* Allocation Status Filter */}
          <Grid item xs={6} sm={3} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Allocation Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="ASSIGNED">Allocated Only</MenuItem>
              <MenuItem value="UNASSIGNED">Unassigned Only</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Card>

      {/* ── 4. Main Data Table ─────────────────────────────────────────────── */}
      {loadingSubjects ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={32} />
        </Box>
      ) : !filteredSubjects || filteredSubjects.length === 0 ? (
        <EmptyState
          type="subjects"
          title="No Subjects Match Filters"
          description={hasActiveFilters ? "Try resetting search or dropdown filters to view curriculum subjects." : "No subjects configured for your department yet."}
          actionText={hasActiveFilters ? "Clear All Filters" : ""}
          onAction={hasActiveFilters ? handleClearFilters : undefined}
        />
      ) : (
        <TableContainer component={Card} sx={{ border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: '16px' }}>
          <Table sx={{ minWidth: 700 }}>
            <TableHead sx={{ bgcolor: `${theme.palette.primary.main}06` }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', py: 1.8 }}>SUBJECT NAME & CODE</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', py: 1.8 }}>COURSE & BRANCH</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', py: 1.8 }}>SEMESTER</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', py: 1.8 }}>TYPE & CREDITS</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', py: 1.8 }}>ASSIGNED FACULTY</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem', py: 1.8 }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSubjects.map((sub) => {
                const assignedFacultyName = sub.facultyId?.name;
                const assignedFacultyEmail = sub.facultyId?.email;
                const courseObj = sub.branchId?.courseId;
                const branchObj = sub.branchId;
                const codeStr = computeSubjectCode(sub, branchObj);

                return (
                  <TableRow key={sub._id || sub.id} hover sx={{ transition: 'background 0.15s' }}>
                    {/* Subject Name & Code */}
                    <TableCell sx={{ py: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.ink?.[900] || 'text.primary', lineHeight: 1.3 }}>
                        {sub.name}
                      </Typography>
                      <Chip
                        label={codeStr}
                        size="small"
                        sx={{
                          mt: 0.5,
                          fontFamily: theme.typography.mono?.fontFamily || 'monospace',
                          fontWeight: 700,
                          fontSize: '0.65rem',
                          height: 18,
                          bgcolor: `${theme.palette.primary.main}12`,
                          color: theme.palette.primary.main,
                        }}
                      />
                    </TableCell>

                    {/* Course & Branch Specialization */}
                    <TableCell sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.ink?.[800] || 'text.primary' }}>
                          {branchObj?.name || 'General Branch'}
                        </Typography>
                        <Chip
                          label={courseObj?.name || courseObj?.code || 'Course Program'}
                          size="small"
                          variant="outlined"
                          sx={{ width: 'fit-content', fontWeight: 600, fontSize: '0.65rem', height: 18 }}
                        />
                      </Box>
                    </TableCell>

                    {/* Semester */}
                    <TableCell sx={{ py: 2 }}>
                      <Chip
                        label={`Semester ${sub.semester}`}
                        size="small"
                        sx={{ fontWeight: 800, fontSize: '0.7rem', bgcolor: `${theme.palette.primary.main}08` }}
                      />
                    </TableCell>

                    {/* Type & Credits */}
                    <TableCell sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={sub.type || 'THEORY'}
                          size="small"
                          color={sub.type === 'PRACTICAL' ? 'info' : 'primary'}
                          sx={{ fontWeight: 700, fontSize: '0.65rem', height: 20 }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          {sub.credits} Credits
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Assigned Faculty */}
                    <TableCell sx={{ py: 2 }}>
                      {assignedFacultyName ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: `${theme.palette.primary.main}18`,
                              color: theme.palette.primary.main,
                              fontWeight: 700,
                              fontSize: '0.8rem',
                            }}
                          >
                            {assignedFacultyName.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.ink?.[900] || 'text.primary' }}>
                              {assignedFacultyName}
                            </Typography>
                            {assignedFacultyEmail && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.72rem' }}>
                                {assignedFacultyEmail}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      ) : (
                        <Chip
                          icon={<WarningOutlined sx={{ fontSize: '0.75rem !important' }} />}
                          label="Unassigned"
                          size="small"
                          color="warning"
                          variant="outlined"
                          sx={{ fontWeight: 700, fontSize: '0.68rem', height: 22 }}
                        />
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="right" sx={{ py: 2 }}>
                      <Button
                        variant={assignedFacultyName ? 'outlined' : 'contained'}
                        size="small"
                        startIcon={<AssignmentIndOutlined />}
                        onClick={() => handleOpenAllocationModal(sub)}
                        sx={{
                          borderRadius: '8px',
                          textTransform: 'none',
                          fontWeight: 700,
                          px: 2,
                          fontSize: '0.75rem',
                          ...(assignedFacultyName
                            ? { color: theme.palette.text.primary, borderColor: theme.palette.divider }
                            : { boxShadow: `0 2px 8px ${theme.palette.primary.main}30` }),
                        }}
                      >
                        {assignedFacultyName ? 'Reassign' : 'Assign Faculty'}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ── 5. Enhanced Allocation Modal ────────────────────────────────────── */}
      <Dialog
        open={allocationModalOpen}
        onClose={handleCloseModal}
        PaperProps={{
          sx: { width: '100%', maxWidth: 500, borderRadius: '16px' },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
          {selectedSubject?.facultyId ? 'Reassign Subject Faculty' : 'Assign Faculty Member'}
        </DialogTitle>

        <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {selectedSubject && (
            <Paper
              sx={{
                p: 2.5,
                borderRadius: '12px',
                bgcolor: `${theme.palette.primary.main}06`,
                border: `1px solid ${theme.palette.primary.main}20`,
                boxShadow: 'none',
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: theme.palette.ink?.[900] || 'text.primary', mb: 0.5 }}>
                {selectedSubject.name}
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', my: 1 }}>
                <Chip
                  label={computeSubjectCode(selectedSubject, selectedSubject.branchId)}
                  size="small"
                  color="primary"
                  sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20 }}
                />
                <Chip
                  label={selectedSubject.branchId?.courseId?.name || 'Course Program'}
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 600, fontSize: '0.65rem', height: 20 }}
                />
                <Chip
                  label={selectedSubject.branchId?.name || 'Branch'}
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 600, fontSize: '0.65rem', height: 20 }}
                />
                <Chip
                  label={`Semester ${selectedSubject.semester}`}
                  size="small"
                  sx={{ fontWeight: 700, fontSize: '0.65rem', height: 20 }}
                />
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Subject Type: <strong>{selectedSubject.type || 'THEORY'}</strong> • Credits: <strong>{selectedSubject.credits}</strong>
              </Typography>
            </Paper>
          )}

          <Typography variant="body2" color="text.secondary">
            Select a professor from your department to assign responsibility for teaching this subject.
          </Typography>

          {loadingFaculty ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <TextField
              select
              fullWidth
              label="Select Department Professor"
              value={selectedFacultyId}
              onChange={(e) => setSelectedFacultyId(e.target.value)}
              helperText="Selecting 'Unassigned / Clear' will remove the current professor assignment."
            >
              <MenuItem value="">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: theme.palette.text.secondary }}>
                  <ClearOutlined fontSize="small" />
                  <em>None (Unassigned / Clear Assignment)</em>
                </Box>
              </MenuItem>

              <Divider sx={{ my: 0.5 }} />

              {facultiesList.map((faculty) => (
                <MenuItem key={faculty.id || faculty._id} value={faculty.id || faculty._id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
                    <Avatar
                      sx={{
                        width: 28,
                        height: 28,
                        bgcolor: `${theme.palette.primary.main}18`,
                        color: theme.palette.primary.main,
                        fontWeight: 700,
                        fontSize: '0.75rem',
                      }}
                    >
                      {faculty.name?.charAt(0) || 'P'}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                        {faculty.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {faculty.email}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </TextField>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={handleCloseModal} variant="outlined" sx={{ borderRadius: '8px', color: theme.palette.text.secondary }}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveAllocation}
            variant="contained"
            disabled={updateSubject.isLoading}
            sx={{ borderRadius: '8px', fontWeight: 700, px: 3 }}
          >
            {updateSubject.isLoading ? 'Saving...' : 'Save Allocation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubjectAllocation;
