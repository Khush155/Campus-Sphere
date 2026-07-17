// client/src/pages/faculty/notifications/NotificationPage.jsx
//
// Page component rendering the Notification Center for Faculty with backend integration.

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
  Badge,
  Tooltip,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Notifications as BellIcon,
  AssignmentTurnedIn as SubmissionIcon,
  Warning as PendingIcon,
  Info as InfoIcon,
  CheckCircle as ReadIcon,
  FiberManualRecord as UnreadDotIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Import backend query hooks
import {
  useNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from '../../../queries/facultyQueries';

export const NotificationPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0); // 0 = All, 1 = Unread, 2 = Academic, 3 = Admin

  // Query notifications from backend
  const { data: notifications = [], isLoading } = useNotificationsQuery();

  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();

  // Handlers
  const handleMarkAsRead = (id) => {
    markReadMutation.mutate(id);
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  // Filter Logic
  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 1) return !n.isRead;
    if (activeTab === 2) return n.category === 'ACADEMIC';
    if (activeTab === 3) return n.category === 'ADMINISTRATIVE';
    return true; // Tab 0 = All
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getIconForCategory = (category) => {
    switch (category) {
      case 'ACADEMIC':
        return <SubmissionIcon color="primary" />;
      case 'ADMINISTRATIVE':
        return <PendingIcon color="error" />;
      case 'GENERAL':
      default:
        return <InfoIcon color="info" />;
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

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
            disabled={markAllReadMutation.isPending}
            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}
          >
            {markAllReadMutation.isPending ? 'Marking...' : 'Mark all as read'}
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
              <React.Fragment key={item._id}>
                <ListItem
                  sx={{
                    px: 3,
                    py: 2.5,
                    bgcolor: !item.isRead ? 'action.hover' : 'transparent',
                    transition: 'background-color 0.2s',
                    '&:hover': { bgcolor: 'action.selected' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 46 }}>
                    {getIconForCategory(item.category)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                          {item.title}
                        </Typography>
                        {!item.isRead && (
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
                          {new Date(item.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {!item.isRead && (
                        <Tooltip title="Mark as read">
                          <IconButton
                            onClick={() => handleMarkAsRead(item._id)}
                            disabled={markReadMutation.isPending}
                            size="small"
                          >
                            <ReadIcon fontSize="small" color="primary" />
                          </IconButton>
                        </Tooltip>
                      )}
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
