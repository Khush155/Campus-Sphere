/* eslint-disable */
import React, { useState } from 'react';
import { 
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, MenuItem, Chip, Snackbar, Alert,
  Grid, Card, CardContent, useTheme
} from '@mui/material';
import { AddOutlined, EventOutlined } from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import EmptyState from '../../../components/common/EmptyState';
import { useLeaveQuery, useCreateLeaveMutation } from '../../../queries/hodQueries';

const LEAVE_TYPES = [
  { value: 'SICK', label: 'Sick Leave' },
  { value: 'CASUAL', label: 'Casual Leave' },
  { value: 'ACADEMIC', label: 'Academic Leave' },
  { value: 'EMERGENCY', label: 'Emergency Leave' },
  { value: 'MEDICAL', label: 'Medical Exemption Leave' },
];

const FacultyLeaveHub = () => {
  const theme = useTheme();

  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: 'CASUAL',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
  });

  // Snackbar Toast
  const [toast, setToast] = useState({ open: false, msg: '', severity: 'success' });
  const showToast = (msg, severity = 'success') => setToast({ open: true, msg, severity });

  // Queries & Mutations
  const { data: leaves = [], isLoading, isError } = useLeaveQuery();
  const createMutation = useCreateLeaveMutation();

  const handleOpen = () => setOpenModal(true);
  const handleClose = () => {
    setOpenModal(false);
    setFormData({
      leaveType: 'CASUAL',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      reason: '',
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.reason || formData.reason.trim().length < 5) {
      showToast('Please provide a reason of at least 5 characters.', 'error');
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      showToast('Start Date cannot be after End Date.', 'error');
      return;
    }

    createMutation.mutate(formData, {
      onSuccess: () => {
        showToast('Leave application submitted to HOD successfully.');
        handleClose();
      },
      onError: (err) => {
        showToast(err.response?.data?.message || 'Failed to submit leave application', 'error');
      }
    });
  };

  const columns = [
    { 
      id: 'leaveType', 
      label: 'Leave Type',
      render: (row) => (
        <Chip 
          label={row.leaveType || 'CASUAL'} 
          size="small" 
          color={row.leaveType === 'MEDICAL' || row.leaveType === 'SICK' ? 'info' : 'secondary'} 
          variant="outlined" 
          sx={{ fontWeight: 600 }}
        />
      )
    },
    { 
      id: 'startDate', 
      label: 'Start Date',
      render: (row) => row.startDate ? new Date(row.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
    },
    { 
      id: 'endDate', 
      label: 'End Date',
      render: (row) => row.endDate ? new Date(row.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
    },
    { 
      id: 'totalDays', 
      label: 'Duration',
      render: (row) => <Chip label={`${row.totalDays || 1} day(s)`} size="small" variant="outlined" />
    },
    { id: 'reason', label: 'Reason', render: (row) => row.reason || '—' },
    { 
      id: 'status', 
      label: 'HOD Status',
      render: (row) => {
        const statusColors = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'error' };
        return (
          <Chip 
            label={row.status || 'PENDING'} 
            size="small" 
            color={statusColors[row.status] || 'default'} 
            sx={{ fontWeight: 700 }}
          />
        );
      }
    },
    { id: 'remarks', label: 'HOD Remarks', render: (row) => row.remarks || '—' },
  ];

  return (
    <Box sx={{ p: { xs: 1, sm: 3 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" sx={{ color: theme.palette.ink?.[900] || 'text.primary' }}>
            My Leave Applications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Apply for leave and track your application status with your Head of Department.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddOutlined />} onClick={handleOpen} sx={{ borderRadius: '8px' }}>
          Apply for Leave
        </Button>
      </Box>

      {/* Leave Table */}
      {leaves.length === 0 && !isLoading ? (
        <EmptyState
          type="leave"
          title="No Leave Applications Submitted"
          description="You have not submitted any leave applications yet. Click 'Apply for Leave' to submit your request."
        />
      ) : (
        <DataTable 
          columns={columns} 
          data={leaves} 
          isLoading={isLoading} 
          isError={isError} 
          emptyMessage="No leave records found."
        />
      )}

      {/* Apply Leave Modal */}
      <Dialog open={openModal} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Submit Leave Application</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                select
                label="Leave Type"
                name="leaveType"
                value={formData.leaveType}
                onChange={handleChange}
                required
                fullWidth
              >
                {LEAVE_TYPES.map(lt => (
                  <MenuItem key={lt.value} value={lt.value}>{lt.label}</MenuItem>
                ))}
              </TextField>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    type="date"
                    label="Start Date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    type="date"
                    label="End Date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>

              <TextField
                label="Reason for Leave"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                required
                multiline
                rows={3}
                fullWidth
                placeholder="Explain the reason for your leave request (min 5 chars)..."
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending} sx={{ borderRadius: 2 }}>
              {createMutation.isPending ? 'Submitting...' : 'Submit Application'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Toast Notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast(t => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setToast(t => ({ ...t, open: false }))} severity={toast.severity} sx={{ width: '100%', borderRadius: 2 }}>
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FacultyLeaveHub;
