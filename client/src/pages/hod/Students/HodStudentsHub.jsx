import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Grid,
  useTheme,
  CircularProgress,
  Card,
  Avatar,
  Paper,
} from '@mui/material';
import {
  AddOutlined,
  SearchOutlined,
  UploadOutlined,
  PeopleOutlined,
  RefreshOutlined,
} from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import Pagination from '../../../components/common/Pagination';
import EmptyState from '../../../components/common/EmptyState';
import {
  useUsersQuery,
  useRegisterMutation,
  useUpdateUserMutation,
  useImportStudentsMutation,
} from '../../../queries/userQueries';
import { useCoursesQuery, useBranchesQuery } from '../../../queries/collegeQueries';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';

const getCleanId = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (val._id) return String(val._id);
  if (val.id) return String(val.id);
  return String(val);
};

export const HodStudentsHub = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();
  const cleanDeptId = getCleanId(user?.departmentId || user?.department);

  // Filter & Pagination States
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Debounce search input
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Create Modal States
  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'STUDENT',
    departmentId: cleanDeptId,
    courseId: '',
    branchId: '',
    semester: 1,
    rollNumber: '',
  });

  // Edit Modal States
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    status: 'ACTIVE',
    courseId: '',
    branchId: '',
    semester: 1,
    rollNumber: '',
    reason: '',
  });
  const [originalStudentData, setOriginalStudentData] = useState(null);

  // CSV Import Modal States
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState(null);

  // Queries
  const { data: courses = [] } = useCoursesQuery();
  const { data: branches = [] } = useBranchesQuery();

  const queryFilters = useMemo(
    () => ({
      role: 'STUDENT',
      department: cleanDeptId,
      course: selectedCourse || undefined,
      branch: selectedBranch || undefined,
      semester: selectedSemester || undefined,
      status: selectedStatus || undefined,
      search: debouncedSearch || undefined,
      page,
      limit: 10,
    }),
    [cleanDeptId, selectedCourse, selectedBranch, selectedSemester, selectedStatus, debouncedSearch, page]
  );

  const { data: responseData, isLoading, refetch } = useUsersQuery(queryFilters);
  const registerMutation = useRegisterMutation();
  const updateMutation = useUpdateUserMutation();
  const importStudentsMutation = useImportStudentsMutation();

  const studentsList = useMemo(() => responseData?.data || [], [responseData]);
  const meta = useMemo(
    () => responseData?.meta || { page: 1, limit: 10, total: 0, totalPages: 1 },
    [responseData]
  );

  // Filter available branches based on selected course in forms
  const filteredCreateBranches = useMemo(() => {
    if (!formData.courseId) return branches;
    return branches.filter((b) => String(b.courseId?._id || b.courseId) === String(formData.courseId));
  }, [branches, formData.courseId]);

  const filteredEditBranches = useMemo(() => {
    if (!editFormData.courseId) return branches;
    return branches.filter((b) => String(b.courseId?._id || b.courseId) === String(editFormData.courseId));
  }, [branches, editFormData.courseId]);

  const splitName = (fullName) => {
    if (!fullName) return { firstName: '', lastName: '' };
    const parts = fullName.trim().split(' ');
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || '',
    };
  };

  const handleOpen = () => setOpenModal(true);
  const handleClose = () => {
    setOpenModal(false);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'STUDENT',
      departmentId: cleanDeptId,
      courseId: '',
      branchId: '',
      semester: 1,
      rollNumber: '',
    });
  };

  const handleOpenEdit = (student) => {
    const { firstName, lastName } = splitName(student.name);
    const dataToSet = {
      id: student.id || student._id,
      firstName,
      lastName,
      email: student.email,
      status: student.status || 'ACTIVE',
      courseId: student.courseId || '',
      branchId: student.branchId || '',
      semester: student.semester || 1,
      rollNumber: student.rollNumber || '',
      reason: '',
    };
    setOriginalStudentData(dataToSet);
    setEditFormData(dataToSet);
    setOpenEditModal(true);
  };

  const handleCloseEdit = () => {
    setOpenEditModal(false);
    setOriginalStudentData(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'courseId') {
        next.branchId = '';
      } else if (name === 'branchId' && value) {
        const foundBranch = branches.find((b) => String(b._id || b.id) === String(value));
        if (foundBranch) {
          next.courseId = String(foundBranch.courseId?._id || foundBranch.courseId || prev.courseId);
        }
      }
      return next;
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'courseId') {
        next.branchId = '';
      } else if (name === 'branchId' && value) {
        const foundBranch = branches.find((b) => String(b._id || b.id) === String(value));
        if (foundBranch) {
          next.courseId = String(foundBranch.courseId?._id || foundBranch.courseId || prev.courseId);
        }
      }
      return next;
    });
  };

  const isBranchOrSemesterModified = useMemo(() => {
    if (!originalStudentData || !editFormData) return false;
    return (
      String(editFormData.branchId) !== String(originalStudentData.branchId) ||
      Number(editFormData.semester) !== Number(originalStudentData.semester)
    );
  }, [editFormData, originalStudentData]);

  // Auto-generate Roll Number helper button
  const handleAutoGenerateRoll = () => {
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    setFormData((prev) => ({
      ...prev,
      rollNumber: `${year}-STU-${rand}`,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      email: formData.email,
      password: formData.password,
      role: 'STUDENT',
      departmentId: cleanDeptId,
      courseId: formData.courseId || undefined,
      branchId: formData.branchId || undefined,
      semester: Number(formData.semester),
      rollNumber: formData.rollNumber || undefined,
    };
    registerMutation.mutate(payload, {
      onSuccess: () => {
        showToast(`Admitted student ${payload.name} (Roll: ${payload.rollNumber || 'Auto'}).`);
        handleClose();
        refetch();
      },
      onError: (err) => {
        showToast(err.response?.data?.message || 'Failed to admit student', { severity: 'error' });
      },
    });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: `${editFormData.firstName} ${editFormData.lastName}`.trim(),
      status: editFormData.status,
      courseId: editFormData.courseId || null,
      branchId: editFormData.branchId || null,
      semester: Number(editFormData.semester),
      rollNumber: editFormData.rollNumber || undefined,
    };

    if (isBranchOrSemesterModified) {
      payload.reason = editFormData.reason;
    }

    updateMutation.mutate(
      { id: editFormData.id, data: payload },
      {
        onSuccess: () => {
          showToast('Updated student academic record.');
          handleCloseEdit();
          refetch();
        },
        onError: (err) => {
          showToast(err.response?.data?.message || 'Failed to update student', { severity: 'error' });
        },
      }
    );
  };

  // CSV Import Handlers
  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setImportError('Please select a CSV file to upload');
      return;
    }

    setImportError(null);
    setImportResult(null);

    const fd = new FormData();
    fd.append('file', selectedFile);

    try {
      const res = await importStudentsMutation.mutateAsync(fd);
      setImportResult(res.data);
      showToast('CSV Batch import completed!');
      refetch();
    } catch (err) {
      setImportError(err.response?.data?.message || 'Failed to process CSV import');
    }
  };

  const columns = [
    {
      id: 'name',
      label: 'Student Name & Email',
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 34, height: 34, bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main, fontWeight: 700, fontSize: '0.85rem' }}>
            {row.name?.charAt(0) || 'S'}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.ink[900] }}>
              {row.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.email}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'rollNumber',
      label: 'Roll Number',
      render: (row) =>
        row.rollNumber ? (
          <Chip
            label={row.rollNumber}
            size="small"
            sx={{
              fontWeight: 800,
              fontFamily: theme.typography.mono.fontFamily,
              fontSize: '0.7rem',
              bgcolor: `${theme.palette.brass?.[500] || '#b8863e'}15`,
              color: theme.palette.brass?.[500] || '#b8863e',
            }}
          />
        ) : (
          <Typography variant="caption" color="text.disabled">—</Typography>
        ),
    },
    {
      id: 'academic',
      label: 'Course & Branch',
      render: (row) => (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {row.branch || row.course || 'Unassigned Batch'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: theme.typography.mono.fontFamily }}>
            Semester {row.semester || 1} {row.group ? `• Group ${row.group}` : ''}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      render: (row) => (
        <Chip
          label={row.status || 'ACTIVE'}
          size="small"
          color={row.status === 'ACTIVE' ? 'success' : 'error'}
          sx={{ fontWeight: 800, fontSize: '0.65rem' }}
        />
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
                icon={<PeopleOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="DEPARTMENT STUDENT ROSTER & ADMISSIONS DESK"
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
              Student Roster & Admissions
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              Manage student accounts, track Roll Numbers, filter by course & semester, perform bulk CSV batch imports, and handle single student admissions.
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
              variant="outlined"
              startIcon={<UploadOutlined />}
              onClick={() => {
                setSelectedFile(null);
                setImportResult(null);
                setImportError(null);
                setImportModalOpen(true);
              }}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
            >
              Bulk CSV Import
            </Button>
            <Button
              variant="contained"
              startIcon={<AddOutlined />}
              onClick={handleOpen}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 700,
                background: theme.palette.primary.gradient || theme.palette.primary.main,
                color: '#ffffff',
              }}
            >
              Admit New Student
            </Button>
          </Box>
        </Box>
      </Card>

      {/* ── 2. KPI Summary Grid ────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
              ENROLLED STUDENTS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.ink[900], mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {isLoading ? <CircularProgress size={24} /> : meta.total}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              In department roster
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.signal.success }}>
              ACTIVE STUDENTS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.signal.success, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {isLoading ? <CircularProgress size={24} /> : studentsList.filter((s) => s.status === 'ACTIVE').length}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Active study status
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.brass?.[500] || '#b8863e' }}>
              ASSIGNED ROLL NUMBERS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.brass?.[500] || '#b8863e', mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {isLoading ? <CircularProgress size={24} /> : studentsList.filter((s) => s.rollNumber).length}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Indexed roll codes
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.primary.main }}>
              CURRENT PAGE ROSTER
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.primary.main, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {isLoading ? <CircularProgress size={24} /> : studentsList.length}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Page {meta.page} of {meta.totalPages}
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* ── 3. Filters & Roster Directory Table ───────────────────────────── */}
      <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by student name or Roll No..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchOutlined sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} />,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={2.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Course"
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setSelectedBranch('');
                setPage(1);
              }}
              SelectProps={{ displayEmpty: true }}
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="">All Courses</MenuItem>
              {courses.map((c) => (
                <MenuItem key={c._id || c.id} value={c._id || c.id}>
                  {c.name} ({c.code})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={2.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Branch"
              value={selectedBranch}
              onChange={(e) => {
                setSelectedBranch(e.target.value);
                setPage(1);
              }}
              SelectProps={{ displayEmpty: true }}
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="">All Branches</MenuItem>
              {branches.map((b) => (
                <MenuItem key={b._id || b.id} value={b._id || b.id}>
                  {b.name} ({b.code})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={1.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Semester"
              value={selectedSemester}
              onChange={(e) => {
                setSelectedSemester(e.target.value);
                setPage(1);
              }}
              SelectProps={{ displayEmpty: true }}
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="">All Sems</MenuItem>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <MenuItem key={s} value={s}>
                  Sem {s}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={1.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Status"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              SelectProps={{ displayEmpty: true }}
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : studentsList.length === 0 ? (
          <EmptyState
            type="users"
            title="No Student Records Found"
            description="No students match the active filter criteria."
            actionText="Reset Filters"
            onAction={() => {
              setSearch('');
              setSelectedCourse('');
              setSelectedBranch('');
              setSelectedSemester('');
              setSelectedStatus('');
            }}
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              data={studentsList}
              isLoading={isLoading}
              onEdit={handleOpenEdit}
              emptyMessage="No students found."
            />

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Pagination
                page={meta.page}
                totalPages={meta.totalPages}
                onPageChange={(p) => setPage(p)}
              />
            </Box>
          </>
        )}
      </Card>

      {/* ── 4. Single Admission Modal ────────────────────────────────────── */}
      <Dialog open={openModal} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Admit New Student</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required fullWidth />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required fullWidth />
              </Grid>
            </Grid>

            <TextField label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} required fullWidth />
            <TextField label="Temporary Password" name="password" type="password" value={formData.password} onChange={handleChange} required fullWidth />

            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField label="Student Roll Number" name="rollNumber" value={formData.rollNumber} onChange={handleChange} fullWidth placeholder="e.g. 2026-CSE-042" />
              <Button variant="outlined" onClick={handleAutoGenerateRoll} sx={{ borderRadius: '8px', whitespace: 'nowrap', textTransform: 'none', fontWeight: 600 }}>
                Auto-Roll
              </Button>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField select label="Degree Course" name="courseId" value={formData.courseId} onChange={handleChange} fullWidth>
                  <MenuItem value="">Select Course</MenuItem>
                  {courses.map((c) => (
                    <MenuItem key={c._id || c.id} value={c._id || c.id}>
                      {c.name} ({c.code})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField select label="Branch Specialization" name="branchId" value={formData.branchId} onChange={handleChange} fullWidth disabled={!formData.courseId}>
                  <MenuItem value="">Select Branch</MenuItem>
                  {filteredCreateBranches.map((b) => (
                    <MenuItem key={b._id || b.id} value={b._id || b.id}>
                      {b.name} ({b.code})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <TextField select label="Initial Semester" name="semester" value={formData.semester} onChange={handleChange} fullWidth>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <MenuItem key={s} value={s}>
                  Semester {s}
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClose} variant="outlined" sx={{ borderRadius: '8px' }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={registerMutation.isPending} sx={{ borderRadius: '8px', fontWeight: 700 }}>
              {registerMutation.isPending ? 'Admitting...' : 'Admit Student'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── 5. Edit Student Modal ────────────────────────────────────────── */}
      <Dialog open={openEditModal} onClose={handleCloseEdit} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Edit Student Academic Profile</DialogTitle>
        <form onSubmit={handleEditSubmit}>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="First Name" name="firstName" value={editFormData.firstName} onChange={handleEditChange} required fullWidth />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Last Name" name="lastName" value={editFormData.lastName} onChange={handleEditChange} required fullWidth />
              </Grid>
            </Grid>

            <TextField label="Email Address" name="email" value={editFormData.email} disabled fullWidth helperText="Email address cannot be modified." />
            <TextField label="Student Roll Number" name="rollNumber" value={editFormData.rollNumber} onChange={handleEditChange} fullWidth />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField select label="Degree Course" name="courseId" value={editFormData.courseId} onChange={handleEditChange} fullWidth>
                  <MenuItem value="">Select Course</MenuItem>
                  {courses.map((c) => (
                    <MenuItem key={c._id || c.id} value={c._id || c.id}>
                      {c.name} ({c.code})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField select label="Branch" name="branchId" value={editFormData.branchId} onChange={handleEditChange} fullWidth disabled={!editFormData.courseId}>
                  <MenuItem value="">Select Branch</MenuItem>
                  {filteredEditBranches.map((b) => (
                    <MenuItem key={b._id || b.id} value={b._id || b.id}>
                      {b.name} ({b.code})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField select label="Semester" name="semester" value={editFormData.semester} onChange={handleEditChange} fullWidth>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <MenuItem key={s} value={s}>
                      Semester {s}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField select label="Status" name="status" value={editFormData.status} onChange={handleEditChange} required fullWidth>
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            {isBranchOrSemesterModified && (
              <TextField
                required
                multiline
                rows={2}
                label="Reason for Academic Placement Change"
                name="reason"
                value={editFormData.reason}
                onChange={handleEditChange}
                helperText="Required when transferring branch or semester."
              />
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseEdit} variant="outlined" sx={{ borderRadius: '8px' }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={updateMutation.isPending} sx={{ borderRadius: '8px', fontWeight: 700 }}>
              {updateMutation.isPending ? 'Saving...' : 'Save Profile'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── 6. Bulk CSV Import Modal ──────────────────────────────────────── */}
      <Dialog open={importModalOpen} onClose={() => setImportModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Bulk CSV Student Batch Import</DialogTitle>
        <form onSubmit={handleImportSubmit}>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Typography variant="body2" color="text.secondary">
              Upload a standard CSV file with columns: <strong>name, email, password, rollNumber, courseCode, branchCode, semester</strong>.
            </Typography>

            <Box sx={{ border: `2px dashed ${theme.palette.divider}`, p: 4, borderRadius: '12px', textAlign: 'center', bgcolor: theme.custom?.surface?.sunken || 'rgba(0,0,0,0.02)' }}>
              <input
                type="file"
                accept=".csv"
                id="csv-file-input"
                style={{ display: 'none' }}
                onChange={(e) => setSelectedFile(e.target.files[0] || null)}
              />
              <label htmlFor="csv-file-input">
                <Button variant="outlined" component="span" startIcon={<UploadOutlined />} sx={{ borderRadius: '8px', fontWeight: 700 }}>
                  Choose CSV File
                </Button>
              </label>
              <Typography variant="caption" sx={{ display: 'block', mt: 1, fontWeight: 600 }}>
                {selectedFile ? `Selected: ${selectedFile.name}` : 'No file chosen yet'}
              </Typography>
            </Box>

            {importError && (
              <Typography variant="caption" color="error.main" sx={{ fontWeight: 700 }}>
                {importError}
              </Typography>
            )}

            {importResult && (
              <Paper sx={{ p: 2, bgcolor: `${theme.palette.signal.success}10`, border: `1px solid ${theme.palette.signal.success}` }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: theme.palette.signal.success }}>
                  Batch Import Summary:
                </Typography>
                <Typography variant="caption" sx={{ display: 'block' }}>
                  Successfully Admitted: {importResult.createdCount || 0}
                </Typography>
                {importResult.failedCount > 0 && (
                  <Typography variant="caption" color="error.main" sx={{ display: 'block' }}>
                    Failed / Duplicates: {importResult.failedCount}
                  </Typography>
                )}
              </Paper>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setImportModalOpen(false)} variant="outlined" sx={{ borderRadius: '8px' }}>Close</Button>
            <Button type="submit" variant="contained" disabled={!selectedFile || importStudentsMutation.isPending} sx={{ borderRadius: '8px', fontWeight: 700 }}>
              {importStudentsMutation.isPending ? 'Importing Batch...' : 'Start Import'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default HodStudentsHub;
