import React from 'react';
import { Box, Grid, CircularProgress, Typography } from '@mui/material';
import {
  MenuBookOutlined as SubjectsIcon,
  ScheduleOutlined as ClassesIcon,
  CheckCircleOutlined as AttendanceIcon,
  AssignmentOutlined as EvaluationIcon,
  FactCheckOutlined,
  FolderOpenOutlined,
  GradeOutlined,
  AssignmentTurnedInOutlined,
  EventNoteOutlined,
  GroupsOutlined,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

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
  { icon: <SubjectsIcon sx={{ fontSize: 22 }} />, color: '#4f46e5' },
  { icon: <ClassesIcon sx={{ fontSize: 22 }} />, color: '#06b6d4' },
  { icon: <AttendanceIcon sx={{ fontSize: 22 }} />, color: '#10b981' },
  { icon: <EvaluationIcon sx={{ fontSize: 22 }} />, color: '#f59e0b' },
];

export const FacultyDashboard = () => {
  const { data, isLoading, error } = useFacultyDashboardQuery();
  const navigate = useNavigate();

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

  const quickActionItems = [
    {
      id: 'attendance',
      label: 'Mark Attendance',
      description: 'Record daily lecture logs',
      icon: <FactCheckOutlined fontSize="small" />,
      color: '#10b981',
      onClick: () => navigate('/attendance'),
    },
    {
      id: 'materials',
      label: 'Study Materials',
      description: 'Upload syllabus & notes',
      icon: <FolderOpenOutlined fontSize="small" />,
      color: '#4f46e5',
      onClick: () => navigate('/materials'),
    },
    {
      id: 'marks',
      label: 'Enter Exam Marks',
      description: 'Submit internal & lab scores',
      icon: <GradeOutlined fontSize="small" />,
      color: '#f59e0b',
      onClick: () => navigate('/marks'),
    },
    {
      id: 'assignments',
      label: 'Course Assignments',
      description: 'Review student submissions',
      icon: <AssignmentTurnedInOutlined fontSize="small" />,
      color: '#06b6d4',
      onClick: () => navigate('/assignments'),
    },
    {
      id: 'leaves',
      label: 'Apply for Leave',
      description: 'Request academic leave',
      icon: <EventNoteOutlined fontSize="small" />,
      color: '#8b5cf6',
      onClick: () => navigate('/leaves'),
    },
    {
      id: 'meetings',
      label: 'Dept Meetings',
      description: 'Schedule & MOM records',
      icon: <GroupsOutlined fontSize="small" />,
      color: '#ec4899',
      onClick: () => navigate('/meetings'),
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
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

      {/* ── 3. Quick Navigation Actions Bar ── */}
      <QuickActions actions={quickActionItems} />

      {/* ── 4. Main Dashboard Body: Balanced 2-Column Split (6:6) ── */}
      <Grid container spacing={3}>
        {/* Left Column (6 Units) — Faculty Profile & Weekly Matrix */}
        <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Faculty Profile Card */}
          <ProfileCard profile={data.profile} />

          {/* Weekly Timetable Matrix Preview */}
          <WeeklySchedule schedule={data.weeklySchedule || {}} />
        </Grid>

        {/* Right Column (6 Units) — Today's Schedule, Assigned Subjects, Notices */}
        <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Today's Teaching Schedule */}
          <TodaysSchedule classes={data.todaysClasses || []} />

          {/* Assigned Subjects Roster */}
          <AssignedSubjects subjects={data.assignedSubjects || []} />

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
