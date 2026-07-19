// client/src/pages/faculty/exams/components/ExamList.jsx
//
// Presentational component displaying a responsive grid of ExamCards.
// Renders custom empty states based on selected filters.

import React from 'react';
import { Grid, Paper, Typography, Box, Button } from '@mui/material';
import { School as EmptyIcon, Add as AddIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import ExamCard from './ExamCard';

export const ExamList = ({
  exams,
  statusFilter,
  onEdit,
  onDelete,
  onPublish,
  onArchive,
  onToggleResultsPublish,
  onEnterMarks,
  onCreateNew,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Empty state rendering
  if (exams.length === 0) {
    const getEmptyStateMessage = () => {
      switch (statusFilter) {
        case 'DRAFT':
          return 'No draft exams found. Click "Schedule Exam" to draft a new exam session.';
        case 'PUBLISHED':
          return 'No scheduled exams found. Create one to notify students.';
        case 'ONGOING':
          return 'No ongoing exams found. Ongoing state represents scheduled tests occurring today.';
        case 'COMPLETED':
          return 'No completed exams found.';
        case 'ARCHIVED':
          return 'No archived exams found.';
        case 'ALL':
        default:
          return 'No exams scheduled for this class yet. Get started by scheduling your first exam.';
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
          No Exams Scheduled
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3, maxWidth: 380, lineHeight: 1.6 }}
        >
          {getEmptyStateMessage()}
        </Typography>

        {/* Quick action button inside empty state */}
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
            Schedule Exam
          </Button>
        )}
      </Paper>
    );
  }

  return (
    <Grid container spacing={3}>
      {exams.map((exam) => (
        <Grid item xs={12} sm={6} md={4} key={exam.id}>
          <ExamCard
            exam={exam}
            onEdit={onEdit}
            onDelete={onDelete}
            onPublish={onPublish}
            onArchive={onArchive}
            onToggleResultsPublish={onToggleResultsPublish}
            onEnterMarks={onEnterMarks}
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default ExamList;
