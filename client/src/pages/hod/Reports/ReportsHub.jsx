import React from 'react';
import { Box, Typography, Grid, CircularProgress, useTheme } from '@mui/material';
import { useHodReportsQuery } from '../../../queries/reportQueries';
import WorkloadChart from './WorkloadChart';
import VacantSubjects from './VacantSubjects';

const ReportsHub = () => {
  const theme = useTheme();
  const { data, isLoading, isError } = useHodReportsQuery();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !data) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error">Failed to load reports. Please try again later.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 1, sm: 3 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: theme.palette.text.primary }}>
          Department Reports
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Analyze faculty workload distribution and identify urgent staffing requirements.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} lg={7}>
          <WorkloadChart data={data.workloadDistribution} />
        </Grid>
        <Grid item xs={12} lg={5}>
          <VacantSubjects data={data.vacantSubjects} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReportsHub;
