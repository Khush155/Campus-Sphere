// client/src/pages/faculty/components/WelcomeCard.jsx
import React from 'react';
import { Box, Typography } from '@mui/material';

export const WelcomeCard = ({ facultyName, designation }) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
        Welcome back, {facultyName}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {designation} • Here is an overview of your classes, schedule, and updates.
      </Typography>
    </Box>
  );
};

export default WelcomeCard;