import React from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, Button, useTheme, Avatar, Chip, Divider, List, ListItem, ListItemText, ListItemIcon 
} from '@mui/material';
import { 
  People as PeopleIcon, 
  School as FacultyIcon, 
  MenuBook as SubjectIcon,
  EventAvailable as AttendanceIcon,
  TrendingUp as PassIcon,
  SwapHoriz as ReassignIcon,
  Warning as AlertIcon,
  Event as EventIcon
} from '@mui/icons-material';

const HODDashboard = () => {
  const theme = useTheme();

  // Layer 2: KPIs
  const kpis = [
    { title: 'Students', value: '1,450', icon: <PeopleIcon sx={{ fontSize: 32 }} />, color: theme.palette.primary.main, bg: 'rgba(79, 70, 229, 0.1)' },
    { title: 'Faculty', value: '58', icon: <FacultyIcon sx={{ fontSize: 32 }} />, color: theme.palette.secondary.main, bg: 'rgba(236, 72, 153, 0.1)' },
    { title: 'Subjects', value: '84', icon: <SubjectIcon sx={{ fontSize: 32 }} />, color: theme.palette.info.main, bg: 'rgba(14, 165, 233, 0.1)' },
    { title: 'Attendance', value: '87%', icon: <AttendanceIcon sx={{ fontSize: 32 }} />, color: theme.palette.success.main, bg: 'rgba(16, 185, 129, 0.1)' },
    { title: 'Pass Rate', value: '92%', icon: <PassIcon sx={{ fontSize: 32 }} />, color: theme.palette.warning.main, bg: 'rgba(245, 158, 11, 0.1)' }
  ];

  // Layer 3: Faculty Workload
  const workload = [
    { name: 'Dr. Sharma', credits: 18, status: 'Overloaded' },
    { name: 'Prof. Singh', credits: 15, status: 'Optimal' },
    { name: 'Prof. Verma', credits: 12, status: 'Optimal' },
  ];

  // Layer 4: Student Alerts
  const alerts = [
    { name: 'Rahul', detail: 'Attendance 62%', severity: 'high' },
    { name: 'Aman', detail: 'CGPA 5.2', severity: 'medium' },
    { name: 'Priya', detail: 'Failed 2 Subjects', severity: 'high' },
  ];

  // Layer 5: Upcoming Events
  const events = [
    { title: 'Semester Exam', date: 'Next Week' },
    { title: 'Faculty Meeting', date: 'Tomorrow, 10 AM' },
    { title: 'Project Evaluation', date: 'Friday, 2 PM' },
  ];

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 3 } }}>
      {/* Layer 1: Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
            Computer Science Department
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
            Good Morning, Dr. Sharma
          </Typography>
        </Box>
        <Chip 
          label="Academic Year: 2026–27" 
          sx={{ fontWeight: 700, borderRadius: 2, bgcolor: theme.custom?.surface?.card || '#fff', border: `1px solid ${theme.custom?.border?.subtle || '#e0e0e0'}` }} 
        />
      </Box>

      {/* Layer 2: KPIs */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {kpis.map((kpi, index) => (
          <Grid item xs={12} sm={6} md={2.4} key={index}>
            <Card sx={{ 
              borderRadius: 4, 
              bgcolor: theme.custom?.surface?.card || '#fff',
              boxShadow: theme.custom?.elevation?.card || 1,
              border: `1px solid ${theme.custom?.border?.subtle || '#e0e0e0'}`,
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' }
            }}>
              <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: kpi.bg, color: kpi.color, display: 'flex' }}>
                  {kpi.icon}
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {kpi.title}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    {kpi.value}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4}>
        {/* Layer 3: Faculty Workload */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            borderRadius: 4, 
            bgcolor: theme.custom?.surface?.card || '#fff',
            boxShadow: theme.custom?.elevation?.card || 1,
            border: `1px solid ${theme.custom?.border?.subtle || '#e0e0e0'}`,
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <CardContent sx={{ p: 3, flexGrow: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FacultyIcon color="primary" /> Faculty Workload
                </Typography>
              </Box>
              <List disablePadding>
                {workload.map((faculty, idx) => (
                  <ListItem key={idx} disablePadding sx={{ mb: 2 }}>
                    <ListItemText 
                      primary={faculty.name} 
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{faculty.credits} Credits</Typography>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: faculty.status === 'Overloaded' ? 'error.main' : 'success.main' }} />
                    </Box>
                  </ListItem>
                ))}
              </List>
            </CardContent>
            <Box sx={{ p: 2, borderTop: `1px solid ${theme.custom?.border?.subtle || '#e0e0e0'}` }}>
              <Button fullWidth variant="outlined" startIcon={<ReassignIcon />} sx={{ borderRadius: 2, fontWeight: 700 }}>
                Reassign Subjects
              </Button>
            </Box>
          </Card>
        </Grid>

        {/* Layer 4: Student Alerts */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            borderRadius: 4, 
            bgcolor: theme.custom?.surface?.card || '#fff',
            boxShadow: theme.custom?.elevation?.card || 1,
            border: `1px solid ${theme.custom?.border?.subtle || '#e0e0e0'}`,
            height: '100%'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AlertIcon color="error" /> Students at Risk
              </Typography>
              <List disablePadding>
                {alerts.map((alert, idx) => (
                  <ListItem key={idx} disablePadding sx={{ mb: 2 }}>
                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(239, 68, 68, 0.1)', color: 'error.main', mr: 2 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'transparent', color: 'inherit', fontWeight: 800 }}>
                        {alert.name[0]}
                      </Avatar>
                    </Box>
                    <ListItemText 
                      primary={alert.name} 
                      secondary={alert.detail}
                      primaryTypographyProps={{ fontWeight: 700 }}
                      secondaryTypographyProps={{ fontWeight: 600, color: alert.severity === 'high' ? 'error.main' : 'warning.main' }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Layer 5: Upcoming Events */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            borderRadius: 4, 
            bgcolor: theme.custom?.surface?.card || '#fff',
            boxShadow: theme.custom?.elevation?.card || 1,
            border: `1px solid ${theme.custom?.border?.subtle || '#e0e0e0'}`,
            height: '100%'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <EventIcon color="info" /> Upcoming
              </Typography>
              <List disablePadding>
                {events.map((event, idx) => (
                  <ListItem key={idx} disablePadding sx={{ mb: 3, position: 'relative' }}>
                    <Box sx={{ width: 4, height: '100%', bgcolor: 'info.main', position: 'absolute', left: 0, borderRadius: 2 }} />
                    <Box sx={{ pl: 3 }}>
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>{event.title}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{event.date}</Typography>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HODDashboard;
