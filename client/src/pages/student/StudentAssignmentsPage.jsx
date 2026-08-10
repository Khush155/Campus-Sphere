import React, { useState, useMemo } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Tabs,
  Tab,
  Chip,
  Button,
  Modal,
  TextField,
  Divider,
  useTheme,
} from '@mui/material';
import {
  CloudUploadOutlined as UploadIcon,
  CheckCircleOutlineOutlined as DoneIcon,
} from '@mui/icons-material';

import { useStudentAssignmentsQuery, useSubmitAssignmentMutation } from '../../queries/studentQueries';
import { useToast } from '../../contexts/ToastContext';

export const StudentAssignmentsPage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { showToast } = useToast();

  const [tabIndex, setTabIndex] = useState(0);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');

  const { data: assignmentsList = [], isLoading } = useStudentAssignmentsQuery();
  const submitMutation = useSubmitAssignmentMutation();

  const pendingAssignments = useMemo(() => {
    if (!assignmentsList) return [];
    const list = Array.isArray(assignmentsList) ? assignmentsList : (assignmentsList.data || []);
    return list.filter((a) => a.status === 'PUBLISHED' || a.status === 'OPEN');
  }, [assignmentsList]);

  const submittedAssignments = useMemo(() => {
    if (!assignmentsList) return [];
    const list = Array.isArray(assignmentsList) ? assignmentsList : (assignmentsList.data || []);
    return list.filter((a) => a.status === 'SUBMITTED' || a.status === 'GRADED');
  }, [assignmentsList]);

  const handleOpenSubmit = (assignment) => {
    setSelectedAssignment(assignment);
    setSubmissionUrl('');
    setSubmissionNotes('');
  };

  const handleCloseSubmit = () => {
    setSelectedAssignment(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!submissionUrl) {
      showToast('Please provide a valid submission URL / document link.', { severity: 'error' });
      return;
    }

    try {
      await submitMutation.mutateAsync({
        assignmentId: selectedAssignment._id,
        submissionUrl,
        notes: submissionNotes,
      });
      showToast('Assignment submitted successfully!');
      handleCloseSubmit();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit assignment.', { severity: 'error' });
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3.5 }}>
      {/* Page Header */}
      <Box sx={{ mb: 3.5 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', mb: 0.5 }}>
          Coursework & Assignments
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review subject coursework deadlines, upload submissions, and view faculty evaluation feedback.
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, mb: 3.5, bgcolor: isDark ? 'background.paper' : '#ffffff' }}>
        <Tabs
          value={tabIndex}
          onChange={(_, val) => setTabIndex(val)}
          sx={{ px: 2, '& .MuiTab-root': { fontWeight: 800, textTransform: 'none', fontSize: '0.95rem', py: 2 } }}
        >
          <Tab label={`Pending Coursework (${pendingAssignments.length})`} />
          <Tab label={`Completed & Graded (${submittedAssignments.length})`} />
        </Tabs>
      </Paper>

      {/* Content Area */}
      {tabIndex === 0 ? (
        <Grid container spacing={3}>
          {isLoading ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 4, textAlign: 'center' }}>Loading coursework assignments...</Paper>
            </Grid>
          ) : pendingAssignments.length === 0 ? (
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: '24px', border: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700 }}>
                  No pending assignments due! 🎉
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  You are all caught up with your academic submissions.
                </Typography>
              </Paper>
            </Grid>
          ) : (
            pendingAssignments.map((assignment) => (
              <Grid item xs={12} md={6} key={assignment._id}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: '24px',
                    border: `1px solid ${theme.palette.divider}`,
                    bgcolor: isDark ? 'background.paper' : '#ffffff',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Chip
                        label={assignment.subjectId?.name || assignment.subject || 'Subject'}
                        size="small"
                        sx={{ fontWeight: 800, bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main }}
                      />
                      <Chip label={`Max Marks: ${assignment.maxMarks || 100}`} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                    </Box>

                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
                      {assignment.title}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {assignment.description || 'No detailed instructions provided.'}
                    </Typography>
                  </Box>

                  <Box sx={{ pt: 2, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="error.main" sx={{ fontWeight: 800 }}>
                      Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'Upcoming'}
                    </Typography>

                    <Button
                      variant="contained"
                      startIcon={<UploadIcon />}
                      onClick={() => handleOpenSubmit(assignment)}
                      sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 800 }}
                    >
                      Submit Work
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            ))
          )}
        </Grid>
      ) : (
        /* Submitted Tab */
        <Grid container spacing={3}>
          {submittedAssignments.length === 0 ? (
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: '24px', border: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700 }}>
                  No submitted assignments found.
                </Typography>
              </Paper>
            </Grid>
          ) : (
            submittedAssignments.map((assignment) => (
              <Grid item xs={12} md={6} key={assignment._id}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: '24px',
                    border: `1px solid ${theme.palette.divider}`,
                    bgcolor: isDark ? 'background.paper' : '#ffffff',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                      {assignment.title}
                    </Typography>
                    <Chip icon={<DoneIcon />} label="SUBMITTED" color="success" size="small" sx={{ fontWeight: 800 }} />
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    {assignment.description}
                  </Typography>

                  {assignment.grade !== undefined && (
                    <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: `${theme.palette.success.main}12`, border: `1px solid ${theme.palette.success.main}` }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'success.main' }}>
                        Grade Awarded: {assignment.grade} / {assignment.maxMarks || 100}
                      </Typography>
                      {assignment.feedback && (
                        <Typography variant="caption" color="text.secondary">
                          Faculty Feedback: &quot;{assignment.feedback}&quot;
                        </Typography>
                      )}
                    </Box>
                  )}
                </Paper>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* Submission Modal */}
      <Modal open={Boolean(selectedAssignment)} onClose={handleCloseSubmit}>
        <Paper
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: 500 },
            p: 3.5,
            borderRadius: '24px',
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
            Submit Coursework: {selectedAssignment?.title}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2.5 }}>
            Paste Google Drive, GitHub, or Cloud PDF URL of your submission below.
          </Typography>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              required
              label="Submission Document / Repository Link"
              placeholder="https://drive.google.com/... or https://github.com/..."
              value={submissionUrl}
              onChange={(e) => setSubmissionUrl(e.target.value)}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Submission Notes / Comments"
              placeholder="Add any comments for your professor..."
              value={submissionNotes}
              onChange={(e) => setSubmissionNotes(e.target.value)}
              sx={{ mb: 3 }}
            />

            <Divider sx={{ mb: 2.5 }} />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
              <Button onClick={handleCloseSubmit} sx={{ textTransform: 'none', fontWeight: 700 }}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" loading={submitMutation.isPending} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 800 }}>
                Submit Assignment
              </Button>
            </Box>
          </form>
        </Paper>
      </Modal>
    </Container>
  );
};

export default StudentAssignmentsPage;
