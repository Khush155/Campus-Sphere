import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Box,
  Typography,
  Chip,
  Button,
  Divider,
  Avatar,
  Skeleton,
  useTheme,
  Tooltip,
} from '@mui/material';
import {
  NotificationsOutlined,
  CampaignOutlined,
  EventNoteOutlined,
  SwapHorizOutlined,
  WarningAmberOutlined,
  GradeOutlined,
  AssignmentIndOutlined,
  PaymentOutlined,
  DoneAllOutlined,
  InfoOutlined,
} from '@mui/icons-material';

import {
  useUnreadCountQuery,
  useNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} from '../../queries/notificationQueries';
import { useAuth } from '../../contexts/AuthContext';

// Helper to format relative time
const getRelativeTime = (timestamp) => {
  if (!timestamp) return '';
  const now = new Date();
  const date = new Date(timestamp);
  const diffInSecs = Math.floor((now - date) / 1000);

  if (diffInSecs < 60) return 'Just now';
  if (diffInSecs < 3600) return `${Math.floor(diffInSecs / 60)}m ago`;
  if (diffInSecs < 86400) return `${Math.floor(diffInSecs / 3600)}h ago`;
  if (diffInSecs < 604800) return `${Math.floor(diffInSecs / 86400)}d ago`;
  return date.toLocaleDateString();
};

// Helper to select icon & color per category
const getCategoryDetails = (category, theme) => {
  switch (category) {
    case 'NOTICE':
      return { icon: <CampaignOutlined fontSize="small" />, color: theme.palette.info.main, bg: `${theme.palette.info.main}18` };
    case 'LEAVE':
      return { icon: <EventNoteOutlined fontSize="small" />, color: theme.palette.warning.main, bg: `${theme.palette.warning.main}18` };
    case 'CROSS_DEPT':
      return { icon: <SwapHorizOutlined fontSize="small" />, color: theme.palette.secondary.main, bg: `${theme.palette.secondary.main}18` };
    case 'ATTENDANCE_LOW':
      return { icon: <WarningAmberOutlined fontSize="small" />, color: theme.palette.error.main, bg: `${theme.palette.error.main}18` };
    case 'MARKS':
      return { icon: <GradeOutlined fontSize="small" />, color: theme.palette.success.main, bg: `${theme.palette.success.main}18` };
    case 'FACULTY_ASSIGNMENT':
      return { icon: <AssignmentIndOutlined fontSize="small" />, color: theme.palette.primary.main, bg: `${theme.palette.primary.main}18` };
    case 'FEE_PAYMENT':
      return { icon: <PaymentOutlined fontSize="small" />, color: theme.palette.success.main, bg: `${theme.palette.success.main}18` };
    default:
      return { icon: <InfoOutlined fontSize="small" />, color: theme.palette.text.secondary, bg: `${theme.palette.action.selected}` };
  }
};

// Helper to resolve role-sensitive target routes for notifications
const resolveNotificationTargetRoute = (notification, userRole) => {
  const rawLink = notification.link;
  const category = notification.category;

  if (rawLink) {
    if (userRole === 'HOD') {
      if (category === 'LEAVE' || rawLink.includes('leave') || rawLink === '/hod/reports') return '/hod/leave-management';
      if (rawLink === '/notices') return '/hod/notices';
      if (rawLink === '/attendance') return '/hod/attendance';
      if (rawLink === '/assignments') return '/hod/faculty-assignment';
    } else if (userRole === 'FACULTY') {
      if (rawLink === '/hod/leave-management') return '/leaves';
      if (rawLink === '/hod/notices') return '/notices';
    } else if (userRole === 'STUDENT') {
      if (rawLink === '/notices') return '/notices';
      if (rawLink === '/leaves') return '/student/leave';
      if (rawLink === '/attendance') return '/student/attendance';
    } else if (userRole === 'SUPER_ADMIN' || userRole === 'COLLEGE_ADMIN') {
      if (rawLink === '/notices') return '/admin/notices';
      if (rawLink === '/leaves') return '/admin/reports';
    }
    return rawLink;
  }

  switch (category) {
    case 'NOTICE':
      return userRole === 'HOD' ? '/hod/notices' : userRole === 'SUPER_ADMIN' || userRole === 'COLLEGE_ADMIN' ? '/admin/notices' : '/notices';
    case 'LEAVE':
      return userRole === 'HOD' ? '/hod/leave-management' : userRole === 'STUDENT' ? '/student/leave' : '/leaves';
    case 'CROSS_DEPT':
      return '/hod/cross-dept-requests';
    case 'ATTENDANCE_LOW':
      return userRole === 'HOD' ? '/hod/attendance' : userRole === 'FACULTY' ? '/attendance' : '/student/attendance';
    case 'FACULTY_ASSIGNMENT':
      return userRole === 'HOD' ? '/hod/faculty-assignment' : '/assignments';
    case 'FEE_PAYMENT':
      return userRole === 'SUPER_ADMIN' || userRole === 'COLLEGE_ADMIN' ? '/admin/fee-clearance' : '/fees';
    default:
      return '/';
  }
};

