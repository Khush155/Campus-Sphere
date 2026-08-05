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
} from '@mui/material';
import {
  AddOutlined,
  SearchOutlined,
  RefreshOutlined,
  MenuBookOutlined,
  LibraryAddOutlined,
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
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';

export const HodSubjectsHub = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();

  const deptId = user?.departmentId?._id || user?.departmentId || user?.department?.id || user?.department;

  // Search & Filter States
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // Debounce search input
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
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
  const { data: subjects = [], isLoading, isError, refetch } = useSubjectsQuery({
    departmentId: deptId,
    search: debouncedSearch || undefined,
    branchId: selectedBranch || undefined,
    semester: selectedSemester ? Number(selectedSemester) : undefined,
  });

  const { data: courses = [] } = useCoursesQuery();
  const { data: branches = [] } = useBranchesQuery();

  const createMutation = useCreateSubjectMutation();
  const updateMutation = useUpdateSubjectMutation();
  const deleteMutation = useDeleteSubjectMutation();

  // Filter subjects by Type locally
  const filteredSubjects = useMemo(() => {
    if (!subjects) return [];
    if (!selectedType) return subjects;
    return subjects.filter((s) => s.type === selectedType);
  }, [subjects, selectedType]);

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
    return Boolean(search || selectedSemester || selectedBranch || selectedType);
  }, [search, selectedSemester, selectedBranch, selectedType]);

  const handleClearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setSelectedSemester('');
    setSelectedBranch('');
    setSelectedType('');
  };

  // Metrics
  const totalSubjects = subjects.length;
  const theoryCount = subjects.filter((s) => s.type === 'THEORY').length;
  const practicalCount = subjects.filter((s) => s.type === 'PRACTICAL').length;
  const electiveCount = subjects.filter((s) => s.type === 'ELECTIVE').length;

  const columns = [
    {
      id: 'code',
      label: 'Subject Code',
      render: (row) => (
        <Chip
          label={row.code || 'N/A'}
          size="small"
          sx={{
            fontWeight: 800,
            fontFamily: theme.typography.mono.fontFamily,
            fontSize: '0.7rem',
            bgcolor: `${theme.palette.primary.main}15`,
            color: theme.palette.primary.main,
          }}
        />
      ),
    },
    {
      id: 'name',
      label: 'Subject Name',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.ink[900] }}>
          {row.name}
        </Typography>
      ),
    },
    {
      id: 'credits',
      label: 'Credits',
      render: (row) => (
        <Chip
          label={`${row.credits || 3} Credits`}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 700, fontSize: '0.68rem' }}
        />
      ),
    },
    {
      id: 'type',
      label: 'Subject Type',
      render: (row) => (
        <Chip
          label={row.type || 'THEORY'}
          size="small"
          color={row.type === 'THEORY' ? 'primary' : row.type === 'PRACTICAL' ? 'secondary' : 'default'}
          sx={{ fontWeight: 800, fontSize: '0.65rem' }}
        />
      ),
    },
    { id: 'branch', label: 'Branch Specialization', render: (row) => row.branchId?.name || '—' },
    { id: 'semester', label: 'Semester', render: (row) => (row.semester ? `Sem ${row.semester}` : '—') },
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

    setEditFormData({
      id: subject._id || subject.id,
      name: subject.name || '',
      code: subject.code || '',
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
      departmentId: deptId,
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
                icon={<MenuBookOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="DEPARTMENT CURRICULUM & SUBJECT MANAGEMENT DESK"
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
              Curriculum & Subject Management
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              Define department curriculum subjects, allocate credit weights, classify theory/practical/elective modules, and manage semester structures.
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
              startIcon={<LibraryAddOutlined />}
              onClick={() => setOpenBulkModal(true)}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
            >
              Add Bulk Subjects
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
              Add Single Subject
            </Button>
          </Box>
        </Box>
      </Card>

      {/* ── 2. KPI Summary Grid ────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
              CURRICULUM SUBJECTS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.ink[900], mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {isLoading ? <CircularProgress size={24} /> : totalSubjects}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Total registered in department
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.primary.main }}>
              THEORY MODULES
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.primary.main, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {isLoading ? <CircularProgress size={24} /> : theoryCount}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Lecture-based subjects
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.secondary?.main || '#9c27b0' }}>
              PRACTICAL / LABS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.secondary?.main || '#9c27b0', mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {isLoading ? <CircularProgress size={24} /> : practicalCount}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Hands-on lab modules
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.brass?.[500] || '#b8863e' }}>
              ELECTIVE MODULES
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.brass?.[500] || '#b8863e', mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {isLoading ? <CircularProgress size={24} /> : electiveCount}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Optional / specialized courses
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* ── 3. Filters & Directory Table ────────────────────────────────── */}
      <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by subject name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchOutlined sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} />,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Branch"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              SelectProps={{ displayEmpty: true }}
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="">All Branches</MenuItem>
              {branches?.map((b) => (
                <MenuItem key={b._id || b.id} value={b._id || b.id}>
                  {b.name} ({b.code})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={2.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Semester"
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              SelectProps={{ displayEmpty: true }}
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="">All Semesters</MenuItem>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <MenuItem key={s} value={s}>
                  Semester {s}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={2.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Subject Type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              SelectProps={{ displayEmpty: true }}
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="THEORY">Theory Only</MenuItem>
              <MenuItem value="PRACTICAL">Practical Only</MenuItem>
              <MenuItem value="ELECTIVE">Elective Only</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : filteredSubjects.length === 0 ? (
          <EmptyState
            type="courses"
            title="No Curriculum Subjects Found"
            description="No subjects match the active search or branch filter criteria."
            actionText={isAnyFilterActive ? 'Clear Filters' : 'Add First Subject'}
            onAction={isAnyFilterActive ? handleClearFilters : handleOpen}
          />
        ) : (
          <DataTable
            columns={columns}
            data={filteredSubjects}
            isLoading={isLoading}
            isError={isError}
            onEdit={handleOpenEdit}
            onDelete={(row) => setDeleteSubjectId(row._id || row.id)}
            emptyMessage="No subjects found."
          />
        )}
      </Card>

      {/* ── 4. Add Subject Modal ──────────────────────────────────────────── */}
      <Dialog open={openModal} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Add New Subject</DialogTitle>
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
                  {courses?.map((c) => (
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
            <Button onClick={handleClose} variant="outlined" sx={{ borderRadius: '8px' }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending} sx={{ borderRadius: '8px', fontWeight: 700 }}>
              {createMutation.isPending ? 'Adding...' : 'Add Subject'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── 5. Edit Subject Modal ─────────────────────────────────────────── */}
      <Dialog open={openEditModal} onClose={handleCloseEdit} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
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
                  {courses?.map((c) => (
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
            <Button onClick={handleCloseEdit} variant="outlined" sx={{ borderRadius: '8px' }}>Cancel</Button>
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
        deptId={deptId}
        onSuccess={() => refetch()}
      />
    </Box>
  );
};

export default HodSubjectsHub;
