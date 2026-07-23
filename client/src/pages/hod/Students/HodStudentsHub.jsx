/* eslint-disable */
import React, { useState, useMemo } from 'react';
import { 
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, MenuItem, Chip, Grid, useTheme, Alert,
  CircularProgress
} from '@mui/material';
import { AddOutlined, SearchOutlined, UploadOutlined } from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import Pagination from '../../../components/common/Pagination';
import EmptyState from '../../../components/common/EmptyState';
import { useUsersQuery, useRegisterMutation, useUpdateUserMutation, useImportStudentsMutation } from '../../../queries/userQueries';
import { useCoursesQuery, useBranchesQuery } from '../../../queries/collegeQueries';
import { useAuth } from '../../../contexts/AuthContext';

const getCleanId = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (val._id) return String(val._id);
  if (val.id) return String(val.id);
  return String(val);
};

const HodStudentsHub = () => {
  const theme = useTheme();
  const { user } = useAuth();
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
    rollNumber: ''
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
    reason: ''
  });

  // CSV Import Modal States
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState(null);

  // Queries
  const { data: courses = [] } = useCoursesQuery();
  const { data: branches = [] } = useBranchesQuery();

  const queryFilters = useMemo(() => ({
    role: 'STUDENT',
    department: cleanDeptId,
    course: selectedCourse || undefined,
    branch: selectedBranch || undefined,
    semester: selectedSemester || undefined,
    status: selectedStatus || undefined,
    search: debouncedSearch || undefined,
    page,
    limit: 10
  }), [cleanDeptId, selectedCourse, selectedBranch, selectedSemester, selectedStatus, debouncedSearch, page]);

  const { data: responseData, isLoading } = useUsersQuery(queryFilters);
  const registerMutation = useRegisterMutation();
  const updateMutation = useUpdateUserMutation();
  const importStudentsMutation = useImportStudentsMutation();

  const studentsList = useMemo(() => responseData?.data || [], [responseData]);
  const meta = useMemo(() => responseData?.meta || { page: 1, limit: 10, total: 0, totalPages: 1 }, [responseData]);

  // Filter available branches based on selected course in forms
  const filteredCreateBranches = useMemo(() => {
    if (!formData.courseId) return branches;
    return branches.filter(b => String(b.courseId?._id || b.courseId) === String(formData.courseId));
  }, [branches, formData.courseId]);

  const filteredEditBranches = useMemo(() => {
    if (!editFormData.courseId) return branches;
    return branches.filter(b => String(b.courseId?._id || b.courseId) === String(editFormData.courseId));
  }, [branches, editFormData.courseId]);

  const splitName = (fullName) => {
    if (!fullName) return { firstName: '', lastName: '' };
    const parts = fullName.trim().split(' ');
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || ''
    };
  };

  const handleOpen = () => setOpenModal(true);
  const handleClose = () => {
    setOpenModal(false);
    setFormData({
      firstName: '', lastName: '', email: '', password: '', 
      role: 'STUDENT', departmentId: cleanDeptId,
      courseId: '', branchId: '', semester: 1, rollNumber: ''
    });
  };

  // Original state tracking to know if branch or semester is modified during edit
  const [originalStudentData, setOriginalStudentData] = useState(null);

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
      reason: ''
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
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'courseId') {
        next.branchId = ''; // Reset branch when course changes
      } else if (name === 'branchId' && value) {
        // Automatically sync courseId when branch is selected
        const foundBranch = branches.find(b => String(b._id || b.id) === String(value));
        if (foundBranch) {
          next.courseId = String(foundBranch.courseId?._id || foundBranch.courseId || prev.courseId);
        }
      }
      return next;
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'courseId') {
        next.branchId = ''; // Reset branch when course changes
      } else if (name === 'branchId' && value) {
        // Automatically sync courseId when branch is selected
        const foundBranch = branches.find(b => String(b._id || b.id) === String(value));
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
      rollNumber: formData.rollNumber || undefined
    };
    registerMutation.mutate(payload, {
      onSuccess: () => {
        handleClose();
      }
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
      rollNumber: editFormData.rollNumber || undefined
    };

    if (isBranchOrSemesterModified) {
      payload.reason = editFormData.reason;
    }

    updateMutation.mutate({ id: editFormData.id, data: payload }, {
      onSuccess: () => {
        handleCloseEdit();
      }
    });
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
    } catch (err) {
      setImportError(err.response?.data?.message || 'Failed to process CSV import');
    }
  };

  const columns = [
    { 
      id: 'name', 
      label: 'Student Name',
      render: (row) => (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="body2" fontWeight={600}>{row.name}</Typography>
          <Typography variant="caption" color="text.secondary">{row.email}</Typography>
        </Box>
      )
    },
    { 
      id: 'rollNumber', 
      label: 'Roll No',
      render: (row) => row.rollNumber || '—'
    },
    { 
      id: 'academic', 
      label: 'Academic Info',
      render: (row) => (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="body2">{row.course || '—'} {row.branch ? `(${row.branch})` : ''}</Typography>
          <Typography variant="caption" color="text.secondary">Sem {row.semester || '—'} {row.group ? `• Group ${row.group}` : ''}</Typography>
        </Box>
      )
    },
    { 
      id: 'status', 
      label: 'Status',
      render: (row) => (
        <Chip 
          label={row.status} 
          size="small"
          color={row.status === 'ACTIVE' ? 'success' : 'default'}
          variant={row.status === 'ACTIVE' ? 'filled' : 'outlined'}
          sx={{ fontWeight: 600, fontSize: '0.75rem' }}
        />
      )
    },
    {
      id: 'actions',
      label: 'Actions',
      render: (row) => (
        <Button size="small" variant="outlined" onClick={() => handleOpenEdit(row)}>
          Edit Profile
        </Button>
      )
    }
  ];

  return (
    <Box sx={{ p: { xs: 1, sm: 3 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" sx={{ color: theme.palette.ink?.[900] || 'text.primary' }}>
            Student Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Filter, search, and manage students registered under your department.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<UploadOutlined />} onClick={() => setImportModalOpen(true)}>
            Import CSV
          </Button>
          <Button variant="contained" startIcon={<AddOutlined />} onClick={handleOpen}>
            Add Student
          </Button>
        </Box>
      </Box>

      {/* Modern Filter & Search Bar */}
      <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(28, 46, 69, 0.02)', border: `1px solid ${theme.palette.divider}` }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name, email, or roll no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchOutlined fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ bgcolor: 'background.paper' }}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Course"
              value={selectedCourse}
              onChange={(e) => { setSelectedCourse(e.target.value); setSelectedBranch(''); setPage(1); }}
              sx={{ bgcolor: 'background.paper' }}
            >
              <MenuItem value="">All Courses</MenuItem>
              {courses.map((c) => (
                <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Branch"
              value={selectedBranch}
              onChange={(e) => { setSelectedBranch(e.target.value); setPage(1); }}
              sx={{ bgcolor: 'background.paper' }}
            >
              <MenuItem value="">All Branches</MenuItem>
              {branches.map((b) => (
                <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Semester"
              value={selectedSemester}
              onChange={(e) => { setSelectedSemester(e.target.value); setPage(1); }}
              sx={{ bgcolor: 'background.paper' }}
            >
              <MenuItem value="">All Semesters</MenuItem>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((sem) => (
                <MenuItem key={sem} value={sem}>Sem {sem}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Status"
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
              sx={{ bgcolor: 'background.paper' }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Box>

      {/* Main Table / Empty State */}
      {studentsList.length === 0 && !isLoading ? (
        <EmptyState
          type="students"
          title="No Students Found"
          description="There are no students matching your filter criteria under your department."
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={studentsList}
            isLoading={isLoading}
          />
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            onPageChange={(p) => setPage(p)}
          />
        </>
      )}

      {/* Add Student Modal */}
      <Dialog open={openModal} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Register New Student</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required fullWidth />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required fullWidth />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Email Address" type="email" name="email" value={formData.email} onChange={handleChange} required fullWidth />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Default Password" type="password" name="password" value={formData.password} onChange={handleChange} required fullWidth />
              </Grid>
              <Grid item xs={6}>
                <TextField select label="Course" name="courseId" value={formData.courseId} onChange={handleChange} required fullWidth>
                  {courses.map(c => <MenuItem key={c._id} value={c._id}>{c.name} ({c.code})</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField select label="Branch" name="branchId" value={formData.branchId} onChange={handleChange} required fullWidth disabled={!formData.courseId}>
                  {filteredCreateBranches.map(b => <MenuItem key={b._id} value={b._id}>{b.name} ({b.code})</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField label="Semester" type="number" name="semester" value={formData.semester} onChange={handleChange} required fullWidth inputProps={{ min: 1, max: 12 }} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Roll Number (Optional)" name="rollNumber" value={formData.rollNumber} onChange={handleChange} fullWidth />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={registerMutation.isLoading}>
              {registerMutation.isLoading ? 'Registering...' : 'Register Student'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Student Modal */}
      <Dialog open={openEditModal} onClose={handleCloseEdit} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Edit Student Profile</DialogTitle>
        <form onSubmit={handleEditSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="First Name" name="firstName" value={editFormData.firstName} onChange={handleEditChange} required fullWidth />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Last Name" name="lastName" value={editFormData.lastName} onChange={handleEditChange} required fullWidth />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Email Address" name="email" value={editFormData.email} disabled fullWidth helperText="Email address cannot be modified" />
              </Grid>
              <Grid item xs={6}>
                <TextField select label="Status" name="status" value={editFormData.status} onChange={handleEditChange} required fullWidth>
                  <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                  <MenuItem value="INACTIVE">INACTIVE</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField label="Roll Number" name="rollNumber" value={editFormData.rollNumber} onChange={handleEditChange} fullWidth />
              </Grid>
              <Grid item xs={6}>
                <TextField select label="Course" name="courseId" value={editFormData.courseId} onChange={handleEditChange} required fullWidth>
                  {courses.map(c => <MenuItem key={c._id} value={c._id}>{c.name} ({c.code})</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField select label="Branch" name="branchId" value={editFormData.branchId} onChange={handleEditChange} required fullWidth disabled={!editFormData.courseId}>
                  {filteredEditBranches.map(b => <MenuItem key={b._id} value={b._id}>{b.name} ({b.code})</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField label="Semester" type="number" name="semester" value={editFormData.semester} onChange={handleEditChange} required fullWidth inputProps={{ min: 1, max: 12 }} />
              </Grid>

              {isBranchOrSemesterModified && (
                <Grid item xs={12}>
                  <Alert severity="warning" sx={{ mb: 1, borderRadius: 2 }}>
                    Modifying a student's branch or semester impacts their academic history. An audit reason is mandatory.
                  </Alert>
                  <TextField
                    label="Reason for Academic Change"
                    name="reason"
                    value={editFormData.reason}
                    onChange={handleEditChange}
                    required
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Provide justification (min 3 chars)..."
                  />
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={handleCloseEdit}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={updateMutation.isLoading}>
              {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* CSV Import Modal */}
      <Dialog open={importModalOpen} onClose={() => { setImportModalOpen(false); setImportResult(null); setImportError(null); setSelectedFile(null); }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Bulk Import Students via CSV</DialogTitle>
        <form onSubmit={handleImportSubmit}>
          <DialogContent dividers>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload a <code>.csv</code> file containing student records. Supported columns:
            </Typography>
            <Box sx={{ p: 1.5, bgcolor: 'grey.100', borderRadius: 2, mb: 2.5, fontFamily: 'monospace', fontSize: '0.8rem' }}>
              Name, Email, Branch, Semester, RollNumber, Group
            </Box>

            <input
              type="file"
              accept=".csv"
              onChange={(e) => setSelectedFile(e.target.files[0] || null)}
              style={{ width: '100%', padding: '10px 0' }}
            />

            {importError && (
              <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{importError}</Alert>
            )}

            {importResult && (
              <Box sx={{ mt: 2 }}>
                <Alert severity={importResult.importedCount > 0 ? "success" : "warning"} sx={{ borderRadius: 2 }}>
                  Successfully imported <strong>{importResult.importedCount}</strong> students. Failed/Skipped: <strong>{importResult.failedCount}</strong>.
                </Alert>
                {importResult.errors?.length > 0 && (
                  <Box sx={{ mt: 1.5, maxHeight: 160, overflowY: 'auto', p: 1.5, bgcolor: 'error.50', borderRadius: 2, border: '1px solid error.light' }}>
                    <Typography variant="caption" color="error.main" fontWeight={700} block sx={{ mb: 0.5 }}>
                      Import Warnings & Errors:
                    </Typography>
                    {importResult.errors.map((err, idx) => (
                      <Typography key={idx} variant="caption" color="error.main" block>
                        • {err}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => { setImportModalOpen(false); setImportResult(null); setImportError(null); setSelectedFile(null); }}>
              Close
            </Button>
            <Button type="submit" variant="contained" disabled={!selectedFile || importStudentsMutation.isLoading}>
              {importStudentsMutation.isLoading ? 'Importing...' : 'Upload & Import'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default HodStudentsHub;
