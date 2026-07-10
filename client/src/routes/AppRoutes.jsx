/* eslint-disable */
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import Home from '../pages/Home';
import LoginPage from '../pages/auth/LoginPage';
import { useAuth } from '../contexts/AuthContext';
import { Typography, Paper, CircularProgress, Box } from '@mui/material';
import RoleRoute from './RoleRoute';
import AdminDashboard from '../pages/admin/AdminDashboard';
import SetupHub from '../pages/admin/CollegeSetup/SetupHub';
import UserRoster from '../pages/admin/UserManagement/UserRoster';
import SetupWizard from '../pages/admin/SetupWizard';
import { useDepartmentsQuery } from '../queries/collegeQueries';
import HodDashboard from '../pages/hod/HodDashboard';
import AssignmentHub from '../pages/hod/FacultyAssignment/AssignmentHub';
import RosterHub from '../pages/hod/Roster/RosterHub';
import ReportsHub from '../pages/hod/Reports/ReportsHub';
import TimetableHub from '../pages/hod/Timetable/TimetableHub';
import RequestHub from '../pages/hod/CrossDeptRequests/RequestHub';
import FacultyDashboard from '../pages/faculty/FacultyDashboard';
import AttendancePage from '../pages/faculty/attendance/AttendancePage';
import AssignmentPage from '../pages/faculty/assignments/AssignmentPage';
import ExamPage from '../pages/faculty/exams/ExamPage';
import MarksPage from '../pages/faculty/marks/MarksPage';
import TimetablePage from '../pages/faculty/timetable/TimetablePage';
import FacultyStudentListPage from '../pages/faculty/students/FacultyStudentListPage';

import HodFacultyHub from '../pages/hod/Faculty/HodFacultyHub';
import HodStudentsHub from '../pages/hod/Students/HodStudentsHub';
import HodSubjectsHub from '../pages/hod/Subjects/HodSubjectsHub';
import HodAttendanceHub from '../pages/hod/AttendanceHub/HodAttendanceHub';
import HodExaminationsHub from '../pages/hod/ExaminationsHub/HodExaminationsHub';
import HodProjectsHub from '../pages/hod/ProjectsHub/HodProjectsHub';
import HodPlacementsHub from '../pages/hod/PlacementsHub/HodPlacementsHub';
import HodLeaveHub from '../pages/hod/LeaveHub/HodLeaveHub';
import HodNoticesHub from '../pages/hod/NoticesHub/HodNoticesHub';
import HodComplaintsHub from '../pages/hod/ComplaintsHub/HodComplaintsHub';
import HodDocumentsHub from '../pages/hod/DocumentsHub/HodDocumentsHub';
import HodMeetingsHub from '../pages/hod/MeetingsHub/HodMeetingsHub';
import HodOpportunitiesHub from '../pages/hod/OpportunitiesHub/HodOpportunitiesHub';
import HodFeedbackHub from '../pages/hod/FeedbackHub/HodFeedbackHub';

import NoticeBoard from '../pages/admin/NoticeBoard/NoticeBoard';
import { AcademicCalendar } from '../pages/admin/AcademicCalendar/AcademicCalendar';
import { CollegeProfile } from '../pages/admin/CollegeProfile/CollegeProfile';
import { AuditLogViewer } from '../pages/admin/AuditLog/AuditLogViewer';
import { BulkPromotion } from '../pages/admin/BulkPromotion/BulkPromotion';
import { Certificates } from '../pages/admin/Certificates/Certificates';
import { Reports } from '../pages/admin/Reports/Reports';

// Newly added Expanded Faculty pages
import MaterialsPage from '../pages/faculty/materials/MaterialsPage';
import ProfilePage from '../pages/faculty/profile/ProfilePage';
import AnalyticsPage from '../pages/faculty/analytics/AnalyticsPage';
import NotificationPage from '../pages/faculty/notifications/NotificationPage';
import SearchPage from '../pages/faculty/search/SearchPage';
import SettingsPage from '../pages/faculty/settings/SettingsPage';

