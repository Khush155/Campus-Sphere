// client/src/pages/faculty/components/StatCard.jsx
//
// Reusable statistics card component for the Faculty Dashboard.
// Displays a single metric (title + value) with a colored icon.
//
// Props:
//   title  — label text (e.g. "Assigned Subjects")
//   value  — display value (e.g. "3")
//   icon   — React element, a MUI icon component
//   color  — hex color string (e.g. "#4f46e5")
//
// Pattern taken from Home.jsx (Admin Dashboard) stat cards.
// Extracted into a dedicated component for reusability and clean code.

import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

export const StatCard = ({ title, value, icon, color }) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 3,
        }}
      >
        {/* Left side — Label and Value */}
        <Box>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontWeight: 600, mb: 1 }}
          >
            {title}
          </Typography>
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, color: 'text.primary' }}
          >
            {value}
          </Typography>
        </Box>

        {/* Right side — Icon with tinted background */}
        <Box
          sx={{
            bgcolor: `${color}15`,
            color: color,
            p: 1.5,
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatCard;
