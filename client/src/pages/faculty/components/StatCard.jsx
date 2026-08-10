import React from 'react';
import { Card, Typography, Box, Avatar, useTheme } from '@mui/material';

export const StatCard = ({ title, value, icon, color = '#4f46e5' }) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        p: 2.5,
        borderRadius: '14px',
        border: `1px solid ${theme.palette.divider}`,
        borderTop: `4px solid ${color}`,
        boxShadow: 'none',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.06em', color: color, textTransform: 'uppercase', fontSize: '0.65rem' }}>
          {title}
        </Typography>
        <Avatar
          sx={{
            width: 38,
            height: 38,
            bgcolor: `${color}15`,
            color: color,
          }}
        >
          {icon}
        </Avatar>
      </Box>
      <Typography variant="h3" sx={{ fontWeight: 900, color: theme.palette.ink[900], mt: 1, fontFamily: theme.typography.mono.fontFamily, lineHeight: 1.1 }}>
        {value ?? '0'}
      </Typography>
    </Card>
  );
};

export default StatCard;
