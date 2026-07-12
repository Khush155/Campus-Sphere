import React from 'react';
import { Box, Typography, Grid, Card, CardContent, Paper, LinearProgress, List, ListItem, ListItemText, Chip, Divider, Button } from '@mui/material';
import { School, ReceiptLong, EventNote, Campaign, ArrowForward } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useStudentLedgerQuery } from '../../queries/feeQueries';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: ledgerData, isLoading: isLedgerLoading } = useStudentLedgerQuery(user?.id);

  const notices = [
    { id: 1, title: 'End Semester Examinations Schedule', date: 'July 10, 2026', category: 'Exam', priority: 'high' },
    { id: 2, title: 'Annual Cultural Fest - CampusSphere 2026 Registration', date: 'July 05, 2026', category: 'Event', priority: 'medium' },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
          Welcome back, {user?.name?.split(' ')[0] || 'Student'}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Student ID: {user?.customId || 'N/A'} • Semester {user?.semester || 'N/A'}
        </Typography>
      </Box>

      {/* Quick Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        
        {/* Fee Status Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%', cursor: 'pointer', transition: '0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }} onClick={() => navigate('/fees')}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ bgcolor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', p: 1.5, borderRadius: 3 }}>
                  <ReceiptLong sx={{ fontSize: 32 }} />
                </Box>
                <Chip label="View Ledger" size="small" variant="outlined" color="warning" />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                Outstanding Fees
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
                {isLedgerLoading ? '...' : `$${ledgerData?.summary?.totalBalance?.toLocaleString() || 0}`}
              </Typography>
              {ledgerData?.summary?.totalBalance > 0 && (
                <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                  Action required: Please clear your dues.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Academic Profile Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ bgcolor: 'rgba(79, 70, 229, 0.15)', color: '#4f46e5', p: 1.5, borderRadius: 3 }}>
                  <School sx={{ fontSize: 32 }} />
                </Box>
                <Chip label="Active" size="small" color="success" sx={{ fontWeight: 700 }} />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                Current Enrollment
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.2, mb: 1 }}>
                B.Tech Computer Science
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Attendance Summary Card (Static placeholder) */}
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', p: 1.5, borderRadius: 3 }}>
                  <EventNote sx={{ fontSize: 32 }} />
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                Current Semester Attendance
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#10b981' }}>89%</Typography>
                <Typography variant="caption" color="text.secondary">/ 75% required</Typography>
              </Box>
              <LinearProgress variant="determinate" value={89} color="success" sx={{ height: 6, borderRadius: 3 }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom Section */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%', borderRadius: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Campaign color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                Recent Announcements
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <List disablePadding>
              {notices.map((notice) => (
                <ListItem
                  key={notice.id}
                  disableGutters
                  secondaryAction={
                    <Chip label={notice.category} size="small" sx={{ fontSize: '0.7rem', fontWeight: 600, bgcolor: notice.priority === 'high' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(79, 70, 229, 0.1)', color: notice.priority === 'high' ? 'error.main' : 'primary.main' }} />
                  }
                  sx={{ borderBottom: '1px solid', borderColor: 'divider', py: 1.5, '&:last-child': { borderBottom: 'none' } }}
                >
                  <ListItemText
                    primary={notice.title}
                    secondary={notice.date}
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 600, color: 'text.primary', sx: { mb: 0.5 } }}
                    secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                  />
                </ListItem>
              ))}
            </List>
            <Button variant="text" endIcon={<ArrowForward />} sx={{ mt: 2, fontWeight: 700 }}>
              View All Notices
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%', borderRadius: 3, border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8fafc' }} elevation={0}>
            <img src="https://illustrations.popsy.co/amber/student-going-to-school.svg" alt="Student" style={{ height: 180, marginBottom: 16 }} />
            <Typography variant="h6" fontWeight="700" color="text.secondary" gutterBottom>Ready for your next class?</Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ maxWidth: 300 }}>
              Your timetable module will be available soon. Check back for your daily schedule and class links.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StudentDashboard;
