import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Card,
  Grid,
  CircularProgress,
  useTheme,
  Avatar,
  Drawer,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
} from '@mui/material';
import {
  AddOutlined,
  GroupsOutlined,
  RefreshOutlined,
  SearchOutlined,
  GridViewOutlined,
  TableRowsOutlined,
  EditOutlined,
  VisibilityOutlined,
  AssignmentIndOutlined,
  EmailOutlined,
  SchoolOutlined,
} from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import { useUsersQuery, useRegisterMutation, useUpdateUserMutation } from '../../../queries/userQueries';
import { useAssignmentsQuery } from '../../../queries/assignmentQueries';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import EmptyState from '../../../components/common/EmptyState';

export const HodFacultyHub = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const deptId = user?.departmentId?._id || user?.departmentId || user?.department?.id || user?.department;

  // View Mode: 'grid' vs 'table'
  const [viewMode, setViewMode] = useState('grid');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Drawers & Modals
  const [selectedFaculty, setSelectedFaculty] = useState(null); // For Profile Drawer
  const [openModal, setOpenModal] = useState(false); // For Register Modal
  const [openEditModal, setOpenEditModal] = useState(false); // For Edit Modal

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'FACULTY',
    departmentId: deptId || '',
  });

  const [editFormData, setEditFormData] = useState({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    status: 'ACTIVE',
  });

  // Queries
  const { data, isLoading, isError, refetch } = useUsersQuery({
    role: 'FACULTY',
    department: deptId,
  });

  const { data: assignmentsRes } = useAssignmentsQuery({ limit: 200 });

  const registerMutation = useRegisterMutation();
  const updateMutation = useUpdateUserMutation();

  // Helper to split fullName
  const splitName = (fullName = '') => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length <= 1) {
      return { firstName: parts[0] || '', lastName: '' };
    }

    const salutations = ['dr.', 'dr', 'prof.', 'prof', 'mr.', 'mr', 'mrs.', 'mrs', 'ms.', 'ms', 'er.', 'er'];
    const hasSalutation = salutations.includes(parts[0].toLowerCase());

    if (hasSalutation && parts.length > 2) {
      return { firstName: `${parts[0]} ${parts[1]}`, lastName: parts.slice(2).join(' ') };
    }

    return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '' };
  };

  // Map faculty with their assigned subjects count
  const facultyWithAssignedSubjects = useMemo(() => {
    if (!data?.data) return [];
    const allAssignments = assignmentsRes?.data || [];

    return data.data.map((fac) => {
      const facId = fac.id || fac._id;
      const assigned = allAssignments.filter(
        (a) => (a.facultyId?.id || a.facultyId?._id || a.facultyId) === facId && a.status === 'ACTIVE'
      );
      const { firstName, lastName } = splitName(fac.name);

      return {
        ...fac,
        firstName,
        lastName,
        assignedSubjects: assigned,
        assignedCount: assigned.length,
      };
    });
  }, [data, assignmentsRes]);

  // Filtered Faculty List
  const filteredFaculty = useMemo(() => {
    return facultyWithAssignedSubjects.filter((f) => {
      const matchesSearch =
        search === '' ||
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.email.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === '' || f.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [facultyWithAssignedSubjects, search, statusFilter]);

  // KPI Metrics
  const totalFaculty = facultyWithAssignedSubjects.length;
  const activeFaculty = facultyWithAssignedSubjects.filter((f) => f.status === 'ACTIVE').length;
  const allocatedFaculty = facultyWithAssignedSubjects.filter((f) => f.assignedCount > 0).length;
  const unassignedFaculty = facultyWithAssignedSubjects.filter((f) => f.assignedCount === 0).length;

  const columns = [
    {
      id: 'name',
      label: 'Professor Name & Email',
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 34, height: 34, bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main, fontWeight: 700, fontSize: '0.85rem' }}>
            {row.name?.charAt(0) || 'P'}
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
      id: 'assignedCount',
      label: 'Teaching Workload',
      render: (row) => (
        <Chip
          icon={<SchoolOutlined sx={{ fontSize: '0.8rem !important' }} />}
          label={row.assignedCount > 0 ? `${row.assignedCount} Subject(s)` : 'Unassigned'}
          size="small"
          color={row.assignedCount > 0 ? 'primary' : 'default'}
          sx={{ fontWeight: 700, fontSize: '0.7rem' }}
        />
      ),
    },
    {
      id: 'status',
      label: 'Account Status',
      render: (row) => (
        <Chip
          label={row.status}
          size="small"
          color={row.status === 'ACTIVE' ? 'success' : 'error'}
          sx={{ fontWeight: 800, fontSize: '0.68rem' }}
        />
      ),
    },
  ];

  const handleOpen = () => setOpenModal(true);
  const handleClose = () => {
    setOpenModal(false);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'FACULTY',
      departmentId: deptId || '',
    });
  };

  const handleOpenEdit = (faculty) => {
    const { firstName, lastName } = splitName(faculty.name);
    setEditFormData({
      id: faculty.id || faculty._id,
      firstName,
      lastName,
      email: faculty.email || '',
      status: faculty.status || 'ACTIVE',
    });
    setOpenEditModal(true);
  };

  const handleCloseEdit = () => setOpenEditModal(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleEditChange = (e) => setEditFormData({ ...editFormData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      email: formData.email,
      password: formData.password,
      role: 'FACULTY',
      departmentId: deptId || '',
    };
    registerMutation.mutate(payload, {
      onSuccess: () => {
        showToast(`Registered professor ${payload.name} in department roster.`);
        handleClose();
        refetch();
      },
      onError: (err) => {
        showToast(err.response?.data?.message || 'Failed to register faculty', { severity: 'error' });
      },
    });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: `${editFormData.firstName} ${editFormData.lastName}`.trim(),
      status: editFormData.status,
    };
    updateMutation.mutate(
      { id: editFormData.id, data: payload },
      {
        onSuccess: () => {
          showToast('Updated faculty member record.');
          handleCloseEdit();
          refetch();
        },
        onError: (err) => {
          showToast(err.response?.data?.message || 'Failed to update faculty', { severity: 'error' });
        },
      }
    );
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
                icon={<GroupsOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="DEPARTMENT FACULTY STAFF DIRECTORY"
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
              Faculty Staff Directory
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              Register new department professors, view workload allocations, inspect faculty profile details, and manage staff credentials.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
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
              onClick={handleOpen}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 700,
                background: theme.palette.primary.gradient || theme.palette.primary.main,
                color: '#ffffff',
              }}
            >
              Register Faculty Member
            </Button>
          </Box>
        </Box>
      </Card>

      {/* ── 2. KPI Summary Cards ───────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
              TOTAL PROFESSORS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.ink[900], mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {isLoading ? <CircularProgress size={24} /> : totalFaculty}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              In department roster
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.signal.success }}>
              ACTIVE FACULTY
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.signal.success, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {isLoading ? <CircularProgress size={24} /> : activeFaculty}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Active user accounts
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.primary.main }}>
              ALLOCATED PROFESSORS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.primary.main, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {isLoading ? <CircularProgress size={24} /> : allocatedFaculty}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Teaching assigned subjects
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.warning.main }}>
              UNASSIGNED POOL
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.warning.main, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {isLoading ? <CircularProgress size={24} /> : unassignedFaculty}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Available for subject allocation
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* ── 3. Filters & View Mode Switcher Header ────────────────────────── */}
      <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, flex: 1, flexWrap: 'wrap', maxWidth: 650 }}>
            <TextField
              size="small"
              placeholder="Search faculty by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ flex: 1, minWidth: 240 }}
              InputProps={{
                startAdornment: <SearchOutlined sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} />,
              }}
            />

            <TextField
              select
              size="small"
              label="Account Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ minWidth: 160 }}
              SelectProps={{ displayEmpty: true }}
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="ACTIVE">Active Only</MenuItem>
              <MenuItem value="INACTIVE">Inactive Only</MenuItem>
            </TextField>
          </Box>

          {/* Toggle Grid vs Table View */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, next) => next && setViewMode(next)}
            size="small"
            sx={{ bgcolor: theme.custom?.surface?.sunken || 'rgba(0,0,0,0.03)' }}
          >
            <ToggleButton value="grid">
              <GridViewOutlined sx={{ fontSize: 18, mr: 0.5 }} /> Grid Cards
            </ToggleButton>
            <ToggleButton value="table">
              <TableRowsOutlined sx={{ fontSize: 18, mr: 0.5 }} /> Roster Table
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* ── 4. Main Body: Grid View vs Table View ───────────────────────── */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : filteredFaculty.length === 0 ? (
          <EmptyState
            type="users"
            title="No Faculty Members Found"
            description="No professor accounts match the active search or status filter."
            actionText="Register Faculty"
            onAction={handleOpen}
          />
        ) : viewMode === 'grid' ? (
          <Grid container spacing={2.5}>
            {filteredFaculty.map((f) => (
              <Grid item xs={12} sm={6} md={4} key={f.id || f._id}>
                <Card
                  sx={{
                    p: 3,
                    borderRadius: '14px',
                    border: `1px solid ${theme.palette.divider}`,
                    boxShadow: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between',
                    gap: 2,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                      borderColor: theme.palette.primary.main,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Avatar
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: `${theme.palette.primary.main}18`,
                        color: theme.palette.primary.main,
                        fontWeight: 800,
                        fontSize: '1.1rem',
                        border: `2px solid ${theme.palette.background.paper}`,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      }}
                    >
                      {f.name?.charAt(0) || 'P'}
                    </Avatar>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.3 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: theme.palette.ink[900], truncate: true }}>
                          {f.name}
                        </Typography>
                      </Box>

                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', truncate: true }}>
                        {f.email}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label={f.status}
                          size="small"
                          color={f.status === 'ACTIVE' ? 'success' : 'error'}
                          sx={{ fontWeight: 800, fontSize: '0.62rem', height: 18 }}
                        />
                        <Chip
                          icon={<SchoolOutlined sx={{ fontSize: '0.7rem !important' }} />}
                          label={f.assignedCount > 0 ? `${f.assignedCount} Subject(s)` : 'Unassigned'}
                          size="small"
                          color={f.assignedCount > 0 ? 'primary' : 'default'}
                          sx={{ fontWeight: 700, fontSize: '0.62rem', height: 18 }}
                        />
                      </Box>
                    </Box>
                  </Box>

                  <Divider />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<VisibilityOutlined />}
                      onClick={() => setSelectedFaculty(f)}
                      sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', flex: 1 }}
                    >
                      View Profile
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="inherit"
                      startIcon={<EditOutlined />}
                      onClick={() => handleOpenEdit(f)}
                      sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.75rem' }}
                    >
                      Edit
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <DataTable
            columns={columns}
            data={filteredFaculty}
            isLoading={isLoading}
            isError={isError}
            onEdit={handleOpenEdit}
            emptyMessage="No faculty members found."
          />
        )}
      </Card>

      {/* ── 5. Faculty Profile Drawer ─────────────────────────────────────── */}
      <Drawer
        anchor="right"
        open={Boolean(selectedFaculty)}
        onClose={() => setSelectedFaculty(null)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 440 }, p: 4, bgcolor: theme.palette.background.paper } }}
      >
        {selectedFaculty && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, height: '100%', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Header Avatar & Name */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    width: 60,
                    height: 60,
                    bgcolor: `${theme.palette.primary.main}18`,
                    color: theme.palette.primary.main,
                    fontWeight: 800,
                    fontSize: '1.4rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                >
                  {selectedFaculty.name?.charAt(0) || 'P'}
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
                    {selectedFaculty.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                    <EmailOutlined sx={{ fontSize: 14 }} /> {selectedFaculty.email}
                  </Typography>
                  <Chip
                    label={selectedFaculty.status}
                    size="small"
                    color={selectedFaculty.status === 'ACTIVE' ? 'success' : 'error'}
                    sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20, mt: 1 }}
                  />
                </Box>
              </Box>

              <Divider />

              {/* Teaching Workload Section */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: theme.palette.ink[900], mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SchoolOutlined sx={{ color: theme.palette.primary.main }} />
                  Assigned Teaching Subjects ({selectedFaculty.assignedCount})
                </Typography>

                {selectedFaculty.assignedCount === 0 ? (
                  <Card sx={{ p: 2.5, bgcolor: theme.custom?.surface?.sunken || 'rgba(0,0,0,0.02)', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      This professor currently has 0 subjects assigned.
                    </Typography>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<AssignmentIndOutlined />}
                      onClick={() => {
                        setSelectedFaculty(null);
                        navigate('/hod/faculty-assignment');
                      }}
                      sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 700 }}
                    >
                      Assign Subject Now
                    </Button>
                  </Card>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {selectedFaculty.assignedSubjects.map((sub) => (
                      <Card key={sub._id} sx={{ p: 2, borderRadius: '10px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.ink[900] }}>
                            {sub.subjectId?.name || 'Subject'}
                          </Typography>
                          <Chip
                            label={sub.group || 'All Groups'}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 700, fontSize: '0.65rem', height: 18 }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: theme.typography.mono.fontFamily }}>
                          Code: {sub.subjectId?.code || 'N/A'}
                        </Typography>
                      </Card>
                    ))}
                  </Box>
                )}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" fullWidth onClick={() => setSelectedFaculty(null)} sx={{ color: theme.palette.text.secondary }}>
                Close
              </Button>
              <Button
                variant="contained"
                fullWidth
                startIcon={<EditOutlined />}
                onClick={() => {
                  const f = selectedFaculty;
                  setSelectedFaculty(null);
                  handleOpenEdit(f);
                }}
                sx={{ background: theme.palette.primary.gradient || theme.palette.primary.main, color: '#ffffff', fontWeight: 700 }}
              >
                Edit Faculty Details
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>

      {/* ── 6. Register Faculty Modal ─────────────────────────────────────── */}
      <Dialog open={openModal} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Register New Department Faculty</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required fullWidth />
            <TextField label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required fullWidth />
            <TextField label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} required fullWidth />
            <TextField label="Temporary Password" name="password" type="password" value={formData.password} onChange={handleChange} required fullWidth />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClose} variant="outlined" sx={{ borderRadius: '8px' }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={registerMutation.isPending} sx={{ borderRadius: '8px', fontWeight: 700 }}>
              {registerMutation.isPending ? 'Registering...' : 'Register Faculty'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── 7. Edit Faculty Modal ─────────────────────────────────────────── */}
      <Dialog open={openEditModal} onClose={handleCloseEdit} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Edit Faculty Details</DialogTitle>
        <form onSubmit={handleEditSubmit}>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="First Name" name="firstName" value={editFormData.firstName} onChange={handleEditChange} required fullWidth />
            <TextField label="Last Name" name="lastName" value={editFormData.lastName} onChange={handleEditChange} required fullWidth />
            <TextField label="Email Address" name="email" type="email" value={editFormData.email} disabled fullWidth helperText="Email address cannot be changed." />
            <TextField label="Account Status" name="status" select value={editFormData.status} onChange={handleEditChange} required fullWidth>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
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
    </Box>
  );
};

export default HodFacultyHub;
