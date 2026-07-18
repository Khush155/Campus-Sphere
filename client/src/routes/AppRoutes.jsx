import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import Home from '../pages/Home';
import LoginPage from '../pages/auth/LoginPage';
import AdmissionPortal from '../pages/public/AdmissionPortal';
import { useAuth } from '../contexts/AuthContext';
import { Typography, Paper, CircularProgress, Box } from '@mui/material';
import RoleRoute from './RoleRoute';
import AdminDashboard from '../pages/admin/AdminDashboard';
import SetupHub from '../pages/admin/CollegeSetup/SetupHub';
import AdmissionQueue from '../pages/admin/StudentManagement/AdmissionQueue';
import FeeManagementHub from '../pages/admin/Finance/FeeManagementHub';
import StudentFeePortal from '../pages/student/StudentFeePortal';
import StudentDashboard from '../pages/student/StudentDashboard';
import StudentProfile from '../pages/student/StudentProfile';
import StudentAcademics from '../pages/student/StudentAcademics';
import StudentTimetable from '../pages/student/StudentTimetable';
import UserRoster from '../pages/admin/UserManagement/UserRoster';
import SetupWizard from '../pages/admin/SetupWizard';
import { useDepartmentsQuery } from '../queries/collegeQueries';
import HodDashboard from '../pages/hod/HodDashboard';
import AssignmentHub from '../pages/hod/FacultyAssignment/AssignmentHub';
import RosterHub from '../pages/hod/Roster/RosterHub';
import ReportsHub from '../pages/hod/Reports/ReportsHub';
import TimetableHub from '../pages/hod/Timetable/TimetableHub';
import RequestHub from '../pages/hod/CrossDeptRequests/RequestHub';
import AcademicCalendarHub from '../pages/admin/AcademicCalendarHub';
import FacultyAttendanceHub from '../pages/faculty/FacultyAttendanceHub';
import StudentAttendancePortal from '../pages/student/StudentAttendancePortal';
// HOD pages now loaded via HodDashboard tabs

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
  if (user?.role === 'STUDENT') {
    return <StudentDashboard />;
  }
  return <Home />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/apply" element={<AdmissionPortal />} />

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
        <Route
          path="hod/overview"
          element={
            <RoleRoute allowedRoles={['HOD']}>
              <HodDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="hod/faculty-assignment"
          element={
            <RoleRoute allowedRoles={['HOD']}>
              <Box sx={{ p: { xs: 1, sm: 3 } }}>
                <AssignmentHub />
              </Box>
            </RoleRoute>
          }
        />
        <Route
          path="hod/cross-dept-requests"
          element={
            <RoleRoute allowedRoles={['HOD']}>
              <RequestHub />
            </RoleRoute>
          }
        />
        <Route
          path="hod/timetable"
          element={
            <RoleRoute allowedRoles={['HOD']}>
              <TimetableHub />
            </RoleRoute>
          }
        />
        <Route
          path="hod/roster"
          element={
            <RoleRoute allowedRoles={['HOD']}>
              <RosterHub />
            </RoleRoute>
          }
        />
        <Route
          path="hod/reports"
          element={
            <RoleRoute allowedRoles={['HOD']}>
              <ReportsHub />
            </RoleRoute>
          }
        />

        <Route
          path="admin/calendar"
          element={
            <RoleRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN']}>
              <AcademicCalendarHub />
            </RoleRoute>
          }
        />
        <Route
          path="faculty/attendance"
          element={
            <RoleRoute allowedRoles={['FACULTY']}>
              <FacultyAttendanceHub />
            </RoleRoute>
          }
        />
        <Route
          path="student/attendance"
          element={
            <RoleRoute allowedRoles={['STUDENT']}>
              <StudentAttendancePortal />
            </RoleRoute>
          }
        />
        <Route path="student/profile" element={<RoleRoute allowedRoles={['STUDENT']}><StudentProfile /></RoleRoute>} />
        <Route path="student/academics" element={<RoleRoute allowedRoles={['STUDENT']}><StudentAcademics /></RoleRoute>} />
        <Route path="student/timetable" element={<RoleRoute allowedRoles={['STUDENT']}><StudentTimetable /></RoleRoute>} />
        <Route path="student/assignments" element={<RoleRoute allowedRoles={['STUDENT']}><PlaceholderView title="Assignments" /></RoleRoute>} />
        <Route path="student/examinations" element={<RoleRoute allowedRoles={['STUDENT']}><PlaceholderView title="Examinations" /></RoleRoute>} />
        <Route path="student/projects" element={<RoleRoute allowedRoles={['STUDENT']}><PlaceholderView title="Projects" /></RoleRoute>} />
        <Route path="student/placements" element={<RoleRoute allowedRoles={['STUDENT']}><PlaceholderView title="Placements" /></RoleRoute>} />
        <Route path="student/library" element={<RoleRoute allowedRoles={['STUDENT']}><PlaceholderView title="Library" /></RoleRoute>} />
        <Route path="student/leave" element={<RoleRoute allowedRoles={['STUDENT']}><PlaceholderView title="Leave Application" /></RoleRoute>} />
        <Route path="student/documents" element={<RoleRoute allowedRoles={['STUDENT']}><PlaceholderView title="Documents" /></RoleRoute>} />
        <Route path="student/complaints" element={<RoleRoute allowedRoles={['STUDENT']}><PlaceholderView title="Complaints / Grievances" /></RoleRoute>} />
        <Route path="student/notifications" element={<RoleRoute allowedRoles={['STUDENT']}><PlaceholderView title="Notifications" /></RoleRoute>} />
        <Route path="student/settings" element={<RoleRoute allowedRoles={['STUDENT']}><PlaceholderView title="Settings" /></RoleRoute>} />

        <Route path="students" element={<PlaceholderView title="Students" />} />
        <Route path="faculty" element={<PlaceholderView title="Faculty" />} />
        <Route path="attendance" element={<PlaceholderView title="Attendance" />} />
        <Route path="fees" element={<StudentFeePortal />} />
        <Route path="notices" element={<PlaceholderView title="Notice Board" />} />
        <Route
          path="admin/admissions"
          element={
            <RoleRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN']}>
              <AdmissionQueue />
            </RoleRoute>
          }
        />
        <Route
          path="admin/fees"
          element={
            <RoleRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN']}>
              <FeeManagementHub />
            </RoleRoute>
          }
        />
      </Route>

      {/* Wildcard Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
