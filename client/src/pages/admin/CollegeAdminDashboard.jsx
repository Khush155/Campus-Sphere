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
  CircularProgress,
} from '@mui/material';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  Business as DepartmentIcon,
  AttachMoney as AttachMoneyIcon,
  Campaign as CampaignIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const CollegeAdminDashboard = () => {
  const { user } = useAuth();

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['collegeAdminStats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/college-admin');
      return response.data.data;
    },
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" variant="h6" align="center" sx={{ mt: 4 }}>
        Failed to load dashboard statistics.
      </Typography>
    );
  }

  const { totalStudents, totalFaculty, totalDepartments, feesCollectionPercent, departmentStats } = dashboardData;

  const stats = [
    { title: 'Total Students', value: totalStudents, icon: <PeopleIcon sx={{ fontSize: 40 }} />, color: '#4f46e5' },
    { title: 'Faculty Members', value: totalFaculty, icon: <SchoolIcon sx={{ fontSize: 40 }} />, color: '#06b6d4' },
    { title: 'Departments', value: totalDepartments, icon: <DepartmentIcon sx={{ fontSize: 40 }} />, color: '#10b981' },
    { title: 'Fees Collected', value: `${feesCollectionPercent}%`, icon: <AttachMoneyIcon sx={{ fontSize: 40 }} />, color: '#f59e0b' },
  ];

  const notices = dashboardData?.notices || [];

  // Assign colors to departments for progress bars
  const pbColors = ['primary', 'secondary', 'success', 'warning', 'info'];

  return (
    <Box sx={{ flexGrow: 1, maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
          Welcome back, {user?.name || 'Admin'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here is the ERP Command Center overview for your institution.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat) => (
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

      {/* Main Grid Section */}
      <Grid container spacing={3}>
        {/* Department Performance */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%', borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
              Department Capacity (Student to Faculty)
            </Typography>

            {departmentStats?.map((dept, index) => {
              // Calculate a simple capacity metric for display
              // For visualization, assume 1 faculty per 20 students is 100% capacity
              let capacity = 0;
              if (dept.studentsCount > 0) {
                const ratio = dept.facultyCount / (dept.studentsCount / 20);
                capacity = Math.min(Math.round(ratio * 100), 100);
              }

              const color = pbColors[index % pbColors.length];
              
              return (
                <Box sx={{ mb: 3 }} key={dept.id}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{dept.name} ({dept.code})</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {dept.studentsCount} Students, {dept.facultyCount} Faculty
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={capacity} 
                    color={color} 
                    sx={{ height: 8, borderRadius: 4, bgcolor: 'action.hover' }} 
                  />
                  {dept.status === 'Warning' && (
                    <Typography variant="caption" color="error.main" sx={{ mt: 0.5, display: 'block', fontWeight: 600 }}>
                      Warning: Insufficient Faculty
                    </Typography>
                  )}
                </Box>
              );
            })}
            {(!departmentStats || departmentStats.length === 0) && (
               <Typography variant="body2" color="text.secondary">No departments available.</Typography>
            )}
          </Paper>
        </Grid>

        {/* Notice Board Preview */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%', borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
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
              {notices.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No recent announcements.
                </Typography>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CollegeAdminDashboard;
