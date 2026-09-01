import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  IconButton,
  Tabs,
  Tab,
  Skeleton,
  useTheme,
} from '@mui/material';
import {
  NotificationsOutlined as NotificationsIcon,
  DoneAllOutlined as MarkAllIcon,
  CheckCircleOutlined as CheckIcon,
  OpenInNewOutlined as LinkIcon,
  CampaignOutlined as CampaignIcon,
  AssignmentOutlined as AssignmentIcon,
  SchoolOutlined as AcademicIcon,
  ReceiptLongOutlined as FeeIcon,
  WarningOutlined as AlertIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import {
  useNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} from '../../queries/notificationQueries';

const getCategoryConfig = (category) => {
  switch (category) {
    case 'ASSIGNMENT':
    case 'FACULTY_ASSIGNMENT':
      return { label: 'ASSIGNMENT', color: 'info', icon: <AssignmentIcon fontSize="small" /> };
    case 'ACADEMIC':
    case 'MARKS':
      return { label: 'ACADEMIC', color: 'primary', icon: <AcademicIcon fontSize="small" /> };
    case 'ATTENDANCE_LOW':
      return { label: 'LOW ATTENDANCE', color: 'error', icon: <AlertIcon fontSize="small" /> };
    case 'FEE_PAYMENT':
      return { label: 'FEE STATEMENT', color: 'secondary', icon: <FeeIcon fontSize="small" /> };
    case 'NOTICE':
    case 'GENERAL':
      return { label: 'NOTICE', color: 'warning', icon: <CampaignIcon fontSize="small" /> };
    default:
      return { label: category || 'GENERAL', color: 'default', icon: <NotificationsIcon fontSize="small" /> };
  }
};

const resolveStudentLink = (rawLink, category) => {
  if (rawLink) {
    if (rawLink === '/notices' || rawLink === '/hod/notices' || rawLink === '/admin/notices') return '/student/notices';
    if (rawLink === '/leaves' || rawLink === '/hod/leave-management' || rawLink === '/admin/leave-management') return '/student/leave';
    if (rawLink === '/attendance' || rawLink === '/hod/attendance') return '/student/attendance';
    if (rawLink === '/assignments') return '/student/assignments';
    if (rawLink === '/complaints' || rawLink === '/hod/complaints' || rawLink === '/admin/complaints') return '/student/complaints';
    if (rawLink === '/fees') return '/student/fees';
    if (rawLink === '/documents' || rawLink === '/hod/documents' || rawLink === '/admin/certificates') return '/student/documents';
    if (rawLink === '/placements' || rawLink === '/hod/placements') return '/student/placements';
    return rawLink;
  }
  if (category === 'NOTICE') return '/student/notices';
  if (category === 'LEAVE') return '/student/leave';
  if (category === 'ATTENDANCE_LOW') return '/student/attendance';
  if (category === 'ASSIGNMENT') return '/student/assignments';
  if (category === 'COMPLAINT') return '/student/complaints';
  if (category === 'FEE_PAYMENT') return '/student/fees';
  if (category === 'DOCUMENT') return '/student/documents';
  if (category === 'PLACEMENT') return '/student/placements';
  return '/student/dashboard';
};

export const StudentNotificationsPage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();

  const [tabValue, setTabValue] = useState(0); // 0: All, 1: Unread Only

  const unreadOnly = tabValue === 1;

  const { data, isLoading } = useNotificationsQuery({
    page: 1,
    limit: 50,
    unreadOnly,
  });

  const markAsReadMutation = useMarkAsReadMutation();
  const markAllAsReadMutation = useMarkAllAsReadMutation();

  const notifications = data?.notifications || [];
  const unreadCount = data?.meta?.unreadCount || notifications.filter((n) => !n.isRead).length;

  const handleTabChange = (_event, newValue) => {
    setTabValue(newValue);
  };

  const handleMarkSingleRead = (id) => {
    markAsReadMutation.mutate(id);
  };

  const handleMarkAllRead = () => {
    markAllAsReadMutation.mutate();
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3.5 }}>
      {/* Header & Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', mb: 0.5 }}>
            Student Notifications Desk
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Official institutional alerts, coursework notices, and attendance updates.
          </Typography>
        </Box>

        {unreadCount > 0 && (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<MarkAllIcon />}
            onClick={handleMarkAllRead}
            disabled={markAllAsReadMutation.isPending}
            sx={{
              borderRadius: '12px',
              fontWeight: 800,
              textTransform: 'none',
              px: 2.5,
              py: 1,
            }}
          >
            Mark All as Read
          </Button>
        )}
      </Box>

      {/* Tabs & Content Paper */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '24px',
          border: `1px solid ${theme.palette.divider}`,
          overflow: 'hidden',
          bgcolor: isDark ? 'background.paper' : '#ffffff',
        }}
      >
        <Box sx={{ borderBottom: `1px solid ${theme.palette.divider}`, px: 3, pt: 1 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                fontWeight: 800,
                textTransform: 'none',
                fontSize: '0.95rem',
                mr: 2,
              },
            }}
          >
            <Tab label="All Notifications" />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>Unread Only</span>
                  {unreadCount > 0 && (
                    <Chip
                      label={unreadCount}
                      color="primary"
                      size="small"
                      sx={{ height: 20, fontSize: '0.72rem', fontWeight: 800 }}
                    />
                  )}
                </Box>
              }
            />
          </Tabs>
        </Box>

        {/* Notifications List Body */}
        <Box sx={{ p: 3 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[1, 2, 3, 4].map((item) => (
                <Skeleton key={item} variant="rounded" height={80} sx={{ borderRadius: '16px' }} />
              ))}
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <NotificationsIcon sx={{ fontSize: 56, color: 'text.secondary', opacity: 0.4, mb: 1.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
                {tabValue === 1 ? 'No Unread Notifications' : 'No Notifications Available'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                {tabValue === 1
                  ? 'All institutional alerts and updates have been reviewed.'
                  : 'You have no published alerts or messages at this time.'}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {notifications.map((item) => {
                const categoryConfig = getCategoryConfig(item.category);
                return (
                  <Paper
                    key={item._id}
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: '16px',
                      border: `1px solid ${
                        !item.isRead
                          ? theme.palette.primary.main
                          : theme.palette.divider
                      }`,
                      bgcolor: !item.isRead
                        ? isDark
                          ? 'rgba(79, 70, 229, 0.08)'
                          : 'rgba(79, 70, 229, 0.03)'
                        : isDark
                        ? 'rgba(255,255,255,0.01)'
                        : 'rgba(0,0,0,0.01)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                      },
                    }}
                  >
                    <Grid container spacing={2} alignItems="flex-start">
                      <Grid item xs={12} sm={9} md={10}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
                          <Chip
                            icon={categoryConfig.icon}
                            label={categoryConfig.label}
                            color={categoryConfig.color}
                            size="small"
                            sx={{ fontWeight: 800, fontSize: '0.72rem' }}
                          />
                          {!item.isRead && (
                            <Chip
                              label="NEW"
                              color="error"
                              size="small"
                              sx={{ fontWeight: 900, height: 20, fontSize: '0.65rem' }}
                            />
                          )}
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            {new Date(item.createdAt).toLocaleString(undefined, {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </Typography>
                        </Box>

                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
                          {item.title}
                        </Typography>

                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, lineHeight: 1.6 }}>
                          {item.message}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} sm={3} md={2} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
                        {item.link && (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<LinkIcon />}
                            onClick={() => navigate(resolveStudentLink(item.link, item.category))}
                            sx={{ textTransform: 'none', fontWeight: 800, borderRadius: '8px' }}
                          >
                            View
                          </Button>
                        )}

                        {!item.isRead && (
                          <IconButton
                            color="primary"
                            title="Mark as read"
                            onClick={() => handleMarkSingleRead(item._id)}
                            disabled={markAsReadMutation.isPending}
                            sx={{
                              bgcolor: `${theme.palette.primary.main}15`,
                              '&:hover': { bgcolor: `${theme.palette.primary.main}30` },
                            }}
                          >
                            <CheckIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Grid>
                    </Grid>
                  </Paper>
                );
              })}
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default StudentNotificationsPage;
