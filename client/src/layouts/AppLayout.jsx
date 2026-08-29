/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Chip,
  Button,
  Alert,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  DateRange as DateRangeIcon,
  ReceiptLong as ReceiptLongIcon,
  Notifications as NotificationsIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  Logout as LogoutIcon,
  Palette as PaletteIcon,
  Search as SearchIcon,
  AssignmentInd as AssignmentIndIcon,
  SwapHoriz as SwapHorizIcon,
  BarChart as BarChartIcon,
  MenuBook as MenuBookIcon,
  FactCheck as FactCheckIcon,
  Article as ArticleIcon,
  AccountTree as AccountTreeIcon,
  Work as WorkIcon,
  EventNote as EventNoteIcon,
  ReportProblem as ReportProblemIcon,
  Folder as FolderIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Campaign as CampaignIcon,
  LocalLibrary as LocalLibraryIcon,
  TrendingUp as TrendingUpIcon,
  Hotel as HotelIcon,
  Description as DescriptionIcon,
  Settings as SettingsIcon,
  Badge as BadgeIcon,
  PersonAdd as PersonAddIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  Groups as GroupsIcon,
  Public as PublicIcon,
  AccountBalance as AccountBalanceIcon,
  History as HistoryIcon,
  Autorenew as AutorenewIcon,
  CardMembership as CardMembershipIcon,
  Assessment as AssessmentIcon,
  CalendarToday as CalendarTodayIcon,
  Timeline as TimelineIcon,
  MenuBook as BookIcon,
  Refresh as RefreshIcon,
  Check as CheckIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  RateReview as RateReviewIcon,
} from '@mui/icons-material';
import { useQueryClient } from '@tanstack/react-query';
import { useThemeContext } from '../contexts/ThemeContext';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useStudentSession } from '../contexts/StudentSessionContext';
import CommandPalette from '../components/common/CommandPalette';
import { useCollegeProfileQuery } from '../queries/collegeProfileQueries';
import { useActiveSessionQuery } from '../queries/academicSessionQueries';
import { useMyProfileQuery } from '../queries/userProfileQueries';
import NotificationMenu from '../components/common/NotificationMenu';

const drawerWidth = 240;

