// client/src/pages/faculty/components/AssignedSubjects.jsx
//
// Displays the list of subjects assigned to a faculty member.
// Features a premium interactive overlay modal to search, filter, and view all assigned subjects in detail.

import React, { useState, useMemo } from 'react';
import {
  Paper,
  Typography,
  Box,
  Chip,
  Stack,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Grid,
  TextField,
  InputAdornment,
  useTheme,
  Tooltip,
} from '@mui/material';
import {
  MenuBook as SubjectIcon,
  LibraryBooks as HeaderIcon,
  ArrowForward as ArrowIcon,
  FolderOpenOutlined as MaterialsIcon,
  Close as CloseIcon,
  FactCheckOutlined as AttendanceIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  GradeOutlined as MarksIcon,
  AutoAwesome as SparklesIcon,
  FormatListNumbered as StatsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const CARD_ACCENT_COLORS = [
  { border: '#4f46e5', bg: 'rgba(79, 70, 229, 0.08)', text: '#4f46e5' },
  { border: '#06b6d4', bg: 'rgba(6, 182, 212, 0.08)', text: '#0891b2' },
  { border: '#10b981', bg: 'rgba(16, 185, 129, 0.08)', text: '#059669' },
  { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)', text: '#d97706' },
  { border: '#ec4899', bg: 'rgba(236, 72, 153, 0.08)', text: '#db2777' },
  { border: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.08)', text: '#7c3aed' },
];

export const AssignedSubjects = ({ subjects = [] }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [openModal, setOpenModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const MAX_DISPLAY = 3;
  const displayedSubjects = subjects.slice(0, MAX_DISPLAY);
  const remainingCount = subjects.length - MAX_DISPLAY;

  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => {
    setOpenModal(false);
    setSearchQuery('');
  };

  // Filtered subjects inside modal overlay
  const filteredSubjects = useMemo(() => {
    if (!searchQuery.trim()) return subjects;
    const q = searchQuery.toLowerCase().trim();
    return subjects.filter(
      (sub) =>
        (sub.name && sub.name.toLowerCase().includes(q)) ||
        (sub.code && sub.code.toLowerCase().includes(q)) ||
        (sub.semester && sub.semester.toLowerCase().includes(q))
    );
  }, [subjects, searchQuery]);

  const totalCredits = useMemo(() => {
    return subjects.reduce((sum, s) => sum + (Number(s.credits) || 0), 0);
  }, [subjects]);

  return (
    <>
      {/* ── Main Dashboard Widget Card ── */}
      <Paper sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        {/* ── Section Header ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HeaderIcon color="primary" />
            <Typography
              variant="h6"
              sx={{ fontWeight: 800, color: 'text.primary' }}
            >
              My Assigned Subjects
            </Typography>
            <Chip
              label={subjects.length}
              size="small"
              color="primary"
              sx={{ fontWeight: 800, fontSize: '0.72rem', height: 22, minWidth: 22 }}
            />
          </Box>

          <Button
            size="small"
            variant="outlined"
            onClick={handleOpenModal}
            sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem' }}
          >
            View All ({subjects.length})
          </Button>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* ── Subject List (Compact Dashboard Widget View) ── */}
        {displayedSubjects.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
            No subjects assigned yet.
          </Typography>
        ) : (
          <Box
            sx={{
              maxHeight: 140,
              overflowY: 'auto',
              pr: 0.5,
              '&::-webkit-scrollbar': { width: '5px' },
              '&::-webkit-scrollbar-track': { background: 'transparent' },
              '&::-webkit-scrollbar-thumb': { background: theme.palette.divider, borderRadius: '4px' },
            }}
          >
            <Stack spacing={1.25}>
              {displayedSubjects.map((subject, idx) => (
                <Box
                  key={subject.id || idx}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 1.25,
                    borderRadius: 2,
                    bgcolor: 'action.hover',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: 'action.selected',
                    },
                  }}
                >
                  {/* Subject icon */}
                  <Box
                    sx={{
                      bgcolor: CARD_ACCENT_COLORS[idx % CARD_ACCENT_COLORS.length].bg,
                      color: CARD_ACCENT_COLORS[idx % CARD_ACCENT_COLORS.length].text,
                      p: 1,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <SubjectIcon fontSize="small" />
                  </Box>

                  {/* Subject details */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        color: 'text.primary',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {subject.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {subject.code}
                    </Typography>
                  </Box>

                  {/* Metadata chips */}
                  <Stack
                    direction="row"
                    spacing={0.75}
                    sx={{ flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end', gap: 0.75 }}
                  >
                    {subject.credits !== undefined &&
                      subject.credits !== null &&
                      subject.credits !== 'undefined' &&
                      Boolean(subject.credits) && (
                        <Chip
                          label={`${subject.credits} Cr`}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.68rem',
                            height: 22,
                            bgcolor: 'rgba(6, 182, 212, 0.1)',
                            color: 'secondary.main',
                          }}
                        />
                      )}
                    {subject.semester && (
                      <Chip
                        label={subject.semester}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.68rem',
                          height: 22,
                          bgcolor: 'rgba(16, 185, 129, 0.1)',
                          color: '#10b981',
                        }}
                      />
                    )}
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {/* Footer trigger button */}
        {subjects.length > 0 && (
          <Box sx={{ mt: 2, pt: 1.5, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {remainingCount > 0 ? `+${remainingCount} more assigned subjects` : `Showing all ${subjects.length} subjects`}
            </Typography>
            <Button
              size="small"
              color="primary"
              endIcon={<ArrowIcon fontSize="small" />}
              onClick={handleOpenModal}
              sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.78rem' }}
            >
              View All Subjects ({subjects.length})
            </Button>
          </Box>
        )}
      </Paper>

      {/* ── HIGH-SPEC ALL ASSIGNED SUBJECTS OVERLAY MODAL ── */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            p: 1,
            boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
            border: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        {/* Modal Header */}
        <DialogTitle sx={{ pb: 1.5, pt: 2, px: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  bgcolor: theme.palette.primary.main,
                  color: '#ffffff',
                  p: 1.25,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 4px 12px ${theme.palette.primary.main}40`,
                }}
              >
                <HeaderIcon />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.text.primary }}>
                    Assigned Teaching Subjects
                  </Typography>
                  <Chip
                    icon={<SparklesIcon sx={{ fontSize: '0.85rem !important' }} />}
                    label="Active Term"
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 700, fontSize: '0.68rem', height: 22 }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.2 }}>
                  Comprehensive list of assigned subjects, credit distributions, and teaching actions
                </Typography>
              </Box>
            </Box>

            <IconButton onClick={handleCloseModal} size="small" sx={{ bgcolor: 'action.hover' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Quick Metrics Bar + Realtime Search Bar */}
          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              borderRadius: '14px',
              bgcolor: 'action.hover',
              borderColor: theme.palette.divider,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            {/* Realtime Search Input */}
            <TextField
              size="small"
              placeholder="Search by subject name, code, or term..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery('')}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: '10px',
                  bgcolor: theme.palette.background.paper,
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  width: { xs: '100%', sm: 300 },
                },
              }}
            />

            {/* Quick Metrics Pills */}
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              <Chip
                icon={<StatsIcon sx={{ fontSize: '0.85rem !important' }} />}
                label={`${filteredSubjects.length} of ${subjects.length} Subjects`}
                size="small"
                sx={{ fontWeight: 700, fontSize: '0.72rem', height: 28, bgcolor: theme.palette.background.paper }}
              />
              <Chip
                label={`${totalCredits} Total Credits`}
                size="small"
                color="secondary"
                sx={{ fontWeight: 800, fontSize: '0.72rem', height: 28 }}
              />
            </Stack>
          </Paper>
        </DialogTitle>

        <Divider />

        {/* Modal Body Grid */}
        <DialogContent sx={{ py: 3, px: 2.5, maxHeight: '65vh' }}>
          {filteredSubjects.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700 }}>
                No matching subjects found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                Try adjusting your search criteria for course name or code.
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setSearchQuery('')}
                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}
              >
                Clear Search Filter
              </Button>
            </Box>
          ) : (
            <Grid container spacing={2.5}>
              {filteredSubjects.map((sub, idx) => {
                const palette = CARD_ACCENT_COLORS[idx % CARD_ACCENT_COLORS.length];
                return (
                  <Grid item xs={12} sm={6} key={sub.id || idx}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: '14px',
                        border: `1px solid ${theme.palette.divider}`,
                        borderTop: `4px solid ${palette.border}`,
                        display: 'flex',
                        flexDirection: 'column',
                        justify: 'space-between',
                        height: '100%',
                        transition: 'all 0.2s ease-in-out',
                        bgcolor: theme.palette.background.paper,
                        '&:hover': {
                          boxShadow: `0 8px 24px rgba(0,0,0,0.08)`,
                          transform: 'translateY(-3px)',
                          borderColor: palette.border,
                        },
                      }}
                    >
                      <Box>
                        {/* Header Badges */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                          <Chip
                            label={sub.code || 'COURSE'}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              fontSize: '0.72rem',
                              height: 24,
                              bgcolor: palette.bg,
                              color: palette.text,
                              fontFamily: theme.typography.mono?.fontFamily,
                              letterSpacing: '0.04em',
                            }}
                          />
                          <Stack direction="row" spacing={0.75}>
                            <Chip
                              label={`${sub.credits || 3} Credits`}
                              size="small"
                              variant="outlined"
                              sx={{ fontWeight: 700, fontSize: '0.68rem', height: 22 }}
                            />
                            {sub.semester && (
                              <Chip
                                label={sub.semester}
                                size="small"
                                sx={{
                                  fontWeight: 700,
                                  fontSize: '0.68rem',
                                  height: 22,
                                  bgcolor: 'rgba(16, 185, 129, 0.1)',
                                  color: '#10b981',
                                }}
                              />
                            )}
                          </Stack>
                        </Box>

                        {/* Subject Title */}
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 800,
                            lineHeight: 1.35,
                            color: theme.palette.text.primary,
                            mb: 1,
                            fontSize: '0.98rem',
                          }}
                        >
                          {sub.name}
                        </Typography>

                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                          Curriculum Subject • Assigned for Active Semester Lectures & Grading
                        </Typography>
                      </Box>

                      <Box sx={{ mt: 2.5 }}>
                        <Divider sx={{ mb: 2 }} />
                        <Stack direction="row" spacing={1} sx={{ flexWrap: 'nowrap', width: '100%' }}>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Tooltip title="View course materials & syllabus">
                              <Button
                                fullWidth
                                size="small"
                                variant="outlined"
                                startIcon={<MaterialsIcon fontSize="small" />}
                                onClick={() => {
                                  handleCloseModal();
                                  navigate('/materials');
                                }}
                                sx={{
                                  borderRadius: '8px',
                                  textTransform: 'none',
                                  fontWeight: 600,
                                  fontSize: '0.72rem',
                                  px: 1,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                Materials
                              </Button>
                            </Tooltip>
                          </Box>

                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Tooltip title="Enter examination marks">
                              <Button
                                fullWidth
                                size="small"
                                variant="outlined"
                                startIcon={<MarksIcon fontSize="small" />}
                                onClick={() => {
                                  handleCloseModal();
                                  navigate('/marks');
                                }}
                                sx={{
                                  borderRadius: '8px',
                                  textTransform: 'none',
                                  fontWeight: 600,
                                  fontSize: '0.72rem',
                                  px: 1,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                Marks
                              </Button>
                            </Tooltip>
                          </Box>

                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Tooltip title="Mark daily lecture attendance">
                              <Button
                                fullWidth
                                size="small"
                                variant="contained"
                                startIcon={<AttendanceIcon fontSize="small" />}
                                onClick={() => {
                                  handleCloseModal();
                                  navigate('/attendance');
                                }}
                                sx={{
                                  borderRadius: '8px',
                                  textTransform: 'none',
                                  fontWeight: 700,
                                  fontSize: '0.72rem',
                                  px: 1,
                                  whiteSpace: 'nowrap',
                                  background: palette.border,
                                  '&:hover': { background: palette.border, filter: 'brightness(0.9)' },
                                }}
                              >
                                Attendance
                              </Button>
                            </Tooltip>
                          </Box>
                        </Stack>
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AssignedSubjects;