export const NotificationMenu = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  // Queries & Mutations
  const { data: unreadCount = 0 } = useUnreadCountQuery();
  const { data, isLoading } = useNotificationsQuery({ page: 1, limit: 12, enabled: open });
  const markAsReadMutation = useMarkAsReadMutation();
  const markAllAsReadMutation = useMarkAllAsReadMutation();

  const notifications = data?.notifications || [];

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleItemClick = (item) => {
    if (!item.isRead) {
      markAsReadMutation.mutate(item._id);
    }
    handleClose();
    const targetRoute = resolveNotificationTargetRoute(item, user?.role);
    if (targetRoute) {
      navigate(targetRoute);
    }
  };

  const handleMarkAllRead = () => {
    markAllAsReadMutation.mutate();
  };

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton onClick={handleOpen} sx={{ color: 'text.secondary' }}>
          <Badge
            badgeContent={unreadCount > 0 ? unreadCount : null}
            color="error"
            max={99}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.65rem',
                fontWeight: 800,
                height: 18,
                minWidth: 18,
                px: 0.5,
              },
            }}
          >
            <NotificationsOutlined fontSize="small" />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1.5,
            width: 360,
            maxHeight: 520,
            borderRadius: 3,
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
            p: 0,
            overflow: 'hidden',
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Chip
                label={`${unreadCount} unread`}
                size="small"
                color="primary"
                sx={{ fontSize: '0.65rem', height: 20, fontWeight: 800 }}
              />
            )}
          </Box>

          {unreadCount > 0 && (
            <Button
              size="small"
              onClick={handleMarkAllRead}
              disabled={markAllAsReadMutation.isPending}
              startIcon={<DoneAllOutlined sx={{ fontSize: '0.9rem !important' }} />}
              sx={{ fontSize: '0.72rem', textTransform: 'none', fontWeight: 700 }}
            >
              Mark all read
            </Button>
          )}
        </Box>

        {/* Content Body */}
        <Box sx={{ overflowY: 'auto', maxHeight: 420 }}>
          {isLoading ? (
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {[1, 2, 3].map((i) => (
                <Box key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  <Skeleton variant="circular" width={36} height={36} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="70%" height={20} />
                    <Skeleton variant="text" width="90%" height={16} />
                  </Box>
                </Box>
              ))}
            </Box>
          ) : notifications.length === 0 ? (
            /* Empty State */
            <Box sx={{ py: 6, px: 3, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <Avatar
                sx={{
                  width: 52,
                  height: 52,
                  bgcolor: `${theme.palette.primary.main}15`,
                  color: theme.palette.primary.main,
                  mb: 1,
                }}
              >
                <DoneAllOutlined />
              </Avatar>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                You&apos;re all caught up! 🎉
              </Typography>
              <Typography variant="caption" color="text.secondary">
                No new notifications at the moment.
              </Typography>
            </Box>
          ) : (
            notifications.map((item, index) => {
              const catDetails = getCategoryDetails(item.category, theme);
              return (
                <React.Fragment key={item._id}>
                  {index > 0 && <Divider sx={{ opacity: 0.5 }} />}
                  <MenuItem
                    onClick={() => handleItemClick(item)}
                    sx={{
                      py: 1.5,
                      px: 2,
                      alignItems: 'flex-start',
                      bgcolor: !item.isRead
                        ? theme.palette.mode === 'dark'
                          ? `${theme.palette.primary.main}15`
                          : `${theme.palette.primary.main}0B`
                        : 'transparent',
                      transition: 'background-color 0.2s',
                      '&:hover': {
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                      },
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        mr: 1.75,
                        mt: 0.25,
                        bgcolor: catDetails.bg,
                        color: catDetails.color,
                        fontSize: '0.9rem',
                      }}
                    >
                      {catDetails.icon}
                    </Avatar>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.25 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: !item.isRead ? 800 : 600,
                            fontSize: '0.82rem',
                            color: 'text.primary',
                            noWrap: true,
                          }}
                        >
                          {item.title}
                        </Typography>
                        {!item.isRead && (
                          <Box
                            sx={{
                              width: 7,
                              height: 7,
                              borderRadius: '50%',
                              bgcolor: theme.palette.primary.main,
                              ml: 1,
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </Box>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.3,
                          fontSize: '0.75rem',
                          mb: 0.5,
                        }}
                      >
                        {item.message}
                      </Typography>

                      <Typography variant="caption" sx={{ fontSize: '0.68rem', color: 'text.disabled', fontWeight: 600 }}>
                        {getRelativeTime(item.createdAt)}
                      </Typography>
                    </Box>
                  </MenuItem>
                </React.Fragment>
              );
            })
          )}
        </Box>
      </Menu>
    </>
  );
};

export default NotificationMenu;
