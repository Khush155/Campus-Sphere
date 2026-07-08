import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  Divider,
} from '@mui/material';
import {
  HowToReg as AdmissionIcon,
  CheckCircle as ApprovedIcon,
  PendingActions as PendingIcon,
  Cancel as RejectedIcon,
  Description as ApplicationIcon,
} from '@mui/icons-material';

const AdmissionsHub = () => {
  const admissionStats = [
    { title: 'Applications', value: 5000, icon: <ApplicationIcon sx={{ fontSize: 40 }} />, color: '#4f46e5' },
    { title: 'Approved', value: 3200, icon: <ApprovedIcon sx={{ fontSize: 40 }} />, color: '#10b981' },
    { title: 'Pending', value: 1400, icon: <PendingIcon sx={{ fontSize: 40 }} />, color: '#f59e0b' },
    { title: 'Rejected', value: 400, icon: <RejectedIcon sx={{ fontSize: 40 }} />, color: '#ef4444' },
  ];

  const recentApplications = [
    { id: 'APP-101', name: 'Rahul Verma', course: 'B.Tech CSE', status: 'Approved', date: '08 July 2026' },
    { id: 'APP-102', name: 'Amit Singh', course: 'B.Tech ECE', status: 'Pending', date: '09 July 2026' },
    { id: 'APP-103', name: 'Sneha Patel', course: 'MBA Finance', status: 'Approved', date: '09 July 2026' },
    { id: 'APP-104', name: 'Vikram Das', course: 'B.Tech ME', status: 'Rejected', date: '10 July 2026' },
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'Approved': return 'success';
      case 'Pending': return 'warning';
      case 'Rejected': return 'error';
      default: return 'default';
    }
  };

  const exportAdmissionsData = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "App ID,Applicant Name,Course,Status,Date\n"
      + recentApplications.map(a => `${a.id},${a.name},${a.course},${a.status},${a.date}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "admissions_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 4, display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
            <AdmissionIcon fontSize="large" color="primary" />
            Admissions Center
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor application funnels and admission statuses.
          </Typography>
        </Box>
        <Button variant="contained" sx={{ borderRadius: 2 }} onClick={exportAdmissionsData}>
          Export Data
        </Button>
      </Box>

      {/* Layer 1: Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {admissionStats.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <Card sx={{ height: '100%', borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 3 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                    {stat.title}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
                    {stat.value}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    bgcolor: `${stat.color}15`,
                    color: stat.color,
                    p: 1.5,
                    borderRadius: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {stat.icon}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Layer 2: Funnel Visualization */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Admission Funnel</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: '100%', bgcolor: 'primary.light', p: 2, borderRadius: 2, textAlign: 'center', color: 'primary.main', fontWeight: 700 }}>
                  1. Application (5000)
                </Box>
                <Divider orientation="vertical" flexItem sx={{ height: 20, mx: 'auto', borderWidth: 2 }} />
                <Box sx={{ width: '85%', bgcolor: 'info.light', p: 2, borderRadius: 2, textAlign: 'center', color: 'info.main', fontWeight: 700 }}>
                  2. Verification (4600)
                </Box>
                <Divider orientation="vertical" flexItem sx={{ height: 20, mx: 'auto', borderWidth: 2 }} />
                <Box sx={{ width: '70%', bgcolor: 'warning.light', p: 2, borderRadius: 2, textAlign: 'center', color: 'warning.main', fontWeight: 700 }}>
                  3. Admission (3200)
                </Box>
                <Divider orientation="vertical" flexItem sx={{ height: 20, mx: 'auto', borderWidth: 2 }} />
                <Box sx={{ width: '55%', bgcolor: 'success.light', p: 2, borderRadius: 2, textAlign: 'center', color: 'success.main', fontWeight: 700 }}>
                  4. Enrollment (2800)
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Layer 3: Recent Applications Table */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', height: '100%' }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Recent Applications</Typography>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: 'background.default' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>App ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Applicant Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Course</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentApplications.map((row) => (
                      <TableRow key={row.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>{row.id}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                        <TableCell>{row.course}</TableCell>
                        <TableCell>{row.date}</TableCell>
                        <TableCell align="center">
                          <Chip label={row.status} size="small" color={getStatusColor(row.status)} sx={{ fontWeight: 600 }} />
                        </TableCell>
                        <TableCell align="center">
                          <Button size="small" variant="outlined" sx={{ borderRadius: 2 }}>Review</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdmissionsHub;
