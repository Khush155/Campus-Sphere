// client/src/pages/faculty/components/NoticesAndEvents.jsx
//
// Dashboard widget that displays Recent Notices and Upcoming Events
// in a tabbed interface. Tabs keep the widget compact while showing
// two distinct data sources.
//
// Props:
//   notices — array from mockRecentNotices:
//     [{ id, title, date, category, priority }]
//
//   events — array from mockUpcomingEvents:
//     [{ id, title, date }]
//
// Future: notices from GET /api/v1/notices, events from GET /api/v1/events.

import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Tab,
  Tabs,
  Button,
} from '@mui/material';
import {
  Campaign as NoticesIcon,
  Event as EventsIcon,
  ArrowForward as ArrowIcon,
  OpenInNew as OpenIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const getPriorityChipSx = (priority) => {
  if (priority === 'high') {
    return {
      bgcolor: 'rgba(239, 68, 68, 0.1)',
      color: 'error.main',
    };
  }
  return {
    bgcolor: 'rgba(79, 70, 229, 0.1)',
    color: 'primary.main',
  };
};

export const NoticesAndEvents = ({ notices = [], events = [] }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_event, newValue) => {
    setActiveTab(newValue);
  };

  const MAX_ITEMS = 3;
  const displayedNotices = notices.slice(0, MAX_ITEMS);
  const displayedEvents = events.slice(0, MAX_ITEMS);

  return (
    <Paper sx={{ p: 3, borderRadius: '16px', border: (theme) => `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
      {/* ── Section Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {activeTab === 0 ? (
            <NoticesIcon color="primary" />
          ) : (
            <EventsIcon color="primary" />
          )}
          <Typography
            variant="h6"
            sx={{ fontWeight: 800, color: 'text.primary' }}
          >
            {activeTab === 0 ? 'Recent Notices' : 'Upcoming Events'}
          </Typography>
        </Box>

        <Button
          size="small"
          variant="outlined"
          startIcon={<OpenIcon sx={{ fontSize: 15 }} />}
          onClick={() => navigate('/notices')}
          sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem' }}
        >
          Notice Board
        </Button>
      </Box>

      {/* ── Tabs ── */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{
          minHeight: 36,
          mb: 1,
          '& .MuiTab-root': {
            minHeight: 36,
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '0.8rem',
            py: 0.5,
          },
          '& .MuiTabs-indicator': {
            height: 2.5,
            borderRadius: 2,
          },
        }}
      >
        <Tab label={`Notices (${notices.length})`} />
        <Tab label={`Events (${events.length})`} />
      </Tabs>

      <Divider />

      {/* ── Tab Content (Fixed Height Scrollable Container) ── */}
      <Box
        sx={{
          minHeight: 140,
          height: 140,
          overflowY: 'auto',
          pr: 0.5,
          display: 'flex',
          flexDirection: 'column',
          '&::-webkit-scrollbar': { width: '5px' },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': { background: (theme) => theme.palette.divider, borderRadius: '4px' },
        }}
      >
        {/* Notices Tab */}
        {activeTab === 0 && (
          displayedNotices.length === 0 ? (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: 'center' }}
              >
                No recent notices.
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {displayedNotices.map((notice) => (
                <ListItem
                  key={notice.id}
                  disableGutters
                  secondaryAction={
                    <Chip
                      label={notice.category || notice.type || 'General'}
                      size="small"
                      sx={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        height: 22,
                        ...getPriorityChipSx(notice.priority),
                      }}
                    />
                  }
                  sx={{
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    py: 1.25,
                    '&:last-child': { borderBottom: 'none' },
                  }}
                >
                  <ListItemText
                    primary={notice.title}
                    secondary={notice.date}
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: 700,
                      color: 'text.primary',
                      sx: {
                        mb: 0.5,
                        pr: 8,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      },
                    }}
                    secondaryTypographyProps={{
                      variant: 'caption',
                      color: 'text.secondary',
                      fontWeight: 500,
                    }}
                  />
                </ListItem>
              ))}
            </List>
          )
        )}

        {/* Events Tab */}
        {activeTab === 1 && (
          displayedEvents.length === 0 ? (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: 'center' }}
              >
                No upcoming events.
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {displayedEvents.map((event) => (
                <ListItem
                  key={event.id}
                  disableGutters
                  secondaryAction={
                    <Chip
                      label={event.date}
                      size="small"
                      sx={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        height: 22,
                        bgcolor: 'rgba(245, 158, 11, 0.1)',
                        color: '#f59e0b',
                      }}
                    />
                  }
                  sx={{
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    py: 1.25,
                    '&:last-child': { borderBottom: 'none' },
                  }}
                >
                  <ListItemText
                    primary={event.title}
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: 700,
                      color: 'text.primary',
                      sx: {
                        pr: 10,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      },
                    }}
                  />
                </ListItem>
              ))}
            </List>
          )
        )}
      </Box>

      {/* Footer link to Notice Hub */}
      <Box sx={{ mt: 2, pt: 1.5, borderTop: (theme) => `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          {activeTab === 0
            ? (notices.length > MAX_ITEMS ? `Showing 3 of ${notices.length} notices` : `Showing all ${notices.length} notices`)
            : (events.length > MAX_ITEMS ? `Showing 3 of ${events.length} events` : `Showing all ${events.length} events`)
          }
        </Typography>
        <Button
          size="small"
          color="primary"
          endIcon={<ArrowIcon fontSize="small" />}
          onClick={() => navigate('/notices')}
          sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.78rem' }}
        >
          View Full Notice Board
        </Button>
      </Box>
    </Paper>
  );
};

export default NoticesAndEvents;
