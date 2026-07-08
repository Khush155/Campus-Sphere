import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
} from '@mui/material';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  CheckCircle as CheckCircleIcon,
  AttachMoney as AttachMoneyIcon,
  Campaign as CampaignIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import HODDashboard from './hod/HODDashboard';

export const Home = () => {
  const { user } = useAuth();

  if (user?.role === 'HOD') {
    return <HODDashboard />;
  }

  const stats = [
    { title: 'Total Students', value: '1,248', icon: <PeopleIcon sx={{ fontSize: 40 }} />, color: '#4f46e5' },
    { title: 'Faculty Members', value: '84', icon: <SchoolIcon sx={{ fontSize: 40 }} />, color: '#06b6d4' },
    { title: 'Avg Attendance', value: '92.4%', icon: <CheckCircleIcon sx={{ fontSize: 40 }} />, color: '#10b981' },
    { title: 'Fees Collected', value: '85%', icon: <AttachMoneyIcon sx={{ fontSize: 40 }} />, color: '#f59e0b' },
  ];

  const notices = [
    { id: 1, title: 'End Semester Examinations Schedule', date: 'July 10, 2026', category: 'Exam', priority: 'high' },
    { id: 2, title: 'Annual Cultural Fest - CampusSphere 2026 Registration', date: 'July 05, 2026', category: 'Event', priority: 'medium' },
    { id: 3, title: 'Placement Drive for Final Year B.Tech Students', date: 'July 01, 2026', category: 'Placement', priority: 'high' },
    { id: 4, title: 'Library Timings Revised for Exam Preparation', date: 'June 28, 2026', category: 'General', priority: 'low' },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
          Welcome back, Admin
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here is an overview of the campus status and updates.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <Card sx={{ height: '100%' }}>
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

      {/* Main Grid Section */}
      <Grid container spacing={3}>
        {/* Attendance Summary */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
              Department-wise Attendance
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Computer Science (CSE)</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>95%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={95} sx={{ height: 8, borderRadius: 4, bgcolor: 'action.hover' }} />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Electronics (ECE)</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>91%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={91} color="secondary" sx={{ height: 8, borderRadius: 4, bgcolor: 'action.hover' }} />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Mechanical Engineering (ME)</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>88%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={88} color="success" sx={{ height: 8, borderRadius: 4, bgcolor: 'action.hover' }} />
            </Box>

            <Box sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Civil Engineering (CE)</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>86%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={86} color="warning" sx={{ height: 8, borderRadius: 4, bgcolor: 'action.hover' }} />
            </Box>
          </Paper>
        </Grid>

        {/* Notice Board Preview */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CampaignIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                Notice Board
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            <List disablePadding>
              {notices.map((notice) => (
                <ListItem
                  key={notice.id}
                  disableGutters
                  secondaryAction={
                    <Chip
                      label={notice.category}
                      size="small"
                      sx={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        bgcolor: notice.priority === 'high' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(79, 70, 229, 0.1)',
                        color: notice.priority === 'high' ? 'error.main' : 'primary.main',
                      }}
                    />
                  }
                  sx={{ borderBottom: '1px solid', borderColor: 'divider', py: 1.5, '&:last-child': { borderBottom: 'none' } }}
                >
                  <ListItemText
                    primary={notice.title}
                    secondary={notice.date}
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: 600,
                      color: 'text.primary',
                      sx: { mb: 0.5 },
                    }}
                    secondaryTypographyProps={{
                      variant: 'caption',
                      color: 'text.secondary',
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Home;
