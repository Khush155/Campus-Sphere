import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Save as SaveIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';

const RolesMatrix = () => {
  const [snackbar, setSnackbar] = useState(false);

  const handleSave = () => {
    setSnackbar(true);
  };
  const roles = [
    { name: 'Admin', description: 'Full system access' },
    { name: 'College Admin', description: 'Institution-wide operations' },
    { name: 'HOD', description: 'Department-level management' },
    { name: 'Faculty', description: 'Academic and student management' },
    { name: 'Student', description: 'Read-only self access' },
  ];

  const permissions = [
    'View Dashboards',
    'Manage Users',
    'Manage Departments',
    'Manage Academics',
    'Manage Finances',
    'Publish Announcements',
    'Approve Requests',
    'System Settings',
  ];

  // Dummy matrix data
  const matrix = {
    'Admin': { 'View Dashboards': true, 'Manage Users': true, 'Manage Departments': true, 'Manage Academics': true, 'Manage Finances': true, 'Publish Announcements': true, 'Approve Requests': true, 'System Settings': true },
    'College Admin': { 'View Dashboards': true, 'Manage Users': true, 'Manage Departments': true, 'Manage Academics': true, 'Manage Finances': true, 'Publish Announcements': true, 'Approve Requests': true, 'System Settings': false },
    'HOD': { 'View Dashboards': true, 'Manage Users': false, 'Manage Departments': false, 'Manage Academics': true, 'Manage Finances': false, 'Publish Announcements': true, 'Approve Requests': true, 'System Settings': false },
    'Faculty': { 'View Dashboards': true, 'Manage Users': false, 'Manage Departments': false, 'Manage Academics': false, 'Manage Finances': false, 'Publish Announcements': false, 'Approve Requests': false, 'System Settings': false },
    'Student': { 'View Dashboards': true, 'Manage Users': false, 'Manage Departments': false, 'Manage Academics': false, 'Manage Finances': false, 'Publish Announcements': false, 'Approve Requests': false, 'System Settings': false },
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 4, display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityIcon fontSize="large" color="primary" />
            Roles & Permissions
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure access control matrix for all system roles.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<SaveIcon />} sx={{ borderRadius: 2 }} onClick={handleSave}>
          Save Changes
        </Button>
      </Box>

      <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        <TableContainer component={Paper} elevation={0}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: 'background.default' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Permission Module</TableCell>
                {roles.map(role => (
                  <TableCell key={role.name} align="center" sx={{ fontWeight: 700 }}>
                    {role.name}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {permissions.map((perm) => (
                <TableRow key={perm} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 600 }}>
                    {perm}
                  </TableCell>
                  {roles.map(role => (
                    <TableCell key={`${role.name}-${perm}`} align="center">
                      <Checkbox 
                        checked={matrix[role.name]?.[perm] || false}
                        disabled={role.name === 'Admin'} // Admin cannot be edited
                        color="primary"
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
      
      <Snackbar open={snackbar} autoHideDuration={3000} onClose={() => setSnackbar(false)}>
        <Alert onClose={() => setSnackbar(false)} severity="success" sx={{ width: '100%' }}>
          Roles and permissions saved successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RolesMatrix;
