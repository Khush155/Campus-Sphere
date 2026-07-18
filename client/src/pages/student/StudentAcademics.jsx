import React from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent } from '@mui/material';
import { MenuBook, Subject, Timeline } from '@mui/icons-material';

const StudentAcademics = () => {
  return (
    <Box sx={{ flexGrow: 1, p: { xs: 1, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
        Academics
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Your current semester subjects, syllabus, and academic progression.
      </Typography>

      <Paper sx={{ p: 4, borderRadius: 3, minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }} elevation={0} variant="outlined">
         <Box sx={{ textAlign: 'center' }}>
            <MenuBook sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Academics module is currently syncing with the department catalog.
            </Typography>
            <Typography variant="body2" color="text.disabled">
              Check back soon for your detailed subject breakdowns.
            </Typography>
         </Box>
      </Paper>
    </Box>
  );
};

export default StudentAcademics;
