import React, { useState } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem } from '@mui/material';
import { AddOutlined } from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import { useSubjectsQuery, useCreateSubjectMutation } from '../../../queries/collegeQueries';
import { useAuth } from '../../../contexts/AuthContext';

const HodSubjectsHub = () => {
  const { user } = useAuth();
  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    credits: 3,
    type: 'Core',
    department: user?.department?.id || user?.department
  });

  const { data, isLoading, isError } = useSubjectsQuery({ department: user?.department?.id || user?.department });
  const createMutation = useCreateSubjectMutation();

  const columns = [
    { id: 'code', label: 'Subject Code' },
    { id: 'name', label: 'Subject Name' },
    { id: 'credits', label: 'Credits' },
    { id: 'type', label: 'Type' }
  ];

  const handleOpen = () => setOpenModal(true);
  const handleClose = () => {
    setOpenModal(false);
    setFormData({
      name: '', code: '', credits: 3, type: 'Core',
      department: user?.department?.id || user?.department
    });
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData, {
      onSuccess: () => {
        handleClose();
      }
    });
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Subject Management</Typography>
        <Button variant="contained" startIcon={<AddOutlined />} onClick={handleOpen}>Add Subject</Button>
      </Box>

      <DataTable 
        columns={columns} 
        data={data?.data || []} 
        isLoading={isLoading} 
        isError={isError} 
        emptyMessage="No subjects found in this department."
      />

      {/* Add Subject Modal */}
      <Dialog open={openModal} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Subject</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Subject Name" name="name" value={formData.name} onChange={handleChange} required fullWidth />
              <TextField label="Subject Code" name="code" value={formData.code} onChange={handleChange} required fullWidth />
              <TextField label="Credits" name="credits" type="number" value={formData.credits} onChange={handleChange} required fullWidth InputProps={{ inputProps: { min: 1, max: 6 } }} />
              <TextField select label="Type" name="type" value={formData.type} onChange={handleChange} required fullWidth>
                <MenuItem value="Core">Core</MenuItem>
                <MenuItem value="Elective">Elective</MenuItem>
                <MenuItem value="Lab">Lab</MenuItem>
              </TextField>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isLoading}>
              {createMutation.isLoading ? 'Adding...' : 'Add Subject'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default HodSubjectsHub;
