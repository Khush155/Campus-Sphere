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
} from '@mui/material';
import {
  Campaign as NoticesIcon,
  Event as EventsIcon,
} from '@mui/icons-material';

/**
 * Returns Chip styling based on notice priority.
 * Matches the pattern in Home.jsx notice board.
 */
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

export const NoticesAndEvents = ({ notices, events }) => {
  // Tab state: 0 = Notices, 1 = Events
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ── Section Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        {activeTab === 0 ? (
          <NoticesIcon color="primary" />
        ) : (
          <EventsIcon color="primary" />
        )}
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, color: 'text.primary' }}
        >
          {activeTab === 0 ? 'Recent Notices' : 'Upcoming Events'}
        </Typography>
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
            fontWeight: 600,
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

      {/* ── Tab Content ── */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {/* Notices Tab */}
        {activeTab === 0 && (
          notices.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ py: 3, textAlign: 'center' }}
            >
              No recent notices.
            </Typography>
          ) : (
            <List disablePadding>
              {notices.map((notice) => (
                <ListItem
                  key={notice.id}
                  disableGutters
                  secondaryAction={
                    <Chip
                      label={notice.category}
                      size="small"
                      sx={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        height: 22,
                        ...getPriorityChipSx(notice.priority),
                      }}
                    />
                  }
                  sx={{
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    py: 1.5,
                    '&:last-child': { borderBottom: 'none' },
                  }}
                >
                  <ListItemText
                    primary={notice.title}
                    secondary={notice.date}
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: 600,
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
                    }}
                  />
                </ListItem>
              ))}
            </List>
          )
        )}

        {/* Events Tab */}
        {activeTab === 1 && (
          events.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ py: 3, textAlign: 'center' }}
            >
              No upcoming events.
            </Typography>
          ) : (
            <List disablePadding>
              {events.map((event) => (
                <ListItem
                  key={event.id}
                  disableGutters
                  secondaryAction={
                    <Chip
                      label={event.date}
                      size="small"
                      sx={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        height: 22,
                        bgcolor: 'rgba(245, 158, 11, 0.1)',
                        color: '#f59e0b',
                      }}
                    />
                  }
                  sx={{
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    py: 1.5,
                    '&:last-child': { borderBottom: 'none' },
                  }}
                >
                  <ListItemText
                    primary={event.title}
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: 600,
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
    </Paper>
  );
};

export default NoticesAndEvents;
