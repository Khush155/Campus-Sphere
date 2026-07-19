/* eslint-disable */
import React from 'react';
import {
  Box, Typography, Paper, Grid, CircularProgress, useTheme, Button, Avatar, IconButton, Divider,
} from '@mui/material';
import { useUsersQuery } from '../../queries/userQueries';
import { useSubjectsQuery } from '../../queries/collegeQueries';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  People, MenuBook, Diversity3, ArrowForwardIos, Assessment, MeetingRoom, CalendarMonth,
} from '@mui/icons-material';

const StatCard = ({ title, value, icon, gradient, loading, onClick }) => {
  return (
    <Paper
      onClick={onClick}
      sx={{
        p: 3,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 4,
        cursor: onClick ? 'pointer' : 'default',
        color: '#fff',
        background: gradient,
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        '&:hover': {
          transform: onClick ? 'translateY(-5px)' : 'none',
          boxShadow: onClick ? '0 15px 40px rgba(0,0,0,0.15)' : '0 10px 30px rgba(0,0,0,0.1)',
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -20,
          right: -20,
          opacity: 0.1,
          transform: 'rotate(-15deg)',
          '& svg': { fontSize: 140 },
        }}
      >
        {icon}
      </Box>
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
            {icon}
          </Avatar>
          <Typography variant="h6" fontWeight={600} sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            {title}
          </Typography>
        </Box>
        {loading ? (
          <CircularProgress size={30} sx={{ color: '#fff' }} />
        ) : (
          <Typography variant="h2" fontWeight={800} sx={{ textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
            {value}
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

const QuickAction = ({ icon, title, desc, onClick }) => {
  const theme = useTheme();
  return (
    <Paper
      onClick={onClick}
      sx={{
        p: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        borderRadius: 3,
        cursor: 'pointer',
        border: `1px solid ${theme.palette.divider}`,
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: theme.palette.primary.main,
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'primary.50',
          transform: 'scale(1.02)',
        },
      }}
    >
      <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>{icon}</Avatar>
      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
        <Typography variant="body2" color="text.secondary">{desc}</Typography>
      </Box>
      <IconButton size="small" sx={{ color: 'text.secondary' }}>
        <ArrowForwardIos fontSize="inherit" />
      </IconButton>
    </Paper>
  );
};

const HodDashboard = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Queries for Overview
  const { data: facultyData, isLoading: loadingFaculty } = useUsersQuery({ role: 'FACULTY', department: user?.departmentId, limit: 1 });
  const { data: studentData, isLoading: loadingStudents } = useUsersQuery({ role: 'STUDENT', department: user?.departmentId, limit: 1 });
  const { data: subjectData, isLoading: loadingSubjects } = useSubjectsQuery({ department: user?.departmentId });

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, sm: 4 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 5 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Welcome back, HOD
          </Typography>
          <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Here is what's happening in your department today.
          </Typography>
        </Box>
        <Button variant="contained" size="large" sx={{ borderRadius: 8, px: 4, py: 1.5, fontWeight: 700 }} onClick={() => navigate('/hod/reports')}>
          View Detailed Analytics
        </Button>
      </Box>

      {/* KPI Row */}
      <Grid container spacing={4} sx={{ mb: 5 }}>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Total Faculty"
            value={facultyData?.meta?.total || 0}
            icon={<Diversity3 />}
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            loading={loadingFaculty}
            onClick={() => navigate('/hod/faculty')}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Total Students"
            value={studentData?.meta?.total || 0}
            icon={<People />}
            gradient="linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"
            loading={loadingStudents}
            onClick={() => navigate('/hod/students')}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Department Subjects"
            value={subjectData?.length || 0}
            icon={<MenuBook />}
            gradient="linear-gradient(135deg, #F2994A 0%, #F2C94C 100%)"
            loading={loadingSubjects}
            onClick={() => navigate('/hod/subjects')}
          />
        </Grid>
      </Grid>

      <Typography variant="h5" fontWeight={800} sx={{ mb: 3 }}>Quick Actions</Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <QuickAction
            icon={<Assessment />}
            title="Performance Reports"
            desc="View 8-KPI enterprise analytics"
            onClick={() => navigate('/hod/reports')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <QuickAction
            icon={<MenuBook />}
            title="Faculty Assignment"
            desc="Assign subjects to teachers"
            onClick={() => navigate('/hod/assignment')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <QuickAction
            icon={<MeetingRoom />}
            title="Schedule Meeting"
            desc="Plan a department virtual/hybrid meeting"
            onClick={() => navigate('/hod/meetings')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <QuickAction
            icon={<CalendarMonth />}
            title="Examinations"
            desc="Manage datesheets & seating plans"
            onClick={() => navigate('/hod/examinations')}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default HodDashboard;
