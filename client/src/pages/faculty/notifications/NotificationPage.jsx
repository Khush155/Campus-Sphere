// client/src/pages/faculty/notifications/NotificationPage.jsx
//
// Page component rendering the Notification Center for Faculty.
// Handles read/unread filters, mock status updates, and dynamic alerts.

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Button,
  Tabs,
  Tab,
  Divider,
  Badge,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Notifications as BellIcon,
  AssignmentTurnedIn as SubmissionIcon,
  Warning as PendingIcon,
  EventNote as CalendarIcon,
  Info as InfoIcon,
  CheckCircle as ReadIcon,
  FiberManualRecord as UnreadDotIcon,
  DeleteOutline as TrashIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const initialNotifications = [
  {
    id: 'n1',
    title: 'Assignment Submissions Received',
    message: '5 students submitted their work for "CSE201 - Assignment 1 (Balanced Trees)".',
    category: 'ACADEMIC',
    type: 'SUBMISSION',
    timestamp: '2 hours ago',
    unread: true,
  },
  {
    id: 'n2',
    title: 'Marks Verification Pending',
    message: 'Gradebook for "DBMS Midterm Assessment" requires review and approval.',
    category: 'ADMINISTRATIVE',
    type: 'PENDING',
    timestamp: '5 hours ago',
    unread: true,
  },
  {
    id: 'n3',
    title: 'Exam Scheduled',
    message: 'Operating Systems End-Term theory exam scheduled for July 24th in Hall-A.',
    category: 'ACADEMIC',
    type: 'CALENDAR',
    timestamp: '1 day ago',
    unread: false,
  },
  {
    id: 'n4',
    title: 'Timetable Adjustment',
    message: 'Wednesday Period 2 slot shifted to room LH-202 (Database Lecture).',
    category: 'ADMINISTRATIVE',
    type: 'CALENDAR',
    timestamp: '2 days ago',
    unread: false,
  },
  {
    id: 'n5',
    title: 'College Notice Published',
    message: 'Registrar office announced extension of semester enrollment deadline.',
    category: 'SYSTEM',
    type: 'INFO',
    timestamp: '3 days ago',
    unread: false,
  },
];

export const NotificationPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeTab, setActiveTab] = useState(0); // 0 = All, 1 = Unread, 2 = Academic, 3 = Admin

  // Handlers
  const handleMarkAsRead = (id) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  const handleMarkAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, unread: false })));
  };

  const handleDelete = (id) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  // Filter Logic
  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 1) return n.unread;
    if (activeTab === 2) return n.category === 'ACADEMIC';
    if (activeTab === 3) return n.category === 'ADMINISTRATIVE';
    return true; // Tab 0 = All
  });

  const unreadCount = notifications.filter((n) => n.unread).length;

  const getIconForType = (type) => {
    switch (type) {
      case 'SUBMISSION':
        return <SubmissionIcon color="primary" />;
      case 'PENDING':
        return <PendingIcon color="error" />;
      case 'CALENDAR':
        return <CalendarIcon color="warning" />;
      case 'INFO':
      default:
        return <InfoIcon color="info" />;
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* ── Page Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton
            onClick={() => navigate('/faculty')}
            size="small"
            sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}
          >
            <BackIcon fontSize="small" />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
              Notification Center
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track grades pending approvals, student submissions, and schedule changes
            </Typography>
          </Box>
        </Box>
        {unreadCount > 0 && (
          <Button
            variant="outlined"
            onClick={handleMarkAllRead}
            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}
          >
            Mark all as read
          </Button>
        )}
      </Box>

      {/* ── Tabs Filter Row ── */}
      <Paper variant="outlined" sx={{ borderRadius: 3.5, overflow: 'hidden', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  All
                </Typography>
                <Badge badgeContent={notifications.length} color="secondary" sx={{ mr: 1 }} />
              </Box>
            }
            sx={{ textTransform: 'none', py: 2 }}
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Unread
                </Typography>
                <Badge badgeContent={unreadCount} color="error" sx={{ mr: 1 }} />
              </Box>
            }
            sx={{ textTransform: 'none', py: 2 }}
          />
          <Tab label="Academic" sx={{ textTransform: 'none', py: 2, fontWeight: 700 }} />
          <Tab label="Administrative" sx={{ textTransform: 'none', py: 2, fontWeight: 700 }} />
        </Tabs>

        {/* ── Notification List ── */}
        {filteredNotifications.length > 0 ? (
          <List disablePadding>
            {filteredNotifications.map((item, index) => (
              <React.Fragment key={item.id}>
                <ListItem
                  sx={{
                    px: 3,
                    py: 2.5,
                    bgcolor: item.unread ? 'action.hover' : 'transparent',
                    transition: 'background-color 0.2s',
                    '&:hover': { bgcolor: 'action.selected' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 46 }}>
                    {getIconForType(item.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                          {item.title}
                        </Typography>
                        {item.unread && (
                          <UnreadDotIcon sx={{ fontSize: 10, color: '#ef4444' }} />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, lineHeight: 1.4 }}>
                          {item.message}
                        </Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600 }}>
                          {item.timestamp}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {item.unread && (
                        <Tooltip title="Mark as read">
                          <IconButton onClick={() => handleMarkAsRead(item.id)} size="small">
                            <ReadIcon fontSize="small" color="primary" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete">
                        <IconButton onClick={() => handleDelete(item.id)} size="small" color="error">
                          <TrashIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < filteredNotifications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          /* Empty Notifications Display */
          <Box
            sx={{
              p: 8,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BellIcon sx={{ fontSize: 50, color: 'text.secondary', mb: 2 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              All caught up!
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
              No notifications match your active filter tab.
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default NotificationPage;
