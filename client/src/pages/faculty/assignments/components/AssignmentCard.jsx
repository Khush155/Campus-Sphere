// client/src/pages/faculty/assignments/components/AssignmentCard.jsx
//
// Presentational component displaying detailed metadata for a single assignment.
// Communicates user events (View/Grade, Edit, Delete, Publish, Archive) to the parent container.

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Chip,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  CalendarToday as CalendarIcon,
  AssignmentTurnedIn as SubmissionsIcon,
  Grade as MarksIcon,
  AttachFile as AttachmentIcon,
  Class as SectionIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Publish as PublishIcon,
  Archive as ArchiveIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import StatusChip from '../../components/StatusChip';
import { ASSIGNMENT_STATUS_OPTIONS } from '../assignmentConstants';

/**
 * Helper to format ISO dates to a reader-friendly local string.
 */
const formatDueDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const AssignmentCard = ({
  assignment,
  onEdit,
  onDelete,
  onPublish,
  onArchive,
  onCloseAssignment,
  onView,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  // Local state for the action menu anchor
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Get status styling configurations from mockData
  const statusConfig = ASSIGNMENT_STATUS_OPTIONS.find(
    (opt) => opt.value === assignment.status
  ) || { label: assignment.status, color: '#6b7280' };

  // Calculate if the assignment is past due
  const isPastDue = new Date(assignment.dueDate) < new Date();

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: isDark ? 'background.paper' : '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: isDark
            ? '0 12px 24px -10px rgba(0,0,0,0.6)'
            : '0 12px 24px -10px rgba(79, 70, 229, 0.12)',
          borderColor: theme.palette.primary.light,
        },
      }}
    >
      <CardContent sx={{ p: 3, flexGrow: 1 }}>
        {/* ── Top Row: Subject Info & Status Badge ── */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
            mb: 2,
          }}
        >
          <Box>
            <Typography
              variant="caption"
              fontFamily="monospace"
              sx={{
                fontWeight: 700,
                color: 'primary.main',
                bgcolor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(79, 70, 229, 0.08)',
                px: 1,
                py: 0.4,
                borderRadius: '4px',
                mr: 1,
              }}
            >
              {assignment.subjectCode}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {assignment.subjectName}
            </Typography>
          </Box>
          <StatusChip label={statusConfig.label} color={statusConfig.color} />
        </Box>

        {/* ── Title & Description ── */}
        <Typography
          variant="h6"
          component="div"
          sx={{
            fontWeight: 800,
            mb: 1,
            color: 'text.primary',
            lineHeight: 1.3,
          }}
        >
          {assignment.title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2.5,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.6,
          }}
        >
          {assignment.description}
        </Typography>

        <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

        {/* ── Metadata Row Items ── */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 1 }}>
          {/* Targeted Sections */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SectionIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {assignment.sectionNames.map((secName) => (
                <Chip
                  key={secName}
                  label={secName}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    bgcolor: 'action.hover',
                    color: 'text.primary',
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Due Date */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CalendarIcon
              sx={{
                fontSize: 18,
                color: isPastDue || assignment.status === 'CLOSED' ? 'error.main' : 'text.secondary',
              }}
            />
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                fontSize: '0.82rem',
                color: isPastDue || assignment.status === 'CLOSED' ? 'error.main' : 'text.primary',
              }}
            >
              Due: {formatDueDate(assignment.dueDate)}
            </Typography>
          </Box>

          {/* Max Marks & Attachments summary */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {/* Marks */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MarksIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.82rem', color: 'text.primary' }}>
                {assignment.maxMarks} Marks
              </Typography>
            </Box>

            {/* Attachments */}
            {assignment.attachments && assignment.attachments.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachmentIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.82rem', color: 'text.primary' }}>
                  {assignment.attachments.length} {assignment.attachments.length === 1 ? 'file' : 'files'}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </CardContent>

      {/* ── Actions Footer ── */}
      <CardActions
        sx={{
          px: 3,
          pb: 3,
          pt: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Button
          variant="contained"
          size="small"
          startIcon={<SubmissionsIcon />}
          onClick={() => onView(assignment.id)}
          disabled={assignment.status === 'DRAFT'} // Drafts can't have submissions
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            py: 0.8,
            px: 2,
            boxShadow: 'none',
            bgcolor: theme.palette.primary.main,
            '&:hover': {
              bgcolor: theme.palette.primary.dark,
              boxShadow: 'none',
            },
          }}
        >
          Grade Submissions
        </Button>

        {/* Triple Dot Extra Actions Menu */}
        <Box>
          <IconButton
            size="small"
            onClick={handleMenuOpen}
            sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 1.5, p: 0.8 }}
          >
            <MoreIcon fontSize="small" />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={openMenu}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: {
                mt: 1,
                borderRadius: 2.5,
                boxShadow: isDark
                  ? '0 4px 20px rgba(0,0,0,0.5)'
                  : '0 4px 20px rgba(79, 70, 229, 0.08)',
                border: `1px solid ${theme.palette.divider}`,
                minWidth: 140,
              },
            }}
          >
            {/* Publish Action */}
            {assignment.status === 'DRAFT' && onPublish && (
              <MenuItem
                onClick={() => {
                  onPublish(assignment.id);
                  handleMenuClose();
                }}
              >
                <PublishIcon fontSize="small" sx={{ mr: 1.5, color: 'success.main' }} />
                Publish
              </MenuItem>
            )}

            {/* Close Action */}
            {assignment.status === 'PUBLISHED' && onCloseAssignment && (
              <MenuItem
                onClick={() => {
                  onCloseAssignment(assignment.id);
                  handleMenuClose();
                }}
              >
                <SubmissionsIcon fontSize="small" sx={{ mr: 1.5, color: 'warning.main' }} />
                Close Submissions
              </MenuItem>
            )}

            {/* Archive Action */}
            {assignment.status !== 'ARCHIVED' && onArchive && (
              <MenuItem
                onClick={() => {
                  onArchive(assignment.id);
                  handleMenuClose();
                }}
              >
                <ArchiveIcon fontSize="small" sx={{ mr: 1.5, color: 'info.main' }} />
                Archive
              </MenuItem>
            )}

            {/* Edit Action */}
            {assignment.status !== 'ARCHIVED' && onEdit && (
              <MenuItem
                onClick={() => {
                  onEdit(assignment);
                  handleMenuClose();
                }}
              >
                <EditIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
                Edit
              </MenuItem>
            )}

            {assignment.status !== 'DRAFT' && assignment.status !== 'ARCHIVED' && <Divider />}

            {/* Delete Action */}
            {onDelete && (
              <MenuItem
                onClick={() => {
                  onDelete(assignment.id);
                  handleMenuClose();
                }}
                sx={{ color: 'error.main' }}
              >
                <DeleteIcon fontSize="small" sx={{ mr: 1.5, color: 'error.main' }} />
                Delete
              </MenuItem>
            )}
          </Menu>
        </Box>
      </CardActions>
    </Card>
  );
};

export default AssignmentCard;
