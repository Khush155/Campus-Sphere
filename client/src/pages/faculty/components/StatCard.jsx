import React from 'react';
import { Card, Typography, Box, Avatar, useTheme } from '@mui/material';

export const StatCard = ({ title, value, icon, color = '#4f46e5' }) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        p: 3,
        borderRadius: '14px',
        border: `1px solid ${theme.palette.divider}`,
        borderLeft: `4px solid ${color}`,
        boxShadow: 'none',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
        },
      }}
    >
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {title}
        </Typography>
        <Typography variant="h3" sx={{ fontWeight: 800, color: theme.palette.ink[900], mt: 0.5, fontFamily: theme.typography.mono.fontFamily }}>
          {value ?? '0'}
        </Typography>
      </Box>

      <Avatar
        sx={{
          width: 46,
          height: 46,
          bgcolor: `${color}15`,
          color: color,
        }}
      >
        {icon}
      </Avatar>
    </Card>
  );
};

export default StatCard;
