/* eslint-disable */
import React, { useState } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem } from '@mui/material';
import { AddOutlined } from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import { useUsersQuery, useRegisterMutation } from '../../../queries/userQueries';
import { useAuth } from '../../../contexts/AuthContext';

const HodStudentsHub = () => {
  const { user } = useAuth();
  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'STUDENT',
    department: user?.department?.id || user?.department,
    batch: '',
    semester: 1
  });

  const { data, isLoading, isError } = useUsersQuery({ role: 'STUDENT', department: user?.department?.id || user?.department });
  const registerMutation = useRegisterMutation();

  const columns = [
    { id: 'firstName', label: 'First Name' },
    { id: 'lastName', label: 'Last Name' },
    { id: 'email', label: 'Email' },
    { id: 'batch', label: 'Batch', render: (row) => row.studentInfo?.batch || 'N/A' },
    { id: 'semester', label: 'Semester', render: (row) => row.studentInfo?.semester || 'N/A' },
    { id: 'status', label: 'Status' }
  ];

  const handleOpen = () => setOpenModal(true);
  const handleClose = () => {
    setOpenModal(false);
    setFormData({
      firstName: '', lastName: '', email: '', password: '', 
      role: 'STUDENT', department: user?.department?.id || user?.department,
      batch: '', semester: 1
    });
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      studentInfo: { batch: formData.batch, semester: Number(formData.semester) }
    };
    registerMutation.mutate(payload, {
      onSuccess: () => {
        handleClose();
      }
    });
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Student Management</Typography>
        <Button variant="contained" startIcon={<AddOutlined />} onClick={handleOpen}>Add Student</Button>
      </Box>

      <DataTable 
        columns={columns} 
        data={data?.data || []} 
        isLoading={isLoading} 
        isError={isError} 
        emptyMessage="No students found in this department."
      />

      {/* Add Student Modal */}
      <Dialog open={openModal} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Student</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required fullWidth />
              <TextField label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required fullWidth />
              <TextField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required fullWidth />
              <TextField label="Temporary Password" name="password" type="password" value={formData.password} onChange={handleChange} required fullWidth />
              <TextField label="Batch (e.g. 2022-2026)" name="batch" value={formData.batch} onChange={handleChange} required fullWidth />
              <TextField label="Semester" name="semester" type="number" value={formData.semester} onChange={handleChange} required fullWidth InputProps={{ inputProps: { min: 1, max: 8 } }} />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={registerMutation.isLoading}>
              {registerMutation.isLoading ? 'Adding...' : 'Add Student'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default HodStudentsHub;
