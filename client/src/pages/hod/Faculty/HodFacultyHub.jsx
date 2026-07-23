import React, { useState, useMemo } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Chip } from '@mui/material';
import { AddOutlined } from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import { useUsersQuery, useRegisterMutation, useUpdateUserMutation } from '../../../queries/userQueries';
import { useAuth } from '../../../contexts/AuthContext';

const HodFacultyHub = () => {
  const { user } = useAuth();
  const deptId = user?.departmentId?._id || user?.departmentId || user?.department?.id || user?.department;
  
  // Create / Add Modal States
  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'FACULTY',
    departmentId: deptId
  });

  // Edit Modal States
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    status: 'ACTIVE'
  });

  const { data, isLoading, isError } = useUsersQuery({ 
    role: 'FACULTY', 
    department: deptId 
  });
  
  const registerMutation = useRegisterMutation();
  const updateMutation = useUpdateUserMutation();

  // Helper to split fullName into firstName and lastName, handling titles/salutations gracefully
  const splitName = (fullName = '') => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length <= 1) {
      return { firstName: parts[0] || '', lastName: '' };
    }
    
    const salutations = ['dr.', 'dr', 'prof.', 'prof', 'mr.', 'mr', 'mrs.', 'mrs', 'ms.', 'ms', 'er.', 'er'];
    const hasSalutation = salutations.includes(parts[0].toLowerCase());
    
    if (hasSalutation && parts.length > 2) {
      const firstName = `${parts[0]} ${parts[1]}`;
      const lastName = parts.slice(2).join(' ');
      return { firstName, lastName };
    }
    
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';
    return { firstName, lastName };
  };

  // Dynamically map API response data to include firstName and lastName properties for columns
  const formattedData = useMemo(() => {
    if (!data?.data) return [];
    return data.data.map(u => {
      const { firstName, lastName } = splitName(u.name);
      return {
        ...u,
        firstName,
        lastName
      };
    });
  }, [data]);

  const columns = [
    { id: 'firstName', label: 'First Name' },
    { id: 'lastName', label: 'Last Name' },
    { id: 'email', label: 'Email' },
    { 
      id: 'status', 
      label: 'Status',
      render: (row) => (
        <Chip
          label={row.status}
          size="small"
          color={row.status === 'ACTIVE' ? 'success' : 'error'}
          sx={{ fontWeight: 'bold', fontSize: '0.7rem', borderRadius: '6px' }}
        />
      )
    }
  ];

  const handleOpen = () => setOpenModal(true);
  const handleClose = () => {
    setOpenModal(false);
    setFormData({
      firstName: '', lastName: '', email: '', password: '', 
      role: 'FACULTY', departmentId: user?.department?.id || user?.department
    });
  };

  const handleOpenEdit = (faculty) => {
    const { firstName, lastName } = splitName(faculty.name);
    setEditFormData({
      id: faculty.id || faculty._id,
      firstName,
      lastName,
      email: faculty.email,
      status: faculty.status || 'ACTIVE'
    });
    setOpenEditModal(true);
  };

  const handleCloseEdit = () => {
    setOpenEditModal(false);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleEditChange = (e) => setEditFormData({ ...editFormData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      email: formData.email,
      password: formData.password,
      role: 'FACULTY',
      departmentId: user?.department?.id || user?.department
    };
    registerMutation.mutate(payload, {
      onSuccess: () => {
        handleClose();
      }
    });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: `${editFormData.firstName} ${editFormData.lastName}`.trim(),
      status: editFormData.status
    };
    updateMutation.mutate({ id: editFormData.id, data: payload }, {
      onSuccess: () => {
        handleCloseEdit();
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
        data={formattedData} 
        isLoading={isLoading} 
        isError={isError} 
        onEdit={handleOpenEdit}
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

      {/* Edit Faculty Modal */}
      <Dialog open={openEditModal} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Faculty Details</DialogTitle>
        <form onSubmit={handleEditSubmit}>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="First Name" name="firstName" value={editFormData.firstName} onChange={handleEditChange} required fullWidth />
              <TextField label="Last Name" name="lastName" value={editFormData.lastName} onChange={handleEditChange} required fullWidth />
              <TextField label="Email" name="email" type="email" value={editFormData.email} disabled fullWidth helperText="Email address cannot be changed." />
              <TextField label="Status" name="status" select value={editFormData.status} onChange={handleEditChange} required fullWidth>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="INACTIVE">Inactive</MenuItem>
              </TextField>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEdit}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={updateMutation.isLoading}>
              {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default HodFacultyHub;
