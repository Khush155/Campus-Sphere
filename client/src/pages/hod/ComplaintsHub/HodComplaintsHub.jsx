/*
 * CHANGELOG
 * Added "Resolve" custom action for complaints using existing DataTable customActions prop.
 * Added resolution dialog to input resolution notes before resolving.
 * Added Snackbar notification pattern for success/error handling.
 * Wired to useUpdateComplaintStatusMutation.
 */
import React, { useState } from 'react';
import { 
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, IconButton, Tooltip, Snackbar, Alert 
} from '@mui/material';
import { AddOutlined, CheckCircleOutlined } from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import { useComplaintsQuery, useCreateComplaintsMutation, useUpdateComplaintStatusMutation } from '../../../queries/hodQueries';

const HodComplaintsHub = () => {
  const [openModal, setOpenModal] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [formData, setFormData] = useState({});

  // Snackbar State
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState('success');

  const { data, isLoading, isError } = useComplaintsQuery();
  const createMutation = useCreateComplaintsMutation();
  const updateStatusMutation = useUpdateComplaintStatusMutation();

  const columns = [
    { id: 'subject', label: 'Subject' },
    { id: 'body', label: 'Body' },
    { id: 'status', label: 'Status' },
    { 
      id: 'createdAt', 
      label: 'Date',
      render: (row) => new Date(row.createdAt).toLocaleDateString()
    }
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
        showToast('Complaint added successfully.');
        handleClose();
      },
      onError: (err) => {
        showToast(err.response?.data?.message || 'Failed to add complaint', 'error');
      }
    });
  };

  const openResolveModal = (row) => {
    setSelectedComplaint(row);
    setResolutionNotes('');
    setResolveModalOpen(true);
  };

  const handleResolveConfirm = () => {
    if (selectedComplaint) {
      updateStatusMutation.mutate(
        { id: selectedComplaint._id, status: 'RESOLVED', resolutionNotes },
        {
          onSuccess: () => {
            showToast('Complaint resolved successfully.');
            setResolveModalOpen(false);
            setSelectedComplaint(null);
          },
          onError: (err) => showToast(err.response?.data?.message || 'Failed to resolve', 'error')
        }
      );
    }
  };

  const customActions = (row) => {
    if (row.status === 'RESOLVED') return null;
    return (
      <Tooltip title="Mark as Resolved">
        <IconButton size="small" color="success" onClick={() => openResolveModal(row)} disabled={updateStatusMutation.isPending}>
          <CheckCircleOutlined fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Complaints Management</Typography>
        <Button variant="contained" startIcon={<AddOutlined />} onClick={handleOpen}>Add New</Button>
      </Box>

      <DataTable 
        columns={columns} 
        data={data} 
        isLoading={isLoading} 
        isError={isError} 
        emptyMessage="No complaints found."
        customActions={customActions}
      />

      {/* Add Modal */}
      <Dialog open={openModal} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Complaint</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Subject" name="subject" onChange={handleChange} required fullWidth />
              <TextField label="Body" name="body" onChange={handleChange} required fullWidth multiline rows={4} />
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

      {/* Resolve Confirmation Modal */}
      <Dialog open={resolveModalOpen} onClose={() => setResolveModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Resolve Complaint</DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ mb: 2 }}>Are you sure you want to mark this complaint as resolved? You can optionally add a resolution note below.</Typography>
          <TextField 
            label="Resolution Notes (Optional)" 
            fullWidth 
            multiline 
            rows={3} 
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveModalOpen(false)}>Cancel</Button>
          <Button onClick={handleResolveConfirm} color="success" variant="contained" disabled={updateStatusMutation.isPending}>
            {updateStatusMutation.isPending ? 'Resolving...' : 'Resolve'}
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

export default HodComplaintsHub;
