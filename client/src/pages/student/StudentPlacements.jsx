import React, { useState } from 'react';
import { 
  Box, Typography, Paper, Grid, Card, CardContent, Chip, Button, 
  Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, alpha
} from '@mui/material';
import { Business, AttachMoney, DateRange, CheckCircle } from '@mui/icons-material';
import { usePlacementsQuery, useApplyForDriveMutation } from '../../queries/engagementQueries';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const StudentPlacements = () => {
  const [tabValue, setTabValue] = useState(0);
  const { data, isLoading } = usePlacementsQuery();
  const applyMutation = useApplyForDriveMutation();

  if (isLoading) {
    return <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;
  }

  const drives = data?.drives || [];
  const applications = data?.applications || [];

  const handleApply = (driveId) => {
    applyMutation.mutate(driveId);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Selected': return 'success';
      case 'Shortlisted': return 'info';
      case 'Rejected': return 'error';
      case 'Interviewing': return 'warning';
      default: return 'primary';
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 1, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
        Placements Hub
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Discover upcoming placement drives and track your applications.
      </Typography>

      <Paper sx={{ width: '100%', mb: 2, borderRadius: 3, overflow: 'hidden' }} elevation={0} variant="outlined">
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} aria-label="placement tabs">
            <Tab label={`Upcoming Drives (${drives.length})`} sx={{ fontWeight: 600 }} />
            <Tab label={`My Applications (${applications.length})`} sx={{ fontWeight: 600 }} />
          </Tabs>
        </Box>

        {/* Drives Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {drives.length > 0 ? drives.map(drive => {
                const hasApplied = applications.some(a => a.driveId?._id === drive._id);
                return (
                  <Grid item xs={12} md={6} key={drive._id}>
                    <Card variant="outlined" sx={{ borderRadius: 3 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6', p: 1, borderRadius: 2 }}>
                              <Business />
                            </Box>
                            <Box>
                              <Typography variant="h6" fontWeight="700">{drive.companyName}</Typography>
                              <Typography variant="body2" color="text.secondary">{drive.role}</Typography>
                            </Box>
                          </Box>
                          <Chip label={drive.status} color={drive.status === 'Open' ? 'success' : 'default'} size="small" />
                        </Box>
                        
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                          <Grid item xs={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <AttachMoney fontSize="small" color="action" />
                              <Typography variant="body2" fontWeight="600">{drive.package || 'Not disclosed'}</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <DateRange fontSize="small" color="action" />
                              <Typography variant="body2" fontWeight="600">Drive: {new Date(drive.driveDate).toLocaleDateString()}</Typography>
                            </Box>
                          </Grid>
                        </Grid>
                        
                        <Button 
                          fullWidth 
                          variant="contained" 
                          disabled={hasApplied || drive.status !== 'Open' || applyMutation.isPending}
                          onClick={() => handleApply(drive._id)}
                        >
                          {hasApplied ? 'Already Applied' : (drive.status === 'Open' ? 'Apply Now' : 'Not Open Yet')}
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              }) : (
                <Grid item xs={12}>
                  <Typography color="text.secondary" align="center" sx={{ py: 4 }}>No upcoming drives at the moment.</Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        </TabPanel>

        {/* Applications Tab */}
        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table sx={{ minWidth: 650 }} aria-label="applications table">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Company</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Package</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Applied On</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {applications.length > 0 ? applications.map((app) => (
                  <TableRow key={app._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ fontWeight: 600 }}>{app.driveId?.companyName || 'Unknown'}</TableCell>
                    <TableCell>{app.driveId?.role}</TableCell>
                    <TableCell>{app.driveId?.package}</TableCell>
                    <TableCell>{new Date(app.appliedAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip label={app.status} color={getStatusColor(app.status)} size="small" />
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      You haven't applied to any drives yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default StudentPlacements;