// Guard for authenticated sections
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress size={50} />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Guard to enforce setup wizard on empty database
const AdminSetupGuard = ({ children }) => {
  const { data: depts, isLoading } = useDepartmentsQuery();
  const skipped = localStorage.getItem('skip_setup_wizard') === 'true';

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress size={50} />
      </Box>
    );
  }

  // If there are zero departments and the user has not skipped, redirect to Setup Wizard
  if ((!depts || depts.length === 0) && !skipped) {
    return <Navigate to="/admin/setup-wizard" replace />;
  }

  return children;
};

// Guard for guest-only sections (like login page)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress size={50} />
      </Box>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Placeholder component for views under construction
const PlaceholderView = ({ title }) => (
  <Paper sx={{ p: 4, textAlign: 'center' }}>
    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
      {title} Module
    </Typography>
    <Typography variant="body1" color="text.secondary">
      This section is under construction. It will be implemented in subsequent phases.
    </Typography>
  </Paper>
);

const HomeRedirect = () => {
  const { user } = useAuth();
  if (user?.role === 'SUPER_ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (user?.role === 'HOD') {
    return <Navigate to="/hod/overview" replace />;
  }
  return <Home />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

      {/* Protected Layout Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomeRedirect />} />
        
        {/* Super Admin Workspace Routes */}
        <Route
          path="admin/dashboard"
          element={
            <RoleRoute allowedRoles={['SUPER_ADMIN']}>
              <AdminSetupGuard>
                <AdminDashboard />
              </AdminSetupGuard>
            </RoleRoute>
          }
        />
        <Route
          path="admin/setup-wizard"
          element={
            <RoleRoute allowedRoles={['SUPER_ADMIN']}>
              <SetupWizard />
            </RoleRoute>
          }
        />
        <Route
          path="admin/college-setup"
          element={
            <RoleRoute allowedRoles={['SUPER_ADMIN']}>
              <Navigate to="/admin/college-setup/departments" replace />
            </RoleRoute>
          }
        />
        <Route
          path="admin/college-setup/:tab"
          element={
            <RoleRoute allowedRoles={['SUPER_ADMIN']}>
              <SetupHub />
            </RoleRoute>
          }
        />
        <Route
          path="admin/users"
          element={
            <RoleRoute allowedRoles={['SUPER_ADMIN']}>
              <AdminSetupGuard>
                <UserRoster />
              </AdminSetupGuard>
            </RoleRoute>
          }
        />

        {/* HOD Workspace Routes */}
        <Route path="hod/overview" element={<RoleRoute allowedRoles={['HOD']}><HodDashboard /></RoleRoute>} />
        <Route path="hod/faculty" element={<RoleRoute allowedRoles={['HOD']}><HodFacultyHub /></RoleRoute>} />
        <Route path="hod/faculty-assignment" element={<RoleRoute allowedRoles={['HOD']}><AssignmentHub /></RoleRoute>} />
        <Route path="hod/students" element={<RoleRoute allowedRoles={['HOD']}><HodStudentsHub /></RoleRoute>} />
        <Route path="hod/subjects" element={<RoleRoute allowedRoles={['HOD']}><HodSubjectsHub /></RoleRoute>} />
        <Route path="hod/feedback" element={<RoleRoute allowedRoles={['HOD']}><HodFeedbackHub /></RoleRoute>} />
        <Route path="hod/timetable" element={<RoleRoute allowedRoles={['HOD']}><TimetableHub /></RoleRoute>} />
        <Route path="hod/cross-dept-requests" element={<RoleRoute allowedRoles={['HOD']}><RequestHub /></RoleRoute>} />
        <Route path="hod/attendance" element={<RoleRoute allowedRoles={['HOD']}><HodAttendanceHub /></RoleRoute>} />
        <Route path="hod/examinations" element={<RoleRoute allowedRoles={['HOD']}><HodExaminationsHub /></RoleRoute>} />
        <Route path="hod/projects" element={<RoleRoute allowedRoles={['HOD']}><HodProjectsHub /></RoleRoute>} />
        <Route path="hod/placements" element={<RoleRoute allowedRoles={['HOD']}><HodPlacementsHub /></RoleRoute>} />
        <Route path="hod/leave-management" element={<RoleRoute allowedRoles={['HOD']}><HodLeaveHub /></RoleRoute>} />
        <Route path="hod/notices" element={<RoleRoute allowedRoles={['HOD']}><HodNoticesHub /></RoleRoute>} />
        <Route path="hod/reports" element={<RoleRoute allowedRoles={['HOD']}><ReportsHub /></RoleRoute>} />
        <Route path="hod/complaints" element={<RoleRoute allowedRoles={['HOD']}><HodComplaintsHub /></RoleRoute>} />
        <Route path="hod/documents" element={<RoleRoute allowedRoles={['HOD']}><HodDocumentsHub /></RoleRoute>} />
        <Route path="hod/meetings" element={<RoleRoute allowedRoles={['HOD']}><HodMeetingsHub /></RoleRoute>} />
        <Route path="hod/opportunities" element={<RoleRoute allowedRoles={['HOD']}><HodOpportunitiesHub /></RoleRoute>} />

        <Route
          path="admin/notices"
          element={
            <RoleRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN']}>
              <AdminSetupGuard>
                <NoticeBoard />
              </AdminSetupGuard>
            </RoleRoute>
          }
        />
        <Route
          path="admin/academic-calendar"
          element={
            <RoleRoute allowedRoles={['SUPER_ADMIN']}>
              <AdminSetupGuard>
                <AcademicCalendar />
              </AdminSetupGuard>
            </RoleRoute>
          }
        />

        <Route
          path="admin/college-profile"
          element={
            <RoleRoute allowedRoles={['SUPER_ADMIN']}>
              <AdminSetupGuard>
                <CollegeProfile />
              </AdminSetupGuard>
            </RoleRoute>
          }
        />

        <Route
          path="admin/audit-logs"
          element={
            <RoleRoute allowedRoles={['SUPER_ADMIN']}>
              <AdminSetupGuard>
                <AuditLogViewer />
              </AdminSetupGuard>
            </RoleRoute>
          }
        />

        <Route
          path="admin/bulk-promotion"
          element={
            <RoleRoute allowedRoles={['SUPER_ADMIN']}>
              <AdminSetupGuard>
                <BulkPromotion />
              </AdminSetupGuard>
            </RoleRoute>
          }
        />

        <Route
          path="admin/certificates"
          element={
            <RoleRoute allowedRoles={['SUPER_ADMIN']}>
              <AdminSetupGuard>
                <Certificates />
              </AdminSetupGuard>
            </RoleRoute>
          }
        />

        <Route
          path="admin/reports"
          element={
            <RoleRoute allowedRoles={['SUPER_ADMIN']}>
              <AdminSetupGuard>
                <Reports />
              </AdminSetupGuard>
            </RoleRoute>
          }
        />

        <Route path="students" element={<RoleRoute allowedRoles={['FACULTY']}><FacultyStudentListPage /></RoleRoute>} />
        <Route path="faculty" element={<RoleRoute allowedRoles={['FACULTY']}><FacultyDashboard /></RoleRoute>} />
        <Route path="attendance" element={<RoleRoute allowedRoles={['FACULTY']}><AttendancePage /></RoleRoute>} />
        <Route path="assignments" element={<RoleRoute allowedRoles={['FACULTY']}><AssignmentPage /></RoleRoute>} />
        <Route path="exams" element={<RoleRoute allowedRoles={['FACULTY']}><ExamPage /></RoleRoute>} />
        <Route path="marks" element={<RoleRoute allowedRoles={['FACULTY']}><MarksPage /></RoleRoute>} />
        <Route path="timetable" element={<RoleRoute allowedRoles={['FACULTY']}><TimetablePage /></RoleRoute>} />
        <Route path="materials" element={<RoleRoute allowedRoles={['FACULTY']}><MaterialsPage /></RoleRoute>} />
        <Route path="profile" element={<RoleRoute allowedRoles={['FACULTY']}><ProfilePage /></RoleRoute>} />
        <Route path="analytics" element={<RoleRoute allowedRoles={['FACULTY']}><AnalyticsPage /></RoleRoute>} />
        <Route path="notifications" element={<RoleRoute allowedRoles={['FACULTY']}><NotificationPage /></RoleRoute>} />
        <Route path="search" element={<RoleRoute allowedRoles={['FACULTY']}><SearchPage /></RoleRoute>} />
        <Route path="settings" element={<RoleRoute allowedRoles={['FACULTY']}><SettingsPage /></RoleRoute>} />
        <Route path="fees" element={<PlaceholderView title="Fees" />} />
        <Route path="notices" element={<PlaceholderView title="Notice Board" />} />
      </Route>

      {/* Wildcard Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
