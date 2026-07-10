import React, { useState } from 'react';
import { Box, Button, Typography, useTheme } from '@mui/material';
import { AddOutlined } from '@mui/icons-material';
import AssignmentFilters from './AssignmentFilters';
import AssignmentTable from './AssignmentTable';
import AssignFacultyDrawer from './AssignFacultyDrawer';
import RevokeAssignmentModal from './RevokeAssignmentModal';
import { useAssignmentsQuery, useCreateAssignmentMutation, useRevokeAssignmentMutation } from '../../../queries/assignmentQueries';

const AssignmentHub = () => {
  const theme = useTheme();
  
  const [filters, setFilters] = useState({ page: 1, limit: 10, status: '', branchId: '', semester: '' });
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [assignmentToRevoke, setAssignmentToRevoke] = useState(null);

  const { data: assignmentsRes, isLoading } = useAssignmentsQuery(filters);
  const assignments = assignmentsRes?.data || [];
  const meta = assignmentsRes?.meta;

  const createMutation = useCreateAssignmentMutation();
  const revokeMutation = useRevokeAssignmentMutation();

  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
  };

  const handleCreateAssignment = async (data) => {
    try {
      await createMutation.mutateAsync(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenRevoke = (assignment) => {
    setAssignmentToRevoke(assignment);
    setRevokeModalOpen(true);
  };

  const handleRevokeConfirm = async (assignmentId) => {
    try {
      await revokeMutation.mutateAsync({ assignmentId, revokedReason: 'Revoked manually from the dashboard.' });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: theme.palette.ink?.[900] || 'text.primary' }}>
            Faculty Assignment
          </Typography>
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

      <AssignmentFilters filters={filters} onFilterChange={handleFilterChange} />
      
      <AssignmentTable
        assignments={assignments}
        meta={meta}
        onPageChange={handlePageChange}
        onRevokeClick={handleOpenRevoke}
      />

      <AssignFacultyDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleCreateAssignment}
        isSubmitting={createMutation.isLoading || createMutation.isPending}
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
    </Box>
  );
};

export default AssignmentHub;
