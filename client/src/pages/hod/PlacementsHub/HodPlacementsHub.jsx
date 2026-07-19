/* eslint-disable */
import React, { useState } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Chip, Alert, Snackbar, Tooltip,
} from '@mui/material';
import { AddOutlined, Business, WorkOutline, Verified, AssignmentTurnedIn } from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import {
  usePlacementsQuery,
  useCreatePlacementsMutation,
  usePlacementApplicationsQuery,
  useIssueNocMutation,
} from '../../../queries/hodQueries';

const DRIVE_STATUSES = ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'];
const DRIVE_TYPES = ['PLACEMENT', 'INTERNSHIP'];
const STATUS_COLORS = { UPCOMING: 'warning', ONGOING: 'success', COMPLETED: 'default', CANCELLED: 'error' };

const HodPlacementsHub = () => {
  const [viewMode, setViewMode] = useState('drives'); // 'drives' | 'students'
  const [openModal, setOpenModal] = useState(false);
  const [toast, setToast] = useState({ open: false, msg: '', severity: 'success' });
  const [formData, setFormData] = useState({
    companyName: '', role: '', packageInfo: '', driveDate: '',
    jobDescription: '', selectionProcess: '', driveType: 'PLACEMENT',
    cgpa: '', backlogs: '',
  });

  const { data: drives = [], isLoading: drivesLoading } = usePlacementsQuery();
  const { data: applications = [], isLoading: appsLoading } = usePlacementApplicationsQuery({ finalStatus: 'SELECTED' });
  const createMutation = useCreatePlacementsMutation();
  const issueNocMutation = useIssueNocMutation();

  const showToast = (msg, severity = 'success') => setToast({ open: true, msg, severity });

  const handleIssueNoc = async (appId) => {
    try {
      await issueNocMutation.mutateAsync(appId);
      showToast('NOC Issued successfully.');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to issue NOC', 'error');
    }
  };

  const driveColumns = [
    {
      id: 'companyName', label: 'Company', render: (r) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Business fontSize="small" color="primary" />
          <Typography fontWeight={700}>{r.companyName}</Typography>
        </Box>
      )
    },
    { id: 'role', label: 'Role', render: (r) => <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><WorkOutline fontSize="small" />{r.role}</Box> },
    { id: 'driveType', label: 'Type', render: (r) => <Chip label={r.driveType || 'PLACEMENT'} size="small" variant="outlined" color="primary" /> },
    { id: 'packageInfo', label: 'Package', render: (r) => r.packageInfo ? <Chip label={r.packageInfo} size="small" color="success" variant="outlined" /> : '—' },
    {
      id: 'eligibility', label: 'Eligibility', render: (r) => (
        <Box>
          {r.eligibilityCriteria?.cgpa && <Chip label={`CGPA ≥ ${r.eligibilityCriteria.cgpa}`} size="small" sx={{ mr: 0.5 }} />}
          {r.eligibilityCriteria?.backlogs !== undefined && <Chip label={`Backlogs ≤ ${r.eligibilityCriteria.backlogs}`} size="small" color="warning" />}
        </Box>
      )
    },
    {
      id: 'applicationDeadline', label: 'Apply By', render: (r) => r.applicationDeadline
        ? <Typography variant="body2" color={new Date(r.applicationDeadline) < new Date() ? 'error.main' : 'text.primary'}>
            {new Date(r.applicationDeadline).toLocaleDateString('en-IN')}
          </Typography>
        : '—'
    },
    { id: 'driveDate', label: 'Drive Date', render: (r) => new Date(r.driveDate).toLocaleDateString('en-IN') },
    {
      id: 'status', label: 'Status', render: (r) => (
        <Chip label={r.status} size="small" color={STATUS_COLORS[r.status] || 'default'} />
      )
    },
  ];

  const studentColumns = [
    { id: 'studentName', label: 'Student', render: (r) => <Typography fontWeight={700}>{r.studentId?.name}</Typography> },
    { id: 'rollNumber', label: 'Roll Number', render: (r) => r.studentId?.rollNumber || '—' },
    { id: 'company', label: 'Company', render: (r) => r.driveId?.companyName },
    { id: 'role', label: 'Role / Type', render: (r) => (
      <Box>
        <Typography variant="body2">{r.driveId?.role}</Typography>
        <Chip label={r.driveId?.driveType || 'PLACEMENT'} size="small" variant="outlined" color="primary" sx={{ mt: 0.5 }} />
      </Box>
    )},
    { id: 'package', label: 'Package (LPA)', render: (r) => r.offerPackageLPA ? <Chip label={`${r.offerPackageLPA} LPA`} size="small" color="success" /> : '—' },
    { id: 'appliedOn', label: 'Applied On', render: (r) => new Date(r.createdAt).toLocaleDateString('en-IN') },
    {
      id: 'nocStatus', label: 'NOC Status', render: (r) => (
        r.isNocIssued ? (
          <Chip icon={<Verified />} label={`Issued ${new Date(r.nocIssueDate).toLocaleDateString('en-IN')}`} color="success" size="small" />
        ) : (
          <Button 
            size="small" 
            variant="contained" 
            color="primary"
            startIcon={<AssignmentTurnedIn />}
            onClick={() => handleIssueNoc(r._id)}
            disabled={issueNocMutation.isPending}
          >
            Issue NOC
          </Button>
        )
      )
    }
  ];

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      companyName: formData.companyName,
      role: formData.role,
      packageInfo: formData.packageInfo,
      driveDate: formData.driveDate,
      jobDescription: formData.jobDescription,
      selectionProcess: formData.selectionProcess,
      driveType: formData.driveType,
      eligibilityCriteria: {
        cgpa: formData.cgpa ? parseFloat(formData.cgpa) : undefined,
        backlogs: formData.backlogs !== '' ? parseInt(formData.backlogs) : undefined,
      },
    };
    createMutation.mutate(payload, {
      onSuccess: () => { setOpenModal(false); showToast('Placement drive created successfully.'); },
      onError: (err) => showToast(err.response?.data?.message || 'Failed to create drive.', 'error'),
    });
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Placements Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage placement drives, internships, and issue NOCs to selected students.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={viewMode === 'drives' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('drives')}
          >
            Drives
          </Button>
          <Button
            variant={viewMode === 'students' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('students')}
          >
            Selected Students
          </Button>
          <Button variant="contained" color="secondary" startIcon={<AddOutlined />} onClick={() => setOpenModal(true)} sx={{ ml: 1 }}>
            Post Drive
          </Button>
        </Box>
      </Box>

      {viewMode === 'drives' ? (
        <DataTable columns={driveColumns} data={drives} isLoading={drivesLoading} emptyMessage="No placement drives posted yet." />
      ) : (
        <DataTable columns={studentColumns} data={applications} isLoading={appsLoading} emptyMessage="No students have been selected yet." />
      )}

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Post Placement / Internship Drive</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="Company Name" name="companyName" value={formData.companyName} onChange={handleChange} required fullWidth />
                <TextField select label="Drive Type" name="driveType" value={formData.driveType} onChange={handleChange} fullWidth>
                  {DRIVE_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              </Box>
              <TextField label="Job Role / Position" name="role" value={formData.role} onChange={handleChange} required fullWidth />
              <TextField label="Package (e.g. 8 LPA, 12-15 LPA, 20k/mo Stipend)" name="packageInfo" value={formData.packageInfo} onChange={handleChange} fullWidth />
              <TextField label="Drive Date" name="driveDate" type="date" value={formData.driveDate} onChange={handleChange} required fullWidth InputLabelProps={{ shrink: true }} />
              <TextField label="Application Deadline" name="applicationDeadline" type="date" value={formData.applicationDeadline} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="Min CGPA Required" name="cgpa" type="number" inputProps={{ min: 0, max: 10, step: 0.1 }} value={formData.cgpa} onChange={handleChange} fullWidth helperText="Leave blank = no filter" />
                <TextField label="Max Backlogs Allowed" name="backlogs" type="number" inputProps={{ min: 0 }} value={formData.backlogs} onChange={handleChange} fullWidth helperText="Leave blank = no filter" />
              </Box>
              <TextField label="Selection Process" name="selectionProcess" value={formData.selectionProcess} onChange={handleChange} fullWidth placeholder="Aptitude Test → Technical → HR" />
              <TextField label="Job Description" name="jobDescription" value={formData.jobDescription} onChange={handleChange} multiline rows={3} fullWidth />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Posting...' : 'Post Drive'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast(t => ({ ...t, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={toast.severity} onClose={() => setToast(t => ({ ...t, open: false }))} sx={{ borderRadius: 2 }}>{toast.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default HodPlacementsHub;
