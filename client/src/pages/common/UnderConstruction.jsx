import React from 'react';
import { Box, Typography, Card, Button } from '@mui/material';
import { Construction as ConstructionIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const UnderConstruction = ({ title }) => {
  const navigate = useNavigate();

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 8, textAlign: 'center' }}>
      <Card sx={{ p: 6, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <ConstructionIcon sx={{ fontSize: 80, color: 'warning.main', mb: 2 }} />
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          {title || 'Under Construction'}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          This module is currently being built in the upcoming phase of CampusSphere ERP. Check back later!
        </Typography>
        <Button variant="contained" onClick={() => navigate(-1)} sx={{ borderRadius: 2 }}>
          Go Back
        </Button>
      </Card>
    </Box>
  );
};

export default UnderConstruction;
