import React, { useMemo } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Chip,
} from '@mui/material';
import {
  PrintOutlined as PrintIcon,
  WbSunnyOutlined as MorningIcon,
  NightsStayOutlined as EveningIcon,
} from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext';
import { useMyProfileQuery } from '../../queries/userProfileQueries';
import { useTimetableQuery } from '../../queries/timetableQueries';
import TimetableGrid from '../faculty/timetable/components/TimetableGrid';

export const StudentTimetablePage = () => {
  const { user } = useAuth();
  const { data: profile } = useMyProfileQuery();

  const currentUser = profile?.user || user;
  const studentMeta = profile?.profileMeta || {};

  const shift = studentMeta?.shift || currentUser?.shift || 'MORNING';
  const group = studentMeta?.group || currentUser?.group || 'G1';

  const { data: rawTimetableData = [], isLoading } = useTimetableQuery();

  // Filter slots for student's group
  const studentTimetableData = useMemo(() => {
    if (!rawTimetableData) return [];
    const list = Array.isArray(rawTimetableData) ? rawTimetableData : (rawTimetableData.data || []);
    return list.filter((slot) => {
      if (!group) return true;
      const slotGrp = slot.group || slot.groupId?.name || slot.groupId || '';
      return !slotGrp || slotGrp === 'FULL_BATCH' || slotGrp === group;
    });
  }, [rawTimetableData, group]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3.5 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
              My Class Timetable
            </Typography>
            <Chip
              icon={shift === 'EVENING' ? <EveningIcon /> : <MorningIcon />}
              label={shift === 'EVENING' ? 'Evening Shift' : 'Morning Shift'}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 800 }}
            />
          </Box>
          <Typography variant="body1" color="text.secondary">
            Weekly matrix schedule for Group <strong>{group}</strong> • Course <strong>{studentMeta?.course || 'B.Tech'}</strong> (Sem{' '}
            {studentMeta?.semester || 6})
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          sx={{
            borderRadius: '12px',
            px: 3,
            py: 1.25,
            fontWeight: 800,
            textTransform: 'none',
            boxShadow: '0 8px 20px rgba(79, 70, 229, 0.25)',
          }}
        >
          Print Schedule
        </Button>
      </Box>

      {/* Timetable Grid Component */}
      {isLoading ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '20px' }}>
          <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 600 }}>
            Loading timetable schedule...
          </Typography>
        </Paper>
      ) : (
        <TimetableGrid timetableData={studentTimetableData} defaultShift={shift} hideShiftToggle={true} />
      )}
    </Container>
  );
};

export default StudentTimetablePage;
