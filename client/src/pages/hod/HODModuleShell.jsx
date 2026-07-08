import React from 'react';
import { Box, Typography, Button, useTheme } from '@mui/material';
import { Architecture as ArchitectureIcon } from '@mui/icons-material';

const HODModuleShell = ({ title, description }) => {
  const theme = useTheme();

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '70vh',
      textAlign: 'center',
      p: 3
    }}>
      <Box sx={{ 
        width: 120, 
        height: 120, 
        borderRadius: '50%', 
        bgcolor: 'rgba(79, 70, 229, 0.1)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        mb: 4,
        position: 'relative'
      }}>
        <ArchitectureIcon sx={{ fontSize: 60, color: theme.palette.primary.main }} />
        <Box sx={{
          position: 'absolute',
          top: -10,
          right: -20,
          bgcolor: theme.palette.warning.main,
          color: '#fff',
          px: 1.5,
          py: 0.5,
          borderRadius: 2,
          fontSize: '0.7rem',
          fontWeight: 800,
          boxShadow: theme.custom?.elevation?.glow || 2
        }}>
          BUILDING
        </Box>
      </Box>

      <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, color: 'text.primary' }}>
        {title || 'Department Module'}
      </Typography>
      
      <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mb: 5, fontWeight: 500, lineHeight: 1.6 }}>
        {description || 'This section of the HOD Command Center is currently being architected.'}
      </Typography>

      <Button 
        variant="contained" 
        size="large" 
        sx={{ 
          borderRadius: 3, 
          px: 4, 
          py: 1.5, 
          fontWeight: 700,
          boxShadow: theme.custom?.elevation?.glow || 2
        }}
      >
        View Wireframe Spec
      </Button>
    </Box>
  );
};

export default HODModuleShell;
