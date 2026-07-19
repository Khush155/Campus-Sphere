/* eslint-disable */
import React, { useState } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem } from '@mui/material';
import { AddOutlined } from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import { useUsersQuery, useRegisterMutation } from '../../../queries/userQueries';
import { useAuth } from '../../../contexts/AuthContext';

const HodFacultyHub = () => {
  const { user } = useAuth();
  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'FACULTY',
    department: user?.department?.id || user?.department
  });

  const { data, isLoading, isError } = useUsersQuery({ role: 'FACULTY', department: user?.department?.id || user?.department });
  const registerMutation = useRegisterMutation();

  const columns = [
    { id: 'firstName', label: 'First Name' },
    { id: 'lastName', label: 'Last Name' },
    { id: 'email', label: 'Email' },
    { id: 'status', label: 'Status' }
  ];

  const handleOpen = () => setOpenModal(true);
  const handleClose = () => {
    setOpenModal(false);
    setFormData({
      firstName: '', lastName: '', email: '', password: '', 
      role: 'FACULTY', department: user?.department?.id || user?.department
    });
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    registerMutation.mutate(formData, {
      onSuccess: () => {
        handleClose();
      }
    });
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Faculty Management</Typography>
        <Button variant="contained" startIcon={<AddOutlined />} onClick={handleOpen}>Add Faculty</Button>
      </Box>

      <DataTable 
        columns={columns} 
        data={data?.data || []} 
        isLoading={isLoading} 
        isError={isError} 
        emptyMessage="No faculty members found in this department."
      />

      {/* Add Faculty Modal */}
      <Dialog open={openModal} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Faculty</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required fullWidth />
              <TextField label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required fullWidth />
              <TextField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required fullWidth />
              <TextField label="Temporary Password" name="password" type="password" value={formData.password} onChange={handleChange} required fullWidth />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={registerMutation.isLoading}>
              {registerMutation.isLoading ? 'Adding...' : 'Add Faculty'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default HodFacultyHub;
