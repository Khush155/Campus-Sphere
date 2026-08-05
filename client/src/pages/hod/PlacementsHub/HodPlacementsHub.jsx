import React, { useState } from 'react';
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
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  Avatar,
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
} from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
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

export const HodPlacementsHub = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();
  const deptId = user?.departmentId?._id || user?.departmentId || user?.department?.id || user?.department;

  const [viewMode, setViewMode] = useState('drives'); // 'drives' | 'students'
  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    role: '',
    packageInfo: '',
    driveDate: '',
    applicationDeadline: '',
    jobDescription: '',
    selectionProcess: '',
    driveType: 'PLACEMENT',
    cgpa: '',
    backlogs: '',
  });

  const { data: drives = [], isLoading: drivesLoading, refetch: refetchDrives } = usePlacementsQuery();
  const { data: applications = [], isLoading: appsLoading, refetch: refetchApps } = usePlacementApplicationsQuery({
    finalStatus: 'SELECTED',
  });
  const createMutation = useCreatePlacementsMutation();
  const issueNocMutation = useIssueNocMutation();

  const totalDrives = drives.length;
  const activeDrives = drives.filter((d) => d.status === 'ONGOING' || d.status === 'UPCOMING').length;
  const selectedCount = applications.length;
  const nocIssuedCount = applications.filter((a) => a.isNocIssued).length;

  const handleRefresh = () => {
    refetchDrives();
    refetchApps();
  };

  const handleIssueNoc = async (appId, studentName) => {
    try {
      await issueNocMutation.mutateAsync(appId);
      showToast(`Official NOC issued successfully for ${studentName || 'student'}.`);
      handleRefresh();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to issue NOC', { severity: 'error' });
    }
  };

  const driveColumns = [
    {
      id: 'companyName',
      label: 'Company & Role',
      render: (r) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 34, height: 34, bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main }}>
            <BusinessOutlined sx={{ fontSize: 18 }} />
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
              {r.companyName}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <WorkOutline sx={{ fontSize: 12 }} /> {r.role}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'driveType',
      label: 'Category',
      render: (r) => (
        <Chip label={r.driveType || 'PLACEMENT'} size="small" variant="outlined" color="primary" sx={{ fontWeight: 800, fontSize: '0.68rem' }} />
      ),
    },
    {
      id: 'packageInfo',
      label: 'Package Offer',
      render: (r) =>
        r.packageInfo ? (
          <Chip
            label={r.packageInfo}
            size="small"
            color="success"
            variant="outlined"
            sx={{ fontWeight: 800, fontSize: '0.7rem' }}
          />
        ) : (
          <Typography variant="caption" color="text.disabled">—</Typography>
        ),
    },
    {
      id: 'eligibility',
      label: 'Eligibility Cutoff',
      render: (r) => (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {r.eligibilityCriteria?.cgpa && (
            <Chip label={`CGPA ≥ ${r.eligibilityCriteria.cgpa}`} size="small" sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
          )}
          {r.eligibilityCriteria?.backlogs !== undefined && (
            <Chip label={`Backlogs ≤ ${r.eligibilityCriteria.backlogs}`} size="small" color="warning" sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
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
      render: (r) => (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Drive: {new Date(r.driveDate).toLocaleDateString('en-IN')}
          </Typography>
          {r.applicationDeadline && (
            <Typography variant="caption" color={new Date(r.applicationDeadline) < new Date() ? 'error.main' : 'text.secondary'}>
              Deadline: {new Date(r.applicationDeadline).toLocaleDateString('en-IN')}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'status',
      label: 'Drive Status',
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
          <Avatar sx={{ width: 34, height: 34, bgcolor: `${theme.palette.signal.success}15`, color: theme.palette.signal.success, fontWeight: 700 }}>
            {r.studentId?.name?.charAt(0) || 'S'}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
              {r.studentId?.name || 'Student'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Roll: {r.studentId?.rollNumber || 'N/A'} • {r.studentId?.email}
            </Typography>
          </Box>
        </Box>
      ),
    },
    { id: 'company', label: 'Hired By Company', render: (r) => r.driveId?.companyName || 'N/A' },
    {
      id: 'role',
      label: 'Designation / Offer',
      render: (r) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>{r.driveId?.role}</Typography>
          <Chip label={r.driveId?.driveType || 'PLACEMENT'} size="small" variant="outlined" color="primary" sx={{ fontSize: '0.62rem', height: 18, mt: 0.3 }} />
        </Box>
      ),
    },
    {
      id: 'package',
      label: 'Offered Package',
      render: (r) =>
        r.offerPackageLPA ? (
          <Chip label={`${r.offerPackageLPA} LPA`} size="small" color="success" sx={{ fontWeight: 800, fontSize: '0.7rem' }} />
        ) : (
          <Typography variant="caption" color="text.disabled">—</Typography>
        ),
    },
    {
      id: 'nocStatus',
      label: 'NOC Certificate',
      render: (r) =>
        r.isNocIssued ? (
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
            Issue Official NOC
          </Button>
        ),
    },
  ];

  const handleChange = (e) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      companyName: formData.companyName,
      role: formData.role,
      packageInfo: formData.packageInfo,
      driveDate: formData.driveDate,
      applicationDeadline: formData.applicationDeadline || undefined,
      jobDescription: formData.jobDescription,
      selectionProcess: formData.selectionProcess,
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
        handleRefresh();
      },
      onError: (err) => showToast(err.response?.data?.message || 'Failed to create drive.', { severity: 'error' }),
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
                icon={<FlightTakeoffOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="STUDENT PLACEMENTS, INTERNSHIPS & NOC DESK"
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
              Placements & Capstone Internships
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              Post campus recruitment drives, manage eligibility cutoffs, track selected students, and issue official No Objection Certificates (NOC).
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshOutlined />}
              onClick={handleRefresh}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddOutlined />}
              onClick={() => setOpenModal(true)}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 700,
                background: theme.palette.primary.gradient || theme.palette.primary.main,
                color: '#ffffff',
              }}
            >
              Post Recruitment Drive
            </Button>
          </Box>
        </Box>
      </Card>

      {/* ── 2. KPI Summary Grid ────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
              RECRUITMENT DRIVES
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.ink[900], mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {drivesLoading ? <CircularProgress size={24} /> : totalDrives}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Total drives posted
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.signal.success }}>
              ACTIVE RECRUITMENTS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.signal.success, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {drivesLoading ? <CircularProgress size={24} /> : activeDrives}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Ongoing & upcoming drives
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.primary.main }}>
              SELECTED STUDENTS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.primary.main, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {appsLoading ? <CircularProgress size={24} /> : selectedCount}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Placed students & interns
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.brass?.[500] || '#b8863e' }}>
              OFFICIAL NOCs ISSUED
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.brass?.[500] || '#b8863e', mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {appsLoading ? <CircularProgress size={24} /> : nocIssuedCount}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Verified NOC passes
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* ── 3. Table Header & View Switcher ───────────────────────────────── */}
      <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, next) => next && setViewMode(next)}
            size="small"
            sx={{ bgcolor: theme.custom?.surface?.sunken || 'rgba(0,0,0,0.03)' }}
          >
            <ToggleButton value="drives">
              <BusinessOutlined sx={{ fontSize: 18, mr: 0.5 }} /> Recruitment Drives ({drives.length})
            </ToggleButton>
            <ToggleButton value="students">
              <SchoolOutlined sx={{ fontSize: 18, mr: 0.5 }} /> Placed Students & NOC Desk ({applications.length})
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {viewMode === 'drives' ? (
          <DataTable columns={driveColumns} data={drives} isLoading={drivesLoading} emptyMessage="No placement drives posted yet." />
        ) : (
          <DataTable columns={studentColumns} data={applications} isLoading={appsLoading} emptyMessage="No students have been selected yet." />
        )}
      </Card>

      {/* ── 4. Post Drive Modal ───────────────────────────────────────────── */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Post Placement / Internship Drive</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={7}>
                <TextField label="Company Name" name="companyName" value={formData.companyName} onChange={handleChange} required fullWidth placeholder="e.g. Google, Microsoft, TCS" />
              </Grid>
              <Grid item xs={5}>
                <TextField select label="Drive Type" name="driveType" value={formData.driveType} onChange={handleChange} fullWidth>
                  {DRIVE_TYPES.map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <TextField label="Job Role / Designation" name="role" value={formData.role} onChange={handleChange} required fullWidth placeholder="e.g. Software Development Engineer" />
            <TextField label="Package Offer" name="packageInfo" value={formData.packageInfo} onChange={handleChange} fullWidth placeholder="e.g. 12 LPA or 30k/mo Stipend" />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="Drive Date" name="driveDate" type="date" value={formData.driveDate} onChange={handleChange} required fullWidth InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Application Deadline" name="applicationDeadline" type="date" value={formData.applicationDeadline} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="Min CGPA Cutoff" name="cgpa" type="number" inputProps={{ min: 0, max: 10, step: 0.1 }} value={formData.cgpa} onChange={handleChange} fullWidth helperText="Leave blank for no filter" />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Max Backlogs Allowed" name="backlogs" type="number" inputProps={{ min: 0 }} value={formData.backlogs} onChange={handleChange} fullWidth helperText="Leave blank for no filter" />
              </Grid>
            </Grid>

            <TextField label="Selection Process" name="selectionProcess" value={formData.selectionProcess} onChange={handleChange} fullWidth placeholder="Aptitude Test → Technical Round → HR Interview" />
            <TextField label="Job Description" name="jobDescription" value={formData.jobDescription} onChange={handleChange} multiline rows={3} fullWidth />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpenModal(false)} variant="outlined" sx={{ borderRadius: '8px' }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending} sx={{ borderRadius: '8px', fontWeight: 700 }}>
              {createMutation.isPending ? 'Posting Drive...' : 'Post Recruitment Drive'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default HodPlacementsHub;
