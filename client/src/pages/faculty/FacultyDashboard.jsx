import React from 'react';
import { Box, Grid, CircularProgress, Typography } from '@mui/material';
import {
  MenuBookOutlined as SubjectsIcon,
  ScheduleOutlined as ClassesIcon,
  CheckCircleOutlined as AttendanceIcon,
  AssignmentOutlined as EvaluationIcon,
} from '@mui/icons-material';

// Faculty dashboard components
import WelcomeCard from './components/WelcomeCard';
import StatCard from './components/StatCard';
import ProfileCard from './components/ProfileCard';
import AssignedSubjects from './components/AssignedSubjects';
import TodaysSchedule from './components/TodaysSchedule';
import NoticesAndEvents from './components/NoticesAndEvents';
import WeeklySchedule from './components/WeeklySchedule';

// Import backend hook
import { useFacultyDashboardQuery } from '../../queries/facultyQueries';

const statCardConfig = [
  { icon: <SubjectsIcon sx={{ fontSize: 22 }} />, color: '#4f46e5' },
  { icon: <ClassesIcon sx={{ fontSize: 22 }} />, color: '#06b6d4' },
  { icon: <AttendanceIcon sx={{ fontSize: 22 }} />, color: '#10b981' },
  { icon: <EvaluationIcon sx={{ fontSize: 22 }} />, color: '#f59e0b' },
];

export const FacultyDashboard = () => {
  const { data, isLoading, error } = useFacultyDashboardQuery();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={36} />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error" sx={{ fontWeight: 700 }}>
          Failed to load faculty dashboard metrics. Please refresh or check session.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* ── 1. Hero Welcome Banner ── */}
      <WelcomeCard
        facultyName={data.facultyName}
        designation={data.designation}
        departmentName={data.profile?.department?.name}
      />

      {/* ── 2. Top Summary KPI Stats ── */}
      <Grid container spacing={2.5}>
        {(data.stats || []).map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <StatCard
              title={stat.title}
              value={stat.value}
              icon={statCardConfig[index]?.icon}
              color={statCardConfig[index]?.color}
            />
          </Grid>
        ))}
      </Grid>

      {/* ── 3. Main Dashboard Body: 2-Column Split (7:5) ── */}
      <Grid container spacing={3}>
        {/* Left Column (7 Units) — Schedules & Assigned Subjects */}
        <Grid item xs={12} lg={7} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Today's Teaching Schedule (compact banner if no classes today) */}
          <TodaysSchedule classes={data.todaysClasses || []} />

          {/* Assigned Subjects Roster */}
          <AssignedSubjects subjects={data.assignedSubjects || []} />

          {/* Weekly Timetable Matrix */}
          <WeeklySchedule schedule={data.weeklySchedule || {}} />
        </Grid>

        {/* Right Column (5 Units) — Profile & Notices */}
        <Grid item xs={12} lg={5} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Faculty Profile Card */}
          <ProfileCard profile={data.profile} />

          {/* Department Notices Feed */}
          <NoticesAndEvents
            notices={data.recentNotices || []}
            events={data.upcomingEvents || []}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default FacultyDashboard;
