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
  Drawer,
  IconButton,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  AddOutlined,
  SearchOutlined,
  UploadOutlined,
  PeopleOutlined,
  RefreshOutlined,
  ClearOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  CancelOutlined,
  VisibilityOutlined,
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
  const isDark = theme.palette.mode === 'dark';
  const cleanDeptId = getCleanId(user?.departmentId || user?.department);

  // Filter & Pagination States
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Profile Drawer State
  const [selectedStudentForDrawer, setSelectedStudentForDrawer] = useState(null);

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

  // Available Branches for Main Filter
  const filteredMainBranches = useMemo(() => {
    if (!selectedCourse) return branches;
    return branches.filter((b) => String(b.courseId?._id || b.courseId) === String(selectedCourse));
  }, [branches, selectedCourse]);

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
    const crsId = typeof student.courseId === 'object' ? student.courseId?._id || '' : student.courseId || '';
    const brnId = typeof student.branchId === 'object' ? student.branchId?._id || '' : student.branchId || '';
    const deptId = typeof student.departmentId === 'object' ? student.departmentId?._id || '' : student.departmentId || '';

    const dataToSet = {
      id: student.id || student._id,
      firstName,
      lastName,
      email: student.email,
      status: student.status || 'ACTIVE',
      departmentId: String(deptId),
      courseId: String(crsId),
      branchId: String(brnId),
      semester: Number(student.semester) || 1,
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
        const foundBranch = branches?.find((b) => String(b._id || b.id) === String(value));
        if (foundBranch) {
          next.courseId = String(foundBranch.courseId?._id || foundBranch.courseId || prev.courseId);
          const homeDeptId = foundBranch.hostingDepartmentId?._id || foundBranch.hostingDepartmentId;
          if (homeDeptId) {
            next.departmentId = String(homeDeptId);
          }
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
        const foundBranch = branches?.find((b) => String(b._id || b.id) === String(value));
        if (foundBranch) {
          next.courseId = String(foundBranch.courseId?._id || foundBranch.courseId || prev.courseId);
          const homeDeptId = foundBranch.hostingDepartmentId?._id || foundBranch.hostingDepartmentId;
          if (homeDeptId) {
            next.departmentId = String(homeDeptId);
          }
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

  const handleClearFilters = () => {
    setSearch('');
    setSelectedCourse('');
    setSelectedBranch('');
    setSelectedSemester('');
    setSelectedStatus('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(search || selectedCourse || selectedBranch || selectedSemester || selectedStatus);

  const columns = [
    {
      id: 'name',
      label: 'STUDENT NAME & EMAIL',
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 34, height: 34, bgcolor: `${theme.palette.primary.main}18`, color: theme.palette.primary.main, fontWeight: 700, fontSize: '0.85rem' }}>
            {row.name?.charAt(0) || 'S'}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 800, color: theme.palette.ink[900], lineHeight: 1.2 }}>
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
      label: 'ROLL NUMBER',
      render: (row) =>
        row.rollNumber ? (
          <Chip
            label={row.rollNumber}
            size="small"
            sx={{
              fontWeight: 800,
              fontFamily: 'monospace',
              fontSize: '0.7rem',
              bgcolor: `${theme.palette.primary.main}12`,
              color: theme.palette.primary.main,
            }}
          />
        ) : (
          <Typography variant="caption" color="text.disabled">—</Typography>
        ),
    },
    {
      id: 'academic',
      label: 'COURSE & BRANCH',
      render: (row) => {
        const branchName = row.branch || row.branchId?.name || row.course || 'General Branch';
        const courseCode = row.courseId?.code || row.course || 'DEGREE';
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.ink?.[800] || 'text.primary' }}>
              {branchName}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'center' }}>
              <Chip label={courseCode} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.65rem', height: 18 }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                Semester {row.semester || 1}
              </Typography>
            </Box>
          </Box>
        );
      },
    },
    {
      id: 'status',
      label: 'STATUS',
      render: (row) => (
        <Chip
          icon={row.status === 'ACTIVE' ? <CheckCircleOutlined sx={{ fontSize: '0.8rem !important' }} /> : <CancelOutlined sx={{ fontSize: '0.8rem !important' }} />}
          label={row.status || 'ACTIVE'}
          size="small"
          color={row.status === 'ACTIVE' ? 'success' : 'error'}
          sx={{ fontWeight: 800, fontSize: '0.65rem', height: 22 }}
        />
      ),
    },
    {
      id: 'actions_extra',
      label: 'PROFILE',
      render: (row) => (
        <Tooltip title="View Student Profile Breakdown">
          <IconButton size="small" onClick={() => setSelectedStudentForDrawer(row)}>
            <VisibilityOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

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
                icon={<PeopleOutlined sx={{ fontSize: '0.85rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="DEPARTMENT STUDENT ROSTER & ADMISSIONS DESK"
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
              Student Directory & Admissions
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5, maxWidth: 680 }}>
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
                px: 2.5,
                background: theme.palette.primary.gradient || theme.palette.primary.main,
                color: '#ffffff',
                boxShadow: `0 4px 14px ${theme.palette.primary.main}35`,
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
              ENROLLED STUDENTS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.ink[900], mt: 0.5, fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
              {isLoading ? <CircularProgress size={22} /> : meta.total}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
              Total in department roster
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
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
              ACTIVE STUDENTS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.success.main, mt: 0.5, fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
              {isLoading ? <CircularProgress size={22} /> : studentsList.filter((s) => s.status === 'ACTIVE').length}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
              Active study status
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: '18px',
              border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
              borderTop: `4px solid ${theme.palette.info.main}`,
              bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
              boxShadow: theme.custom?.elevation?.raised || 'none',
              transition: 'all 0.25s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: isDark ? '0 12px 28px rgba(0,0,0,0.3)' : '0 12px 28px rgba(0,0,0,0.06)',
                borderColor: theme.palette.info.main,
              },
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
              ASSIGNED ROLL NUMBERS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.info.main, mt: 0.5, fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
              {isLoading ? <CircularProgress size={22} /> : studentsList.filter((s) => s.rollNumber).length}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
              Indexed roll codes
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: '18px',
              border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
              borderTop: `4px solid ${theme.palette.warning.main}`,
              bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
              boxShadow: theme.custom?.elevation?.raised || 'none',
              transition: 'all 0.25s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: isDark ? '0 12px 28px rgba(0,0,0,0.3)' : '0 12px 28px rgba(0,0,0,0.06)',
                borderColor: theme.palette.warning.main,
              },
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
              CURRENT PAGE ROSTER
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.warning.main, mt: 0.5, fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
              {isLoading ? <CircularProgress size={22} /> : studentsList.length}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
              Page {meta.page} of {meta.totalPages}
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* ── 3. Filters & Roster Directory Table ───────────────────────────── */}
      <Card sx={{ p: { xs: 2, md: 2.5 }, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
            <PeopleOutlined sx={{ color: theme.palette.primary.main, fontSize: 18 }} /> Filter Student Directory
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

        <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
          {/* Search */}
          <Grid item xs={12} sm={6} md={3}>
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

          {/* Course */}
          <Grid item xs={12} sm={6} md={2.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Course Program"
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setSelectedBranch('');
                setPage(1);
              }}
            >
              <MenuItem value="">All Courses</MenuItem>
              {courses.map((c) => (
                <MenuItem key={c._id || c.id} value={c._id || c.id}>
                  {c.name} ({c.code})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Branch */}
          <Grid item xs={12} sm={6} md={2.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Branch Specialization"
              value={selectedBranch}
              onChange={(e) => {
                setSelectedBranch(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">All Branches</MenuItem>
              {filteredMainBranches.map((b) => (
                <MenuItem key={b._id || b.id} value={b._id || b.id}>
                  {b.name} ({b.code})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Semester */}
          <Grid item xs={6} sm={3} md={2}>
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
            >
              <MenuItem value="">All Semesters</MenuItem>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <MenuItem key={s} value={s}>
                  Semester {s}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Status */}
          <Grid item xs={6} sm={3} md={2}>
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
            description={hasActiveFilters ? "No students match your search or filter criteria." : "No student records found in your department roster."}
            actionText={hasActiveFilters ? "Clear All Filters" : "Admit New Student"}
            onAction={hasActiveFilters ? handleClearFilters : handleOpen}
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

      {/* ── 7. Student Quick Profile Drawer ───────────────────────────────── */}
      <Drawer
        anchor="right"
        open={Boolean(selectedStudentForDrawer)}
        onClose={() => setSelectedStudentForDrawer(null)}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 420 }, p: 0, bgcolor: 'background.default' },
        }}
      >
        {selectedStudentForDrawer && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Drawer Header */}
            <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Student Academic Details</Typography>
              <IconButton onClick={() => setSelectedStudentForDrawer(null)} size="small"><CloseOutlined /></IconButton>
            </Box>

            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5, overflowY: 'auto' }}>
              {/* Profile Card */}
              <Paper sx={{ p: 2.5, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, bgcolor: `${theme.palette.primary.main}04`, textAlign: 'center' }}>
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    mx: 'auto',
                    mb: 1.5,
                    bgcolor: `${theme.palette.primary.main}20`,
                    color: theme.palette.primary.main,
                    fontSize: '1.5rem',
                    fontWeight: 800,
                  }}
                >
                  {selectedStudentForDrawer.name?.charAt(0) || 'S'}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {selectedStudentForDrawer.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {selectedStudentForDrawer.email}
                </Typography>
                <Chip
                  icon={selectedStudentForDrawer.status === 'ACTIVE' ? <CheckCircleOutlined sx={{ fontSize: '0.8rem !important' }} /> : <CancelOutlined sx={{ fontSize: '0.8rem !important' }} />}
                  label={selectedStudentForDrawer.status || 'ACTIVE'}
                  size="small"
                  color={selectedStudentForDrawer.status === 'ACTIVE' ? 'success' : 'error'}
                  sx={{ fontWeight: 800, fontSize: '0.65rem' }}
                />
              </Paper>

              {/* Data Breakdown */}
              <Paper sx={{ p: 2.5, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    ROLL NUMBER
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 800, fontFamily: 'monospace', color: theme.palette.primary.main }}>
                    {selectedStudentForDrawer.rollNumber || 'Unassigned'}
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    BRANCH & DEGREE PROGRAM
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {selectedStudentForDrawer.branch || selectedStudentForDrawer.branchId?.name || selectedStudentForDrawer.course || 'N/A'}
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    CURRENT SEMESTER
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Semester {selectedStudentForDrawer.semester || 1}
                  </Typography>
                </Box>
              </Paper>

              <Button
                variant="contained"
                fullWidth
                onClick={() => {
                  const s = selectedStudentForDrawer;
                  setSelectedStudentForDrawer(null);
                  handleOpenEdit(s);
                }}
                sx={{ borderRadius: '10px', fontWeight: 700, mt: 'auto' }}
              >
                Edit Academic Record
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>
    </Box>
  );
};

export default HodStudentsHub;
