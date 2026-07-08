import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  Book as BookIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Campaign as CampaignIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
} from '@mui/icons-material';
import { useHodDashboardStatsQuery } from '../../queries/dashboardQueries';
import { useAuth } from '../../contexts/AuthContext';
import AssignmentHub from './FacultyAssignment/AssignmentHub';

export const HODDashboard = () => {
  const { user } = useAuth();
  const { data: stats, isLoading, isError } = useHodDashboardStatsQuery();
  const [tabIndex, setTabIndex] = useState(0);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !stats) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Failed to load department statistics.</Typography>
      </Box>
    );
  }

  const { department, metrics } = stats;

  const metricCards = [
    { title: 'Total Students', value: metrics.totalStudents, icon: <PeopleIcon sx={{ fontSize: 40 }} />, color: '#4f46e5' },
    { title: 'Faculty Members', value: metrics.totalFaculty, icon: <SchoolIcon sx={{ fontSize: 40 }} />, color: '#06b6d4' },
    { title: 'Department Subjects', value: metrics.totalSubjects, icon: <BookIcon sx={{ fontSize: 40 }} />, color: '#10b981' },
  ];

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
          Welcome back, {user?.name || 'HOD'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Overview for {department.name} ({department.code})
        </Typography>
      </Box>

      {/* Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {metricCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                p: 2,
                borderRadius: 4,
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              }}
            >
              <Box sx={{ p: 2, borderRadius: 3, bgcolor: `${stat.color}15`, color: stat.color, mr: 3 }}>
                {stat.icon}
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {stat.title}
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabIndex} onChange={handleTabChange} aria-label="hod dashboard tabs">
          <Tab label="Dashboard Overview" sx={{ fontWeight: 600, textTransform: 'none', fontSize: '1rem' }} />
          <Tab label="Faculty Assignments" sx={{ fontWeight: 600, textTransform: 'none', fontSize: '1rem' }} />
        </Tabs>
      </Box>

      {tabIndex === 0 && (
        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 3, mb: 3, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Faculty Workload (Active Credits)
              </Typography>
              {stats.facultyWorkloads?.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No faculty assignments found.</Typography>
              ) : (
                <List>
                  {stats.facultyWorkloads?.map((faculty) => (
                    <ListItem key={faculty.id} sx={{ px: 0, flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{faculty.name}</Typography>
                        <Typography variant="body2" color={faculty.credits > 16 ? 'error.main' : 'text.secondary'}>
                          {faculty.credits} credits {faculty.credits > 16 && '(Overloaded)'}
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={Math.min((faculty.credits / 20) * 100, 100)} 
                        color={faculty.credits > 16 ? 'error' : 'primary'}
                        sx={{ width: '100%', height: 8, borderRadius: 4 }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Card>

            <Card sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Department Activity Feed
              </Typography>
              <List>
                {stats.recentActivities?.map((activity) => (
                  <React.Fragment key={activity.id}>
                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {activity.title}
                          </Typography>
                        }
                        secondary={new Date(activity.date).toLocaleDateString()}
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            </Card>
          </Grid>

          {/* Right Column */}
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3, mb: 3, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button variant="contained" startIcon={<CampaignIcon />} sx={{ justifyContent: 'flex-start', py: 1.5, borderRadius: 2 }}>
                  Broadcast Notice
                </Button>
                <Button variant="outlined" startIcon={<AssignmentTurnedInIcon />} sx={{ justifyContent: 'flex-start', py: 1.5, borderRadius: 2 }}>
                  Review Leaves (3 Pending)
                </Button>
              </Box>
            </Card>

            <Card sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', bgcolor: 'error.main', color: 'error.contrastText' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon /> Student Alerts
              </Typography>
              <List>
                {stats.studentAlerts?.map((alert) => (
                  <ListItem key={alert.id} sx={{ px: 0, py: 0.5 }}>
                    <ListItemText primary={alert.message} primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }} />
                  </ListItem>
                ))}
              </List>
              <Button size="small" variant="contained" color="inherit" sx={{ mt: 2, color: 'error.main', bgcolor: 'white', '&:hover': { bgcolor: 'grey.100' } }}>
                View All Defaulters
              </Button>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {tabIndex === 1 && (
        <AssignmentHub departmentId={department.id} />
      )}
    </Box>
  );
};

export default HODDashboard;
