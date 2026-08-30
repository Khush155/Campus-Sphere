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
  Badge,
  IconButton,
  Tooltip,
  Paper,
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
  MeetingRoomOutlined,
  CheckCircleOutlined,
  CloseOutlined,
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
        f.email.toLowerCase().includes(search.toLowerCase()) ||
        (f.specialization && f.specialization.toLowerCase().includes(search.toLowerCase())) ||
        (f.qualification && f.qualification.toLowerCase().includes(search.toLowerCase()));

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
      label: 'Faculty Professor',
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            variant="dot"
            sx={{
              '& .MuiBadge-badge': {
                bgcolor: row.status === 'ACTIVE' ? theme.palette.success.main : theme.palette.error.main,
                width: 10,
                height: 10,
                borderRadius: '50%',
                border: `2px solid ${theme.palette.background.paper}`,
              },
            }}
          >
            <Avatar
              sx={{
                width: 38,
                height: 38,
                bgcolor: `${theme.palette.primary.main}15`,
                color: theme.palette.primary.main,
                fontWeight: 700,
                fontSize: '0.9rem',
              }}
            >
              {row.name?.charAt(0) || 'P'}
            </Avatar>
          </Badge>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.ink[900], lineHeight: 1.2 }}>
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
      id: 'qualification',
      label: 'Specialization & Qualification',
      render: (row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.ink[800], fontSize: '0.8rem' }}>
            {row.qualification || row.specialization || 'Ph.D. / M.Tech Faculty'}
          </Typography>
          {row.officeRoom && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <MeetingRoomOutlined sx={{ fontSize: 13 }} /> {row.officeRoom}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'assignedCount',
      label: 'Workload Status',
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
          sx={{ fontWeight: 800, fontSize: '0.68rem', height: 20 }}
        />
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="View Profile">
            <IconButton size="small" onClick={() => setSelectedFaculty(row)} color="primary">
              <VisibilityOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Member">
            <IconButton size="small" onClick={() => handleOpenEdit(row)}>
              <EditOutlined fontSize="small" />
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

  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* ── 1. Hero Banner ─────────────────────────────────────────────────── */}
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
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Chip
                icon={<GroupsOutlined sx={{ fontSize: '0.85rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="DEPARTMENT FACULTY ROSTER"
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
              Staff & Faculty Directory
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5, maxWidth: 650 }}>
              Manage professor rosters, designations, contact credentials, and course allocations across the department.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', zIndex: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshOutlined />}
              onClick={() => refetch()}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
            >
              Refresh Roster
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
              Register Faculty
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
              borderRadius: '18px',
              border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
              borderTop: `4px solid ${theme.palette.primary.main}`,
              bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
              boxShadow: theme.custom?.elevation?.raised || 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.25s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: isDark ? '0 12px 28px rgba(0,0,0,0.3)' : '0 12px 28px rgba(0,0,0,0.06)',
                borderColor: theme.palette.primary.main,
              },
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
                TOTAL PROFESSORS
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.ink[900], mt: 0.5, fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
                {isLoading ? <CircularProgress size={22} /> : totalFaculty}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
                In department roster
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main, width: 44, height: 44 }}>
              <GroupsOutlined />
            </Avatar>
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.25s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: isDark ? '0 12px 28px rgba(0,0,0,0.3)' : '0 12px 28px rgba(0,0,0,0.06)',
                borderColor: theme.palette.success.main,
              },
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
                ACTIVE FACULTY
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.success.main, mt: 0.5, fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
                {isLoading ? <CircularProgress size={22} /> : activeFaculty}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
                Active user accounts
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
              borderRadius: '18px',
              border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
              borderTop: `4px solid ${theme.palette.info.main}`,
              bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
              boxShadow: theme.custom?.elevation?.raised || 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.25s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: isDark ? '0 12px 28px rgba(0,0,0,0.3)' : '0 12px 28px rgba(0,0,0,0.06)',
                borderColor: theme.palette.info.main,
              },
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
                ALLOCATED TEACHERS
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.info.main, mt: 0.5, fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
                {isLoading ? <CircularProgress size={22} /> : allocatedFaculty}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
                Teaching active subjects
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: `${theme.palette.info.main}15`, color: theme.palette.info.main, width: 44, height: 44 }}>
              <SchoolOutlined />
            </Avatar>
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.25s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: isDark ? '0 12px 28px rgba(0,0,0,0.3)' : '0 12px 28px rgba(0,0,0,0.06)',
                borderColor: theme.palette.warning.main,
              },
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
                UNASSIGNED POOL
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.warning.main, mt: 0.5, fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
                {isLoading ? <CircularProgress size={22} /> : unassignedFaculty}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
                Available for allocation
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: `${theme.palette.warning.main}15`, color: theme.palette.warning.main, width: 44, height: 44 }}>
              <AssignmentIndOutlined />
            </Avatar>
          </Card>
        </Grid>
      </Grid>

      {/* ── 3. Filters & Roster Container ──────────────────────────────────── */}
      <Card sx={{ p: { xs: 2, md: 3 }, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, flex: 1, flexWrap: 'wrap', minWidth: 280 }}>
            <TextField
              size="small"
              placeholder="Search by name, email, specialization..."
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
            sx={{ bgcolor: `${theme.palette.primary.main}08`, p: 0.5, borderRadius: '10px' }}
          >
            <ToggleButton value="grid" sx={{ borderRadius: '8px', px: 2, py: 0.5, fontWeight: 700, textTransform: 'none' }}>
              <GridViewOutlined sx={{ fontSize: 18, mr: 0.8 }} /> Grid View
            </ToggleButton>
            <ToggleButton value="table" sx={{ borderRadius: '8px', px: 2, py: 0.5, fontWeight: 700, textTransform: 'none' }}>
              <TableRowsOutlined sx={{ fontSize: 18, mr: 0.8 }} /> Roster Table
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* ── 4. Main Grid View vs Table View ─────────────────────────────── */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
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
              <Grid item xs={12} sm={6} md={4} key={f.id || f._id} sx={{ display: 'flex' }}>
                <Card
                  sx={{
                    p: 2.5,
                    borderRadius: '14px',
                    border: `1px solid ${theme.palette.divider}`,
                    boxShadow: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    width: '100%',
                    gap: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                      borderColor: theme.palette.primary.main,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {/* Header: Avatar + Status + Name */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        variant="dot"
                        sx={{
                          '& .MuiBadge-badge': {
                            bgcolor: f.status === 'ACTIVE' ? theme.palette.success.main : theme.palette.error.main,
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            border: `2px solid ${theme.palette.background.paper}`,
                          },
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 48,
                            height: 48,
                            bgcolor: `${theme.palette.primary.main}18`,
                            color: theme.palette.primary.main,
                            fontWeight: 800,
                            fontSize: '1.1rem',
                            border: `1px solid ${theme.palette.divider}`,
                          }}
                        >
                          {f.name?.charAt(0) || 'P'}
                        </Avatar>
                      </Badge>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: theme.palette.ink[900], lineHeight: 1.3, truncate: true }}>
                          {f.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, truncate: true, mt: 0.2 }}>
                          <EmailOutlined sx={{ fontSize: 13 }} /> {f.email}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Metadata Pill Tags */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                      <Chip
                        icon={<SchoolOutlined sx={{ fontSize: '0.75rem !important' }} />}
                        label={f.assignedCount > 0 ? `${f.assignedCount} Subject(s)` : 'Unassigned'}
                        size="small"
                        color={f.assignedCount > 0 ? 'primary' : 'warning'}
                        variant={f.assignedCount > 0 ? 'filled' : 'outlined'}
                        sx={{ fontWeight: 700, fontSize: '0.65rem', height: 22 }}
                      />

                      {f.officeRoom && (
                        <Chip
                          icon={<MeetingRoomOutlined sx={{ fontSize: '0.75rem !important' }} />}
                          label={f.officeRoom}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 600, fontSize: '0.65rem', height: 22 }}
                        />
                      )}
                    </Box>

                    {/* Qualification / Specialization snippet */}
                    {(f.qualification || f.specialization) && (
                      <Typography variant="caption" color="text.secondary" sx={{ bgcolor: `${theme.palette.primary.main}06`, p: 1, borderRadius: '6px', fontSize: '0.72rem' }}>
                        <strong>Qualification:</strong> {f.qualification || f.specialization}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ pt: 1, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<VisibilityOutlined />}
                      onClick={() => setSelectedFaculty(f)}
                      sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', flex: 1 }}
                    >
                      View Profile
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="inherit"
                      startIcon={<EditOutlined />}
                      onClick={() => handleOpenEdit(f)}
                      sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.75rem' }}
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
        PaperProps={{ sx: { width: { xs: '100%', sm: 460 }, p: 3.5, bgcolor: theme.palette.background.paper } }}
      >
        {selectedFaculty && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* Header Avatar & Name */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    sx={{
                      width: 56,
                      height: 56,
                      bgcolor: `${theme.palette.primary.main}18`,
                      color: theme.palette.primary.main,
                      fontWeight: 800,
                      fontSize: '1.3rem',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    }}
                  >
                    {selectedFaculty.name?.charAt(0) || 'P'}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
                      {selectedFaculty.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.2 }}>
                      <EmailOutlined sx={{ fontSize: 13 }} /> {selectedFaculty.email}
                    </Typography>
                    <Chip
                      label={selectedFaculty.status}
                      size="small"
                      color={selectedFaculty.status === 'ACTIVE' ? 'success' : 'error'}
                      sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20, mt: 0.8 }}
                    />
                  </Box>
                </Box>

                <IconButton onClick={() => setSelectedFaculty(null)} size="small">
                  <CloseOutlined />
                </IconButton>
              </Box>

              <Divider />

              {/* Professor Details */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
                  Faculty Credentials & Office
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                  <Paper sx={{ p: 1.5, borderRadius: '8px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                      OFFICE ROOM
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.3 }}>
                      {selectedFaculty.officeRoom || 'Main Faculty Block'}
                    </Typography>
                  </Paper>

                  <Paper sx={{ p: 1.5, borderRadius: '8px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                      OFFICE HOURS
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.3 }}>
                      {selectedFaculty.officeHours || 'Mon-Fri 10:00 - 2:00'}
                    </Typography>
                  </Paper>
                </Box>

                {(selectedFaculty.qualification || selectedFaculty.specialization) && (
                  <Paper sx={{ p: 1.5, borderRadius: '8px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                      QUALIFICATION & SPECIALIZATION
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.3 }}>
                      {selectedFaculty.qualification || selectedFaculty.specialization}
                    </Typography>
                  </Paper>
                )}
              </Box>

              {/* Teaching Workload Section */}
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: theme.palette.ink[900], mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SchoolOutlined sx={{ color: theme.palette.primary.main }} />
                  Assigned Teaching Subjects ({selectedFaculty.assignedCount})
                </Typography>

                {selectedFaculty.assignedCount === 0 ? (
                  <Card sx={{ p: 2.5, bgcolor: `${theme.palette.primary.main}04`, border: `1px dashed ${theme.palette.divider}`, boxShadow: 'none', textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      This professor currently has 0 subjects assigned in active workload records.
                    </Typography>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<AssignmentIndOutlined />}
                      onClick={() => {
                        setSelectedFaculty(null);
                        navigate('/hod/faculty-assignment');
                      }}
                      sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}
                    >
                      Assign Subject Now
                    </Button>
                  </Card>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {selectedFaculty.assignedSubjects.map((sub) => (
                      <Card key={sub._id} sx={{ p: 1.8, borderRadius: '10px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.ink[900] }}>
                            {sub.subjectId?.name || 'Subject'}
                          </Typography>
                          <Chip
                            label={sub.group ? `Group ${sub.group}` : 'All Groups'}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ fontWeight: 700, fontSize: '0.65rem', height: 20 }}
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

            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button variant="outlined" fullWidth onClick={() => setSelectedFaculty(null)} sx={{ borderRadius: '10px', color: theme.palette.text.secondary }}>
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
                sx={{ borderRadius: '10px', fontWeight: 700 }}
              >
                Edit Faculty
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
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required fullWidth size="small" />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required fullWidth size="small" />
              </Grid>
            </Grid>
            <TextField label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} required fullWidth size="small" />
            <TextField label="Temporary Password" name="password" type="password" value={formData.password} onChange={handleChange} required fullWidth size="small" />
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
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
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="First Name" name="firstName" value={editFormData.firstName} onChange={handleEditChange} required fullWidth size="small" />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Last Name" name="lastName" value={editFormData.lastName} onChange={handleEditChange} required fullWidth size="small" />
              </Grid>
            </Grid>
            <TextField label="Email Address" name="email" type="email" value={editFormData.email} disabled fullWidth size="small" helperText="Email address cannot be changed." />
            <TextField label="Account Status" name="status" select value={editFormData.status} onChange={handleEditChange} required fullWidth size="small">
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
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
