// client/src/pages/faculty/exams/components/ExamCard.jsx
//
// Presentational component displaying detailed metadata for a scheduled exam.
// Relays click actions (Grade Marks, Edit, Delete, Publish, Archive, Toggle Results) to parent.

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
  Room as RoomIcon,
  AccessTime as DurationIcon,
  Star as WeightageIcon,
  FactCheck as GradeIcon,
  Class as SectionIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Publish as PublishIcon,
  Archive as ArchiveIcon,
  Visibility as ShowResultsIcon,
  VisibilityOff as HideResultsIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import StatusChip from '../../components/StatusChip';
import { EXAM_STATUS_OPTIONS, EXAM_TYPE_OPTIONS } from '../examConstants';

/**
 * Format date string to reader-friendly local string.
 */
const formatExamDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const ExamCard = ({
  exam,
  onEdit,
  onDelete,
  onPublish,
  onArchive,
  onToggleResultsPublish,
  onEnterMarks,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Action Menu State
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Get status & type styling configurations
  const statusConfig = EXAM_STATUS_OPTIONS.find((opt) => opt.value === exam.status) || {
    label: exam.status,
    color: '#6b7280',
  };

  const typeConfig = EXAM_TYPE_OPTIONS.find((opt) => opt.value === exam.type) || {
    label: exam.type,
    color: theme.palette.primary.main,
  };

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
        {/* ── Top Row: Subject Code & Status Badge ── */}
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
              {exam.subjectCode}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {exam.subjectName}
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
          {exam.title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.5,
            height: 40,
          }}
        >
          {exam.description}
        </Typography>

        {/* Exam Type Chip */}
        <Box sx={{ mb: 2 }}>
          <StatusChip label={typeConfig.label} color={typeConfig.color} variant="outlined" />
        </Box>

        <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

        {/* ── Metadata Icons ── */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {/* Target Sections */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SectionIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {exam.sectionNames.map((secName) => (
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

          {/* Exam Date & Time */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CalendarIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.82rem', color: 'text.primary' }}>
              {formatExamDate(exam.examDate)}
            </Typography>
          </Box>

          {/* Duration & Room */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DurationIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.82rem', color: 'text.primary' }}>
                {exam.durationMinutes} Mins
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <RoomIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.82rem', color: 'text.primary' }}>
                Room: {exam.roomNumber}
              </Typography>
            </Box>
          </Box>

          {/* Marks & Weightage */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem', color: 'text.primary' }}>
              Total: {exam.totalMarks} Marks
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <WeightageIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.82rem', color: 'text.primary' }}>
                Weight: {exam.weightage}%
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>

      {/* ── Action Footer ── */}
      <CardActions
        sx={{
          px: 3,
          pb: 3,
          pt: 0.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1.5,
        }}
      >
        {/* Presentational result publication or grading triggers */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {exam.status === 'COMPLETED' ? (
            <Button
              variant="contained"
              size="small"
              startIcon={<GradeIcon />}
              onClick={() => onEnterMarks(exam.id)}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                bgcolor: theme.palette.primary.main,
                boxShadow: 'none',
                '&:hover': { bgcolor: theme.palette.primary.dark, boxShadow: 'none' },
              }}
            >
              Grade Exam
            </Button>
          ) : (
            /* Result published notifications label */
            exam.isResultPublished && (
              <Chip
                label="Results Out"
                size="small"
                sx={{
                  bgcolor: 'rgba(16, 185, 129, 0.08)',
                  color: 'success.main',
                  fontWeight: 700,
                  fontSize: '0.65rem',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                }}
              />
            )
          )}
        </Box>

        {/* Dropdown Menu Actions */}
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
                minWidth: 160,
              },
            }}
          >
            {/* Publish Exam */}
            {exam.status === 'DRAFT' && onPublish && (
              <MenuItem
                onClick={() => {
                  onPublish(exam.id);
                  handleMenuClose();
                }}
              >
                <PublishIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
                Publish Schedule
              </MenuItem>
            )}

            {/* Toggle Results Publication */}
            {exam.status === 'COMPLETED' && onToggleResultsPublish && (
              <MenuItem
                onClick={() => {
                  onToggleResultsPublish(exam.id, exam.isResultPublished);
                  handleMenuClose();
                }}
              >
                {exam.isResultPublished ? (
                  <>
                    <HideResultsIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
                    Hide Results
                  </>
                ) : (
                  <>
                    <ShowResultsIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
                    Publish Results
                  </>
                )}
              </MenuItem>
            )}

            {/* Edit Action */}
            {exam.status !== 'ARCHIVED' && onEdit && (
              <MenuItem
                onClick={() => {
                  onEdit(exam);
                  handleMenuClose();
                }}
              >
                <EditIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
                Edit Schedule
              </MenuItem>
            )}

            {/* Archive Action */}
            {exam.status !== 'ARCHIVED' && onArchive && (
              <MenuItem
                onClick={() => {
                  onArchive(exam.id);
                  handleMenuClose();
                }}
              >
                <ArchiveIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
                Archive Exam
              </MenuItem>
            )}

            {onDelete && <Divider />}

            {/* Cancel/Delete Action */}
            {onDelete && (
              <MenuItem
                onClick={() => {
                  onDelete(exam.id);
                  handleMenuClose();
                }}
                sx={{ color: 'error.main' }}
              >
                <DeleteIcon fontSize="small" sx={{ mr: 1.5, color: 'error.main' }} />
                Delete Exam
              </MenuItem>
            )}
          </Menu>
        </Box>
      </CardActions>
    </Card>
  );
};

export default ExamCard;
