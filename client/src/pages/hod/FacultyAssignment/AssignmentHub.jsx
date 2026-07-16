/*
 * CHANGELOG
 * Refactored to use standard DataTable component instead of custom AssignmentTable.
 * Implemented Toast/Snackbar notifications for create and revoke actions.
 * Wired revoke action to DataTable customActions.
 */
import React, { useState } from 'react';
import { Box, Button, Typography, useTheme, Tooltip, IconButton, Snackbar, Alert } from '@mui/material';
import { AddOutlined, CancelOutlined } from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import AssignFacultyDrawer from './AssignFacultyDrawer';
import RevokeAssignmentModal from './RevokeAssignmentModal';
import { useAssignmentsQuery, useCreateAssignmentMutation, useRevokeAssignmentMutation } from '../../../queries/assignmentQueries';

const AssignmentHub = () => {
  const theme = useTheme();
  
  const [filters, setFilters] = useState({ page: 1, limit: 10, status: '', branchId: '', semester: '' });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [assignmentToRevoke, setAssignmentToRevoke] = useState(null);

  // Snackbar State
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState('success');

  const { data: assignmentsRes, isLoading, isError } = useAssignmentsQuery(filters);
  const assignments = assignmentsRes?.data || [];
  const meta = assignmentsRes?.meta; // DataTable does not support backend pagination out of the box in this project pattern without modifying DataTable, but we pass what we can.

  const createMutation = useCreateAssignmentMutation();
  const revokeMutation = useRevokeAssignmentMutation();

  const showToast = (message, severity = 'success') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  const handleCreateAssignment = async (data) => {
    try {
      await createMutation.mutateAsync(data);
      showToast('Faculty assigned successfully.');
      setDrawerOpen(false);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to assign faculty', 'error');
    }
  };

  const handleOpenRevoke = (assignment) => {
    setAssignmentToRevoke(assignment);
    setRevokeModalOpen(true);
  };

  const handleRevokeConfirm = async (assignmentId) => {
    try {
      await revokeMutation.mutateAsync({ assignmentId, revokedReason: 'Revoked manually from the dashboard.' });
      showToast('Assignment revoked successfully.');
      setRevokeModalOpen(false);
      setAssignmentToRevoke(null);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to revoke assignment', 'error');
    }
  };

  const columns = [
    { 
      id: 'subject', 
      label: 'Subject',
      render: (row) => row.subjectId?.name || 'N/A'
    },
    { 
      id: 'faculty', 
      label: 'Faculty',
      render: (row) => row.facultyId?.name || 'N/A'
    },
    { 
      id: 'targetGroup', 
      label: 'Target Group',
      render: (row) => row.group || 'All'
    },
    { id: 'status', label: 'Status' }
  ];

  const customActions = (row) => {
    if (row.status !== 'ACTIVE') return null;
    return (
      <Tooltip title="Revoke">
        <IconButton size="small" color="error" onClick={() => handleOpenRevoke(row)} disabled={revokeMutation.isPending}>
          <CancelOutlined fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Faculty Assignment</Typography>
          <Typography variant="body2" color="text.secondary">
            Assign your department's faculty to subjects.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddOutlined />}
          onClick={() => setDrawerOpen(true)}
          sx={{ fontWeight: 700 }}
        >
          Assign Faculty
        </Button>
      </Box>

      <DataTable 
        columns={columns} 
        data={assignments} 
        isLoading={isLoading} 
        isError={isError} 
        emptyMessage="No faculty assignments found."
        customActions={customActions}
      />

      <AssignFacultyDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleCreateAssignment}
        isSubmitting={createMutation.isPending}
      />

      {assignmentToRevoke && (
        <RevokeAssignmentModal
          open={revokeModalOpen}
          onClose={() => {
            setRevokeModalOpen(false);
            setAssignmentToRevoke(null);
          }}
          onConfirm={handleRevokeConfirm}
          assignment={assignmentToRevoke}
        />
      )}

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

export default AssignmentHub;
