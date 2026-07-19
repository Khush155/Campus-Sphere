// client/src/components/common/CommandPalette.jsx
//
// Global Search / Command Palette component.
// Enables searchable modal triggered by Search icon or Ctrl+K.

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Modal,
  Box,
  TextField,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
} from '@mui/material';
import {
  SearchOutlined,
  ArrowForwardOutlined,
  NavigationOutlined,
  FlashOnOutlined,
  PersonOutline,
  BookOutlined,
  AssignmentOutlined as AssignmentIcon,
  AssessmentOutlined as ExamIcon,
  MenuBookOutlined as BookIcon,
  NotificationsOutlined as NotificationsIcon,
  CalendarTodayOutlined as CalendarIcon,
} from '@mui/icons-material';

import { useUsersQuery } from '../../queries/userQueries';
import { useSubjectsQuery } from '../../queries/collegeQueries';
import { useAuth } from '../../contexts/AuthContext';

// Maps dynamic icons based on item category
const getIconForType = (type) => {
  switch (type) {
    case 'NAV':
      return <NavigationOutlined />;
    case 'ACTION':
      return <FlashOnOutlined />;
    case 'RECORD_USER':
    case 'RECORD_STUDENT':
    case 'RECORD_FACULTY':
      return <PersonOutline />;
    case 'RECORD_SUBJECT':
      return <BookOutlined />;
    case 'RECORD_ASSIGNMENT':
      return <AssignmentIcon />;
    case 'RECORD_EXAM':
      return <ExamIcon />;
    case 'RECORD_MATERIAL':
      return <BookIcon />;
    case 'RECORD_NOTIFICATION':
      return <NotificationsIcon />;
    case 'RECORD_TIMETABLE':
      return <CalendarIcon />;
    default:
      return <NavigationOutlined />;
  }
};

