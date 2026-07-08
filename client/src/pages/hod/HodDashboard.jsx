import React from 'react';
import { Box, Typography, Paper, Grid, CircularProgress, useTheme } from '@mui/material';
import { useUsersQuery } from '../../queries/userQueries';
import { useSubjectsQuery } from '../../queries/collegeQueries';
import { useAuth } from '../../contexts/AuthContext';

const HodDashboard = () => {
  const theme = useTheme();
  const { user } = useAuth();
  
  // Use existing queries, they will be scoped by departmentId on the backend automatically
  const { data: facultyData, isLoading: loadingFaculty } = useUsersQuery({ role: 'FACULTY', limit: 1 });
  const { data: studentData, isLoading: loadingStudents } = useUsersQuery({ role: 'STUDENT', limit: 1 });
  const { data: subjectData, isLoading: loadingSubjects } = useSubjectsQuery({ departmentId: user?.departmentId, limit: 1 });

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: theme.palette.ink?.[900] || 'text.primary' }}>
        Department Dashboard
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
        Overview of your department metrics and configurations.
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>Total Faculty</Typography>
            {loadingFaculty ? (
              <CircularProgress size={30} />
            ) : (
              <Typography variant="h3" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
                {facultyData?.meta?.total || 0}
              </Typography>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>Total Students</Typography>
            {loadingStudents ? (
              <CircularProgress size={30} />
            ) : (
              <Typography variant="h3" sx={{ fontWeight: 800, color: theme.palette.signal?.success || 'success.main' }}>
                {studentData?.meta?.total || 0}
              </Typography>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>Total Subjects</Typography>
            {loadingSubjects ? (
              <CircularProgress size={30} />
            ) : (
              <Typography variant="h3" sx={{ fontWeight: 800, color: '#a27431' }}>
                {subjectData?.length || 0}
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HodDashboard;
