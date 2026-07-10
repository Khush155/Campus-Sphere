// client/src/pages/faculty/assignments/components/AssignmentList.jsx
//
// Presentational grid container displaying filtered AssignmentCards.
// Handles responsive grid spacing and renders a clear Empty State when no assignments match the criteria.

import React from 'react';
import { Grid, Paper, Typography, Box, Button } from '@mui/material';
import { Assignment as EmptyIcon, Add as AddIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import AssignmentCard from './AssignmentCard';

export const AssignmentList = ({
  assignments,
  statusFilter,
  onEdit,
  onDelete,
  onPublish,
  onArchive,
  onView,
  onCreateNew,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Render Empty State if no assignments match the active filters
  if (assignments.length === 0) {
    const getEmptyStateMessage = () => {
      switch (statusFilter) {
        case 'DRAFT':
          return 'No draft assignments found. Tap "Create Assignment" to start a new draft.';
        case 'PUBLISHED':
          return 'No active assignments found. Create and publish one to start collecting submissions.';
        case 'CLOSED':
          return 'No closed assignments found.';
        case 'ARCHIVED':
          return 'No archived assignments found.';
        case 'ALL':
        default:
          return 'No assignments created for this class yet. Get started by creating your first assignment.';
      }
    };

    return (
      <Paper
        elevation={0}
        variant="outlined"
        sx={{
          p: 6,
          textAlign: 'center',
          borderRadius: 3,
          bgcolor: isDark ? 'background.paper' : '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            bgcolor: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(79, 70, 229, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2.5,
          }}
        >
          <EmptyIcon sx={{ fontSize: 30, color: theme.palette.primary.main }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
          No Assignments Found
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3, maxWidth: 380, lineHeight: 1.6 }}
        >
          {getEmptyStateMessage()}
        </Typography>

        {/* Propose a quick action button inside the empty state if it's the general view */}
        {(statusFilter === 'ALL' || statusFilter === 'PUBLISHED') && onCreateNew && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreateNew}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              px: 3,
              py: 1,
              bgcolor: '#4f46e5',
              '&:hover': { bgcolor: '#4338ca' },
            }}
          >
            Create Assignment
          </Button>
        )}
      </Paper>
    );
  }

  return (
    <Grid container spacing={3}>
      {assignments.map((assignment) => (
        <Grid item xs={12} sm={6} md={4} key={assignment.id}>
          <AssignmentCard
            assignment={assignment}
            onEdit={onEdit}
            onDelete={onDelete}
            onPublish={onPublish}
            onArchive={onArchive}
            onView={onView}
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default AssignmentList;
