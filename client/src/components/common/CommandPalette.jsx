import React, { useState, useEffect, useRef, useMemo } from 'react';
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

  // Static options tailored specifically per ROLE
  const roleStaticOptions = useMemo(() => {
    const role = user?.role;

    if (role === 'SUPER_ADMIN' || role === 'COLLEGE_ADMIN') {
      return [
        { id: 'nav-dash', type: 'NAV', text: 'Go to Admin Dashboard', icon: <NavigationOutlined />, path: '/' },
        { id: 'nav-depts', type: 'NAV', text: 'College Setup — Departments', icon: <NavigationOutlined />, path: '/admin/college-setup/departments' },
        { id: 'nav-courses', type: 'NAV', text: 'College Setup — Degree Courses', icon: <NavigationOutlined />, path: '/admin/college-setup/courses' },
        { id: 'nav-branches', type: 'NAV', text: 'College Setup — Branch Specializations', icon: <NavigationOutlined />, path: '/admin/college-setup/branches' },
        { id: 'nav-subjects', type: 'NAV', text: 'College Setup — Subjects', icon: <NavigationOutlined />, path: '/admin/college-setup/subjects' },
        { id: 'nav-users', type: 'NAV', text: 'Users Directory & Account Roles', icon: <NavigationOutlined />, path: '/admin/users' },
        { id: 'nav-admissions', type: 'NAV', text: 'Student Admissions Studio', icon: <NavigationOutlined />, path: '/admin/admissions' },
        { id: 'nav-faculty-assign', type: 'NAV', text: 'Faculty Allocations Desk', icon: <NavigationOutlined />, path: '/admin/faculty-assignments' },
        { id: 'nav-idcards', type: 'NAV', text: 'ID Cards Printing Studio', icon: <NavigationOutlined />, path: '/admin/id-cards' },
        { id: 'nav-feeclearance', type: 'NAV', text: 'Fee Dues & Clearance Desk', icon: <NavigationOutlined />, path: '/admin/fee-clearance' },
        { id: 'nav-placements', type: 'NAV', text: 'Corporate Placements & Drives', icon: <NavigationOutlined />, path: '/admin/placements' },
        { id: 'nav-admin-leaves', type: 'NAV', text: 'Leave Management Oversight', icon: <NavigationOutlined />, path: '/admin/leave-management' },
        { id: 'nav-admin-complaints', type: 'NAV', text: 'Campus Maintenance & Complaints', icon: <NavigationOutlined />, path: '/admin/complaints' },
        { id: 'nav-notices', type: 'NAV', text: 'Notice Board Broadcasts', icon: <NavigationOutlined />, path: '/admin/notices' },
        { id: 'nav-calendar', type: 'NAV', text: 'Academic Calendar', icon: <NavigationOutlined />, path: '/admin/academic-calendar' },
        { id: 'nav-promotion', type: 'NAV', text: 'Bulk Semester Promotion Engine', icon: <NavigationOutlined />, path: '/admin/bulk-promotion' },
        { id: 'nav-certificates', type: 'NAV', text: 'Certificates Generator Hub', icon: <NavigationOutlined />, path: '/admin/certificates' },
        { id: 'nav-reports', type: 'NAV', text: 'Reports Export Center', icon: <NavigationOutlined />, path: '/admin/reports' },
        { id: 'nav-profile', type: 'NAV', text: 'College Profile Settings', icon: <NavigationOutlined />, path: '/admin/college-profile' },
        { id: 'nav-audit', type: 'NAV', text: 'Audit Security Logs', icon: <NavigationOutlined />, path: '/admin/audit-logs' },
        { id: 'act-user', type: 'ACTION', text: 'Register new user account', icon: <FlashOnOutlined />, path: '/admin/users?register=true' },
        { id: 'act-dept', type: 'ACTION', text: 'Create new department', icon: <FlashOnOutlined />, path: '/admin/college-setup/departments?add=true' },
      ];
    }

    if (role === 'HOD') {
      return [
        { id: 'nav-hod-dash', type: 'NAV', text: 'Go to HOD Dashboard', icon: <NavigationOutlined />, path: '/' },
        { id: 'nav-hod-fac', type: 'NAV', text: 'Department Faculty Management', icon: <NavigationOutlined />, path: '/hod/faculty' },
        { id: 'nav-hod-req', type: 'NAV', text: 'Cross-Department Requests', icon: <NavigationOutlined />, path: '/hod/cross-dept-requests' },
        { id: 'nav-hod-stud', type: 'NAV', text: 'Department Students Hub', icon: <NavigationOutlined />, path: '/hod/students' },
        { id: 'nav-hod-sub', type: 'NAV', text: 'Subject Curriculum Hub', icon: <NavigationOutlined />, path: '/hod/subjects' },
        { id: 'nav-hod-tt', type: 'NAV', text: 'Class Timetable Builder', icon: <NavigationOutlined />, path: '/hod/timetable' },
        { id: 'nav-hod-att', type: 'NAV', text: 'Attendance & Detention Audit Hub', icon: <NavigationOutlined />, path: '/hod/attendance' },
        { id: 'nav-hod-exam', type: 'NAV', text: 'Examinations & Marks Entry Lock', icon: <NavigationOutlined />, path: '/hod/examinations' },
        { id: 'nav-hod-placements', type: 'NAV', text: 'Department Placements Hub', icon: <NavigationOutlined />, path: '/hod/placements' },
        { id: 'nav-hod-opportunities', type: 'NAV', text: 'Global Opportunities & Hackathons', icon: <NavigationOutlined />, path: '/hod/opportunities' },
        { id: 'nav-hod-leave', type: 'NAV', text: 'Faculty & Student Leave Approvals', icon: <NavigationOutlined />, path: '/hod/leave-management' },
        { id: 'nav-hod-notice', type: 'NAV', text: 'Department Notices & Broadcasts', icon: <NavigationOutlined />, path: '/hod/notices' },
        { id: 'nav-hod-reports', type: 'NAV', text: 'Department Performance Reports', icon: <NavigationOutlined />, path: '/hod/reports' },
        { id: 'nav-hod-complaints', type: 'NAV', text: 'Department Complaints Desk', icon: <NavigationOutlined />, path: '/hod/complaints' },
        { id: 'nav-hod-meetings', type: 'NAV', text: 'Schedule Department Meetings', icon: <NavigationOutlined />, path: '/hod/meetings' },
        { id: 'nav-hod-documents', type: 'NAV', text: 'Student Documents Verification', icon: <NavigationOutlined />, path: '/hod/documents' },
        { id: 'nav-hod-feedback', type: 'NAV', text: 'Faculty Student Appraisals', icon: <NavigationOutlined />, path: '/hod/feedback' },
      ];
    }

    if (role === 'FACULTY') {
      return [
        { id: 'nav-fac-dash', type: 'NAV', text: 'Go to Faculty Dashboard', icon: <NavigationOutlined />, path: '/' },
        { id: 'nav-fac-students', type: 'NAV', text: 'Class Students Roster Desk', icon: <NavigationOutlined />, path: '/students' },
        { id: 'nav-fac-att', type: 'NAV', text: 'Mark Lecture Attendance', icon: <NavigationOutlined />, path: '/attendance' },
        { id: 'nav-fac-asg', type: 'NAV', text: 'Coursework Assignments Hub', icon: <NavigationOutlined />, path: '/assignments' },
        { id: 'nav-fac-marks', type: 'NAV', text: 'Gradebook & Marks Desk', icon: <NavigationOutlined />, path: '/marks' },
        { id: 'nav-fac-tt', type: 'NAV', text: 'Timetable & Lecture Schedule', icon: <NavigationOutlined />, path: '/timetable' },
        { id: 'nav-fac-mat', type: 'NAV', text: 'Course Study Materials Vault', icon: <NavigationOutlined />, path: '/materials' },
        { id: 'nav-fac-leave', type: 'NAV', text: 'Faculty Leave Application Portal', icon: <NavigationOutlined />, path: '/leaves' },
        { id: 'nav-fac-notices', type: 'NAV', text: 'Department Notice Board', icon: <NavigationOutlined />, path: '/notices' },
        { id: 'nav-fac-meetings', type: 'NAV', text: 'Departmental Meetings & MOM', icon: <NavigationOutlined />, path: '/meetings' },
        { id: 'nav-fac-complaints', type: 'NAV', text: 'Maintenance & Infrastructure Helpdesk', icon: <NavigationOutlined />, path: '/complaints' },
        { id: 'nav-fac-analytics', type: 'NAV', text: 'Faculty Teaching Analytics', icon: <NavigationOutlined />, path: '/analytics' },
      ];
    }

    // Default for Student role
    return [
      { id: 'nav-stu-dash', type: 'NAV', text: 'Go to Student Dashboard', icon: <NavigationOutlined />, path: '/' },
      { id: 'nav-stu-profile', type: 'NAV', text: 'My Student Profile & ID Card', icon: <NavigationOutlined />, path: '/student/profile' },
      { id: 'nav-stu-academics', type: 'NAV', text: 'My Enrolled Subjects & Curriculum', icon: <NavigationOutlined />, path: '/student/academics' },
      { id: 'nav-stu-att', type: 'NAV', text: 'My Class Attendance', icon: <NavigationOutlined />, path: '/student/attendance' },
      { id: 'nav-stu-asg', type: 'NAV', text: 'My Course Assignments', icon: <NavigationOutlined />, path: '/student/assignments' },
      { id: 'nav-stu-res', type: 'NAV', text: 'Exam Results & Marks Breakdown', icon: <NavigationOutlined />, path: '/student/examinations' },
      { id: 'nav-stu-hallticket', type: 'NAV', text: 'Examination Hall Ticket (Admit Card)', icon: <NavigationOutlined />, path: '/student/hall-ticket' },
      { id: 'nav-stu-tt', type: 'NAV', text: 'My Class Timetable', icon: <NavigationOutlined />, path: '/student/timetable' },
      { id: 'nav-stu-mat', type: 'NAV', text: 'Digital Library & Study Materials', icon: <NavigationOutlined />, path: '/student/library' },
      { id: 'nav-stu-fees', type: 'NAV', text: 'Fee Receipts & Dues Clearance', icon: <NavigationOutlined />, path: '/student/fees' },
      { id: 'nav-stu-placements', type: 'NAV', text: 'Placement Drives & Hackathons', icon: <NavigationOutlined />, path: '/student/placements' },
      { id: 'nav-stu-leaves', type: 'NAV', text: 'Submit Student Leave Request', icon: <NavigationOutlined />, path: '/student/leave' },
      { id: 'nav-stu-documents', type: 'NAV', text: 'Official Document & Certificate Requests', icon: <NavigationOutlined />, path: '/student/documents' },
      { id: 'nav-stu-complaints', type: 'NAV', text: 'Grievance & Maintenance Helpdesk', icon: <NavigationOutlined />, path: '/student/complaints' },
      { id: 'nav-stu-feedback', type: 'NAV', text: 'Submit Faculty Teaching Feedback', icon: <NavigationOutlined />, path: '/student/feedback' },
      { id: 'nav-stu-notices', type: 'NAV', text: 'College Notices & Bulletins', icon: <NavigationOutlined />, path: '/student/notices' },
    ];
  }, [user]);

  // Dynamic user records search mapping
  const userOptions = useMemo(() => {
    if (!usersData?.data) return [];
    return usersData.data.map((u) => ({
      id: `user-${u.id}`,
      type: 'RECORD_USER',
      text: `${u.name} (${u.role.replace('_', ' ')})`,
      icon: <PersonOutline />,
      path: `/admin/users?search=${encodeURIComponent(u.name)}`,
    }));
  }, [usersData]);

  // Dynamic subject records search mapping
  const subjectOptions = useMemo(() => {
    if (!subjectsData) return [];
    return subjectsData.map((s) => ({
      id: `subject-${s._id}`,
      type: 'RECORD_SUBJECT',
      text: `${s.name}${s.code ? ` (${s.code})` : ''}`,
      icon: <BookOutlined />,
      path: user?.role === 'FACULTY' ? '/materials' : '/admin/college-setup/subjects',
    }));
  }, [subjectsData, user]);

  const allItems = useMemo(() => {
    return [...roleStaticOptions, ...userOptions, ...subjectOptions];
  }, [roleStaticOptions, userOptions, subjectOptions]);

  // Map icons onto recent items
  const recentOptions = useMemo(() => {
    return recentItems.map((item) => ({
      ...item,
      icon: getIconForType(item.originalType),
      type: 'RECENT',
    }));
  }, [recentItems]);

  // Fuzzy filter query match - if empty, show recents first, then navigation defaults
  const filtered = useMemo(() => {
    if (query === '') {
      return [...recentOptions, ...roleStaticOptions];
    }
    return allItems.filter((item) =>
      item.text.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, recentOptions, roleStaticOptions, allItems]);

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
            const globalIndex = filtered.findIndex((i) => i.id === item.id);
            const isSelected = globalIndex === selectedIndex;

            return (
              <ListItemButton
                key={item.id}
                selected={isSelected}
                onClick={() => handleAction(item)}
                onMouseEnter={() => setSelectedIndex(globalIndex)}
                sx={{
                  px: 2,
                  py: 1.25,
                  borderRadius: 1.5,
                  mx: 1,
                  my: 0.25,
                  '&.Mui-selected': {
                    bgcolor: 'action.selected',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: isSelected ? 'primary.main' : 'text.secondary' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    variant: 'body2',
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? 'primary.main' : 'text.primary',
                  }}
                />
                {isSelected && (
                  <ArrowForwardOutlined fontSize="small" color="primary" />
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
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        pt: { xs: 4, sm: 10 },
      }}
    >
      <Box
        onKeyDown={handleKeyDown}
        sx={{
          width: '100%',
          maxWidth: 640,
          bgcolor: 'background.paper',
          borderRadius: 3,
          boxShadow: 24,
          outline: 'none',
          overflow: 'hidden',
          mx: 2,
        }}
      >
        {/* Search Input Field */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          <SearchOutlined color="action" />
          <TextField
            inputRef={inputRef}
            fullWidth
            variant="standard"
            placeholder={`Search features & commands for ${user?.role || 'user'}... (Press ESC to close)`}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            InputProps={{ disableUnderline: true }}
            sx={{
              '& input': {
                fontSize: '1rem',
                fontWeight: 500,
              },
            }}
          />
        </Box>

        {/* Results List View */}
        <Box sx={{ maxHeight: 380, overflowY: 'auto', py: 1 }}>
          {filtered.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
              No matching commands or pages found.
            </Typography>
          ) : (
            <>
              {renderGroup('RECENT', 'RECENTLY VISITED')}
              {renderGroup('NAV', 'AUTHORIZED NAVIGATION')}
              {renderGroup('ACTION', 'QUICK ACTIONS')}
              {renderGroup('RECORD_USER', 'USERS DIRECTORY')}
              {renderGroup('RECORD_SUBJECT', 'CURRICULUM SUBJECTS')}
            </>
          )}
        </Box>

        <Divider />

        {/* Footer shortcuts info */}
        <Box
          sx={{
            px: 2.5,
            py: 1.25,
            bgcolor: 'action.hover',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            Role: <strong>{user?.role || 'GUEST'}</strong>
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Typography variant="caption" color="text.secondary">
              <kbd style={{ background: '#eee', color: '#333', padding: '2px 6px', borderRadius: '4px' }}>↑↓</kbd> Navigate
            </Typography>
            <Typography variant="caption" color="text.secondary">
              <kbd style={{ background: '#eee', color: '#333', padding: '2px 6px', borderRadius: '4px' }}>↵</kbd> Select
            </Typography>
            <Typography variant="caption" color="text.secondary">
              <kbd style={{ background: '#eee', color: '#333', padding: '2px 6px', borderRadius: '4px' }}>ESC</kbd> Close
            </Typography>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default CommandPalette;
