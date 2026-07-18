/*
 * CHANGELOG
 * Added Approve/Reject custom actions for document requests using existing DataTable customActions prop.
 * Added Snackbar notification pattern for success/error handling.
 * Wired to useUpdateDocumentStatusMutation.
 */
import React, { useState } from 'react';
import { 
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, IconButton, Tooltip, Snackbar, Alert 
} from '@mui/material';
import { AddOutlined, CheckCircleOutlined, CancelOutlined } from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import { useDocumentsQuery, useCreateDocumentsMutation, useUpdateDocumentStatusMutation } from '../../../queries/hodQueries';

const HodDocumentsHub = () => {
  const [openModal, setOpenModal] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [formData, setFormData] = useState({});

  // Snackbar State
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState('success');

  const { data, isLoading, isError } = useDocumentsQuery();
  const createMutation = useCreateDocumentsMutation();
  const updateStatusMutation = useUpdateDocumentStatusMutation();

  const columns = [
    { id: 'title', label: 'Title' },
    { id: 'type', label: 'Type' },
    { id: 'status', label: 'Status' },
    { 
      id: 'createdAt', 
      label: 'Requested On',
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
        showToast('Document request added successfully.');
        handleClose();
      },
      onError: (err) => {
        showToast(err.response?.data?.message || 'Failed to add document request', 'error');
      }
    });
  };

  const handleApprove = (row) => {
    updateStatusMutation.mutate(
      { id: row._id, status: 'APPROVED' },
      {
        onSuccess: () => showToast('Document request approved successfully.'),
        onError: (err) => showToast(err.response?.data?.message || 'Failed to approve', 'error')
      }
    );
  };

  const openRejectModal = (row) => {
    setSelectedDoc(row);
    setRejectModalOpen(true);
  };

  const handleRejectConfirm = () => {
    if (selectedDoc) {
      updateStatusMutation.mutate(
        { id: selectedDoc._id, status: 'REJECTED' },
        {
          onSuccess: () => {
            showToast('Document request rejected.');
            setRejectModalOpen(false);
            setSelectedDoc(null);
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
        <Typography variant="h4" fontWeight="bold">Documents Management</Typography>
        <Button variant="contained" startIcon={<AddOutlined />} onClick={handleOpen}>Add New</Button>
      </Box>

      <DataTable 
        columns={columns} 
        data={data} 
        isLoading={isLoading} 
        isError={isError} 
        emptyMessage="No document requests found."
        customActions={customActions}
      />

      {/* Add Modal */}
      <Dialog open={openModal} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Request New Document</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Title" name="title" onChange={handleChange} required fullWidth />
              <TextField label="Type" name="type" onChange={handleChange} required fullWidth />
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
        <DialogTitle>Reject Document Request</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to reject this document request?</Typography>
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

export default HodDocumentsHub;
