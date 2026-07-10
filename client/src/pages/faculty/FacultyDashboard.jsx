// client/src/pages/faculty/FacultyDashboard.jsx
//
// Main Faculty Dashboard page — the container that assembles all dashboard
// components into a cohesive layout. This is what renders at the /faculty route.
//
// Architecture:
//   AppLayout (sidebar + AppBar)
//     └── <Outlet />
//           └── FacultyDashboard (this file)
//                 ├── WelcomeCard
//                 ├── StatCard × 4
//                 ├── ProfileCard
//                 ├── AssignedSubjects
//                 ├── TodaysSchedule
//                 ├── NoticesAndEvents
//                 ├── WeeklySchedule
//                 └── QuickActions
//
// Data: All data comes from mockData.js for now.
// Future: Replace mock imports with React Query hooks that fetch from
//         GET /api/v1/faculty/:id, GET /api/v1/timetable, etc.
//
// Layout follows the exact same Grid pattern as Home.jsx (Admin Dashboard).

import React from 'react';
import { Box, Grid } from '@mui/material';
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

// Mock data — will be replaced by React Query hooks in Phase 5.2+
import {
  mockFacultyProfile,
  mockAssignedSubjects,
  mockTodaysClasses,
  mockQuickStats,
  mockRecentNotices,
  mockUpcomingEvents,
  mockWeeklySchedule,
} from './mockData';

/**
 * Stat card configuration.
 *
 * mockQuickStats provides { title, value } but icons and colors are UI
 * concerns — they belong here in the page component, not in the data file.
 * React elements (icons) should never be stored in data/mock files.
 */
const statCardConfig = [
  { icon: <SubjectsIcon sx={{ fontSize: 40 }} />, color: '#4f46e5' },
  { icon: <ClassesIcon sx={{ fontSize: 40 }} />, color: '#06b6d4' },
  { icon: <AttendanceIcon sx={{ fontSize: 40 }} />, color: '#10b981' },
  { icon: <EvaluationIcon sx={{ fontSize: 40 }} />, color: '#f59e0b' },
];

export const FacultyDashboard = () => {
  const navigate = useNavigate();

  /**
   * Quick action shortcuts for faculty.
   * Defined inside the component so onClick can use navigate().
   * Other actions will get onClick handlers as their modules are built.
   */
  const quickActionsConfig = [
    { id: 'attendance', label: 'Mark Attendance', description: 'Daily class attendance', icon: <MarkAttendanceIcon />, color: '#4f46e5', onClick: () => navigate('/attendance') },
    { id: 'assignment', label: 'Create Assignment', description: 'New assignment', icon: <CreateAssignmentIcon />, color: '#06b6d4', onClick: () => navigate('/assignments') },
    { id: 'marks', label: 'Upload Marks', description: 'Exam results', icon: <UploadMarksIcon />, color: '#10b981', onClick: () => navigate('/marks') },
    { id: 'schedule', label: 'View Schedule', description: 'Full timetable', icon: <ViewScheduleIcon />, color: '#f59e0b', onClick: () => navigate('/timetable') },
    { id: 'students', label: 'View Students', description: 'Class roster', icon: <ViewStudentsIcon />, color: '#8b5cf6', onClick: () => navigate('/students') },
    { id: 'leave', label: 'Apply Leave', description: 'Leave request', icon: <LeaveIcon />, color: '#ef4444' },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* ── Row 1: Welcome Header ── */}
      <WelcomeCard
        facultyName={mockFacultyProfile.name}
        designation={mockFacultyProfile.designation}
      />

      {/* ── Row 2: Quick Statistics ── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {mockQuickStats.map((stat, index) => (
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
          <ProfileCard profile={mockFacultyProfile} />
        </Grid>

        {/* Right: Assigned Subjects List */}
        <Grid item xs={12} md={8}>
          <AssignedSubjects subjects={mockAssignedSubjects} />
        </Grid>
      </Grid>

      {/* ── Row 4: Today's Schedule + Notices & Events ── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <TodaysSchedule classes={mockTodaysClasses} />
        </Grid>
        <Grid item xs={12} md={6}>
          <NoticesAndEvents
            notices={mockRecentNotices}
            events={mockUpcomingEvents}
          />
        </Grid>
      </Grid>

      {/* ── Row 5: Weekly Schedule ── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <WeeklySchedule schedule={mockWeeklySchedule} />
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
