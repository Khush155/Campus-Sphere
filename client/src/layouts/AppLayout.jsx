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
  Collapse,
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
  ExpandLess,
  ExpandMore,
  AccountBalance as InstitutionIcon,
  Business as DepartmentIcon,
  MenuBook as AcademicsIcon,
  HowToReg as AdmissionsIcon,
  BarChart as ReportsIcon,
  Campaign as AnnouncementsIcon,
  FactCheck as ApprovalsIcon,
  Settings as SettingsIcon,
  Public as GlobalIcon,
  CardMembership as LicenseIcon,
  Security as SecurityIcon,
  TrendingUp as AnalyticsIcon,
  ListAlt as AuditIcon,
} from '@mui/icons-material';
import { useThemeContext } from '../contexts/ThemeContext';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';
import CommandPalette from '../components/common/CommandPalette';

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
  const [openMenus, setOpenMenus] = useState({});

  const handleToggleSubMenu = (menuText) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuText]: !prev[menuText],
    }));
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

  const superAdminMenu = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/superadmin/dashboard' },
    { text: 'Institutions', icon: <InstitutionIcon />, path: '/superadmin/institutions' },
    { text: 'College Admins', icon: <PeopleIcon />, path: '/superadmin/college-admins' },
    { text: 'Academic Templates', icon: <AcademicsIcon />, path: '/superadmin/templates' },
    { text: 'Global Users', icon: <GlobalIcon />, path: '/superadmin/global-users' },
    { text: 'Subscriptions', icon: <LicenseIcon />, path: '/superadmin/subscriptions' },
    { text: 'Role Management', icon: <SecurityIcon />, path: '/superadmin/roles' },
    { text: 'Platform Analytics', icon: <AnalyticsIcon />, path: '/superadmin/analytics' },
    { text: 'Audit Logs', icon: <AuditIcon />, path: '/superadmin/audit-logs' },
    { text: 'Broadcast Center', icon: <AnnouncementsIcon />, path: '/superadmin/broadcasts' },
    { text: 'System Settings', icon: <SettingsIcon />, path: '/superadmin/settings' },
  ];

  const collegeAdminMenu = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
    { text: 'Institution', icon: <InstitutionIcon />, path: '/admin/institution' },
    { text: 'Departments', icon: <DepartmentIcon />, path: '/admin/college-setup/departments' },
    {
      text: 'Users',
      icon: <PeopleIcon />,
      children: [
        { text: 'Students', path: '/admin/students' },
        { text: 'Faculty', path: '/admin/users' },
        { text: 'Roles', path: '/admin/roles' },
      ]
    },
    {
      text: 'Academics',
      icon: <AcademicsIcon />,
      children: [
        { text: 'Courses', path: '/admin/courses' },
        { text: 'Subjects', path: '/admin/subjects' },
        { text: 'Calendar', path: '/admin/calendar' },
      ]
    },
    { text: 'Admissions', icon: <AdmissionsIcon />, path: '/admin/admissions' },
    { text: 'Finance', icon: <ReceiptLongIcon />, path: '/admin/fees' },
    { text: 'Reports', icon: <ReportsIcon />, path: '/admin/reports' },
    { text: 'Announcements', icon: <AnnouncementsIcon />, path: '/admin/announcements' },
    { text: 'Approvals', icon: <ApprovalsIcon />, path: '/admin/approvals' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/admin/settings' },
  ];

  const hodMenu = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/hod/dashboard' },
    { text: 'Faculty', icon: <SchoolIcon />, path: '/hod/faculty' },
    { text: 'Students', icon: <PeopleIcon />, path: '/hod/students' },
    { text: 'Subjects', icon: <AcademicsIcon />, path: '/hod/subjects' },
    { text: 'Timetable', icon: <DateRangeIcon />, path: '/hod/timetable' },
    { text: 'Attendance', icon: <AuditIcon />, path: '/hod/attendance' },
    { text: 'Results', icon: <AnalyticsIcon />, path: '/hod/results' },
    { text: 'Assignments', icon: <ReportsIcon />, path: '/hod/assignments' },
    { text: 'Analytics', icon: <AnalyticsIcon />, path: '/hod/analytics' },
    { text: 'Announcements', icon: <AnnouncementsIcon />, path: '/hod/announcements' },
    { text: 'Reports', icon: <ReportsIcon />, path: '/hod/reports' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/hod/settings' },
  ];

  const defaultMenu = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/', roles: ['FACULTY', 'STUDENT'] },
    { text: 'Attendance', icon: <DateRangeIcon />, path: '/attendance', roles: ['FACULTY', 'STUDENT'] },
    { text: 'Fees', icon: <ReceiptLongIcon />, path: '/fees', roles: ['STUDENT'] },
    { text: 'Notices', icon: <NotificationsIcon />, path: '/notices', roles: ['FACULTY', 'STUDENT'] },
  ];

  let visibleMenuItems = [];
  if (user?.role === 'SUPER_ADMIN') {
    visibleMenuItems = superAdminMenu;
  } else if (user?.role === 'COLLEGE_ADMIN') {
    visibleMenuItems = collegeAdminMenu;
  } else if (user?.role === 'HOD') {
    visibleMenuItems = hodMenu;
  } else {
    visibleMenuItems = defaultMenu.filter(item => item.roles.includes(user?.role));
  }

  const getInitials = (name) => {
    if (!name) return 'CS';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ justifyContent: 'center', py: 2 }}>
        <Typography
          variant="h5"
          component="div"
          sx={{
            fontWeight: 800,
            background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '0.5px',
          }}
        >
          CampusSphere
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ px: 2, py: 2, flexGrow: 1 }}>
        {visibleMenuItems.map((item) => {
          const hasChildren = !!item.children;
          const isActive = !hasChildren && location.pathname === item.path;
          const isOpen = openMenus[item.text] || false;

          const renderItemButton = (item, isSubItem = false) => {
            const isSubActive = location.pathname === item.path;
            return (
              <ListItemButton
                onClick={() => {
                  if (item.children) {
                    handleToggleSubMenu(item.text);
                  } else {
                    navigate(item.path);
                    setMobileOpen(false);
                  }
                }}
                sx={{
                  borderRadius: 2,
                  pl: isSubItem ? 4 : 2,
                  backgroundColor: isSubActive || (isActive && !isSubItem)
                    ? theme.palette.mode === 'light'
                      ? 'rgba(79, 70, 229, 0.08)'
                      : 'rgba(99, 102, 241, 0.15)'
                    : 'transparent',
                  color: isSubActive || (isActive && !isSubItem) ? theme.palette.primary.main : theme.palette.text.secondary,
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'light'
                      ? 'rgba(79, 70, 229, 0.04)'
                      : 'rgba(99, 102, 241, 0.06)',
                  },
                }}
              >
                {item.icon && (
                  <ListItemIcon
                    sx={{
                      color: isSubActive || (isActive && !isSubItem) ? theme.palette.primary.main : theme.palette.text.secondary,
                      minWidth: 40,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                )}
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: isSubActive || (isActive && !isSubItem) ? 700 : 500,
                    fontSize: isSubItem ? '0.9rem' : '1rem'
                  }}
                />
                {item.children && (isOpen ? <ExpandLess /> : <ExpandMore />)}
              </ListItemButton>
            );
          };

          return (
            <React.Fragment key={item.text}>
              <ListItem disablePadding sx={{ mb: 1 }}>
                {renderItemButton(item)}
              </ListItem>
              {hasChildren && (
                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children.map((child) => (
                      <ListItem key={child.text} disablePadding sx={{ mb: 0.5 }}>
                        {renderItemButton(child, true)}
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              )}
            </React.Fragment>
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
            {(() => {
              const flatItems = visibleMenuItems.flatMap(item => item.children ? item.children : item);
              return flatItems.find(item => item.path === location.pathname)?.text || 'CampusSphere';
            })()}
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