export const CommandPalette = ({ open, onClose }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const { user } = useAuth();

  // States
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentItems, setRecentItems] = useState(() => {
    try {
      const stored = localStorage.getItem('command_palette_recent');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  
  // Live records data queries
  const canFetchUsers = user?.role === 'SUPER_ADMIN' || user?.role === 'COLLEGE_ADMIN' || user?.role === 'HOD';
  const { data: usersData } = useUsersQuery({ limit: 50 }, { enabled: !!canFetchUsers });
  const { data: subjectsData } = useSubjectsQuery();

  // Focus input automatically on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
    }
  }, [open]);

  // Static options list for Admin / HOD
  const staticOptions = [
    { id: 'nav-dash', type: 'NAV', text: 'Go to Dashboard', icon: <NavigationOutlined />, path: '/admin/dashboard' },
    { id: 'nav-depts', type: 'NAV', text: 'Go to College Setup - Departments', icon: <NavigationOutlined />, path: '/admin/college-setup/departments' },
    { id: 'nav-courses', type: 'NAV', text: 'Go to College Setup - Courses', icon: <NavigationOutlined />, path: '/admin/college-setup/courses' },
    { id: 'nav-branches', type: 'NAV', text: 'Go to College Setup - Branches', icon: <NavigationOutlined />, path: '/admin/college-setup/branches' },
    { id: 'nav-subjects', type: 'NAV', text: 'Go to College Setup - Subjects', icon: <NavigationOutlined />, path: '/admin/college-setup/subjects' },
    { id: 'nav-users', type: 'NAV', text: 'Go to Users Directory', icon: <NavigationOutlined />, path: '/admin/users' },
    { id: 'act-user', type: 'ACTION', text: 'Register new user account', icon: <FlashOnOutlined />, path: '/admin/users?register=true' },
    { id: 'act-dept', type: 'ACTION', text: 'Add a new department', icon: <FlashOnOutlined />, path: '/admin/college-setup/departments?add=true' },
    { id: 'act-course', type: 'ACTION', text: 'Add a new degree course', icon: <FlashOnOutlined />, path: '/admin/college-setup/courses?add=true' },
    { id: 'act-branch', type: 'ACTION', text: 'Add a new branch specialization', icon: <FlashOnOutlined />, path: '/admin/college-setup/branches?add=true' },
    { id: 'act-subject', type: 'ACTION', text: 'Add a curriculum subject', icon: <FlashOnOutlined />, path: '/admin/college-setup/subjects?add=true' },
  ];

  // Static options list for Faculty
  const facultyStaticOptions = [
    { id: 'nav-dash', type: 'NAV', text: 'Go to Faculty Dashboard', icon: <NavigationOutlined />, path: '/faculty' },
    { id: 'nav-students', type: 'NAV', text: 'Go to Students Roster', icon: <NavigationOutlined />, path: '/students' },
    { id: 'nav-attendance', type: 'NAV', text: 'Go to Attendance Marking', icon: <NavigationOutlined />, path: '/attendance' },
    { id: 'nav-assignments', type: 'NAV', text: 'Go to Assignments Module', icon: <NavigationOutlined />, path: '/assignments' },
    { id: 'nav-exams', type: 'NAV', text: 'Go to Exams Module', icon: <NavigationOutlined />, path: '/exams' },
    { id: 'nav-marks', type: 'NAV', text: 'Go to Gradebook & Marks', icon: <NavigationOutlined />, path: '/marks' },
    { id: 'nav-timetable', type: 'NAV', text: 'Go to Timetable Schedule', icon: <NavigationOutlined />, path: '/timetable' },
    { id: 'nav-materials', type: 'NAV', text: 'Go to Course Materials', icon: <NavigationOutlined />, path: '/materials' },
    { id: 'nav-analytics', type: 'NAV', text: 'Go to Analytics Dashboard', icon: <NavigationOutlined />, path: '/analytics' },
    { id: 'nav-notifications', type: 'NAV', text: 'Go to Notifications Center', icon: <NavigationOutlined />, path: '/notifications' },
    { id: 'nav-settings', type: 'NAV', text: 'Go to Settings', icon: <NavigationOutlined />, path: '/settings' },
  ];

  const staticList = user?.role === 'FACULTY' ? facultyStaticOptions : staticOptions;

  // Dynamic user records search mapping
  const userOptions = usersData?.data?.map((u) => ({
    id: `user-${u.id}`,
    type: 'RECORD_USER',
    text: `${u.name} (${u.role.replace('_', ' ')})`,
    icon: <PersonOutline />,
    path: `/admin/users?search=${encodeURIComponent(u.name)}`,
  })) || [];

  // Dynamic subject records search mapping
  const subjectOptions = subjectsData?.map((s) => ({
    id: `subject-${s._id}`,
    type: 'RECORD_SUBJECT',
    text: `${s.name} (${s.code})`,
    icon: <BookOutlined />,
    path: `/admin/college-setup/subjects?search=${encodeURIComponent(s.name)}`,
  })) || [];

  // Faculty specific records
  const facultyRecords = user?.role === 'FACULTY' ? [
    { id: 'fac-profile', type: 'RECORD_FACULTY', text: 'Profile: Dr. Ananya Sharma (Assistant Professor)', icon: <PersonOutline />, path: '/profile' },
    { id: 'asg-1', type: 'RECORD_ASSIGNMENT', text: 'Assignment: Tree Balancing Implementation (CSE201)', icon: <AssignmentIcon />, path: '/assignments' },
    { id: 'asg-2', type: 'RECORD_ASSIGNMENT', text: 'Assignment: Relational Algebra Worksheet (CSE305)', icon: <AssignmentIcon />, path: '/assignments' },
    { id: 'asg-3', type: 'RECORD_ASSIGNMENT', text: 'Assignment: Process Sync Programming Lab (CSE302)', icon: <AssignmentIcon />, path: '/assignments' },
    { id: 'exam-1', type: 'RECORD_EXAM', text: 'Exam: DSA Midterm Assessment (CSE201)', icon: <ExamIcon />, path: '/exams' },
    { id: 'exam-2', type: 'RECORD_EXAM', text: 'Exam: DBMS Quiz 1 (CSE305)', icon: <ExamIcon />, path: '/exams' },
    { id: 'exam-3', type: 'RECORD_EXAM', text: 'Exam: OS End-Term Theory Exam (CSE302)', icon: <ExamIcon />, path: '/exams' },
    { id: 'mat-1', type: 'RECORD_MATERIAL', text: 'Material: Tree balancing lecture slides (PPT)', icon: <BookIcon />, path: '/materials' },
    { id: 'mat-2', type: 'RECORD_MATERIAL', text: 'Material: DBMS Normalization Rules guide (PDF)', icon: <BookIcon />, path: '/materials' },
    { id: 'mat-3', type: 'RECORD_MATERIAL', text: 'Material: Database Indexing & B-Trees video (YouTube)', icon: <BookIcon />, path: '/materials' },
    { id: 'notif-page', type: 'RECORD_NOTIFICATION', text: 'Notification Log: Review submissions and schedule alerts', icon: <NotificationsIcon />, path: '/notifications' },
    { id: 'timetable-page', type: 'RECORD_TIMETABLE', text: 'Timetable: View weekly classes schedule grid', icon: <CalendarIcon />, path: '/timetable' }
  ] : [];

  const allItems = [...staticList, ...userOptions, ...subjectOptions, ...facultyRecords];

  // Map icons onto recent items
  const recentOptions = recentItems.map((item) => ({
    ...item,
    icon: getIconForType(item.originalType),
    type: 'RECENT',
  }));

  // Fuzzy filter query match - if empty, show recents first, then navigation defaults
  const filtered = query === ''
    ? [...recentOptions, ...staticList]
    : allItems.filter((item) =>
        item.text.toLowerCase().includes(query.toLowerCase())
      );

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleAction(filtered[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleAction = (item) => {
    const originalType = item.type === 'RECENT' ? item.originalType : item.type;
    const saveable = {
      id: item.id,
      text: item.text,
      path: item.path,
      originalType: originalType,
    };

    const updated = [saveable, ...recentItems.filter((i) => i.id !== item.id)].slice(0, 5);
    setRecentItems(updated);
    localStorage.setItem('command_palette_recent', JSON.stringify(updated));

    navigate(item.path);
    onClose();
  };

  // Grouped render helper
  const renderGroup = (type, title) => {
    const items = filtered.filter((i) => i.type === type);
    if (items.length === 0) return null;

    return (
      <Box key={type} sx={{ py: 1 }}>
        <Typography
          variant="caption"
          sx={{
            px: 2,
            py: 0.5,
            display: 'block',
            fontWeight: 700,
            color: theme.palette.text.secondary,
            fontFamily: theme.typography.body2.fontFamily,
          }}
        >
          {title}
        </Typography>
        <List disablePadding>
          {items.map((item) => {
            const indexInFiltered = filtered.indexOf(item);
            const isSelected = indexInFiltered === selectedIndex;

            return (
              <ListItemButton
                key={item.id}
                onClick={() => handleAction(item)}
                selected={isSelected}
                sx={{
                  mx: 1,
                  my: 0.2,
                  borderRadius: '8px',
                  py: 1,
                  bgcolor: isSelected ? theme.custom?.interaction?.hoverTint || 'rgba(79, 70, 229, 0.08)' : 'transparent',
                  color: isSelected ? theme.palette.primary.main : theme.palette.text.primary,
                  '&.Mui-selected': {
                    bgcolor: theme.custom?.interaction?.hoverTint || 'rgba(79, 70, 229, 0.08)',
                    color: theme.palette.primary.main,
                    '&:hover': {
                      bgcolor: theme.custom?.interaction?.hoverTint || 'rgba(79, 70, 229, 0.08)',
                    },
                  },
                  '&:hover': {
                    bgcolor: theme.custom?.interaction?.hoverTint || 'rgba(79, 70, 229, 0.08)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isSelected ? theme.palette.primary.main : theme.palette.text.secondary,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    fontFamily: theme.typography.body2.fontFamily,
                  }}
                />
                {isSelected && (
                  <ArrowForwardOutlined
                    sx={{ fontSize: 16, color: theme.palette.primary.main }}
                  />
                )}
              </ListItemButton>
            );
          })}
        </List>
      </Box>
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      BackdropProps={{
        sx: {
          backdropFilter: 'blur(8px)',
          bgcolor: 'rgba(14, 26, 43, 0.4)',
        },
      }}
      sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', pt: { xs: 4, md: 10 } }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 600,
          bgcolor: theme.custom?.surface?.overlay || theme.palette.background.paper,
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '75vh',
          outline: 'none',
        }}
      >
        {/* Search Input Box */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`, bgcolor: theme.custom?.surface?.sunken || theme.palette.action.hover }}>
          <SearchOutlined sx={{ color: theme.palette.text.secondary, mr: 1.5 }} />
          <TextField
            inputRef={inputRef}
            fullWidth
            variant="standard"
            placeholder="Type a page, quick action, student name, or subject..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            InputProps={{
              disableUnderline: true,
              style: {
                fontFamily: theme.typography.body1.fontFamily,
                fontSize: '0.95rem',
                color: theme.palette.text.primary,
              },
            }}
          />
          <Typography
            variant="caption"
            sx={{
              px: 1,
              py: 0.3,
              borderRadius: '4px',
              bgcolor: 'rgba(0,0,0,0.06)',
              color: theme.palette.text.secondary,
              fontFamily: theme.typography.mono?.fontFamily || 'monospace',
              fontSize: '0.68rem',
            }}
          >
            ESC
          </Typography>
        </Box>

        {/* Results Container */}
        <Box sx={{ overflowY: 'auto', p: 1, flexGrow: 1 }}>
          {filtered.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontFamily: theme.typography.body2.fontFamily }}>
                {"No commands or records match \"" + query + "\""}
              </Typography>
            </Box>
          ) : (
            <>
              {renderGroup('RECENT', 'RECENT SEARCHES & VIEWS')}
              {filtered.filter((i) => i.type === 'RECENT').length > 0 && <Divider sx={{ my: 1, borderColor: theme.custom?.border?.subtle || theme.palette.divider }} />}
              {renderGroup('NAV', 'NAVIGATION')}
              {filtered.filter((i) => i.type === 'NAV').length > 0 &&
                filtered.filter((i) => i.type !== 'NAV' && i.type !== 'RECENT').length > 0 && <Divider sx={{ my: 1, borderColor: theme.custom?.border?.subtle || theme.palette.divider }} />}
              {renderGroup('ACTION', 'QUICK ACTIONS')}
              {filtered.filter((i) => i.type === 'ACTION').length > 0 &&
                filtered.filter((i) => i.type.startsWith('RECORD')).length > 0 && <Divider sx={{ my: 1, borderColor: theme.custom?.border?.subtle || theme.palette.divider }} />}
              {renderGroup('RECORD_USER', 'USERS RECORDS')}
              {renderGroup('RECORD_SUBJECT', 'CURRICULUM SUBJECTS')}
              {renderGroup('RECORD_STUDENT', 'STUDENTS DIRECTORY')}
              {renderGroup('RECORD_FACULTY', 'FACULTY MEMBERS')}
              {renderGroup('RECORD_ASSIGNMENT', 'ASSIGNMENTS')}
              {renderGroup('RECORD_EXAM', 'EXAM SCHEDULES')}
              {renderGroup('RECORD_MATERIAL', 'COURSE MATERIALS')}
              {renderGroup('RECORD_NOTIFICATION', 'NOTIFICATIONS ALERTS')}
              {renderGroup('RECORD_TIMETABLE', 'TIMETABLES')}
            </>
          )}
        </Box>

        {/* Footer shortcuts helper */}
        <Box
          sx={{
            p: 1.5,
            borderTop: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
            display: 'flex',
            gap: 2,
            justifyContent: 'flex-end',
            alignItems: 'center',
            bgcolor: theme.custom?.surface?.sunken || theme.palette.action.hover,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontFamily: theme.typography.body2.fontFamily }}>
              Select:
            </Typography>
            <Typography variant="caption" sx={{ px: 0.6, py: 0.1, bgcolor: 'rgba(0,0,0,0.06)', borderRadius: '3px', fontFamily: theme.typography.mono?.fontFamily || 'monospace', fontSize: '0.68rem' }}>
              ↑↓
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontFamily: theme.typography.body2.fontFamily }}>
              Execute:
            </Typography>
            <Typography variant="caption" sx={{ px: 0.6, py: 0.1, bgcolor: 'rgba(0,0,0,0.06)', borderRadius: '3px', fontFamily: theme.typography.mono?.fontFamily || 'monospace', fontSize: '0.68rem' }}>
              Enter
            </Typography>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default CommandPalette;
