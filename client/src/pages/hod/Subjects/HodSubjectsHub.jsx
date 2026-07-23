import React, { useState, useMemo } from 'react';
import { 
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, MenuItem, Chip, Grid, useTheme 
} from '@mui/material';
import { AddOutlined, SearchOutlined } from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import EmptyState from '../../../components/common/EmptyState';
import ConfirmDeleteModal from '../../../components/common/ConfirmDeleteModal';
import { 
  useSubjectsQuery, 
  useCreateSubjectMutation, 
  useUpdateSubjectMutation, 
  useDeleteSubjectMutation,
  useCoursesQuery,
  useBranchesQuery
} from '../../../queries/collegeQueries';
import { useAuth } from '../../../contexts/AuthContext';

const HodSubjectsHub = () => {
  const theme = useTheme();
  const { user } = useAuth();
  
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
  const { data: subjects, isLoading, isError } = useSubjectsQuery({ 
    departmentId: deptId,
    search: debouncedSearch || undefined,
    branchId: selectedBranch || undefined,
    semester: selectedSemester ? Number(selectedSemester) : undefined
  });
  
  const { data: courses } = useCoursesQuery();
  const { data: branches } = useBranchesQuery();

  const createMutation = useCreateSubjectMutation();
  const updateMutation = useUpdateSubjectMutation();
  const deleteMutation = useDeleteSubjectMutation();

  // Filter subjects by Type locally if type filter is active
  const filteredSubjects = useMemo(() => {
    if (!subjects) return [];
    if (!selectedType) return subjects;
    return subjects.filter(s => s.type === selectedType);
  }, [subjects, selectedType]);

  // Branches filtered by course selection for Add Form
  const availableBranchesForAdd = useMemo(() => {
    if (!branches || !formData.courseId) return [];
    return branches.filter(b => (b.courseId?._id || b.courseId) === formData.courseId);
  }, [branches, formData.courseId]);

  // Branches filtered by course selection for Edit Form
  const availableBranchesForEdit = useMemo(() => {
    if (!branches || !editFormData.courseId) return [];
    return branches.filter(b => (b.courseId?._id || b.courseId) === editFormData.courseId);
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

  const columns = [
    { id: 'code', label: 'Code' },
    { id: 'name', label: 'Subject Name' },
    { id: 'credits', label: 'Credits' },
    { 
      id: 'type', 
      label: 'Type',
      render: (row) => (
        <Chip
          label={row.type}
          size="small"
          color={row.type === 'THEORY' ? 'primary' : row.type === 'PRACTICAL' ? 'secondary' : 'default'}
          sx={{ fontWeight: 'bold', fontSize: '0.7rem', borderRadius: '6px' }}
        />
      )
    },
    { id: 'branch', label: 'Branch', render: (row) => row.branchId?.name || '—' },
    { id: 'course', label: 'Course', render: (row) => row.branchId?.courseId?.name || '—' },
    { id: 'semester', label: 'Semester', render: (row) => row.semester ? `Sem ${row.semester}` : '—' },
  ];

  const handleOpen = () => setOpenModal(true);
  const handleClose = () => {
    setOpenModal(false);
    setFormData({
      name: '', code: '', credits: 3, type: 'THEORY',
      courseId: '', branchId: '', semester: 1
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
      semester: subject.semester || 1
    });
    setOpenEditModal(true);
  };

  const handleCloseEdit = () => {
    setOpenEditModal(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'courseId') next.branchId = ''; // Reset branch when course changes
      return next;
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'courseId') next.branchId = ''; // Reset branch when course changes
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
      semester: Number(formData.semester)
    };
    createMutation.mutate(payload, {
      onSuccess: () => {
        handleClose();
      }
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
      departmentId: deptId,
      semester: Number(editFormData.semester)
    };
    updateMutation.mutate({ id: editFormData.id, data: payload }, {
      onSuccess: () => {
        handleCloseEdit();
      }
    });
  };

  const handleDeleteConfirm = () => {
    if (!deleteSubjectId) return;
    deleteMutation.mutate(deleteSubjectId, {
      onSuccess: () => {
        setDeleteSubjectId(null);
      }
    });
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 3 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" sx={{ color: theme.palette.ink?.[900] || 'text.primary' }}>
            Subject Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage course curriculum and subjects assigned to your department.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddOutlined />} onClick={handleOpen}>
          Add Subject
        </Button>
      </Box>

      {/* Filter & Search Bar */}
      <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(28, 46, 69, 0.02)', border: `1px solid ${theme.palette.divider}` }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by subject name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchOutlined fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ bgcolor: 'background.paper' }}
            />
          </Grid>

          <Grid item xs={6} sm={3} md={2.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Branch"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              sx={{ bgcolor: 'background.paper' }}
            >
              <MenuItem value="">All Branches</MenuItem>
              {branches?.map((b) => (
                <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={6} sm={2} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Semester"
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              sx={{ bgcolor: 'background.paper' }}
            >
              <MenuItem value="">All Semesters</MenuItem>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((sem) => (
                <MenuItem key={sem} value={sem.toString()}>Sem {sem}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={6} sm={3} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              sx={{ bgcolor: 'background.paper' }}
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="THEORY">Theory</MenuItem>
              <MenuItem value="PRACTICAL">Practical</MenuItem>
              <MenuItem value="SESSIONAL">Sessional</MenuItem>
            </TextField>
          </Grid>

          {isAnyFilterActive && (
            <Grid item xs={12} md={1.5}>
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                fullWidth
                onClick={handleClearFilters}
                sx={{ height: 40, fontWeight: 600 }}
              >
                Clear
              </Button>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Main Data Table */}
      {!filteredSubjects || filteredSubjects.length === 0 ? (
        <EmptyState
          type="subjects"
          title="No Subjects Found"
          description={isAnyFilterActive ? "No subjects match your search filter criteria." : "No subjects have been created for your department yet."}
          actionText={isAnyFilterActive ? "Clear Filters" : ""}
          onAction={isAnyFilterActive ? handleClearFilters : undefined}
        />
      ) : (
        <DataTable 
          columns={columns} 
          data={filteredSubjects} 
          isLoading={isLoading} 
          isError={isError} 
          onEdit={handleOpenEdit}
          onDelete={(sub) => setDeleteSubjectId(sub._id || sub.id)}
          emptyMessage="No subjects found in this department."
        />
      )}

      {/* Add Subject Modal */}
      <Dialog open={openModal} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Subject</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Subject Name" name="name" value={formData.name} onChange={handleChange} required fullWidth />
              <TextField label="Subject Code" name="code" value={formData.code} onChange={handleChange} required fullWidth placeholder="e.g. CS101" />
              <TextField label="Credits" name="credits" type="number" value={formData.credits} onChange={handleChange} required fullWidth InputProps={{ inputProps: { min: 1, max: 6 } }} />
              
              <TextField select label="Type" name="type" value={formData.type} onChange={handleChange} required fullWidth>
                <MenuItem value="THEORY">Theory</MenuItem>
                <MenuItem value="PRACTICAL">Practical</MenuItem>
                <MenuItem value="SESSIONAL">Sessional</MenuItem>
              </TextField>

              <TextField label="Course" name="courseId" select value={formData.courseId} onChange={handleChange} required fullWidth>
                {courses?.map((c) => (
                  <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                ))}
              </TextField>

              <TextField label="Branch" name="branchId" select value={formData.branchId} onChange={handleChange} required fullWidth disabled={!formData.courseId}>
                {availableBranchesForAdd.map((b) => (
                  <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>
                ))}
              </TextField>

              <TextField label="Semester" name="semester" type="number" value={formData.semester} onChange={handleChange} required fullWidth InputProps={{ inputProps: { min: 1, max: 12 } }} />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isLoading}>
              {createMutation.isLoading ? 'Adding...' : 'Add Subject'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Subject Modal */}
      <Dialog open={openEditModal} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Subject Details</DialogTitle>
        <form onSubmit={handleEditSubmit}>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Subject Name" name="name" value={editFormData.name} onChange={handleEditChange} required fullWidth />
              <TextField label="Subject Code" name="code" value={editFormData.code} onChange={handleEditChange} required fullWidth />
              <TextField label="Credits" name="credits" type="number" value={editFormData.credits} onChange={handleEditChange} required fullWidth InputProps={{ inputProps: { min: 1, max: 6 } }} />
              
              <TextField select label="Type" name="type" value={editFormData.type} onChange={handleEditChange} required fullWidth>
                <MenuItem value="THEORY">Theory</MenuItem>
                <MenuItem value="PRACTICAL">Practical</MenuItem>
                <MenuItem value="SESSIONAL">Sessional</MenuItem>
              </TextField>

              <TextField label="Course" name="courseId" select value={editFormData.courseId} onChange={handleEditChange} required fullWidth>
                {courses?.map((c) => (
                  <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                ))}
              </TextField>

              <TextField label="Branch" name="branchId" select value={editFormData.branchId} onChange={handleEditChange} required fullWidth disabled={!editFormData.courseId}>
                {availableBranchesForEdit.map((b) => (
                  <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>
                ))}
              </TextField>

              <TextField label="Semester" name="semester" type="number" value={editFormData.semester} onChange={handleEditChange} required fullWidth InputProps={{ inputProps: { min: 1, max: 12 } }} />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEdit}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={updateMutation.isLoading}>
              {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Subject Confirmation Modal */}
      <ConfirmDeleteModal
        open={Boolean(deleteSubjectId)}
        onClose={() => setDeleteSubjectId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Subject"
        description="Are you sure you want to delete this subject? This action is permanent and will remove it from department allocations."
        actionText="Delete Subject"
        typedConfirmation
        confirmationWord="DELETE"
      />
    </Box>
  );
};

export default HodSubjectsHub;
