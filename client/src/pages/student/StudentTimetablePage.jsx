import React, { useMemo, useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Chip,
  Grid,
  Skeleton,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  PrintOutlined as PrintIcon,
  WbSunnyOutlined as MorningIcon,
  NightsStayOutlined as EveningIcon,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Room as RoomIcon,
  Person as FacultyIcon,
  FiberManualRecord as LiveDotIcon,
  Upcoming as UpcomingIcon,
  SchoolOutlined as ClassIcon,
} from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext';
import { useStudentSession } from '../../contexts/StudentSessionContext';
import { useMyProfileQuery } from '../../queries/userProfileQueries';
import { useTimetableQuery } from '../../queries/timetableQueries';
import TimetableGrid from '../faculty/timetable/components/TimetableGrid';

const daysMap = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const timeToMins = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const StudentTimetablePage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { user } = useAuth();
  const { data: profile } = useMyProfileQuery();
  const { selectedSemester, isArchivedView } = useStudentSession();

  const currentUser = profile?.user || user;
  const studentMeta = profile?.profileMeta || {};

  const shift = studentMeta?.shift || currentUser?.shift || 'MORNING';
  const group = studentMeta?.group || currentUser?.group || 'G1';

  // Week offset for week navigation (0 = Current Week, -1 = Prev Week, 1 = Next Week)
  const [weekOffset, setWeekOffset] = useState(0);

  const { data: rawTimetableData = [], isLoading, isError, refetch } = useTimetableQuery();

  // Filter slots for student's group & cohort
  const studentTimetableData = useMemo(() => {
    if (!rawTimetableData) return [];
    const list = Array.isArray(rawTimetableData) ? rawTimetableData : (rawTimetableData.data || []);
    return list.filter((slot) => {
      // Semester filter if slot or subject is tagged with semester
      const slotSem = slot.semester || slot.subjectId?.semester;
      if (slotSem !== undefined && slotSem !== null && Number(slotSem) !== Number(selectedSemester)) {
        return false;
      }
      if (!group) return true;
      const slotGrp = slot.group || slot.groupId?.name || slot.groupId || '';
      return !slotGrp || slotGrp === 'FULL_BATCH' || slotGrp === 'ALL' || slotGrp === group;
    });
  }, [rawTimetableData, group, selectedSemester]);

  // Current real-time info
  const now = new Date();
  const currentDayName = daysMap[now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Date range for week navigation display
  const weekDateRangeLabel = useMemo(() => {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + weekOffset * 7);

    // Calculate Monday of that week
    const dayOfWeek = baseDate.getDay();
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() - distanceToMonday);

    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5);

    const formatOpt = { month: 'short', day: 'numeric' };
    const mondayStr = monday.toLocaleDateString('en-US', formatOpt);
    const saturdayStr = saturday.toLocaleDateString('en-US', { ...formatOpt, year: 'numeric' });

    if (weekOffset === 0) {
      return `This Week (${mondayStr} – ${saturdayStr})`;
    } else if (weekOffset === -1) {
      return `Previous Week (${mondayStr} – ${saturdayStr})`;
    } else if (weekOffset === 1) {
      return `Next Week (${mondayStr} – ${saturdayStr})`;
    }
    return `Week of ${mondayStr} – ${saturdayStr}`;
  }, [weekOffset]);

  // Detect currently ongoing class
  const ongoingClass = useMemo(() => {
    if (weekOffset !== 0) return null; // Only highlight ongoing for current week
    return studentTimetableData.find((slot) => {
      const slotDay = (slot.dayOfWeek || slot.day || '').toUpperCase();
      if (slotDay !== currentDayName) return false;
      const startM = timeToMins(slot.startTime);
      const endM = timeToMins(slot.endTime);
      return currentMinutes >= startM && currentMinutes < endM;
    });
  }, [studentTimetableData, currentDayName, currentMinutes, weekOffset]);

  // Calculate remaining minutes for ongoing class
  const ongoingRemainingMins = useMemo(() => {
    if (!ongoingClass) return null;
    const endM = timeToMins(ongoingClass.endTime);
    return Math.max(0, endM - currentMinutes);
  }, [ongoingClass, currentMinutes]);

  // Detect next class
  const nextClassInfo = useMemo(() => {
    if (ongoingClass) {
      // Find class after ongoing
      const todayAfterOngoing = studentTimetableData
        .filter((slot) => {
          const slotDay = (slot.dayOfWeek || slot.day || '').toUpperCase();
          return slotDay === currentDayName && timeToMins(slot.startTime) >= timeToMins(ongoingClass.endTime);
        })
        .sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime));

      if (todayAfterOngoing.length > 0) {
        return { slot: todayAfterOngoing[0], label: 'Next Class Today' };
      }
    }

    // 1. Look for remaining classes today
    const todayUpcoming = studentTimetableData
      .filter((slot) => {
        const slotDay = (slot.dayOfWeek || slot.day || '').toUpperCase();
        return slotDay === currentDayName && timeToMins(slot.startTime) > currentMinutes;
      })
      .sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime));

    if (todayUpcoming.length > 0) {
      return { slot: todayUpcoming[0], label: 'Next Class Today' };
    }

    // 2. Look for upcoming classes on future days
    const dayIndexMap = { MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6, SUNDAY: 0 };
    const currentDayIdx = dayIndexMap[currentDayName] || 0;

    const sortedFuture = [...studentTimetableData]
      .filter((slot) => {
        const slotDay = (slot.dayOfWeek || slot.day || '').toUpperCase();
        return slotDay !== 'SUNDAY';
      })
      .sort((a, b) => {
        const dayA = dayIndexMap[(a.dayOfWeek || a.day || '').toUpperCase()] || 0;
        const dayB = dayIndexMap[(b.dayOfWeek || b.day || '').toUpperCase()] || 0;
        const diffA = (dayA - currentDayIdx + 7) % 7 || 7;
        const diffB = (dayB - currentDayIdx + 7) % 7 || 7;
        if (diffA !== diffB) return diffA - diffB;
        return timeToMins(a.startTime) - timeToMins(b.startTime);
      });

    if (sortedFuture.length > 0) {
      const targetDay = (sortedFuture[0].dayOfWeek || sortedFuture[0].day || '').toLowerCase();
      const capitalizedDay = targetDay.charAt(0).toUpperCase() + targetDay.slice(1);
      return { slot: sortedFuture[0], label: `Next Class (${capitalizedDay})` };
    }

    return null;
  }, [studentTimetableData, currentDayName, currentMinutes, ongoingClass]);

  // Statistics summaries
  const totalClassesPerWeek = studentTimetableData.length;
  const uniqueSubjectsCount = new Set(
    studentTimetableData.map((s) => s.subjectCode || s.subjectId?.code || s.subjectName || s.subjectId?.name)
  ).size;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3.5 }}>
      {/* Header Bar */}
      <Box
        sx={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
              My Class Timetable
            </Typography>

            <Chip
              icon={shift === 'EVENING' ? <EveningIcon fontSize="small" /> : <MorningIcon fontSize="small" />}
              label={shift === 'EVENING' ? 'Evening Shift' : 'Morning Shift'}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 800 }}
            />

            <Chip
              icon={<ClassIcon fontSize="small" />}
              label={`Group ${group}`}
              size="small"
              sx={{ fontWeight: 700, bgcolor: isDark ? 'action.hover' : 'rgba(79, 70, 229, 0.08)', color: 'primary.main' }}
            />

            {isArchivedView && (
              <Chip
                label={`SEMESTER ${selectedSemester} ARCHIVED`}
                color="warning"
                size="small"
                sx={{ fontWeight: 800 }}
              />
            )}
          </Box>

          <Typography variant="body1" color="text.secondary">
            Week-at-a-Glance Matrix for Course <strong>{studentMeta?.course || 'B.Tech'}</strong> (Sem{' '}
            {studentMeta?.semester || 6}) • Branch <strong>{studentMeta?.branch || 'Computer Science'}</strong>
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          {/* Week Navigation Controls */}
          <Paper
            elevation={0}
            sx={{
              display: 'flex',
              alignItems: 'center',
              borderRadius: '12px',
              border: `1px solid ${theme.palette.divider}`,
              p: 0.5,
              bgcolor: isDark ? 'background.paper' : '#ffffff',
            }}
          >
            <Tooltip title="Previous Week">
              <IconButton size="small" onClick={() => setWeekOffset((prev) => prev - 1)}>
                <PrevIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Button
              size="small"
              onClick={() => setWeekOffset(0)}
              sx={{
                px: 1.5,
                fontWeight: 700,
                fontSize: '0.78rem',
                textTransform: 'none',
                color: weekOffset === 0 ? 'primary.main' : 'text.secondary',
              }}
            >
              {weekOffset === 0 ? 'Current Week' : 'Reset to Today'}
            </Button>

            <Tooltip title="Next Week">
              <IconButton size="small" onClick={() => setWeekOffset((prev) => prev + 1)}>
                <NextIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Paper>

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
      </Box>

      {/* Week Selector Banner */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <CalendarIcon sx={{ fontSize: 20, color: 'primary.main' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
          {weekDateRangeLabel}
        </Typography>
        {weekOffset === 0 && (
          <Chip
            label={`Today is ${currentDayName}`}
            size="small"
            sx={{
              fontWeight: 800,
              fontSize: '0.7rem',
              bgcolor: theme.palette.primary.main,
              color: '#ffffff',
            }}
          />
        )}
      </Box>

      {/* Ongoing Class & Next Class Live Status Banner */}
      {(ongoingClass || nextClassInfo) && (
        <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
          {/* Ongoing Class Card */}
          {ongoingClass && (
            <Grid item xs={12} md={nextClassInfo ? 6 : 12}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: '16px',
                  border: `2px solid ${theme.palette.success.main}`,
                  bgcolor: isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.04)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Chip
                    icon={<LiveDotIcon sx={{ fontSize: '10px !important', color: '#fff !important' }} />}
                    label="ONGOING NOW"
                    size="small"
                    sx={{
                      fontWeight: 800,
                      fontSize: '0.68rem',
                      bgcolor: theme.palette.success.main,
                      color: '#ffffff',
                      letterSpacing: '0.04em',
                    }}
                  />
                  {ongoingRemainingMins !== null && (
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'success.main' }}>
                      {ongoingRemainingMins} mins remaining
                    </Typography>
                  )}
                </Box>

                <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
                  {ongoingClass.subjectName || ongoingClass.subjectId?.name || 'Class Session'}
                  {(ongoingClass.subjectCode || ongoingClass.subjectId?.code) && (
                    <Typography component="span" sx={{ ml: 1, fontWeight: 700, color: 'text.secondary', fontSize: '0.9rem' }}>
                      ({ongoingClass.subjectCode || ongoingClass.subjectId?.code})
                    </Typography>
                  )}
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <TimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                      {ongoingClass.startTime} – {ongoingClass.endTime}
                    </Typography>
                  </Box>

                  {(ongoingClass.roomNumber || ongoingClass.room) && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <RoomIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                        Venue: {ongoingClass.roomNumber || ongoingClass.room}
                      </Typography>
                    </Box>
                  )}

                  {(ongoingClass.facultyName || ongoingClass.facultyId?.name) && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <FacultyIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                        Faculty: {ongoingClass.facultyName || ongoingClass.facultyId?.name}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>
          )}

          {/* Next Class Summary Card */}
          {nextClassInfo && (
            <Grid item xs={12} md={ongoingClass ? 6 : 12}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: '16px',
                  border: `1px solid ${theme.palette.divider}`,
                  bgcolor: isDark ? 'background.paper' : '#ffffff',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Chip
                    icon={<UpcomingIcon fontSize="small" />}
                    label={nextClassInfo.label}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 800, fontSize: '0.68rem' }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    Up Next
                  </Typography>
                </Box>

                <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
                  {nextClassInfo.slot.subjectName || nextClassInfo.slot.subjectId?.name || 'Upcoming Class'}
                  {(nextClassInfo.slot.subjectCode || nextClassInfo.slot.subjectId?.code) && (
                    <Typography component="span" sx={{ ml: 1, fontWeight: 700, color: 'text.secondary', fontSize: '0.9rem' }}>
                      ({nextClassInfo.slot.subjectCode || nextClassInfo.slot.subjectId?.code})
                    </Typography>
                  )}
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <TimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                      {nextClassInfo.slot.startTime} – {nextClassInfo.slot.endTime}
                    </Typography>
                  </Box>

                  {(nextClassInfo.slot.roomNumber || nextClassInfo.slot.room) && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <RoomIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                        Venue: {nextClassInfo.slot.roomNumber || nextClassInfo.slot.room}
                      </Typography>
                    </Box>
                  )}

                  {(nextClassInfo.slot.facultyName || nextClassInfo.slot.facultyId?.name) && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <FacultyIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                        Faculty: {nextClassInfo.slot.facultyName || nextClassInfo.slot.facultyId?.name}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* Overview Stats Quick Summary Bar */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: '12px', border: `1px solid ${theme.palette.divider}`, bgcolor: isDark ? 'background.paper' : '#ffffff' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              WEEKLY LECTURES
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main', mt: 0.5 }}>
              {isLoading ? <Skeleton width={40} /> : `${totalClassesPerWeek} Sessions`}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: '12px', border: `1px solid ${theme.palette.divider}`, bgcolor: isDark ? 'background.paper' : '#ffffff' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              ENROLLED SUBJECTS
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5 }}>
              {isLoading ? <Skeleton width={40} /> : `${uniqueSubjectsCount} Subjects`}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: '12px', border: `1px solid ${theme.palette.divider}`, bgcolor: isDark ? 'background.paper' : '#ffffff' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              MY GROUP / BATCH
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5 }}>
              Group {group}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: '12px', border: `1px solid ${theme.palette.divider}`, bgcolor: isDark ? 'background.paper' : '#ffffff' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              TIMETABLE SHIFT
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5 }}>
              {shift === 'EVENING' ? 'Evening' : 'Morning'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Main Timetable Grid Component or States */}
      {isLoading ? (
        <Paper sx={{ p: 4, borderRadius: '20px', border: `1px solid ${theme.palette.divider}` }}>
          <Skeleton variant="text" width="30%" height={32} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={360} sx={{ borderRadius: '12px' }} />
        </Paper>
      ) : isError ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '20px', border: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h6" color="error" sx={{ fontWeight: 800, mb: 1 }}>
            Unable to Load Timetable
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Failed to retrieve schedule data for your cohort. Please check your internet connection and try again.
          </Typography>
          <Button variant="outlined" color="primary" onClick={() => refetch()} sx={{ borderRadius: '10px', fontWeight: 700 }}>
            Retry Loading
          </Button>
        </Paper>
      ) : studentTimetableData.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '20px', border: `1px solid ${theme.palette.divider}` }}>
          <CalendarIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
            No Timetable Slots Scheduled
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 480, mx: 'auto' }}>
            No class schedule has been published for Group <strong>{group}</strong> in Course{' '}
            <strong>{studentMeta?.course || 'B.Tech'}</strong> (Sem {studentMeta?.semester || 6}). Please contact your department coordinator if you believe this is an error.
          </Typography>
        </Paper>
      ) : (
        <TimetableGrid
          timetableData={studentTimetableData}
          defaultShift={shift}
          hideShiftToggle={true}
          todayDay={weekOffset === 0 ? currentDayName : null}
          ongoingSlotId={ongoingClass?._id || ongoingClass?.id}
        />
      )}
    </Container>
  );
};

export default StudentTimetablePage;
