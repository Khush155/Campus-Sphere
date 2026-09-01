import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  IconButton,
  Tooltip,
  useTheme,
  Avatar,
  InputAdornment,
} from '@mui/material';
import {
  Close as CloseIcon,
  OpenInNew as OpenInNewIcon,
  CheckCircleOutline as SavedIcon,
  Save as SaveIcon,
  Search as SearchIcon,
  AssignmentTurnedIn as SubmissionsIcon,
} from '@mui/icons-material';
import { useAssignmentSubmissionsQuery, useGradeSubmissionMutation } from '../../../../queries/facultyQueries';
import { useToast } from '../../../../contexts/ToastContext';
import EmptyState from '../../../../components/common/EmptyState';

export const GradeSubmissionsDialog = ({ open, onClose, assignment }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [editingRows, setEditingRows] = useState({});

  const assignmentId = assignment?.id || assignment?._id;
  const { data, isLoading, refetch } = useAssignmentSubmissionsQuery(assignmentId);
  const gradeMutation = useGradeSubmissionMutation();

  const submissions = data?.submissions || [];
  const maxMarks = assignment?.maxMarks || data?.assignment?.maxMarks || 100;

  const filteredSubmissions = submissions.filter((sub) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = sub.studentId?.name?.toLowerCase() || '';
    const email = sub.studentId?.email?.toLowerCase() || '';
    const roll = sub.studentId?.rollNumber?.toLowerCase() || '';
    return name.includes(q) || email.includes(q) || roll.includes(q);
  });

  const handleMarksChange = (subId, val) => {
    setEditingRows((prev) => ({
      ...prev,
      [subId]: {
        ...prev[subId],
        marks: val,
      },
    }));
  };

  const handleFeedbackChange = (subId, val) => {
    setEditingRows((prev) => ({
      ...prev,
      [subId]: {
        ...prev[subId],
        feedback: val,
      },
    }));
  };

  const handleSaveGrade = (submission) => {
    const subId = submission._id;
    const draft = editingRows[subId] || {};
    const marksVal = draft.marks !== undefined ? draft.marks : submission.marksObtained;
    const feedbackVal = draft.feedback !== undefined ? draft.feedback : submission.feedback;

    if (marksVal === undefined || marksVal === null || marksVal === '') {
      showToast('Please specify the marks obtained.', { severity: 'warning' });
      return;
    }

    const numMarks = Number(marksVal);
    if (isNaN(numMarks) || numMarks < 0 || numMarks > maxMarks) {
      showToast(`Marks must be a number between 0 and ${maxMarks}.`, { severity: 'error' });
      return;
    }

    gradeMutation.mutate(
      {
        assignmentId,
        submissionId: subId,
        marksObtained: numMarks,
        feedback: feedbackVal,
      },
      {
        onSuccess: () => {
          showToast(`Grade recorded for ${submission.studentId?.name || 'Student'}!`);
          setEditingRows((prev) => {
            const copy = { ...prev };
            delete copy[subId];
            return copy;
          });
          refetch();
        },
        onError: (err) => {
          showToast(err.response?.data?.message || 'Failed to save grade', { severity: 'error' });
        },
      }
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '20px',
          boxShadow: isDark ? '0 24px 60px rgba(0,0,0,0.7)' : '0 24px 60px rgba(0,0,0,0.15)',
          overflow: 'hidden',
        },
      }}
    >
      {/* ── Dialog Header ── */}
      <DialogTitle
        sx={{
          p: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: isDark ? 'background.paper' : '#fcfcfd',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              bgcolor: `${theme.palette.primary.main}15`,
              color: theme.palette.primary.main,
              width: 44,
              height: 44,
            }}
          >
            <SubmissionsIcon />
          </Avatar>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {assignment?.title || 'Assignment Submissions & Grading'}
              </Typography>
              <Chip
                label={`Max: ${maxMarks} Marks`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 700, fontSize: '0.7rem' }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary">
              Review student coursework solutions, assign scores, and provide qualitative feedback.
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* ── Search Toolbar ── */}
      <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: isDark ? 'background.default' : '#f8fafc' }}>
        <TextField
          size="small"
          placeholder="Filter by student name, email, or roll number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* ── Submissions Content ── */}
      <DialogContent sx={{ p: 0 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={36} />
          </Box>
        ) : filteredSubmissions.length === 0 ? (
          <Box sx={{ p: 4 }}>
            <EmptyState
              type="assignments"
              title="No Student Submissions Yet"
              description="No students have submitted coursework solutions for this assignment."
            />
          </Box>
        ) : (
          <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 420 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, bgcolor: isDark ? '#1e293b' : '#f1f5f9' }}>Student</TableCell>
                  <TableCell sx={{ fontWeight: 800, bgcolor: isDark ? '#1e293b' : '#f1f5f9' }}>Submitted At</TableCell>
                  <TableCell sx={{ fontWeight: 800, bgcolor: isDark ? '#1e293b' : '#f1f5f9' }}>Solution Link</TableCell>
                  <TableCell sx={{ fontWeight: 800, bgcolor: isDark ? '#1e293b' : '#f1f5f9' }} width={120}>
                    Marks (/{maxMarks})
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, bgcolor: isDark ? '#1e293b' : '#f1f5f9' }}>Feedback Note</TableCell>
                  <TableCell sx={{ fontWeight: 800, bgcolor: isDark ? '#1e293b' : '#f1f5f9' }} align="center">
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSubmissions.map((sub) => {
                  const student = sub.studentId || {};
                  const isGraded = sub.status === 'GRADED';
                  const isLate = sub.status === 'LATE';
                  const draft = editingRows[sub._id] || {};
                  const currentMarks = draft.marks !== undefined ? draft.marks : (sub.marksObtained ?? '');
                  const currentFeedback = draft.feedback !== undefined ? draft.feedback : (sub.feedback ?? '');

                  return (
                    <TableRow key={sub._id} hover>
                      {/* Student Info */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {student.name || 'Student'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {student.rollNumber ? `Roll: ${student.rollNumber} • ` : ''}
                          {student.email}
                        </Typography>
                      </TableCell>

                      {/* Submitted At & Status */}
                      <TableCell>
                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>
                          {new Date(sub.submittedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Typography>
                        <Chip
                          label={sub.status}
                          size="small"
                          color={isGraded ? 'success' : isLate ? 'warning' : 'primary'}
                          sx={{ height: 18, fontSize: '0.62rem', fontWeight: 800, mt: 0.5 }}
                        />
                      </TableCell>

                      {/* Solution Link */}
                      <TableCell>
                        {sub.submissionUrl ? (
                          <Button
                            size="small"
                            variant="outlined"
                            endIcon={<OpenInNewIcon sx={{ fontSize: '0.85rem !important' }} />}
                            href={sub.submissionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ textTransform: 'none', py: 0.4, px: 1, fontSize: '0.72rem', fontWeight: 700 }}
                          >
                            View Submission
                          </Button>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            Text / Notes only
                          </Typography>
                        )}
                        {sub.notes && (
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}>
                            &ldquo;{sub.notes}&rdquo;
                          </Typography>
                        )}
                      </TableCell>

                      {/* Marks Input */}
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={currentMarks}
                          onChange={(e) => handleMarksChange(sub._id, e.target.value)}
                          placeholder="Score"
                          inputProps={{ min: 0, max: maxMarks, step: 1 }}
                          sx={{ width: 90 }}
                        />
                      </TableCell>

                      {/* Feedback Input */}
                      <TableCell>
                        <TextField
                          size="small"
                          value={currentFeedback}
                          onChange={(e) => handleFeedbackChange(sub._id, e.target.value)}
                          placeholder="Feedback remarks..."
                          fullWidth
                        />
                      </TableCell>

                      {/* Action */}
                      <TableCell align="center">
                        <Tooltip title={isGraded ? 'Update Grade' : 'Save Grade'}>
                          <span>
                            <Button
                              variant="contained"
                              size="small"
                              color={isGraded ? 'success' : 'primary'}
                              startIcon={isGraded ? <SavedIcon /> : <SaveIcon />}
                              onClick={() => handleSaveGrade(sub)}
                              disabled={gradeMutation.isPending}
                              sx={{ textTransform: 'none', fontWeight: 700, minWidth: 80 }}
                            >
                              {isGraded ? 'Saved' : 'Grade'}
                            </Button>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      {/* ── Dialog Footer ── */}
      <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1, pl: 1 }}>
          Total Submissions: <strong>{submissions.length}</strong> (Graded:{' '}
          {submissions.filter((s) => s.status === 'GRADED').length})
        </Typography>
        <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}>
          Done / Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GradeSubmissionsDialog;