export const AppLayout = () => {
  const { mode, toggleTheme, colorPreset, setColorPreset } = useThemeContext();
  const theme = useTheme();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [presetAnchorEl, setPresetAnchorEl] = useState(null);
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries();
      showToast('Data refreshed successfully!');
    } catch (err) {
      showToast('Failed to refresh data.', { severity: 'error' });
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  const { data: profile } = useCollegeProfileQuery();
  const { data: activeSession } = useActiveSessionQuery();
  const { data: myProfile } = useMyProfileQuery();

  // myProfile is now { user, profileMeta } — read the nested user object
  const currentUser = myProfile?.user || user;

  const getFullAvatarUrl = (relativeUrl) => {
    if (!relativeUrl) return undefined;
    if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://') || relativeUrl.startsWith('data:')) {
      return relativeUrl;
    }
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    const rootUrl = baseUrl.replace(/\/api\/v1\/?$/, '');
    const cleanRelative = relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`;
    return `${rootUrl}${cleanRelative}`;
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const {
    isStudent,
    activeSemester,
    selectedSemester,
    setSelectedSemester,
    isArchivedView,
    availableSemesters,
    resetToActive,
  } = useStudentSession();

  const [sessionAnchorEl, setSessionAnchorEl] = useState(null);

  const handleSessionMenuOpen = (e) => {
    setSessionAnchorEl(e.currentTarget);
  };
  const handleSessionMenuClose = () => {
    setSessionAnchorEl(null);
  };
  const handleSemesterSelect = (semNumber) => {
    setSelectedSemester(semNumber);
    handleSessionMenuClose();
  };

  const handlePresetMenuOpen = (event) => {
    setPresetAnchorEl(event.currentTarget);
  };

  const handlePresetMenuClose = () => {
    setPresetAnchorEl(null);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    await logout();
    navigate('/login');
  };

  const userRole = currentUser?.role || user?.role;

  const menuItems = (userRole === 'SUPER_ADMIN' || userRole === 'COLLEGE_ADMIN')
    ? [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard', roles: ['SUPER_ADMIN', 'COLLEGE_ADMIN'] },
        { text: 'College Setup', icon: <SchoolIcon />, path: '/admin/college-setup/departments', roles: ['SUPER_ADMIN', 'COLLEGE_ADMIN'] },
        { text: 'Users Directory', icon: <PeopleIcon />, path: '/admin/users', roles: ['SUPER_ADMIN', 'COLLEGE_ADMIN'] },
        { text: 'Student Admissions', icon: <PersonAddIcon />, path: '/admin/admissions', roles: ['SUPER_ADMIN', 'COLLEGE_ADMIN'] },
        { text: 'Faculty Allocations', icon: <AssignmentIndIcon />, path: '/admin/faculty-assignments', roles: ['SUPER_ADMIN', 'COLLEGE_ADMIN'] },
        { text: 'ID Cards Studio', icon: <BadgeIcon />, path: '/admin/id-cards', roles: ['SUPER_ADMIN', 'COLLEGE_ADMIN'] },
        { text: 'Fee Dues Clearance', icon: <AccountBalanceWalletIcon />, path: '/admin/fee-clearance', roles: ['SUPER_ADMIN', 'COLLEGE_ADMIN'] },
        { text: 'Notice Board', icon: <NotificationsIcon />, path: '/admin/notices', roles: ['SUPER_ADMIN', 'COLLEGE_ADMIN'] },
        { text: 'Academic Calendar', icon: <DateRangeIcon />, path: '/admin/academic-calendar', roles: ['SUPER_ADMIN', 'COLLEGE_ADMIN'] },
        { text: 'Bulk Promotion', icon: <AutorenewIcon />, path: '/admin/bulk-promotion', roles: ['SUPER_ADMIN'] },
        { text: 'Certificates', icon: <CardMembershipIcon />, path: '/admin/certificates', roles: ['SUPER_ADMIN', 'COLLEGE_ADMIN'] },
        { text: 'Reports Export', icon: <AssessmentIcon />, path: '/admin/reports', roles: ['SUPER_ADMIN', 'COLLEGE_ADMIN'] },
        { text: 'College Profile', icon: <AccountBalanceIcon />, path: '/admin/college-profile', roles: ['SUPER_ADMIN'] },
        { text: 'Audit Logs', icon: <HistoryIcon />, path: '/admin/audit-logs', roles: ['SUPER_ADMIN', 'COLLEGE_ADMIN'] },
      ]
    : userRole === 'HOD'
    ? [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/hod/overview', roles: ['HOD'] },
        { text: 'Staff Directory', icon: <GroupsIcon />, path: '/hod/faculty', roles: ['HOD'] },
        { text: 'Subject Allocations', icon: <AssignmentIndIcon />, path: '/hod/faculty-assignment', roles: ['HOD'] },
        { text: 'Cross-Dept Requests', icon: <SwapHorizIcon />, path: '/hod/cross-dept-requests', roles: ['HOD'] },
        { text: 'Students', icon: <PeopleIcon />, path: '/hod/students', roles: ['HOD'] },
        { text: 'Semester Progression', icon: <TrendingUpIcon />, path: '/hod/promotions', roles: ['HOD'] },
        { text: 'Subjects', icon: <MenuBookIcon />, path: '/hod/subjects', roles: ['HOD'] },
        { text: 'Timetable', icon: <DateRangeIcon />, path: '/hod/timetable', roles: ['HOD'] },
        { text: 'Attendance', icon: <FactCheckIcon />, path: '/hod/attendance', roles: ['HOD'] },
        { text: 'Examinations', icon: <ArticleIcon />, path: '/hod/examinations', roles: ['HOD'] },
        { text: 'Placements', icon: <WorkIcon />, path: '/hod/placements', roles: ['HOD'] },
        { text: 'Leave Management', icon: <EventNoteIcon />, path: '/hod/leave-management', roles: ['HOD'] },
        { text: 'Notices', icon: <NotificationsIcon />, path: '/hod/notices', roles: ['HOD'] },
        { text: 'Reports', icon: <BarChartIcon />, path: '/hod/reports', roles: ['HOD'] },
        { text: 'Complaints', icon: <ReportProblemIcon />, path: '/hod/complaints', roles: ['HOD'] },
        { text: 'Documents', icon: <FolderIcon />, path: '/hod/documents', roles: ['HOD'] },
        { text: 'Meetings', icon: <GroupsIcon />, path: '/hod/meetings', roles: ['HOD'] },
        { text: 'Opportunities', icon: <PublicIcon />, path: '/hod/opportunities', roles: ['HOD'] },
        { text: 'Feedback', icon: <ReportProblemIcon />, path: '/hod/feedback', roles: ['HOD'] },
      ]
    : userRole === 'STUDENT'
    ? [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/', roles: ['STUDENT'] },
        { text: 'Academics', icon: <MenuBookIcon />, path: '/student/academics', roles: ['STUDENT'] },
        { text: 'Timetable', icon: <DateRangeIcon />, path: '/student/timetable', roles: ['STUDENT'] },
        { text: 'Assignments', icon: <AssignmentIcon />, path: '/student/assignments', roles: ['STUDENT'] },
        { text: 'Attendance', icon: <FactCheckIcon />, path: '/student/attendance', roles: ['STUDENT'] },
        { text: 'Examinations', icon: <ArticleIcon />, path: '/student/examinations', roles: ['STUDENT'] },
        { text: 'Fees', icon: <ReceiptLongIcon />, path: '/student/fees', roles: ['STUDENT'] },
        { text: 'Notices', icon: <CampaignIcon />, path: '/student/notices', roles: ['STUDENT'] },
        { text: 'Projects', icon: <FolderIcon />, path: '/student/projects', roles: ['STUDENT'] },
        { text: 'Placements', icon: <WorkIcon />, path: '/student/placements', roles: ['STUDENT'] },
        { text: 'Library', icon: <LocalLibraryIcon />, path: '/student/library', roles: ['STUDENT'] },
        { text: 'Leave', icon: <EventNoteIcon />, path: '/student/leave', roles: ['STUDENT'] },
        { text: 'Portfolio & Resume', icon: <MenuBookIcon />, path: '/student/portfolio', roles: ['STUDENT'] },
        { text: 'Documents', icon: <FolderIcon />, path: '/student/documents', roles: ['STUDENT'] },
        { text: 'Complaints', icon: <ReportProblemIcon />, path: '/student/complaints', roles: ['STUDENT'] },
        { text: 'Faculty Feedback', icon: <RateReviewIcon />, path: '/student/feedback', roles: ['STUDENT'] },
        { text: 'Notifications', icon: <NotificationsIcon />, path: '/student/notifications', roles: ['STUDENT'] },
      ]
    : userRole === 'FACULTY'
    ? [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/', roles: ['FACULTY'] },
        { text: 'Students Roster', icon: <PeopleIcon />, path: '/students', roles: ['FACULTY'] },
        { text: 'Attendance', icon: <DateRangeIcon />, path: '/attendance', roles: ['FACULTY'] },
        { text: 'Assignments', icon: <AssignmentIcon />, path: '/assignments', roles: ['FACULTY'] },
        { text: 'Marks', icon: <FactCheckIcon />, path: '/marks', roles: ['FACULTY'] },
        { text: 'Timetable', icon: <CalendarTodayIcon />, path: '/timetable', roles: ['FACULTY'] },
        { text: 'Leave Portal', icon: <EventNoteIcon />, path: '/leaves', roles: ['FACULTY'] },
        { text: 'Notices', icon: <NotificationsIcon />, path: '/notices', roles: ['FACULTY'] },
        { text: 'Department Meetings', icon: <SchoolIcon />, path: '/meetings', roles: ['FACULTY'] },
        { text: 'Materials', icon: <MenuBookIcon />, path: '/materials', roles: ['FACULTY'] },
        { text: 'Maintenance Helpdesk', icon: <ReportProblemIcon />, path: '/complaints', roles: ['FACULTY'] },
        { text: 'Analytics', icon: <BarChartIcon />, path: '/analytics', roles: ['FACULTY'] },
      ]
    : [];

  const visibleMenuItems = menuItems.filter(item => item.roles.includes(userRole));

  const getInitials = (name) => {
    if (!name) return 'CS';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const [logoError, setLogoError] = useState(false);

  const getFullLogoUrl = (relativeUrl) => {
    if (!relativeUrl) return null;
    if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://') || relativeUrl.startsWith('data:')) {
      return relativeUrl;
    }
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    const rootUrl = baseUrl.replace(/\/api\/v1\/?$/, '');
    const cleanRelative = relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`;
    return `${rootUrl}${cleanRelative}`;
  };

  const hasCustomProfile = profile && profile.name && profile.name !== 'My College';

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar
        sx={{
          px: 2.5,
          py: 2.5,
          minHeight: '76px !important',
          display: 'flex',
          alignItems: 'center',
          gap: 1.75,
          borderBottom: `1px solid ${theme.palette.divider}`,
          background: mode === 'dark'
            ? 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)'
            : 'linear-gradient(180deg, rgba(79,70,229,0.03) 0%, rgba(255,255,255,0) 100%)',
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: hasCustomProfile && profile?.logoUrl && !logoError
              ? 'transparent'
              : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            boxShadow: hasCustomProfile && profile?.logoUrl && !logoError ? '0 2px 8px rgba(0,0,0,0.1)' : '0 4px 14px rgba(79, 70, 229, 0.35)',
            flexShrink: 0,
          }}
        >
          {hasCustomProfile && profile?.logoUrl && !logoError ? (
            <Box
              component="img"
              src={getFullLogoUrl(profile.logoUrl)}
              alt="College Logo"
              onError={() => setLogoError(true)}
              sx={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <SchoolIcon sx={{ color: '#ffffff', fontSize: 22 }} />
          )}
        </Box>

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 800,
              fontSize: '1.08rem',
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              color: 'text.primary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              ...(!hasCustomProfile && {
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }),
            }}
          >
            {hasCustomProfile ? profile.name : 'CampusSphere'}
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ px: 2, py: 2, flexGrow: 1 }}>
        {visibleMenuItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/admin/dashboard' &&
              item.path !== '/' &&
              location.pathname.startsWith(item.path));
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 2,
                  backgroundColor: isActive
                    ? theme.palette.mode === 'light'
                      ? 'rgba(79, 70, 229, 0.08)'
                      : 'rgba(99, 102, 241, 0.15)'
                    : 'transparent',
                  color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'light'
                      ? 'rgba(79, 70, 229, 0.04)'
                      : 'rgba(99, 102, 241, 0.06)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.95rem',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          ERP v1.0.0
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* ── Top Executive Glassmorphism Navbar ───────────────────────────── */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: mode === 'dark' ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${theme.palette.divider}`,
          boxShadow: mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.03)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 }, minHeight: '64px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ display: { sm: 'none' }, color: 'text.primary' }}
            >
              <MenuIcon />
            </IconButton>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h6" color="text.primary" sx={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>
                {menuItems.find((item) => item.path === location.pathname)?.text || 'CampusSphere'}
              </Typography>

              {isStudent ? (
                <Box>
                  <Button
                    size="small"
                    onClick={handleSessionMenuOpen}
                    endIcon={<KeyboardArrowDownIcon sx={{ fontSize: '18px !important' }} />}
                    startIcon={
                      isArchivedView ? (
                        <HistoryIcon sx={{ fontSize: '16px !important', color: '#f59e0b' }} />
                      ) : (
                        <DateRangeIcon sx={{ fontSize: '16px !important', color: 'primary.main' }} />
                      )
                    }
                    sx={{
                      borderRadius: '20px',
                      textTransform: 'none',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      px: 1.75,
                      py: 0.5,
                      border: `1px solid ${isArchivedView ? '#f59e0b' : `${theme.palette.primary.main}50`}`,
                      bgcolor: isArchivedView
                        ? 'rgba(245, 158, 11, 0.1)'
                        : `${theme.palette.primary.main}10`,
                      color: isArchivedView ? (mode === 'dark' ? '#fbbf24' : '#b45309') : 'primary.main',
                      '&:hover': {
                        bgcolor: isArchivedView
                          ? 'rgba(245, 158, 11, 0.18)'
                          : `${theme.palette.primary.main}20`,
                      },
                    }}
                  >
                    {isArchivedView
                      ? `Semester ${selectedSemester} (Archived • Read Only)`
                      : `Semester ${selectedSemester} (Current Active)`}
                  </Button>

                  <Menu
                    anchorEl={sessionAnchorEl}
                    open={Boolean(sessionAnchorEl)}
                    onClose={handleSessionMenuClose}
                    transformOrigin={{ horizontal: 'left', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
                    PaperProps={{
                      sx: {
                        borderRadius: '16px',
                        minWidth: 290,
                        p: 1,
                        mt: 1,
                        boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
                        border: `1px solid ${theme.palette.divider}`,
                      },
                    }}
                  >
                    <Box sx={{ px: 2, py: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                        Select Academic Semester
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Switch historical session context across modules
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 0.75 }} />

                    {availableSemesters.map((sem) => {
                      const isSelected = Number(selectedSemester) === Number(sem.semester);

                      return (
                        <MenuItem
                          key={sem.semester}
                          onClick={() => handleSemesterSelect(sem.semester)}
                          sx={{
                            borderRadius: '10px',
                            py: 1,
                            px: 1.5,
                            my: 0.5,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            bgcolor: isSelected
                              ? `${theme.palette.primary.main}15`
                              : 'transparent',
                            '&:hover': {
                              bgcolor: isSelected
                                ? `${theme.palette.primary.main}25`
                                : mode === 'dark'
                                ? 'rgba(255,255,255,0.05)'
                                : 'rgba(0,0,0,0.03)',
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                            {isSelected ? (
                              <CheckIcon sx={{ color: 'primary.main', fontSize: 18, fontWeight: 800 }} />
                            ) : (
                              <Box sx={{ width: 18 }} />
                            )}
                            <Box>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: isSelected ? 800 : 600,
                                  color: isSelected ? 'primary.main' : 'text.primary',
                                }}
                              >
                                {sem.label}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                {sem.subLabel}
                              </Typography>
                            </Box>
                          </Box>

                          <Chip
                            label={sem.isCurrent ? 'ACTIVE' : 'CLEARED'}
                            color={sem.isCurrent ? 'primary' : 'success'}
                            size="small"
                            sx={{ height: 20, fontSize: '0.62rem', fontWeight: 800 }}
                          />
                        </MenuItem>
                      );
                    })}
                  </Menu>
                </Box>
              ) : activeSession ? (
                <Chip
                  label={`${activeSession.academicYear} (${activeSession.semesterType} TERM)`}
                  size="small"
                  variant="outlined"
                  sx={{
                    display: { xs: 'none', md: 'inline-flex' },
                    fontWeight: 700,
                    fontSize: '0.68rem',
                    height: 22,
                    borderColor: `${theme.palette.primary.main}40`,
                    bgcolor: `${theme.palette.primary.main}0A`,
                    color: theme.palette.primary.main,
                  }}
                />
              ) : null}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Command Palette Trigger Search Pill */}
            <Box
              onClick={() => setCmdPaletteOpen(true)}
              sx={{
                display: { xs: 'none', sm: 'flex' },
                alignItems: 'center',
                gap: 1.5,
                px: 1.75,
                py: 0.75,
                borderRadius: '20px',
                bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                border: `1px solid ${theme.palette.divider}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                  borderColor: theme.palette.primary.main,
                },
              }}
            >
              <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Typography variant="caption" sx={{ fontWeight: 500, color: 'text.secondary', userSelect: 'none' }}>
                Search commands &amp; pages...
              </Typography>
              <Box
                sx={{
                  px: 0.8,
                  py: 0.2,
                  borderRadius: '6px',
                  bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: 'text.secondary',
                  fontFamily: theme.typography.mono.fontFamily,
                }}
              >
                Ctrl K
              </Box>
            </Box>

            {/* Mobile Search Icon Button */}
            <Tooltip title="Search (Ctrl+K)">
              <IconButton onClick={() => setCmdPaletteOpen(true)} sx={{ display: { xs: 'flex', sm: 'none' }, color: 'text.secondary' }}>
                <SearchIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Instant Data Refresh Button */}
            <Tooltip title="Refresh Application Data">
              <IconButton
                onClick={handleRefreshData}
                disabled={isRefreshing}
                sx={{
                  color: 'text.secondary',
                  '&:hover': { color: theme.palette.primary.main, bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
                }}
              >
                <RefreshIcon
                  fontSize="small"
                  sx={{
                    animation: isRefreshing ? 'spin 0.7s linear infinite' : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  }}
                />
              </IconButton>
            </Tooltip>

            {/* Theme Color Palette Switcher */}
            <Tooltip title="Theme Preset Color">
              <IconButton onClick={handlePresetMenuOpen} sx={{ color: 'text.secondary' }}>
                <PaletteIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={presetAnchorEl}
              open={Boolean(presetAnchorEl)}
              onClose={handlePresetMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  borderRadius: 3,
                  boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                  p: 1,
                  minWidth: 160,
                },
              }}
            >
              <Typography variant="caption" sx={{ px: 2, py: 1, display: 'block', fontWeight: 800, color: 'text.secondary' }}>
                ACCENT PRESET
              </Typography>
              <MenuItem onClick={() => { setColorPreset('indigo'); handlePresetMenuClose(); }} selected={colorPreset === 'indigo'} sx={{ borderRadius: 1.5, mb: 0.5 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#4f46e5', mr: 1.5 }} />
                Indigo Blue
              </MenuItem>
              <MenuItem onClick={() => { setColorPreset('emerald'); handlePresetMenuClose(); }} selected={colorPreset === 'emerald'} sx={{ borderRadius: 1.5, mb: 0.5 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#059669', mr: 1.5 }} />
                Emerald Green
              </MenuItem>
              <MenuItem onClick={() => { setColorPreset('rose'); handlePresetMenuClose(); }} selected={colorPreset === 'rose'} sx={{ borderRadius: 1.5, mb: 0.5 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#db2777', mr: 1.5 }} />
                Rose Pink
              </MenuItem>
              <MenuItem onClick={() => { setColorPreset('amber'); handlePresetMenuClose(); }} selected={colorPreset === 'amber'} sx={{ borderRadius: 1.5, mb: 0.5 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#d97706', mr: 1.5 }} />
                Amber Sunset
              </MenuItem>
              <MenuItem onClick={() => { setColorPreset('violet'); handlePresetMenuClose(); }} selected={colorPreset === 'violet'} sx={{ borderRadius: 1.5 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#7c3aed', mr: 1.5 }} />
                Royal Violet
              </MenuItem>
            </Menu>

            {/* Dark/Light Mode Switcher */}
            <Tooltip title="Toggle Light/Dark Theme">
              <IconButton onClick={toggleTheme} sx={{ color: 'text.secondary' }}>
                {mode === 'dark' ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
              </IconButton>
            </Tooltip>

            {/* Persistent Notification Bell & Dropdown Panel */}
            <NotificationMenu />

            {/* User Profile Pill Button */}
            <Box
              onClick={handleProfileMenuOpen}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                p: 0.5,
                pl: 1,
                borderRadius: '24px',
                bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                border: `1px solid ${theme.palette.divider}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                },
              }}
            >
              <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', alignItems: 'flex-end' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.8rem', lineHeight: 1.1, color: 'text.primary' }}>
                  {currentUser?.name || 'User'}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.62rem', color: theme.palette.primary.main }}>
                  {currentUser?.role?.replace('_', ' ') || 'GUEST'}
                </Typography>
              </Box>

              <Avatar
                src={getFullAvatarUrl(currentUser?.profilePicUrl)}
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: theme.palette.primary.main,
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  boxShadow: `0 2px 8px ${theme.palette.primary.main}40`,
                }}
              >
                {!currentUser?.profilePicUrl && getInitials(currentUser?.name)}
              </Avatar>
            </Box>

            {/* User Profile Dropdown Menu */}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  borderRadius: 3,
                  boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                  minWidth: 200,
                  p: 1,
                },
              }}
            >
              <Box sx={{ px: 1.5, py: 1, mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  {currentUser?.name || 'User Profile'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, wordBreak: 'break-all' }}>
                  {currentUser?.email || 'user@college.edu'}
                </Typography>
                <Chip
                  label={currentUser?.role?.replace('_', ' ') || 'GUEST'}
                  size="small"
                  color="primary"
                  sx={{ fontSize: '0.65rem', height: 20, fontWeight: 800 }}
                />
              </Box>
              <Divider sx={{ my: 0.5 }} />
              <MenuItem
                onClick={() => {
                  handleProfileMenuClose();
                  navigate(userRole === 'STUDENT' ? '/student/profile' : '/profile');
                }}
                sx={{ borderRadius: 1.5 }}
              >
                <ListItemIcon sx={{ minWidth: 28 }}><PersonIcon fontSize="small" /></ListItemIcon>
                My Profile
              </MenuItem>
              <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/settings'); }} sx={{ borderRadius: 1.5 }}>
                <ListItemIcon sx={{ minWidth: 28 }}><SettingsIcon fontSize="small" /></ListItemIcon>
                Account Settings
              </MenuItem>
              <Divider sx={{ my: 0.5 }} />
              <MenuItem onClick={handleLogout} sx={{ color: 'error.main', borderRadius: 1.5 }}>
                <ListItemIcon sx={{ color: 'error.main', minWidth: 28 }}>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Navigation Sidebars */}
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: 'none' },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: 'background.paper',
              borderRight: `1px solid ${theme.palette.divider}`,
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box
        key={location.pathname}
        className="fade-entrance"
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: '64px',
          bgcolor: 'background.default',
        }}
      >
        {isStudent && isArchivedView && (
          <Box sx={{ mb: 3 }}>
            <Alert
              severity="warning"
              icon={<HistoryIcon />}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={resetToActive}
                  sx={{
                    fontWeight: 800,
                    textTransform: 'none',
                    border: '1px solid currentColor',
                    borderRadius: '8px',
                    px: 1.5,
                  }}
                >
                  Return to Active Term (Sem {activeSemester})
                </Button>
              }
              sx={{
                borderRadius: '16px',
                fontWeight: 600,
                border: '1px solid #f59e0b',
                bgcolor: mode === 'dark' ? 'rgba(245, 158, 11, 0.12)' : '#fffbeb',
                color: mode === 'dark' ? '#fef3c7' : '#92400e',
              }}
            >
              <strong>Historical Archival View (Read-Only Mode):</strong> You are browsing historical records for{' '}
              <strong>Semester {selectedSemester}</strong>. Submitting assignments, filing leave, or editing data is disabled for past cleared terms.
            </Alert>
          </Box>
        )}
        <Outlet />
      </Box>

      <CommandPalette open={cmdPaletteOpen} onClose={() => setCmdPaletteOpen(false)} />
    </Box>
  );
};

export default AppLayout;
