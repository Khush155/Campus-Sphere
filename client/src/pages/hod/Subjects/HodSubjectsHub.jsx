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
  Card,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  AddOutlined,
  SearchOutlined,
  RefreshOutlined,
  MenuBookOutlined,
  LibraryAddOutlined,
  EditOutlined,
  DeleteOutline,
  ClearOutlined,
} from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import EmptyState from '../../../components/common/EmptyState';
import ConfirmDeleteModal from '../../../components/common/ConfirmDeleteModal';
import BulkSubjectModal from './BulkSubjectModal';
import {
  useSubjectsQuery,
  useCreateSubjectMutation,
  useUpdateSubjectMutation,
  useDeleteSubjectMutation,
  useCoursesQuery,
  useBranchesQuery,
} from '../../../queries/collegeQueries';
import { useUsersQuery } from '../../../queries/userQueries';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { computeSubjectCode } from '../../../utils/subjectCode';

export const HodSubjectsHub = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();

  const cleanDeptId = useMemo(() => {
    if (!user) return undefined;
    const d = user.departmentId || user.department;
    return typeof d === 'object' ? d?._id || d?.id : d;
  }, [user]);

  // Search & Filter States
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // Debounce search input
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Modals States
  const [openModal, setOpenModal] = useState(false);
  const [openBulkModal, setOpenBulkModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [deleteSubjectId, setDeleteSubjectId] = useState(null);

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    credits: 3,
    type: 'THEORY',
    courseId: '',
    branchId: '',
    semester: 1,
  });

  const [editFormData, setEditFormData] = useState({
    id: '',
    name: '',
    code: '',
    credits: 3,
    type: 'THEORY',
    courseId: '',
    branchId: '',
    semester: 1,
  });

  // Queries & Mutations
  const { data: allCourses = [] } = useCoursesQuery();
  const { data: branches = [] } = useBranchesQuery();

  // Fetch department students to derive HOD's distinct courses
  const { data: baseStudentsResponse } = useUsersQuery({
    role: 'STUDENT',
    departmentId: cleanDeptId,
    limit: 1000,
  });

  const baseStudents = useMemo(() => {
    if (!baseStudentsResponse) return [];
    return baseStudentsResponse.data || (Array.isArray(baseStudentsResponse) ? baseStudentsResponse : []);
  }, [baseStudentsResponse]);

  // Derived HOD Courses
  const hodCourses = useMemo(() => {
    const map = new Map();
    baseStudents.forEach((s) => {
      const cObj = typeof s.courseId === 'object' ? s.courseId : null;
      const cId = cObj?._id || (typeof s.courseId === 'string' ? s.courseId : null);
      if (cId && !map.has(String(cId))) {
        const matchingGlobal = allCourses.find((c) => String(c._id || c.id) === String(cId));
        map.set(String(cId), {
          _id: String(cId),
          id: String(cId),
          name: cObj?.name || matchingGlobal?.name || s.course || 'Course Program',
          code: cObj?.code || matchingGlobal?.code || s.course || 'DEGREE',
          durationYears: matchingGlobal?.durationYears || cObj?.durationYears || 4,
        });
      }
    });

    if (map.size === 0 && allCourses.length > 0) {
      allCourses.forEach((c) => {
        const id = String(c._id || c.id);
        map.set(id, {
          _id: id,
          id,
          name: c.name,
          code: c.code,
          durationYears: c.durationYears || 4,
        });
      });
    }

    return Array.from(map.values());
  }, [baseStudents, allCourses]);

  // Bounded semester options for main filter
  const selectedCourseObj = useMemo(() => {
    if (!selectedCourse) return null;
    return hodCourses.find((c) => String(c._id || c.id) === String(selectedCourse));
  }, [hodCourses, selectedCourse]);

  const maxSemestersForFilter = useMemo(() => {
    if (!selectedCourseObj) return 8;
    return (selectedCourseObj.durationYears || 4) * 2;
  }, [selectedCourseObj]);

  const semesterFilterOptions = useMemo(() => {
    return Array.from({ length: maxSemestersForFilter }, (_, i) => i + 1);
  }, [maxSemestersForFilter]);

  // Available Branches for Main Filter
  const availableBranchesForFilter = useMemo(() => {
    if (!selectedCourse) return branches;
    return branches.filter((b) => {
      const crsId = typeof b.courseId === 'object' ? b.courseId?._id || b.courseId?.id : b.courseId;
      return String(crsId) === String(selectedCourse);
    });
  }, [branches, selectedCourse]);

  // Subjects Query
  const { data: subjects = [], isLoading, isError, refetch } = useSubjectsQuery({
    departmentId: cleanDeptId,
    search: debouncedSearch || undefined,
    branchId: selectedBranch || undefined,
    semester: selectedSemester ? Number(selectedSemester) : undefined,
  });

  const createMutation = useCreateSubjectMutation();
  const updateMutation = useUpdateSubjectMutation();
  const deleteMutation = useDeleteSubjectMutation();

  // Filter subjects locally by Course & Type if specified
  const filteredSubjects = useMemo(() => {
    if (!subjects) return [];
    let result = subjects;
    if (selectedCourse) {
      result = result.filter((s) => {
        const crsId = typeof s.branchId?.courseId === 'object' ? s.branchId?.courseId?._id : (s.branchId?.courseId || s.courseId);
        return String(crsId) === String(selectedCourse);
      });
    }
    if (selectedType) {
      result = result.filter((s) => s.type === selectedType);
    }
    return result;
  }, [subjects, selectedCourse, selectedType]);

  // Branches filtered by course selection for Add Form
  const availableBranchesForAdd = useMemo(() => {
    if (!branches || !formData.courseId) return [];
    return branches.filter((b) => String(b.courseId?._id || b.courseId) === String(formData.courseId));
  }, [branches, formData.courseId]);

  // Branches filtered by course selection for Edit Form
  const availableBranchesForEdit = useMemo(() => {
    if (!branches || !editFormData.courseId) return [];
    return branches.filter((b) => String(b.courseId?._id || b.courseId) === String(editFormData.courseId));
  }, [branches, editFormData.courseId]);

  const isAnyFilterActive = useMemo(() => {
    return Boolean(search || selectedCourse || selectedSemester || selectedBranch || selectedType);
  }, [search, selectedCourse, selectedSemester, selectedBranch, selectedType]);

  const handleClearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setSelectedCourse('');
    setSelectedSemester('');
    setSelectedBranch('');
    setSelectedType('');
  };

  // Metrics
  const totalSubjects = filteredSubjects.length;
  const theoryCount = filteredSubjects.filter((s) => s.type === 'THEORY').length;
  const practicalCount = filteredSubjects.filter((s) => s.type === 'PRACTICAL').length;
  const electiveCount = filteredSubjects.filter((s) => s.type === 'ELECTIVE').length;

  const columns = [
    {
      id: 'code',
      label: 'SUBJECT CODE',
      render: (row) => (
        <Chip
          label={computeSubjectCode(row, row.branchId || branches?.find((b) => String(b._id) === String(row.branchId))) || 'N/A'}
          size="small"
          sx={{
            fontWeight: 800,
            fontSize: '0.7rem',
            bgcolor: `${theme.palette.primary.main}18`,
            color: theme.palette.primary.main,
            height: 22,
          }}
        />
      ),
    },
    {
      id: 'name',
      label: 'SUBJECT TITLE & WEIGHTAGE',
      render: (row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 800, color: theme.palette.ink?.[900], lineHeight: 1.2 }}>
            {row.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.credits || 3} Credits • Code: <strong style={{ fontFamily: 'monospace' }}>{row.code || '—'}</strong>
          </Typography>
        </Box>
      ),
    },
    {
      id: 'type',
      label: 'TYPE',
      render: (row) => (
        <Chip
          label={row.type || 'THEORY'}
          size="small"
          color={row.type === 'THEORY' ? 'primary' : row.type === 'PRACTICAL' ? 'secondary' : 'warning'}
          sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20 }}
        />
      ),
    },
    {
      id: 'branch',
      label: 'CURRICULUM PLACEMENT',
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
          <Chip label={row.branchId?.code || row.branchId?.name || 'General'} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.65rem', height: 20 }} />
          <Chip label={row.semester ? `Sem ${row.semester}` : 'Sem 1'} size="small" color="primary" sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20 }} />
        </Box>
      ),
    },
    {
      id: 'actions',
      label: 'ACTIONS',
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="Edit Subject">
            <IconButton size="small" color="primary" onClick={() => handleOpenEdit(row)}>
              <EditOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Subject">
            <IconButton size="small" color="error" onClick={() => setDeleteSubjectId(row._id || row.id)}>
              <DeleteOutline fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const handleOpen = () => setOpenModal(true);
  const handleClose = () => {
    setOpenModal(false);
    setFormData({
      name: '',
      code: '',
      credits: 3,
      type: 'THEORY',
      courseId: '',
      branchId: '',
      semester: 1,
    });
  };

  const handleOpenEdit = (subject) => {
    const parentCourseId = subject.branchId?.courseId?._id || subject.branchId?.courseId;
    const branchIdVal = subject.branchId?._id || subject.branchId;
    const branchObj = typeof subject.branchId === 'object' ? subject.branchId : branches?.find((b) => String(b._id || b.id) === String(branchIdVal));
    const computedCode = subject.code || computeSubjectCode(subject, branchObj) || '';

    setEditFormData({
      id: subject._id || subject.id,
      name: subject.name || '',
      code: computedCode,
      credits: subject.credits || 3,
      type: subject.type || 'THEORY',
      courseId: parentCourseId || '',
      branchId: branchIdVal || '',
      semester: subject.semester || 1,
    });
    setOpenEditModal(true);
  };

  const handleCloseEdit = () => setOpenEditModal(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'courseId') next.branchId = '';
      return next;
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'courseId') next.branchId = '';
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      credits: Number(formData.credits),
      type: formData.type,
      branchId: formData.branchId,
      departmentId: cleanDeptId,
      semester: Number(formData.semester),
    };
    createMutation.mutate(payload, {
      onSuccess: () => {
        showToast(`Created subject "${payload.name}" (${payload.code}).`);
        handleClose();
        refetch();
      },
      onError: (err) => {
        showToast(err.response?.data?.message || 'Failed to create subject', { severity: 'error' });
      },
    });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: editFormData.name.trim(),
      code: editFormData.code.trim().toUpperCase(),
      credits: Number(editFormData.credits),
      type: editFormData.type,
      branchId: editFormData.branchId,
      semester: Number(editFormData.semester),
    };
    updateMutation.mutate(
      { id: editFormData.id, data: payload },
      {
        onSuccess: () => {
          showToast(`Updated subject "${payload.name}".`);
          handleCloseEdit();
          refetch();
        },
        onError: (err) => {
          showToast(err.response?.data?.message || 'Failed to update subject', { severity: 'error' });
        },
      }
    );
  };

  const handleDeleteConfirm = () => {
    if (!deleteSubjectId) return;
    deleteMutation.mutate(deleteSubjectId, {
      onSuccess: () => {
        showToast('Subject deleted successfully.');
        setDeleteSubjectId(null);
        refetch();
      },
      onError: (err) => {
        showToast(err.response?.data?.message || 'Failed to delete subject', { severity: 'error' });
        setDeleteSubjectId(null);
      },
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
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
                icon={<MenuBookOutlined sx={{ fontSize: '0.85rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="CURRICULAR SUBJECTS & DEPT SYLLABUS STUDIO"
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
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.ink?.[900], letterSpacing: '-0.02em' }}>
              Curriculum & Subject Management
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5, maxWidth: 680 }}>
              Define department curriculum subjects, allocate credit weights, classify theory/practical/elective modules, and manage semester placements.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshOutlined />}
              onClick={() => refetch()}
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, px: 2 }}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              startIcon={<LibraryAddOutlined />}
              onClick={() => setOpenBulkModal(true)}
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, px: 2 }}
            >
              Add Bulk Subjects
            </Button>
            <Button
              variant="contained"
              startIcon={<AddOutlined />}
              onClick={handleOpen}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 700,
                px: 2.5,
                boxShadow: `0 4px 14px ${theme.palette.primary.main}35`,
              }}
            >
              Add Single Subject
            </Button>
          </Box>
        </Box>
      </Card>

      {/* ── 2. KPI Summary Grid ────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, borderTop: `4px solid ${theme.palette.primary.main}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
              TOTAL CURRICULUM SUBJECTS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.ink?.[900], mt: 0.5 }}>
              {isLoading ? <CircularProgress size={22} /> : totalSubjects}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
              Registered in active roster
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, borderTop: `4px solid ${theme.palette.primary.main}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
              THEORY MODULES
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.primary.main, mt: 0.5 }}>
              {isLoading ? <CircularProgress size={22} /> : theoryCount}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
              Lecture-based subjects
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, borderTop: `4px solid ${theme.palette.secondary?.main || '#9c27b0'}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
              PRACTICAL / LABS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.secondary?.main || '#9c27b0', mt: 0.5 }}>
              {isLoading ? <CircularProgress size={22} /> : practicalCount}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
              Hands-on lab modules
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, borderTop: `4px solid ${theme.palette.warning.main}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
              ELECTIVE MODULES
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.warning.main, mt: 0.5 }}>
              {isLoading ? <CircularProgress size={22} /> : electiveCount}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
              Specialized courses
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* ── 3. Filters & Directory Table ────────────────────────────────── */}
      <Card sx={{ p: { xs: 2, md: 2.5 }, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Grid container spacing={2} sx={{ mb: 2.5 }} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search subject or Code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchOutlined sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} />,
              }}
            />
          </Grid>

          {/* Course Program Filter */}
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
                setSelectedSemester('');
              }}
            >
              <MenuItem value="">All Courses</MenuItem>
              {hodCourses.map((c) => (
                <MenuItem key={c._id} value={c._id}>
                  {c.code} — {c.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Branch Specialization Filter */}
          <Grid item xs={12} sm={6} md={2.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Branch Specialization"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              <MenuItem value="">All Branches</MenuItem>
              {availableBranchesForFilter.map((b) => (
                <MenuItem key={b._id || b.id} value={b._id || b.id}>
                  {b.name} ({b.code})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Semester Filter bounded by Course Duration */}
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Semester"
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
            >
              <MenuItem value="">All Semesters</MenuItem>
              {semesterFilterOptions.map((s) => (
                <MenuItem key={s} value={s}>
                  Semester {s}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Subject Type Filter */}
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Subject Type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="THEORY">Theory</MenuItem>
              <MenuItem value="PRACTICAL">Practical</MenuItem>
              <MenuItem value="ELECTIVE">Elective</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        {isAnyFilterActive && (
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Active Filters applied.
            </Typography>
            <Button size="small" startIcon={<ClearOutlined />} onClick={handleClearFilters} sx={{ textTransform: 'none', fontSize: '0.72rem' }}>
              Clear All Filters
            </Button>
          </Box>
        )}

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : filteredSubjects.length === 0 ? (
          <EmptyState
            type="courses"
            title="No Curriculum Subjects Found"
            description="No subjects match the active search or filter criteria."
            actionText={isAnyFilterActive ? 'Clear Filters' : 'Add First Subject'}
            onAction={isAnyFilterActive ? handleClearFilters : handleOpen}
          />
        ) : (
          <DataTable
            columns={columns}
            data={filteredSubjects}
            isLoading={isLoading}
            isError={isError}
            emptyMessage="No subjects found."
          />
        )}
      </Card>

      {/* ── 4. Add Subject Modal ──────────────────────────────────────────── */}
      <Dialog open={openModal} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Add New Curriculum Subject</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Subject Name" name="name" value={formData.name} onChange={handleChange} required fullWidth placeholder="e.g. Data Structures & Algorithms" />
            <TextField label="Subject Code" name="code" value={formData.code} onChange={handleChange} required fullWidth placeholder="e.g. CSE-301" />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="Credits" name="credits" type="number" value={formData.credits} onChange={handleChange} required fullWidth inputProps={{ min: 1, max: 10 }} />
              </Grid>
              <Grid item xs={6}>
                <TextField select label="Subject Type" name="type" value={formData.type} onChange={handleChange} required fullWidth>
                  <MenuItem value="THEORY">THEORY</MenuItem>
                  <MenuItem value="PRACTICAL">PRACTICAL</MenuItem>
                  <MenuItem value="ELECTIVE">ELECTIVE</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField select label="Degree Course" name="courseId" value={formData.courseId} onChange={handleChange} required fullWidth>
                  <MenuItem value="">Select Course</MenuItem>
                  {hodCourses.map((c) => (
                    <MenuItem key={c._id || c.id} value={c._id || c.id}>
                      {c.name} ({c.code})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField select label="Branch Specialization" name="branchId" value={formData.branchId} onChange={handleChange} required fullWidth disabled={!formData.courseId}>
                  <MenuItem value="">Select Branch</MenuItem>
                  {availableBranchesForAdd.map((b) => (
                    <MenuItem key={b._id || b.id} value={b._id || b.id}>
                      {b.name} ({b.code})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <TextField select label="Semester" name="semester" value={formData.semester} onChange={handleChange} required fullWidth>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <MenuItem key={s} value={s}>
                  Semester {s}
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClose} variant="outlined" sx={{ borderRadius: '8px', fontWeight: 600 }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending} sx={{ borderRadius: '8px', fontWeight: 700 }}>
              {createMutation.isPending ? 'Adding...' : 'Add Subject'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── 5. Edit Subject Modal ─────────────────────────────────────────── */}
      <Dialog open={openEditModal} onClose={handleCloseEdit} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Edit Subject Details</DialogTitle>
        <form onSubmit={handleEditSubmit}>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Subject Name" name="name" value={editFormData.name} onChange={handleEditChange} required fullWidth />
            <TextField label="Subject Code" name="code" value={editFormData.code} onChange={handleEditChange} required fullWidth />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="Credits" name="credits" type="number" value={editFormData.credits} onChange={handleEditChange} required fullWidth inputProps={{ min: 1, max: 10 }} />
              </Grid>
              <Grid item xs={6}>
                <TextField select label="Subject Type" name="type" value={editFormData.type} onChange={handleEditChange} required fullWidth>
                  <MenuItem value="THEORY">THEORY</MenuItem>
                  <MenuItem value="PRACTICAL">PRACTICAL</MenuItem>
                  <MenuItem value="ELECTIVE">ELECTIVE</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField select label="Degree Course" name="courseId" value={editFormData.courseId} onChange={handleEditChange} required fullWidth>
                  <MenuItem value="">Select Course</MenuItem>
                  {hodCourses.map((c) => (
                    <MenuItem key={c._id || c.id} value={c._id || c.id}>
                      {c.name} ({c.code})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField select label="Branch" name="branchId" value={editFormData.branchId} onChange={handleEditChange} required fullWidth disabled={!editFormData.courseId}>
                  <MenuItem value="">Select Branch</MenuItem>
                  {availableBranchesForEdit.map((b) => (
                    <MenuItem key={b._id || b.id} value={b._id || b.id}>
                      {b.name} ({b.code})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <TextField select label="Semester" name="semester" value={editFormData.semester} onChange={handleEditChange} required fullWidth>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <MenuItem key={s} value={s}>
                  Semester {s}
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseEdit} variant="outlined" sx={{ borderRadius: '8px', fontWeight: 600 }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={updateMutation.isPending} sx={{ borderRadius: '8px', fontWeight: 700 }}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Subject Confirmation Modal */}
      {deleteSubjectId && (
        <ConfirmDeleteModal
          open={Boolean(deleteSubjectId)}
          title="Delete Curriculum Subject"
          content="Are you sure you want to delete this subject? This action cannot be undone."
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteSubjectId(null)}
          isDeleting={deleteMutation.isPending}
        />
      )}

      {/* Bulk Add Subjects Modal */}
      <BulkSubjectModal
        open={openBulkModal}
        onClose={() => setOpenBulkModal(false)}
        deptId={cleanDeptId}
        onSuccess={() => refetch()}
      />
    </Box>
  );
};

export default HodSubjectsHub;
