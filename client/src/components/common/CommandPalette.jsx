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
} from '@mui/icons-material';
import { useUsersQuery } from '../../queries/userQueries';
import { useSubjectsQuery } from '../../queries/collegeQueries';

// Maps dynamic icons based on item category
const getIconForType = (type) => {
  switch (type) {
    case 'NAV':
      return <NavigationOutlined />;
    case 'ACTION':
      return <FlashOnOutlined />;
    case 'RECORD_USER':
      return <PersonOutline />;
    case 'RECORD_SUBJECT':
      return <BookOutlined />;
    default:
      return <NavigationOutlined />;
  }
};

export const CommandPalette = ({ open, onClose }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const inputRef = useRef(null);

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
  const { data: usersData } = useUsersQuery({ limit: 50 });
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

  // Static options list
  const staticOptions = [
    // Navigation
    { id: 'nav-dash', type: 'NAV', text: 'Go to Dashboard', icon: <NavigationOutlined />, path: '/admin/dashboard' },
    { id: 'nav-depts', type: 'NAV', text: 'Go to College Setup - Departments', icon: <NavigationOutlined />, path: '/admin/college-setup/departments' },
    { id: 'nav-courses', type: 'NAV', text: 'Go to College Setup - Courses', icon: <NavigationOutlined />, path: '/admin/college-setup/courses' },
    { id: 'nav-branches', type: 'NAV', text: 'Go to College Setup - Branches', icon: <NavigationOutlined />, path: '/admin/college-setup/branches' },
    { id: 'nav-subjects', type: 'NAV', text: 'Go to College Setup - Subjects', icon: <NavigationOutlined />, path: '/admin/college-setup/subjects' },
    { id: 'nav-users', type: 'NAV', text: 'Go to Users Directory', icon: <NavigationOutlined />, path: '/admin/users' },

    // Quick Actions
    { id: 'act-user', type: 'ACTION', text: 'Register new user account', icon: <FlashOnOutlined />, path: '/admin/users?register=true' },
    { id: 'act-dept', type: 'ACTION', text: 'Add a new department', icon: <FlashOnOutlined />, path: '/admin/college-setup/departments?add=true' },
    { id: 'act-course', type: 'ACTION', text: 'Add a new degree course', icon: <FlashOnOutlined />, path: '/admin/college-setup/courses?add=true' },
    { id: 'act-branch', type: 'ACTION', text: 'Add a new branch specialization', icon: <FlashOnOutlined />, path: '/admin/college-setup/branches?add=true' },
    { id: 'act-subject', type: 'ACTION', text: 'Add a curriculum subject', icon: <FlashOnOutlined />, path: '/admin/college-setup/subjects?add=true' },
  ];

  // Dynamic user records search mapping
  const userOptions = usersData?.data?.map((u) => ({
    id: `user-${u.id}`,
    type: 'RECORD_USER',
    text: `${u.name} (${u.role.replace('_', ' ')})`,
    icon: <PersonOutline />,
    path: `/admin/users?search=${encodeURIComponent(u.name)}`,
  })) || [];

  // Dynamic subject records search mapping
  // Dynamic subject records search mapping
  const subjectOptions = subjectsData?.map((s) => ({
    id: `subject-${s._id}`,
    type: 'RECORD_SUBJECT',
    text: `${s.name} (${s.code})`,
    icon: <BookOutlined />,
    path: `/admin/college-setup/subjects?search=${encodeURIComponent(s.name)}`,
  })) || [];

  const allItems = [...staticOptions, ...userOptions, ...subjectOptions];

  // Map icons onto recent items
  const recentOptions = recentItems.map((item) => ({
    ...item,
    icon: getIconForType(item.originalType),
    type: 'RECENT',
  }));

  // Fuzzy filter query match - if empty, show recents first, then navigation defaults
  const filtered = query === ''
    ? [...recentOptions, ...staticOptions]
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
                  bgcolor: isSelected ? theme.custom.interaction.hoverTint : 'transparent',
                  color: isSelected ? theme.palette.primary.main : theme.palette.text.primary,
                  '&.Mui-selected': {
                    bgcolor: theme.custom.interaction.hoverTint,
                    color: theme.palette.primary.main,
                    '&:hover': {
                      bgcolor: theme.custom.interaction.hoverTint,
                    },
                  },
                  '&:hover': {
                    bgcolor: theme.custom.interaction.hoverTint,
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
          bgcolor: theme.custom.surface.overlay,
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: `1px solid ${theme.custom.border.subtle}`,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '75vh',
          outline: 'none',
        }}
      >
        {/* Search Input Box */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: `1px solid ${theme.custom.border.subtle}`, bgcolor: theme.custom.surface.sunken }}>
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
              fontFamily: theme.typography.mono.fontFamily,
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
              {filtered.filter((i) => i.type === 'RECENT').length > 0 && <Divider sx={{ my: 1, borderColor: theme.custom.border.subtle }} />}
              {renderGroup('NAV', 'NAVIGATION')}
              {filtered.filter((i) => i.type === 'NAV').length > 0 &&
                filtered.filter((i) => i.type !== 'NAV' && i.type !== 'RECENT').length > 0 && <Divider sx={{ my: 1, borderColor: theme.custom.border.subtle }} />}
              {renderGroup('ACTION', 'QUICK ACTIONS')}
              {filtered.filter((i) => i.type === 'ACTION').length > 0 &&
                filtered.filter((i) => i.type.startsWith('RECORD')).length > 0 && <Divider sx={{ my: 1, borderColor: theme.custom.border.subtle }} />}
              {renderGroup('RECORD_USER', 'USERS RECORDS')}
              {filtered.filter((i) => i.type === 'RECORD_USER').length > 0 &&
                filtered.filter((i) => i.type === 'RECORD_SUBJECT').length > 0 && <Divider sx={{ my: 1, borderColor: theme.custom.border.subtle }} />}
              {renderGroup('RECORD_SUBJECT', 'CURRICULUM SUBJECTS')}
            </>
          )}
        </Box>

        {/* Footer shortcuts helper */}
        <Box
          sx={{
            p: 1.5,
            borderTop: `1px solid ${theme.custom.border.subtle}`,
            display: 'flex',
            gap: 2,
            justifyContent: 'flex-end',
            alignItems: 'center',
            bgcolor: theme.custom.surface.sunken,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontFamily: theme.typography.body2.fontFamily }}>
              Select:
            </Typography>
            <Typography variant="caption" sx={{ px: 0.6, py: 0.1, bgcolor: 'rgba(0,0,0,0.06)', borderRadius: '3px', fontFamily: theme.typography.mono.fontFamily, fontSize: '0.68rem' }}>
              ↑↓
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontFamily: theme.typography.body2.fontFamily }}>
              Execute:
            </Typography>
            <Typography variant="caption" sx={{ px: 0.6, py: 0.1, bgcolor: 'rgba(0,0,0,0.06)', borderRadius: '3px', fontFamily: theme.typography.mono.fontFamily, fontSize: '0.68rem' }}>
              Enter
            </Typography>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default CommandPalette;
