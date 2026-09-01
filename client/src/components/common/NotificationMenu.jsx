import React, { useState, useMemo } from 'react';
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
  BuildOutlined,
  SchoolOutlined,
  GroupsOutlined,
  DescriptionOutlined,
} from '@mui/icons-material';

import {
  useUnreadCountQuery,
  useNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} from '../../queries/notificationQueries';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

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
    case 'COMPLAINT':
      return { icon: <BuildOutlined fontSize="small" />, color: theme.palette.warning.main, bg: `${theme.palette.warning.main}18` };
    case 'EXAM':
      return { icon: <SchoolOutlined fontSize="small" />, color: theme.palette.primary.main, bg: `${theme.palette.primary.main}18` };
    case 'MEETING':
      return { icon: <GroupsOutlined fontSize="small" />, color: theme.palette.info.main, bg: `${theme.palette.info.main}18` };
    case 'DOCUMENT':
      return { icon: <DescriptionOutlined fontSize="small" />, color: theme.palette.secondary.main, bg: `${theme.palette.secondary.main}18` };
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
      if (rawLink === '/notices' || rawLink === '/student/notices') return '/hod/notices';
      if (rawLink === '/attendance' || rawLink === '/student/attendance') return '/hod/attendance';
      if (rawLink === '/assignments' || rawLink === '/student/assignments') return '/hod/faculty-assignment';
      if (rawLink === '/complaints' || rawLink === '/student/complaints') return '/hod/complaints';
      if (rawLink === '/meetings') return '/hod/meetings';
      if (rawLink === '/documents' || rawLink === '/student/documents') return '/hod/documents';
      if (rawLink === '/placements' || rawLink === '/student/placements') return '/hod/placements';
    } else if (userRole === 'FACULTY') {
      if (rawLink === '/hod/leave-management' || rawLink === '/student/leave') return '/leaves';
      if (rawLink === '/hod/notices' || rawLink === '/student/notices') return '/notices';
      if (rawLink === '/hod/complaints' || rawLink === '/student/complaints') return '/complaints';
      if (rawLink === '/hod/meetings') return '/meetings';
      if (rawLink === '/student/attendance') return '/attendance';
      if (rawLink === '/student/assignments') return '/assignments';
    } else if (userRole === 'STUDENT') {
      if (rawLink === '/notices' || rawLink === '/hod/notices' || rawLink === '/admin/notices') return '/student/notices';
      if (rawLink === '/leaves' || rawLink === '/hod/leave-management' || rawLink === '/admin/leave-management') return '/student/leave';
      if (rawLink === '/attendance' || rawLink === '/hod/attendance') return '/student/attendance';
      if (rawLink === '/assignments') return '/student/assignments';
      if (rawLink === '/complaints' || rawLink === '/hod/complaints' || rawLink === '/admin/complaints') return '/student/complaints';
      if (rawLink === '/fees') return '/student/fees';
      if (rawLink === '/documents' || rawLink === '/hod/documents' || rawLink === '/admin/certificates') return '/student/documents';
      if (rawLink === '/placements' || rawLink === '/hod/placements') return '/student/placements';
    } else if (userRole === 'SUPER_ADMIN' || userRole === 'COLLEGE_ADMIN') {
      if (rawLink === '/notices' || rawLink === '/student/notices' || rawLink === '/hod/notices') return '/admin/notices';
      if (rawLink === '/leaves' || rawLink === '/student/leave' || rawLink === '/hod/leave-management') return '/admin/leave-management';
      if (rawLink === '/complaints' || rawLink === '/student/complaints' || rawLink === '/hod/complaints') return '/admin/complaints';
      if (rawLink === '/placements' || rawLink === '/student/placements' || rawLink === '/hod/placements') return '/admin/placements';
    }
    return rawLink;
  }

  switch (category) {
    case 'NOTICE':
      return userRole === 'HOD' ? '/hod/notices' : (userRole === 'SUPER_ADMIN' || userRole === 'COLLEGE_ADMIN') ? '/admin/notices' : userRole === 'STUDENT' ? '/student/notices' : '/notices';
    case 'LEAVE':
      return userRole === 'HOD' ? '/hod/leave-management' : userRole === 'STUDENT' ? '/student/leave' : (userRole === 'SUPER_ADMIN' || userRole === 'COLLEGE_ADMIN') ? '/admin/leave-management' : '/leaves';
    case 'CROSS_DEPT':
      return '/hod/cross-dept-requests';
    case 'ATTENDANCE_LOW':
      return userRole === 'HOD' ? '/hod/attendance' : userRole === 'FACULTY' ? '/attendance' : '/student/attendance';
    case 'FACULTY_ASSIGNMENT':
      return userRole === 'HOD' ? '/hod/faculty-assignment' : (userRole === 'SUPER_ADMIN' || userRole === 'COLLEGE_ADMIN') ? '/admin/faculty-assignments' : '/assignments';
    case 'FEE_PAYMENT':
      return (userRole === 'SUPER_ADMIN' || userRole === 'COLLEGE_ADMIN') ? '/admin/fee-clearance' : '/student/fees';
    case 'COMPLAINT':
      return userRole === 'HOD' ? '/hod/complaints' : (userRole === 'SUPER_ADMIN' || userRole === 'COLLEGE_ADMIN') ? '/admin/complaints' : userRole === 'STUDENT' ? '/student/complaints' : '/complaints';
    case 'MEETING':
      return userRole === 'HOD' ? '/hod/meetings' : userRole === 'FACULTY' ? '/meetings' : '/';
    case 'DOCUMENT':
      return userRole === 'STUDENT' ? '/student/documents' : userRole === 'HOD' ? '/hod/documents' : '/admin/certificates';
    case 'PLACEMENT':
      return userRole === 'STUDENT' ? '/student/placements' : userRole === 'HOD' ? '/hod/placements' : '/admin/placements';
    default:
      return '/';
  }
};

