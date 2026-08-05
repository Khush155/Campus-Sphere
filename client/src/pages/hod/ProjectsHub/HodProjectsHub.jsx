import React, { useState } from 'react';
import { 
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, MenuItem, Chip, Alert, Snackbar, Paper
} from '@mui/material';
import { AddOutlined } from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import { useProjectsQuery, useCreateProjectsMutation, useUpdateProjectStatusMutation } from '../../../queries/hodQueries';
import { useUsersQuery } from '../../../queries/userQueries';
import { useAuth } from '../../../contexts/AuthContext';

const PROJECT_STATUSES = ['PROPOSED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'];

const HodProjectsHub = () => {
  const { user } = useAuth();
  const deptId = user?.departmentId?._id || user?.departmentId || user?.department?.id || user?.department;

  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', guideId: '', academicYear: '2026-2027', status: 'PROPOSED'
  });
  const [toast, setToast] = useState({ open: false, msg: '', severity: 'success' });

  const { data: projects = [], isLoading, isError } = useProjectsQuery();
  const { data: facultyResponse } = useUsersQuery({ role: 'FACULTY', limit: 500 });
  const facultyList = facultyResponse?.data || [];

  const createMutation = useCreateProjectsMutation();
  const updateStatusMutation = useUpdateProjectStatusMutation();

  const showToast = (msg, severity = 'success') => setToast({ open: true, msg, severity });

  const handleStatusChange = (projectId, newStatus) => {
    updateStatusMutation.mutate({ id: projectId, status: newStatus }, {
      onSuccess: () => showToast('Status updated successfully'),
      onError: (err) => showToast(err.response?.data?.message || 'Update failed', 'error')
    });
  };

  const columns = [
    { 
      id: 'title', 
      label: 'Project Details', 
      render: (r) => (
        <Box>
          <Typography fontWeight={700}>{r.title}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {r.description}
          </Typography>
        </Box>
      )
    },
    { id: 'academicYear', label: 'Academic Year', render: (r) => <Typography variant="body2">{r.academicYear}</Typography> },
    { 
      id: 'guideId', 
      label: 'Guide (Faculty)', 
      render: (r) => r.guideId ? `${r.guideId.name}` : <Typography variant="caption" color="text.disabled">—</Typography> 
    },
    { 
      id: 'status', 
      label: 'Status', 
      render: (r) => {
        const colors = { PROPOSED: 'default', APPROVED: 'primary', IN_PROGRESS: 'info', COMPLETED: 'success', REJECTED: 'error' };
        return (
          <TextField
            select
            size="small"
            value={r.status}
            onChange={(e) => handleStatusChange(r._id, e.target.value)}
            sx={{ minWidth: 130, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'transparent' } } }}
            SelectProps={{
              renderValue: (v) => <Chip label={v} size="small" color={colors[v] || 'default'} />
            }}
          >
            {PROJECT_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
        );
      } 
    }
  ];

  const handleOpen = () => setOpenModal(true);
  const handleClose = () => {
    setOpenModal(false);
    setFormData({ title: '', description: '', guideId: '', academicYear: '2026-2027', status: 'PROPOSED' });
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      departmentId: deptId
    };
    createMutation.mutate(payload, {
      onSuccess: () => {
        handleClose();
        showToast('Project created successfully');
      },
      onError: (err) => {
        showToast(err.response?.data?.message || 'Failed to create project', 'error');
      }
    });
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Projects Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage academic projects, assign faculty guides, and track progress.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddOutlined />} onClick={handleOpen}>
          Add Project
        </Button>
      </Box>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <DataTable 
          columns={columns} 
          data={projects} 
          isLoading={isLoading} 
          isError={isError} 
          emptyMessage="No projects found in this department."
        />
      </Paper>

      {/* Add Modal */}
      <Dialog open={openModal} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Project</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField label="Project Title" name="title" value={formData.title} onChange={handleChange} required fullWidth />
              
              <TextField 
                label="Description" name="description" value={formData.description} 
                onChange={handleChange} required fullWidth multiline rows={3} 
                helperText="Brief summary of the project goals."
              />
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField select label="Guide (Faculty)" name="guideId" value={formData.guideId || ''} onChange={handleChange} required fullWidth>
                  <MenuItem value="" disabled>Select Guide</MenuItem>
                  {facultyList.map(f => (
                    <MenuItem key={f.id} value={f.id}>{f.name} ({f.email})</MenuItem>
                  ))}
                </TextField>

                <TextField label="Academic Year" name="academicYear" value={formData.academicYear} onChange={handleChange} required fullWidth placeholder="e.g. 2026-2027" />
              </Box>

              <TextField select label="Initial Status" name="status" value={formData.status} onChange={handleChange} required fullWidth>
                {PROJECT_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving...' : 'Save Project'}
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

export default HodProjectsHub;
