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
  Card,
  useTheme,
  Avatar,
  Divider,
  InputAdornment,
} from '@mui/material';
import {
  AddOutlined,
  BusinessOutlined,
  WorkOutline,
  VerifiedOutlined,
  AssignmentTurnedInOutlined,
  RefreshOutlined,
  FlightTakeoffOutlined,
  SchoolOutlined,
  SearchOutlined,
  TrendingUpOutlined,
  PeopleOutlined,
  AccessTimeOutlined,
  WarningAmberOutlined,
} from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import EmptyState from '../../../components/common/EmptyState';
import {
  usePlacementsQuery,
  useCreatePlacementsMutation,
  usePlacementApplicationsQuery,
  useIssueNocMutation,
} from '../../../queries/hodQueries';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';

const DRIVE_TYPES = ['PLACEMENT', 'INTERNSHIP'];
const STATUS_COLORS = { UPCOMING: 'warning', ONGOING: 'success', COMPLETED: 'default', CANCELLED: 'error' };

// Generate consistent gradient from a string
const getAvatarGradient = (name = '') => {
  const colors = [
    ['#6366f1', '#8b5cf6'], ['#3b82f6', '#06b6d4'], ['#10b981', '#22c55e'],
    ['#f59e0b', '#ef4444'], ['#ec4899', '#f43f5e'], ['#14b8a6', '#0ea5e9'],
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return `linear-gradient(135deg, ${colors[idx][0]}, ${colors[idx][1]})`;
};

const isDeadlineSoon = (deadline) => {
  if (!deadline) return false;
  const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
  return days >= 0 && days <= 3;
};

const isDeadlinePast = (deadline) => {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
};

const KpiCard = ({ label, value, sublabel, accentColor, icon }) => {
  const theme = useTheme();
  return (
    <Card
      sx={{
        p: 2.5, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`,
        borderTop: `4px solid ${accentColor}`, boxShadow: 'none',
        height: '100%',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.06em', color: accentColor, textTransform: 'uppercase', fontSize: '0.65rem' }}>
          {label}
        </Typography>
        <Box sx={{ color: accentColor, opacity: 0.7 }}>{icon}</Box>
      </Box>
      <Typography variant="h3" sx={{ fontWeight: 900, color: accentColor, mt: 1, fontFamily: 'monospace', lineHeight: 1.1 }}>
        {value}
      </Typography>
      {sublabel && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          {sublabel}
        </Typography>
      )}
    </Card>
  );
};

export const HodPlacementsHub = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();
  const deptId = user?.departmentId?._id || user?.departmentId || user?.department?.id || user?.department;

  const [viewMode, setViewMode] = useState('drives'); // 'drives' | 'students'
  const [driveTypeFilter, setDriveTypeFilter] = useState('ALL');
  const [nocFilter, setNocFilter] = useState('ALL'); // 'ALL' | 'ISSUED' | 'PENDING'
  const [search, setSearch] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '', role: '', packageInfo: '', driveDate: '',
    applicationDeadline: '', jobDescription: '', selectionProcess: '',
    driveType: 'PLACEMENT', cgpa: '', backlogs: '',
  });

  const { data: drives = [], isLoading: drivesLoading, refetch: refetchDrives } = usePlacementsQuery();
  const { data: applications = [], isLoading: appsLoading, refetch: refetchApps } = usePlacementApplicationsQuery({ finalStatus: 'SELECTED' });
  const createMutation = useCreatePlacementsMutation();
  const issueNocMutation = useIssueNocMutation();

  const handleRefresh = () => { refetchDrives(); refetchApps(); };

  const handleIssueNoc = async (appId, studentName) => {
    try {
      await issueNocMutation.mutateAsync(appId);
      showToast(`NOC issued successfully for ${studentName || 'student'}.`);
      handleRefresh();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to issue NOC', { severity: 'error' });
    }
  };

  // Filtered drives
  const filteredDrives = useMemo(() => {
    let list = drives;
    if (driveTypeFilter !== 'ALL') list = list.filter((d) => d.driveType === driveTypeFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((d) => d.companyName?.toLowerCase().includes(q) || d.role?.toLowerCase().includes(q));
    }
    return list;
  }, [drives, driveTypeFilter, search]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    let list = applications;
    if (nocFilter === 'ISSUED') list = list.filter((a) => a.isNocIssued);
    if (nocFilter === 'PENDING') list = list.filter((a) => !a.isNocIssued);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.studentId?.name?.toLowerCase().includes(q) || a.driveId?.companyName?.toLowerCase().includes(q));
    }
    return list;
  }, [applications, nocFilter, search]);

  // KPI Stats
  const totalDrives = drives.length;
  const activeDrives = drives.filter((d) => d.status === 'ONGOING' || d.status === 'UPCOMING').length;
  const selectedCount = applications.length;
  const nocIssuedCount = applications.filter((a) => a.isNocIssued).length;

  const driveColumns = [
    {
      id: 'company',
      label: 'Company & Role',
      render: (r) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 38, height: 38, background: getAvatarGradient(r.companyName), fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
            {r.companyName?.charAt(0)?.toUpperCase() || 'C'}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 800, color: theme.palette.ink?.[900] || '#1a1a1a' }}>
              {r.companyName}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <WorkOutline sx={{ fontSize: 12, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">{r.role}</Typography>
            </Box>
          </Box>
        </Box>
      ),
    },
    {
      id: 'driveType',
      label: 'Category',
      render: (r) => (
        <Chip
          label={r.driveType || 'PLACEMENT'}
          size="small"
          color={r.driveType === 'INTERNSHIP' ? 'secondary' : 'primary'}
          variant="outlined"
          sx={{ fontWeight: 800, fontSize: '0.68rem' }}
        />
      ),
    },
    {
      id: 'packageInfo',
      label: 'Package Offer',
      render: (r) => r.packageInfo ? (
        <Chip label={r.packageInfo} size="small" color="success" variant="outlined" sx={{ fontWeight: 800, fontSize: '0.7rem' }} />
      ) : (
        <Typography variant="caption" color="text.disabled">Not Disclosed</Typography>
      ),
    },
    {
      id: 'eligibility',
      label: 'Eligibility',
      render: (r) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {r.eligibilityCriteria?.cgpa && (
            <Chip label={`CGPA ≥ ${r.eligibilityCriteria.cgpa}`} size="small" sx={{ fontWeight: 700, fontSize: '0.63rem', height: 20 }} />
          )}
          {r.eligibilityCriteria?.backlogs !== undefined && (
            <Chip label={`Backlogs ≤ ${r.eligibilityCriteria.backlogs}`} size="small" color="warning" sx={{ fontWeight: 700, fontSize: '0.63rem', height: 20 }} />
          )}
          {!r.eligibilityCriteria?.cgpa && r.eligibilityCriteria?.backlogs === undefined && (
            <Typography variant="caption" color="text.secondary">All Eligible</Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'dates',
      label: 'Timeline',
      render: (r) => {
        const soon = isDeadlineSoon(r.applicationDeadline);
        const past = isDeadlinePast(r.applicationDeadline);
        return (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTimeOutlined sx={{ fontSize: 12, color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {new Date(r.driveDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </Typography>
            </Box>
            {r.applicationDeadline && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                {(soon || past) && <WarningAmberOutlined sx={{ fontSize: 12, color: past ? 'error.main' : 'warning.main' }} />}
                <Typography variant="caption" sx={{ color: past ? 'error.main' : soon ? 'warning.main' : 'text.secondary', fontWeight: soon || past ? 700 : 400 }}>
                  Deadline: {new Date(r.applicationDeadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  {soon && !past ? ' (Soon!)' : past ? ' (Closed)' : ''}
                </Typography>
              </Box>
            )}
          </Box>
        );
      },
    },
    {
      id: 'status',
      label: 'Status',
      render: (r) => (
        <Chip label={r.status || 'UPCOMING'} size="small" color={STATUS_COLORS[r.status] || 'default'} sx={{ fontWeight: 800, fontSize: '0.65rem' }} />
      ),
    },
  ];

  const studentColumns = [
    {
      id: 'studentName',
      label: 'Selected Student',
      render: (r) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 36, height: 36, background: getAvatarGradient(r.studentId?.name), fontWeight: 800, fontSize: 15 }}>
            {r.studentId?.name?.charAt(0) || 'S'}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 800, color: theme.palette.ink?.[900] || '#1a1a1a' }}>
              {r.studentId?.name || 'Student'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {r.studentId?.email}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'company',
      label: 'Hired By',
      render: (r) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 26, height: 26, background: getAvatarGradient(r.driveId?.companyName), fontSize: 12, fontWeight: 800 }}>
            {r.driveId?.companyName?.charAt(0) || 'C'}
          </Avatar>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>{r.driveId?.companyName || 'N/A'}</Typography>
        </Box>
      ),
    },
    {
      id: 'role',
      label: 'Role & Type',
      render: (r) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>{r.driveId?.role || '—'}</Typography>
          <Chip label={r.driveId?.driveType || 'PLACEMENT'} size="small" variant="outlined" color="primary" sx={{ fontSize: '0.62rem', height: 18, mt: 0.3 }} />
        </Box>
      ),
    },
    {
      id: 'package',
      label: 'Package',
      render: (r) => r.offerPackageLPA ? (
        <Chip label={`${r.offerPackageLPA} LPA`} size="small" color="success" sx={{ fontWeight: 800, fontSize: '0.7rem' }} />
      ) : (
        <Typography variant="caption" color="text.disabled">—</Typography>
      ),
    },
    {
      id: 'nocStatus',
      label: 'NOC Certificate',
      render: (r) => r.isNocIssued ? (
        <Chip
          icon={<VerifiedOutlined sx={{ fontSize: '0.8rem !important' }} />}
          label={`Issued ${new Date(r.nocIssueDate).toLocaleDateString('en-IN')}`}
          color="success"
          size="small"
          sx={{ fontWeight: 800, fontSize: '0.65rem' }}
        />
      ) : (
        <Button
          size="small"
          variant="contained"
          color="primary"
          startIcon={<AssignmentTurnedInOutlined />}
          onClick={() => handleIssueNoc(r._id || r.id, r.studentId?.name)}
          disabled={issueNocMutation.isPending}
          sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 700, fontSize: '0.72rem' }}
        >
          Issue NOC
        </Button>
      ),
    },
  ];

  const handleChange = (e) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      companyName: formData.companyName, role: formData.role, packageInfo: formData.packageInfo,
      driveDate: formData.driveDate, applicationDeadline: formData.applicationDeadline || undefined,
      jobDescription: formData.jobDescription, selectionProcess: formData.selectionProcess,
      driveType: formData.driveType,
      eligibilityCriteria: {
        cgpa: formData.cgpa ? parseFloat(formData.cgpa) : undefined,
        backlogs: formData.backlogs !== '' ? parseInt(formData.backlogs) : undefined,
      },
      departmentIds: deptId ? [deptId] : [],
    };
    createMutation.mutate(payload, {
      onSuccess: () => {
        setOpenModal(false);
        showToast(`Placement drive for ${formData.companyName} created!`);
        setFormData({ companyName: '', role: '', packageInfo: '', driveDate: '', applicationDeadline: '', jobDescription: '', selectionProcess: '', driveType: 'PLACEMENT', cgpa: '', backlogs: '' });
        handleRefresh();
      },
      onError: (err) => showToast(err.response?.data?.message || 'Failed to create drive.', { severity: 'error' }),
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* ── 1. Hero Banner ─────────────────────────────────────────────────── */}
      <Card
        sx={{
          p: 3.5, borderRadius: '16px',
          border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}0D 0%, ${theme.palette.brass?.[500] || '#b8863e'}08 100%)`,
          boxShadow: 'none',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Chip
              icon={<FlightTakeoffOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
              label="STUDENT PLACEMENTS, INTERNSHIPS & NOC DESK"
              size="small"
              sx={{ bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main, fontWeight: 800, fontSize: '0.68rem', letterSpacing: '0.05em', mb: 1.5 }}
            />
            <Typography variant="h4" sx={{ fontFamily: theme.typography.h1?.fontFamily, fontWeight: 800, color: theme.palette.ink?.[900] || '#1a1a1a' }}>
              Placements & Capstone Internships
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5, maxWidth: 560 }}>
              Post campus recruitment drives, manage eligibility cutoffs, track selected students, and issue official No Objection Certificates (NOC).
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button variant="outlined" startIcon={<RefreshOutlined />} onClick={handleRefresh} sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}>
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddOutlined />}
              onClick={() => setOpenModal(true)}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, background: theme.palette.primary.gradient || theme.palette.primary.main, color: '#fff' }}
            >
              Post Recruitment Drive
            </Button>
          </Box>
        </Box>
      </Card>

      {/* ── 2. KPI Cards ───────────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        {[
          { label: 'Recruitment Drives', value: totalDrives, sublabel: 'Total drives posted', accentColor: theme.palette.ink?.[700] || '#374151', icon: <BusinessOutlined sx={{ fontSize: 20 }} /> },
          { label: 'Active Recruitments', value: activeDrives, sublabel: 'Ongoing & upcoming', accentColor: theme.palette.success.main, icon: <TrendingUpOutlined sx={{ fontSize: 20 }} /> },
          { label: 'Selected Students', value: selectedCount, sublabel: 'Placed & interning', accentColor: theme.palette.primary.main, icon: <PeopleOutlined sx={{ fontSize: 20 }} /> },
          { label: 'NOC Certificates Issued', value: nocIssuedCount, sublabel: 'Official NOC passes', accentColor: theme.palette.brass?.[500] || '#b8863e', icon: <VerifiedOutlined sx={{ fontSize: 20 }} /> },
        ].map((kpi) => (
          <Grid item xs={12} sm={6} md={3} key={kpi.label}>
            <KpiCard {...kpi} color={kpi.accentColor} />
          </Grid>
        ))}
      </Grid>

      {/* ── 3. Placement Funnel Stats ──────────────────────────────────────── */}
      <Card sx={{ p: 2.5, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.06em', color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem', mb: 2, display: 'block' }}>
          Recruitment Funnel Overview
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
          {[
            { label: 'Drives Posted', value: totalDrives, color: theme.palette.primary.main },
            { label: '▶', value: null, color: 'text.disabled' },
            { label: 'Active / Open', value: activeDrives, color: theme.palette.warning.main },
            { label: '▶', value: null, color: 'text.disabled' },
            { label: 'Students Selected', value: selectedCount, color: theme.palette.success.main },
            { label: '▶', value: null, color: 'text.disabled' },
            { label: 'NOC Issued', value: nocIssuedCount, color: theme.palette.brass?.[500] || '#b8863e' },
          ].map((step, i) =>
            step.value !== null ? (
              <Box key={i} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', px: 3, py: 1.5, borderRadius: '10px', bgcolor: `${step.color}10`, mx: 0.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 900, color: step.color, fontFamily: 'monospace', lineHeight: 1 }}>
                  {step.value}
                </Typography>
                <Typography variant="caption" sx={{ color: step.color, fontWeight: 700, fontSize: '0.62rem', mt: 0.5 }}>
                  {step.label}
                </Typography>
              </Box>
            ) : (
              <Typography key={i} sx={{ color: 'text.disabled', fontSize: 18, px: 0.5 }}>{step.label}</Typography>
            )
          )}
        </Box>
      </Card>

      {/* ── 4. Table with Filters ──────────────────────────────────────────── */}
      <Card sx={{ borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', overflow: 'hidden' }}>
        {/* Toolbar — single row: view toggle | type filter | search */}
        <Box sx={{ px: 3, pt: 2.5, pb: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
            {/* View Toggle */}
            <Box sx={{ display: 'flex', gap: 0.75, flexShrink: 0 }}>
              <Chip
                icon={<BusinessOutlined sx={{ fontSize: '0.9rem !important' }} />}
                label={`Drives (${drives.length})`}
                onClick={() => setViewMode('drives')}
                color={viewMode === 'drives' ? 'primary' : 'default'}
                variant={viewMode === 'drives' ? 'filled' : 'outlined'}
                sx={{ fontWeight: 800, cursor: 'pointer', fontSize: '0.75rem' }}
              />
              <Chip
                icon={<SchoolOutlined sx={{ fontSize: '0.9rem !important' }} />}
                label={`Placed Students (${applications.length})`}
                onClick={() => setViewMode('students')}
                color={viewMode === 'students' ? 'primary' : 'default'}
                variant={viewMode === 'students' ? 'filled' : 'outlined'}
                sx={{ fontWeight: 800, cursor: 'pointer', fontSize: '0.75rem' }}
              />
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />

            {/* Sub-filter chips — type or NOC */}
            {viewMode === 'drives' && (
              <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', flexWrap: 'wrap' }}>
                {['ALL', 'PLACEMENT', 'INTERNSHIP'].map((t) => (
                  <Chip
                    key={t}
                    label={t}
                    size="small"
                    onClick={() => setDriveTypeFilter(t)}
                    color={driveTypeFilter === t ? 'primary' : 'default'}
                    variant={driveTypeFilter === t ? 'filled' : 'outlined'}
                    sx={{ fontWeight: 700, cursor: 'pointer', fontSize: '0.68rem' }}
                  />
                ))}
              </Box>
            )}
            {viewMode === 'students' && (
              <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', flexWrap: 'wrap' }}>
                {['ALL', 'ISSUED', 'PENDING'].map((n) => (
                  <Chip
                    key={n}
                    label={n}
                    size="small"
                    onClick={() => setNocFilter(n)}
                    color={nocFilter === n ? (n === 'ISSUED' ? 'success' : n === 'PENDING' ? 'warning' : 'primary') : 'default'}
                    variant={nocFilter === n ? 'filled' : 'outlined'}
                    sx={{ fontWeight: 700, cursor: 'pointer', fontSize: '0.68rem' }}
                  />
                ))}
              </Box>
            )}

            {/* Search — pushed to the right */}
            <Box sx={{ ml: 'auto', flexShrink: 0 }}>
              <TextField
                size="small"
                placeholder={viewMode === 'drives' ? 'Search company or role...' : 'Search student or company...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlined sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> }}
                sx={{ minWidth: 240 }}
              />
            </Box>
          </Box>
        </Box>

        {/* Table */}
        <Box sx={{ p: 3 }}>
          {viewMode === 'drives' ? (
            filteredDrives.length === 0 && !drivesLoading ? (
              <EmptyState type="reports" title="No Drives Found" description="No placement drives match the current filters." actionText="Post First Drive" onAction={() => setOpenModal(true)} />
            ) : (
              <DataTable columns={driveColumns} data={filteredDrives} isLoading={drivesLoading} emptyMessage="No placement drives posted yet." />
            )
          ) : (
            filteredStudents.length === 0 && !appsLoading ? (
              <EmptyState type="reports" title="No Students Found" description="No selected students match the current NOC filter." />
            ) : (
              <DataTable columns={studentColumns} data={filteredStudents} isLoading={appsLoading} emptyMessage="No students have been selected yet." />
            )
          )}
        </Box>
      </Card>

      {/* ── 5. Post Drive Modal ───────────────────────────────────────────── */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800, borderBottom: `1px solid ${theme.palette.divider}`, pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: `${theme.palette.primary.main}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FlightTakeoffOutlined sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
            </Box>
            Post Placement / Internship Drive
          </Box>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 3 }}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={8}>
                <TextField label="Company Name" name="companyName" value={formData.companyName} onChange={handleChange} required fullWidth placeholder="e.g. Google, Microsoft, TCS" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField select label="Drive Type" name="driveType" value={formData.driveType} onChange={handleChange} fullWidth>
                  {DRIVE_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField label="Job Role / Designation" name="role" value={formData.role} onChange={handleChange} required fullWidth placeholder="e.g. Software Development Engineer" />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField label="Package Offer" name="packageInfo" value={formData.packageInfo} onChange={handleChange} fullWidth placeholder="e.g. 12 LPA or 30k/mo Stipend" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Selection Process" name="selectionProcess" value={formData.selectionProcess} onChange={handleChange} fullWidth placeholder="Aptitude → Technical → HR" />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField label="Drive Date" name="driveDate" type="date" value={formData.driveDate} onChange={handleChange} required fullWidth InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Application Deadline" name="applicationDeadline" type="date" value={formData.applicationDeadline} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
              </Grid>

              <Grid item xs={12}>
                <Divider><Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>ELIGIBILITY CRITERIA</Typography></Divider>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Min CGPA Cutoff" name="cgpa" type="number" inputProps={{ min: 0, max: 10, step: 0.1 }} value={formData.cgpa} onChange={handleChange} fullWidth helperText="Leave blank for no minimum" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Max Backlogs Allowed" name="backlogs" type="number" inputProps={{ min: 0 }} value={formData.backlogs} onChange={handleChange} fullWidth helperText="Leave blank for no restriction" />
              </Grid>

              <Grid item xs={12}>
                <TextField label="Job Description" name="jobDescription" value={formData.jobDescription} onChange={handleChange} multiline rows={3} fullWidth placeholder="Describe the role, responsibilities, and required skills..." />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
            <Button onClick={() => setOpenModal(false)} variant="outlined" sx={{ borderRadius: '8px' }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending} sx={{ borderRadius: '8px', fontWeight: 700, px: 4 }}>
              {createMutation.isPending ? 'Posting...' : 'Post Recruitment Drive'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default HodPlacementsHub;
