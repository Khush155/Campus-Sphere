/*
 * CHANGELOG
 * Added Approve/Reject custom actions for leave requests using existing DataTable customActions prop.
 * Added confirmation dialog for rejecting leaves.
 * Added Snackbar notification pattern for success/error handling.
 * Wired to useUpdateLeaveStatusMutation.
 */
import React, { useState } from 'react';
import { 
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, IconButton, Tooltip, Snackbar, Alert 
} from '@mui/material';
import { AddOutlined, CheckCircleOutlined, CancelOutlined } from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import { useLeaveQuery, useCreateLeaveMutation, useUpdateLeaveStatusMutation } from '../../../queries/hodQueries';

const HodLeaveHub = () => {
  const [openModal, setOpenModal] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [formData, setFormData] = useState({});

  // Snackbar State
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState('success');

  const { data, isLoading, isError } = useLeaveQuery();
  const createMutation = useCreateLeaveMutation();
  const updateStatusMutation = useUpdateLeaveStatusMutation();

  const columns = [
    { id: 'reason', label: 'Reason' },
    { 
      id: 'fromDate', 
      label: 'From',
      render: (row) => new Date(row.fromDate).toLocaleDateString()
    },
    { 
      id: 'toDate', 
      label: 'To',
      render: (row) => new Date(row.toDate).toLocaleDateString()
    },
    { id: 'status', label: 'Status' }
  ];

  const showToast = (message, severity = 'success') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  const handleOpen = () => setOpenModal(true);
  const handleClose = () => {
    setOpenModal(false);
    setFormData({});
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData, {
      onSuccess: () => {
        showToast('Leave request added successfully.');
        handleClose();
      },
      onError: (err) => {
        showToast(err.response?.data?.message || 'Failed to add leave', 'error');
      }
    });
  };

  const handleApprove = (row) => {
    updateStatusMutation.mutate(
      { id: row._id, status: 'APPROVED' },
      {
        onSuccess: () => showToast('Leave approved successfully.'),
        onError: (err) => showToast(err.response?.data?.message || 'Failed to approve', 'error')
      }
    );
  };

  const openRejectModal = (row) => {
    setSelectedLeave(row);
    setRejectModalOpen(true);
  };

  const handleRejectConfirm = () => {
    if (selectedLeave) {
      updateStatusMutation.mutate(
        { id: selectedLeave._id, status: 'REJECTED' },
        {
          onSuccess: () => {
            showToast('Leave rejected.');
            setRejectModalOpen(false);
            setSelectedLeave(null);
          },
          onError: (err) => showToast(err.response?.data?.message || 'Failed to reject', 'error')
        }
      );
    }
  };

  const customActions = (row) => {
    if (row.status !== 'PENDING') return null;
    return (
      <>
        <Tooltip title="Approve">
          <IconButton size="small" color="success" onClick={() => handleApprove(row)} disabled={updateStatusMutation.isPending}>
            <CheckCircleOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Reject">
          <IconButton size="small" color="error" onClick={() => openRejectModal(row)} disabled={updateStatusMutation.isPending}>
            <CancelOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      </>
    );
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Leave Management</Typography>
        <Button variant="contained" startIcon={<AddOutlined />} onClick={handleOpen}>Add New</Button>
      </Box>

      <DataTable 
        columns={columns} 
        data={data} 
        isLoading={isLoading} 
        isError={isError} 
        emptyMessage="No leave records found."
        customActions={customActions}
      />

      {/* Add Modal */}
      <Dialog open={openModal} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Leave</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Reason" name="reason" onChange={handleChange} required fullWidth />
              <TextField label="Status" name="status" onChange={handleChange} required fullWidth />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Adding...' : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Reject Confirmation Modal */}
      <Dialog open={rejectModalOpen} onClose={() => setRejectModalOpen(false)}>
        <DialogTitle>Reject Leave Request</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to reject this leave request?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectModalOpen(false)}>Cancel</Button>
          <Button onClick={handleRejectConfirm} color="error" variant="contained" disabled={updateStatusMutation.isPending}>
            {updateStatusMutation.isPending ? 'Rejecting...' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notification */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={4000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setToastOpen(false)} severity={toastSeverity} sx={{ width: '100%', borderRadius: 2 }}>
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default HodLeaveHub;
