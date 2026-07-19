// client/src/pages/faculty/FacultyDashboard.jsx
//
// Main Faculty Dashboard page with backend integration.

import React from 'react';
import { Box, Grid, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  MenuBook as SubjectsIcon,
  Schedule as ClassesIcon,
  CheckCircle as AttendanceIcon,
  Assignment as EvaluationIcon,
  FactCheck as MarkAttendanceIcon,
  NoteAdd as CreateAssignmentIcon,
  Upload as UploadMarksIcon,
  CalendarMonth as ViewScheduleIcon,
  Groups as ViewStudentsIcon,
  EventBusy as LeaveIcon,
} from '@mui/icons-material';

// Faculty dashboard components
import WelcomeCard from './components/WelcomeCard';
import StatCard from './components/StatCard';
import ProfileCard from './components/ProfileCard';
import AssignedSubjects from './components/AssignedSubjects';
import TodaysSchedule from './components/TodaysSchedule';
import NoticesAndEvents from './components/NoticesAndEvents';
import WeeklySchedule from './components/WeeklySchedule';
import QuickActions from './components/QuickActions';

// Import backend hook
import { useFacultyDashboardQuery } from '../../queries/facultyQueries';

const statCardConfig = [
  { icon: <SubjectsIcon sx={{ fontSize: 40 }} />, color: '#4f46e5' },
  { icon: <ClassesIcon sx={{ fontSize: 40 }} />, color: '#06b6d4' },
  { icon: <AttendanceIcon sx={{ fontSize: 40 }} />, color: '#10b981' },
  { icon: <EvaluationIcon sx={{ fontSize: 40 }} />, color: '#f59e0b' },
];

export const FacultyDashboard = () => {
  const navigate = useNavigate();
  const { data, isLoading, error } = useFacultyDashboardQuery();

  const quickActionsConfig = [
    { id: 'attendance', label: 'Mark Attendance', description: 'Daily class attendance', icon: <MarkAttendanceIcon />, color: '#4f46e5', onClick: () => navigate('/attendance') },
    { id: 'assignment', label: 'Create Assignment', description: 'New assignment', icon: <CreateAssignmentIcon />, color: '#06b6d4', onClick: () => navigate('/assignments') },
    { id: 'marks', label: 'Upload Marks', description: 'Exam results', icon: <UploadMarksIcon />, color: '#10b981', onClick: () => navigate('/marks') },
    { id: 'schedule', label: 'View Schedule', description: 'Full timetable', icon: <ViewScheduleIcon />, color: '#f59e0b', onClick: () => navigate('/timetable') },
    { id: 'students', label: 'View Students', description: 'Class roster', icon: <ViewStudentsIcon />, color: '#8b5cf6', onClick: () => navigate('/students') },
    { id: 'leave', label: 'Apply Leave', description: 'Leave request', icon: <LeaveIcon />, color: '#ef4444' },
  ];

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        Failed to load dashboard data. Please try again.
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* ── Row 1: Welcome Header ── */}
      <WelcomeCard
        facultyName={data.facultyName}
        designation={data.designation}
      />

      {/* ── Row 2: Quick Statistics ── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {data.stats.map((stat, index) => (
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

      {/* ── Row 3: Profile + Assigned Subjects ── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Left: Faculty Profile Card */}
        <Grid item xs={12} md={4}>
          <ProfileCard profile={data.profile} />
        </Grid>

        {/* Right: Assigned Subjects List */}
        <Grid item xs={12} md={8}>
          <AssignedSubjects subjects={data.assignedSubjects} />
        </Grid>
      </Grid>

      {/* ── Row 4: Today's Schedule + Notices & Events ── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <TodaysSchedule classes={data.todaysClasses} />
        </Grid>
        <Grid item xs={12} md={6}>
          <NoticesAndEvents
            notices={data.recentNotices}
            events={data.upcomingEvents}
          />
        </Grid>
      </Grid>

      {/* ── Row 5: Weekly Schedule ── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <WeeklySchedule schedule={data.weeklySchedule} />
        </Grid>
      </Grid>

      {/* ── Row 6: Quick Actions ── */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <QuickActions actions={quickActionsConfig} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default FacultyDashboard;
