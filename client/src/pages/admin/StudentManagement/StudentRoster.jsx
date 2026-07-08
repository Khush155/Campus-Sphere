import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  CircularProgress,
  Button,
  MenuItem,
  Grid,
  Skeleton,
  useTheme,
  Alert,
} from '@mui/material';
import {
  SearchOutlined,
  UploadFileOutlined,
  SchoolOutlined,
  FileDownloadOutlined,
} from '@mui/icons-material';
import { useStudentsQuery, downloadExport } from '../../../queries/studentQueries';
import { useDepartmentsQuery, useCoursesQuery, useBranchesQuery } from '../../../queries/collegeQueries';
import Pagination from '../../../components/common/Pagination';
import BulkImportDrawer from './BulkImportDrawer';

const SEMESTER_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

const STATUS_CHIP_PROPS = {
  ACTIVE: { label: 'Active', color: 'success' },
  INACTIVE: { label: 'Inactive', color: 'default' },
};

export const StudentRoster = () => {
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter state
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('search') || '');
  const [deptFilter, setDeptFilter] = useState(searchParams.get('department') || '');
  const [courseFilter, setCourseFilter] = useState(searchParams.get('course') || '');
  const [branchFilter, setBranchFilter] = useState(searchParams.get('branch') || '');
  const [semesterFilter, setSemesterFilter] = useState(searchParams.get('semester') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [importOpen, setImportOpen] = useState(false);

  const limit = 15;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Sync filters to URL
  useEffect(() => {
    const params = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (deptFilter) params.department = deptFilter;
    if (courseFilter) params.course = courseFilter;
    if (branchFilter) params.branch = branchFilter;
    if (semesterFilter) params.semester = semesterFilter;
    if (statusFilter) params.status = statusFilter;
    if (page > 1) params.page = String(page);
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, deptFilter, courseFilter, branchFilter, semesterFilter, statusFilter, page, setSearchParams]);

  const filters = {
    search: debouncedSearch || undefined,
    department: deptFilter || undefined,
    course: courseFilter || undefined,
    branch: branchFilter || undefined,
    semester: semesterFilter || undefined,
    status: statusFilter || undefined,
    page,
    limit,
  };

  const { data, isLoading, isError } = useStudentsQuery(filters);
  const { data: departments } = useDepartmentsQuery();
  const { data: courses } = useCoursesQuery();
  const { data: branches } = useBranchesQuery(courseFilter || undefined);

  const students = data?.data || [];
  const meta = data?.meta || {};

  const handleResetFilters = useCallback(() => {
    setSearch('');
    setDebouncedSearch('');
    setDeptFilter('');
    setCourseFilter('');
    setBranchFilter('');
    setSemesterFilter('');
    setStatusFilter('');
    setPage(1);
  }, []);

  const renderSkeletonRows = () =>
    Array.from({ length: limit }).map((_, i) => (
      <TableRow key={i}>
        {Array.from({ length: 6 }).map((__, j) => (
          <TableCell key={j}>
            <Skeleton variant="text" width="80%" height={20} />
          </TableCell>
        ))}
      </TableRow>
    ));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2, borderBottom: `1px solid ${theme.custom.border.subtle}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <SchoolOutlined sx={{ color: theme.palette.primary.main }} />
          <Box>
            <Typography
              variant="h5"
              sx={{ fontFamily: theme.typography.h1.fontFamily, fontWeight: 600, color: theme.palette.ink[900], lineHeight: 1.1 }}
            >
              Student Roster
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontFamily: theme.typography.body2.fontFamily }}>
              {isLoading ? 'Loading…' : `${meta.total ?? 0} total student records`}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadOutlined />}
            onClick={() => {
              downloadExport({
                search: debouncedSearch || undefined,
                department: deptFilter || undefined,
                course: courseFilter || undefined,
                branch: branchFilter || undefined,
                semester: semesterFilter || undefined,
                status: statusFilter || undefined,
              });
            }}
            sx={{ fontWeight: 600, textTransform: 'none', borderRadius: '10px', px: 2.5 }}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<UploadFileOutlined />}
            onClick={() => setImportOpen(true)}
            sx={{ fontWeight: 700, textTransform: 'none', borderRadius: '10px', px: 2.5 }}
          >
            Bulk Import CSV
          </Button>
        </Box>
      </Box>

      {/* Advanced Filter Panel */}
      <Card
        sx={{
          p: 2.5,
          border: `1px solid ${theme.custom.border.subtle}`,
          borderRadius: '14px',
          bgcolor: theme.custom.surface.raised,
          boxShadow: 'none',
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <SearchOutlined sx={{ mr: 1, color: theme.palette.text.secondary, fontSize: 18 }} /> }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Department"
              value={deptFilter}
              onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            >
              <MenuItem value="">All</MenuItem>
              {(departments || []).map((d) => (
                <MenuItem key={d.id || d._id} value={d.id || d._id}>{d.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Course"
              value={courseFilter}
              onChange={(e) => { setCourseFilter(e.target.value); setBranchFilter(''); setPage(1); }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            >
              <MenuItem value="">All</MenuItem>
              {(courses || []).map((c) => (
                <MenuItem key={c.id || c._id} value={c.id || c._id}>{c.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Branch"
              value={branchFilter}
              onChange={(e) => { setBranchFilter(e.target.value); setPage(1); }}
              disabled={!courseFilter}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            >
              <MenuItem value="">All</MenuItem>
              {(branches || []).map((b) => (
                <MenuItem key={b.id || b._id} value={b.id || b._id}>{b.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} md={1}>
            <TextField
              select
              fullWidth
              size="small"
              label="Sem"
              value={semesterFilter}
              onChange={(e) => { setSemesterFilter(e.target.value); setPage(1); }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            >
              <MenuItem value="">All</MenuItem>
              {SEMESTER_OPTIONS.map((s) => (
                <MenuItem key={s} value={String(s)}>Sem {s}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} md={1}>
            <TextField
              select
              fullWidth
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
            </TextField>
          </Grid>
          {(debouncedSearch || deptFilter || courseFilter || branchFilter || semesterFilter || statusFilter) && (
            <Grid item xs={12}>
              <Button size="small" onClick={handleResetFilters} sx={{ textTransform: 'none', fontWeight: 600, color: theme.palette.text.secondary }}>
                Clear Filters
              </Button>
            </Grid>
          )}
        </Grid>
      </Card>

      {/* Table */}
      {isError ? (
        <Alert severity="error" sx={{ borderRadius: '10px' }}>
          Failed to load student records. Please try again.
        </Alert>
      ) : (
        <Card
          sx={{
            border: `1px solid ${theme.custom.border.subtle}`,
            borderRadius: '14px',
            boxShadow: 'none',
            overflow: 'hidden',
          }}
        >
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: theme.custom.surface.raised }}>
                  {['Name', 'Email', 'Department', 'Course / Branch', 'Semester', 'Status'].map((col) => (
                    <TableCell
                      key={col}
                      sx={{
                        fontFamily: theme.typography.body2.fontFamily,
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: theme.palette.text.secondary,
                        py: 1.5,
                        borderBottom: `1px solid ${theme.custom.border.subtle}`,
                      }}
                    >
                      {col}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading
                  ? renderSkeletonRows()
                  : students.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ py: 6, textAlign: 'center' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                          <SchoolOutlined sx={{ fontSize: 40, color: theme.palette.text.disabled }} />
                          <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.875rem' }}>
                            No students found matching the applied filters
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )
                  : students.map((student) => {
                    const statusProps = STATUS_CHIP_PROPS[student.status] || { label: student.status, color: 'default' };
                    return (
                      <TableRow
                        key={student.id}
                        hover
                        sx={{
                          '&:last-child td': { border: 0 },
                          '& td': { borderBottom: `1px solid ${theme.custom.border.subtle}` },
                          transition: 'background 0.15s ease',
                        }}
                      >
                        <TableCell>
                          <Typography sx={{ fontFamily: theme.typography.body1.fontFamily, fontSize: '0.875rem', fontWeight: 600, color: theme.palette.ink[900] }}>
                            {student.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontFamily: theme.typography.mono.fontFamily, fontSize: '0.78rem', color: theme.palette.text.secondary }}>
                            {student.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '0.82rem', color: theme.palette.text.primary }}>
                            {student.department || <span style={{ color: theme.palette.text.disabled }}>—</span>}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '0.82rem', color: theme.palette.text.primary }}>
                            {student.course || '—'}
                            {student.branch ? ` / ${student.branch}` : ''}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {student.semester ? (
                            <Chip
                              label={`Sem ${student.semester}`}
                              size="small"
                              sx={{ fontFamily: theme.typography.mono.fontFamily, fontWeight: 700, fontSize: '0.7rem' }}
                            />
                          ) : (
                            <Typography sx={{ color: theme.palette.text.disabled, fontSize: '0.82rem' }}>—</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={statusProps.label}
                            color={statusProps.color}
                            size="small"
                            sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>

          {!isLoading && meta.totalPages > 1 && (
            <Box sx={{ p: 2, borderTop: `1px solid ${theme.custom.border.subtle}` }}>
              <Pagination
                page={page}
                totalPages={meta.totalPages}
                total={meta.total}
                limit={limit}
                onPageChange={(newPage) => setPage(newPage)}
              />
            </Box>
          )}
        </Card>
      )}

      {/* Bulk Import Drawer */}
      <BulkImportDrawer open={importOpen} onClose={() => setImportOpen(false)} />
    </Box>
  );
};

export default StudentRoster;
