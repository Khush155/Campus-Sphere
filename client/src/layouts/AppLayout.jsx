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
  Hotel as HotelIcon,
  Description as DescriptionIcon,
  Settings as SettingsIcon,
  Groups as GroupsIcon,
  Public as PublicIcon,
  AccountBalance as AccountBalanceIcon,
  History as HistoryIcon,
  Autorenew as AutorenewIcon,
  CardMembership as CardMembershipIcon,
  Assessment as AssessmentIcon,
  CalendarToday as CalendarTodayIcon,
} from '@mui/icons-material';
import { useThemeContext } from '../contexts/ThemeContext';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';
import CommandPalette from '../components/common/CommandPalette';
import { useCollegeProfileQuery } from '../queries/collegeProfileQueries';

const drawerWidth = 240;

export const AppLayout = () => {
  const { mode, toggleTheme, colorPreset, setColorPreset } = useThemeContext();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [presetAnchorEl, setPresetAnchorEl] = useState(null);
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);

  const { data: profile } = useCollegeProfileQuery();

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

  const menuItems = user?.role === 'SUPER_ADMIN'
    ? [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard', roles: ['SUPER_ADMIN'] },
        { text: 'College Setup', icon: <SchoolIcon />, path: '/admin/college-setup/departments', roles: ['SUPER_ADMIN'] },
        { text: 'Users Directory', icon: <PeopleIcon />, path: '/admin/users', roles: ['SUPER_ADMIN'] },
        { text: 'Notice Board', icon: <NotificationsIcon />, path: '/admin/notices', roles: ['SUPER_ADMIN'] },
        { text: 'Academic Calendar', icon: <DateRangeIcon />, path: '/admin/academic-calendar', roles: ['SUPER_ADMIN'] },
        { text: 'Bulk Promotion', icon: <AutorenewIcon />, path: '/admin/bulk-promotion', roles: ['SUPER_ADMIN'] },
        { text: 'Certificates', icon: <CardMembershipIcon />, path: '/admin/certificates', roles: ['SUPER_ADMIN'] },
        { text: 'Reports Export', icon: <AssessmentIcon />, path: '/admin/reports', roles: ['SUPER_ADMIN'] },
        { text: 'College Profile', icon: <AccountBalanceIcon />, path: '/admin/college-profile', roles: ['SUPER_ADMIN'] },
        { text: 'Audit Logs', icon: <HistoryIcon />, path: '/admin/audit-logs', roles: ['SUPER_ADMIN'] },
      ]
    : user?.role === 'HOD'
    ? [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/hod/overview', roles: ['HOD'] },
        { text: 'Faculty', icon: <AssignmentIndIcon />, path: '/hod/faculty', roles: ['HOD'] },
        { text: 'Faculty Assignment', icon: <AssignmentIndIcon />, path: '/hod/faculty-assignment', roles: ['HOD'] },
        { text: 'Cross-Dept Requests', icon: <SwapHorizIcon />, path: '/hod/cross-dept-requests', roles: ['HOD'] },
        { text: 'Students', icon: <PeopleIcon />, path: '/hod/students', roles: ['HOD'] },
        { text: 'Subjects', icon: <MenuBookIcon />, path: '/hod/subjects', roles: ['HOD'] },
        { text: 'Timetable', icon: <DateRangeIcon />, path: '/hod/timetable', roles: ['HOD'] },
        { text: 'Attendance', icon: <FactCheckIcon />, path: '/hod/attendance', roles: ['HOD'] },
        { text: 'Examinations', icon: <ArticleIcon />, path: '/hod/examinations', roles: ['HOD'] },
        { text: 'Projects', icon: <AccountTreeIcon />, path: '/hod/projects', roles: ['HOD'] },
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
    : user?.role === 'STUDENT'
    ? [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/', roles: ['STUDENT'] },
        { text: 'Profile', icon: <PersonIcon />, path: '/student/profile', roles: ['STUDENT'] },
        { text: 'Academics', icon: <MenuBookIcon />, path: '/student/academics', roles: ['STUDENT'] },
        { text: 'Timetable', icon: <DateRangeIcon />, path: '/student/timetable', roles: ['STUDENT'] },
        { text: 'Assignments', icon: <AssignmentIcon />, path: '/student/assignments', roles: ['STUDENT'] },
        { text: 'Attendance', icon: <FactCheckIcon />, path: '/student/attendance', roles: ['STUDENT'] },
        { text: 'Examinations', icon: <ArticleIcon />, path: '/student/examinations', roles: ['STUDENT'] },
        { text: 'Fees', icon: <ReceiptLongIcon />, path: '/fees', roles: ['STUDENT'] },
        { text: 'Notices', icon: <CampaignIcon />, path: '/notices', roles: ['STUDENT'] },
        { text: 'Projects', icon: <FolderIcon />, path: '/student/projects', roles: ['STUDENT'] },
        { text: 'Placements', icon: <WorkIcon />, path: '/student/placements', roles: ['STUDENT'] },
        { text: 'Library', icon: <LocalLibraryIcon />, path: '/student/library', roles: ['STUDENT'] },
        { text: 'Leave', icon: <EventNoteIcon />, path: '/student/leave', roles: ['STUDENT'] },
        { text: 'Portfolio & Resume', icon: <MenuBookIcon />, path: '/student/portfolio', roles: ['STUDENT'] },
        { text: 'Documents', icon: <FolderIcon />, path: '/student/documents', roles: ['STUDENT'] },
        { text: 'Complaints', icon: <ReportProblemIcon />, path: '/student/complaints', roles: ['STUDENT'] },
        { text: 'Notifications', icon: <NotificationsIcon />, path: '/student/notifications', roles: ['STUDENT'] },
      ]
    : user?.role === 'FACULTY'
    ? [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/', roles: ['FACULTY'] },
        { text: 'Attendance', icon: <DateRangeIcon />, path: '/attendance', roles: ['FACULTY'] },
        { text: 'Assignments', icon: <AssignmentIcon />, path: '/assignments', roles: ['FACULTY'] },
        { text: 'Exams', icon: <AssessmentIcon />, path: '/exams', roles: ['FACULTY'] },
        { text: 'Marks', icon: <FactCheckIcon />, path: '/marks', roles: ['FACULTY'] },
        { text: 'Timetable', icon: <CalendarTodayIcon />, path: '/timetable', roles: ['FACULTY'] },
        { text: 'Notices', icon: <NotificationsIcon />, path: '/notices', roles: ['FACULTY'] },
      ]
    : [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/', roles: ['COLLEGE_ADMIN'] },
        { text: 'Students', icon: <PeopleIcon />, path: '/students', roles: ['COLLEGE_ADMIN'] },
        { text: 'Faculty', icon: <SchoolIcon />, path: '/faculty', roles: ['COLLEGE_ADMIN'] },
        { text: 'Attendance', icon: <DateRangeIcon />, path: '/attendance', roles: ['COLLEGE_ADMIN'] },
        { text: 'Fees', icon: <ReceiptLongIcon />, path: '/fees', roles: ['COLLEGE_ADMIN'] },
        { text: 'Notices', icon: <NotificationsIcon />, path: '/notices', roles: ['COLLEGE_ADMIN'] },
      ];
  const visibleMenuItems = (user?.role === 'SUPER_ADMIN' || user?.role === 'HOD' || user?.role === 'STUDENT' || user?.role === 'FACULTY')
    ? menuItems
    : menuItems.filter(item => item.roles.includes(user?.role));

  const getInitials = (name) => {
    if (!name) return 'CS';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getFullLogoUrl = (relativeUrl) => {
    if (!relativeUrl) return null;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    const rootUrl = baseUrl.replace('/api/v1', '');
    return `${rootUrl}${relativeUrl}`;
  };

  const hasCustomProfile = profile && profile.name && profile.name !== 'My College';

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ justifyContent: 'center', py: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {hasCustomProfile && profile.logoUrl ? (
          <Box
            component="img"
            src={getFullLogoUrl(profile.logoUrl)}
            alt="College Logo"
            sx={{ width: 32, height: 32, objectFit: 'contain' }}
          />
        ) : null}
        <Typography
          variant="h6"
          component="div"
          sx={{
            fontWeight: 800,
            letterSpacing: '0.5px',
            maxWidth: 180,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: theme.palette.text.primary,
            ...(!hasCustomProfile && {
              background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }),
          }}
        >
          {hasCustomProfile ? profile.name : 'CampusSphere'}
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ px: 2, py: 2, flexGrow: 1 }}>
        {visibleMenuItems.map((item) => {
          const isActive = location.pathname === item.path;
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
      {/* Top Navbar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' }, color: 'text.primary' }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" color="text.primary" sx={{ fontWeight: 700 }}>
            {menuItems.find((item) => item.path === location.pathname)?.text || 'CampusSphere'}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Command Palette trigger */}
            <Tooltip title="Command Palette (Ctrl+K)">
              <IconButton onClick={() => setCmdPaletteOpen(true)} color="inherit" sx={{ color: 'text.secondary' }}>
                <SearchIcon />
              </IconButton>
            </Tooltip>

            {/* Palette Switcher Button */}
            <Tooltip title="Choose theme color">
              <IconButton onClick={handlePresetMenuOpen} color="inherit" sx={{ color: 'text.secondary' }}>
                <PaletteIcon />
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
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  p: 1,
                },
              }}
            >
              <Typography variant="caption" sx={{ px: 2, py: 1, display: 'block', fontWeight: 700, color: 'text.secondary' }}>
                THEME COLOR
              </Typography>
              <MenuItem
                onClick={() => {
                  setColorPreset('indigo');
                  handlePresetMenuClose();
                }}
                selected={colorPreset === 'indigo'}
                sx={{ borderRadius: 1, mb: 0.5 }}
              >
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#4f46e5', mr: 1.5 }} />
                Indigo Blue
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setColorPreset('emerald');
                  handlePresetMenuClose();
                }}
                selected={colorPreset === 'emerald'}
                sx={{ borderRadius: 1, mb: 0.5 }}
              >
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#059669', mr: 1.5 }} />
                Emerald Green
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setColorPreset('rose');
                  handlePresetMenuClose();
                }}
                selected={colorPreset === 'rose'}
                sx={{ borderRadius: 1, mb: 0.5 }}
              >
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#db2777', mr: 1.5 }} />
                Rose Pink
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setColorPreset('amber');
                  handlePresetMenuClose();
                }}
                selected={colorPreset === 'amber'}
                sx={{ borderRadius: 1, mb: 0.5 }}
              >
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#d97706', mr: 1.5 }} />
                Amber Sunset
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setColorPreset('violet');
                  handlePresetMenuClose();
                }}
                selected={colorPreset === 'violet'}
                sx={{ borderRadius: 1 }}
              >
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#7c3aed', mr: 1.5 }} />
                Royal Violet
              </MenuItem>
            </Menu>

            {/* Theme Toggle Button */}
            <Tooltip title="Toggle light/dark theme">
              <IconButton onClick={toggleTheme} color="inherit" sx={{ color: 'text.secondary' }}>
                {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>

            {/* Profile Avatar & Menu */}
            <Tooltip title="Account settings">
              <IconButton onClick={handleProfileMenuOpen} sx={{ p: 0.5 }}>
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: theme.palette.primary.main,
                    fontSize: '0.95rem',
                    fontWeight: 600,
                  }}
                >
                  {getInitials(user?.name)}
                </Avatar>
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  minWidth: 150,
                },
              }}
            >
              <Box sx={{ px: 2, py: 1.5, minWidth: 160 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {user?.name || 'User Profile'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, wordBreak: 'break-all' }}>
                  {user?.email || 'user@college.edu'}
                </Typography>
                <Chip
                  label={user?.role?.replace('_', ' ') || 'GUEST'}
                  size="small"
                  color="primary"
                  sx={{ fontSize: '0.65rem', height: 20, fontWeight: 700 }}
                />
              </Box>
              <Divider />
              <MenuItem onClick={handleProfileMenuClose}>Profile</MenuItem>
              <MenuItem onClick={handleProfileMenuClose}>Settings</MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                <ListItemIcon sx={{ color: 'error.main', minWidth: 30 }}>
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
        <Outlet />
      </Box>

      <CommandPalette open={cmdPaletteOpen} onClose={() => setCmdPaletteOpen(false)} />
    </Box>
  );
};

export default AppLayout;