export const NotificationMenu = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [anchorEl, setAnchorEl] = useState(null);
  const [filterTab, setFilterTab] = useState('ALL');
  const open = Boolean(anchorEl);

  // Queries & Mutations
  const { data: unreadCount = 0 } = useUnreadCountQuery();
  const { data, isLoading } = useNotificationsQuery({ page: 1, limit: 20, enabled: open });
  const markAsReadMutation = useMarkAsReadMutation();
  const markAllAsReadMutation = useMarkAllAsReadMutation();

  const notifications = data?.notifications;

  const filteredNotifications = useMemo(() => {
    const list = notifications || [];
    if (filterTab === 'UNREAD') {
      return list.filter((n) => !n.isRead);
    }
    if (filterTab === 'NOTICES') {
      return list.filter((n) => n.category === 'NOTICE');
    }
    if (filterTab === 'LEAVES') {
      return list.filter((n) => n.category === 'LEAVE');
    }
    if (filterTab === 'ACADEMIC') {
      return list.filter((n) =>
        ['MARKS', 'ATTENDANCE_LOW', 'FACULTY_ASSIGNMENT', 'EXAM'].includes(n.category)
      );
    }
    return list;
  }, [notifications, filterTab]);

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
    markAllAsReadMutation.mutate(undefined, {
      onSuccess: () => {
        showToast('All notifications marked as read!');
      },
    });
  };

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          onClick={handleOpen}
          sx={{
            color: 'text.secondary',
            position: 'relative',
            '&:hover': {
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
            },
          }}
        >
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
                animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { boxShadow: `0 0 0 0 ${theme.palette.error.main}80` },
                  '70%': { boxShadow: `0 0 0 6px ${theme.palette.error.main}00` },
                  '100%': { boxShadow: `0 0 0 0 ${theme.palette.error.main}00` },
                },
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
            width: 380,
            maxHeight: 560,
            borderRadius: 3,
            boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
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
              Notifications Hub
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

        {/* Filter Chips Bar */}
        <Box
          sx={{
            px: 2,
            py: 1,
            display: 'flex',
            gap: 1,
            overflowX: 'auto',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)',
            borderBottom: `1px solid ${theme.palette.divider}`,
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {[
            { id: 'ALL', label: 'All' },
            { id: 'UNREAD', label: 'Unread' },
            { id: 'NOTICES', label: 'Notices' },
            { id: 'LEAVES', label: 'Leaves' },
            { id: 'ACADEMIC', label: 'Academic' },
          ].map((tab) => (
            <Chip
              key={tab.id}
              label={tab.label}
              size="small"
              onClick={() => setFilterTab(tab.id)}
              variant={filterTab === tab.id ? 'filled' : 'outlined'}
              color={filterTab === tab.id ? 'primary' : 'default'}
              sx={{
                fontWeight: 700,
                fontSize: '0.68rem',
                height: 22,
                cursor: 'pointer',
              }}
            />
          ))}
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
          ) : filteredNotifications.length === 0 ? (
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
                {filterTab === 'ALL' ? 'No new notifications at the moment.' : `No ${filterTab.toLowerCase()} notifications found.`}
              </Typography>
            </Box>
          ) : (
            filteredNotifications.map((item, index) => {
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
