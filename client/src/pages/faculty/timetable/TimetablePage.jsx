// client/src/pages/faculty/timetable/TimetablePage.jsx
//
// Container page orchestrating the Faculty Timetable module.
// Consumes mock timetable data and forwards it to the presentation grid.

import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Child components
import TimetableGrid from './components/TimetableGrid';
import { mockTimetable } from './mockData';

export const TimetablePage = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* ── Page Header ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          mb: 4,
        }}
      >
        <IconButton
          onClick={() => navigate('/faculty')}
          size="small"
          sx={{
            bgcolor: 'action.hover',
            '&:hover': { bgcolor: 'action.selected' },
          }}
        >
          <BackIcon fontSize="small" />
        </IconButton>
        <Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}
          >
            Class Timetable
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View scheduled weekly lectures, labs, practicals, and tutorials for the current semester
          </Typography>
        </Box>
      </Box>

      {/* ── Weekly Schedule Grid ── */}
      <TimetableGrid timetableData={mockTimetable} />
    </Box>
  );
};

export default TimetablePage;
