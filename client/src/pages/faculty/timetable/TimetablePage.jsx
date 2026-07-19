// client/src/pages/faculty/timetable/TimetablePage.jsx
//
// Container page orchestrating the Faculty Timetable module with backend integration.

import React, { useMemo } from 'react';
import { Box, Typography, IconButton, CircularProgress } from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Child components
import TimetableGrid from './components/TimetableGrid';
import { useTimetableQuery } from '../../../queries/timetableQueries';

export const TimetablePage = () => {
  const navigate = useNavigate();

  // Fetch timetable slots specifically for Faculty
  const { data: rawTimetable = [], isLoading } = useTimetableQuery({ isFaculty: true });

  // Map backend timetable slots to display format expectations
  const formattedTimetable = useMemo(() => {
    return rawTimetable.map((s) => ({
      id: s._id,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      room: s.room || 'LH-201',
      group: s.group || 'CSE-A',
      subjectId: s.subjectId?._id || s.subjectId,
      subjectCode: s.subjectId?.code || 'CS301',
      subjectName: s.subjectId?.name || 'Assigned Subject',
      classType: 'LECTURE',
    }));
  }, [rawTimetable]);

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
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TimetableGrid timetableData={formattedTimetable} />
      )}
    </Box>
  );
};

export default TimetablePage;
