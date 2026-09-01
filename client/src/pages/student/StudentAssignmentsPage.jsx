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
  Avatar,
  useTheme,
} from '@mui/material';
import {
  CloudUploadOutlined as UploadIcon,
  CheckCircleOutlineOutlined as DoneIcon,
  AssignmentOutlined as AssignmentIcon,
  HourglassEmptyOutlined as PendingIcon,
  VerifiedUserOutlined as QualityIcon,
} from '@mui/icons-material';

import { useStudentAssignmentsQuery, useSubmitAssignmentMutation } from '../../queries/studentQueries';
import { useToast } from '../../contexts/ToastContext';
import { useStudentSession } from '../../contexts/StudentSessionContext';
import EmptyState from '../../components/common/EmptyState';

export const StudentAssignmentsPage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { showToast } = useToast();
  const { selectedSemester, isArchivedView } = useStudentSession();

  const [tabIndex, setTabIndex] = useState(0);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const { data: assignmentsList = [], isLoading } = useStudentAssignmentsQuery({
    semester: selectedSemester,
  });
  const submitMutation = useSubmitAssignmentMutation();

  const pendingAssignments = useMemo(() => {
    if (!assignmentsList) return [];
    const list = Array.isArray(assignmentsList) ? assignmentsList : (assignmentsList.data || []);
    return list.filter((a) => !a.mySubmission && (a.status === 'PUBLISHED' || a.status === 'OPEN'));
  }, [assignmentsList]);

  const submittedAssignments = useMemo(() => {
    if (!assignmentsList) return [];
    const list = Array.isArray(assignmentsList) ? assignmentsList : (assignmentsList.data || []);
    return list.filter((a) => Boolean(a.mySubmission) || a.status === 'SUBMITTED' || a.status === 'GRADED');
  }, [assignmentsList]);

  const handleOpenSubmit = (assignment) => {
    setSelectedAssignment(assignment);
    setSubmissionUrl(assignment.mySubmission?.submissionUrl || '');
    setSubmissionNotes(assignment.mySubmission?.notes || '');
    setSelectedFile(null);
  };

  const handleCloseSubmit = () => {
    setSelectedAssignment(null);
    setSelectedFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!submissionUrl && !selectedFile) {
      showToast('Please attach a submission file (PDF/ZIP) or provide a document URL.', { severity: 'error' });
      return;
    }

    try {
      await submitMutation.mutateAsync({
        assignmentId: selectedAssignment._id,
        submissionUrl,
        notes: submissionNotes,
        file: selectedFile,
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
            Coursework & Assignments
          </Typography>
          {isArchivedView && (
            <Chip
              label={`SEMESTER ${selectedSemester} ARCHIVED`}
              color="warning"
              size="small"
              sx={{ fontWeight: 800 }}
            />
          )}
        </Box>
        <Typography variant="body1" color="text.secondary">
          {isArchivedView
            ? `Viewing archived coursework records for Semester ${selectedSemester}. Submissions are disabled.`
            : 'Review subject coursework deadlines, upload submissions, and view faculty evaluation feedback.'}
        </Typography>
      </Box>

      {/* Roster-Style 4-Color Top-Bordered KPI Grid */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: '14px',
              border: `1px solid ${theme.palette.divider}`,
              borderTop: '4px solid #4f46e5',
              bgcolor: isDark ? 'background.paper' : '#ffffff',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                Total Assignments
              </Typography>
              <Avatar sx={{ bgcolor: 'rgba(79, 70, 229, 0.12)', color: '#4f46e5', width: 40, height: 40, borderRadius: '10px' }}>
                <AssignmentIcon fontSize="small" />
              </Avatar>
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
                {assignmentsList.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Published term coursework
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: '14px',
              border: `1px solid ${theme.palette.divider}`,
              borderTop: '4px solid #10b981',
              bgcolor: isDark ? 'background.paper' : '#ffffff',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                Completed & Graded
              </Typography>
              <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#10b981', width: 40, height: 40, borderRadius: '10px' }}>
                <DoneIcon fontSize="small" />
              </Avatar>
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
                {submittedAssignments.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Submitted to faculty
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: '14px',
              border: `1px solid ${theme.palette.divider}`,
              borderTop: '4px solid #f59e0b',
              bgcolor: isDark ? 'background.paper' : '#ffffff',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                Pending Submissions
              </Typography>
              <Avatar sx={{ bgcolor: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', width: 40, height: 40, borderRadius: '10px' }}>
                <PendingIcon fontSize="small" />
              </Avatar>
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
                {pendingAssignments.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Awaiting student action
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: '14px',
              border: `1px solid ${theme.palette.divider}`,
              borderTop: '4px solid #06b6d4',
              bgcolor: isDark ? 'background.paper' : '#ffffff',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                Submission Rate
              </Typography>
              <Avatar sx={{ bgcolor: 'rgba(6, 182, 212, 0.12)', color: '#06b6d4', width: 40, height: 40, borderRadius: '10px' }}>
                <QualityIcon fontSize="small" />
              </Avatar>
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
                {assignmentsList.length > 0 ? Math.round((submittedAssignments.length / assignmentsList.length) * 100) : 100}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Course completion index
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper elevation={0} sx={{ borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, mb: 3.5, bgcolor: isDark ? 'background.paper' : '#ffffff' }}>
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
              <EmptyState
                type="assignments"
                title="No Pending Assignments Due"
                description="You are all caught up! There are no outstanding coursework assignments due at this time."
              />
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
                      disabled={isArchivedView}
                      startIcon={<UploadIcon />}
                      onClick={() => handleOpenSubmit(assignment)}
                      sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 800 }}
                    >
                      {isArchivedView ? 'Closed (Archived)' : 'Submit Work'}
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
                    <Chip
                      icon={<DoneIcon />}
                      label={assignment.mySubmission?.status === 'LATE' ? 'SUBMITTED (LATE)' : assignment.mySubmission?.status === 'GRADED' ? 'GRADED' : 'SUBMITTED'}
                      color={assignment.mySubmission?.status === 'LATE' ? 'warning' : 'success'}
                      size="small"
                      sx={{ fontWeight: 800 }}
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    {assignment.description}
                  </Typography>

                  {assignment.mySubmission?.submissionUrl && (
                    <Box sx={{ mb: 1.5, p: 1.5, borderRadius: '12px', bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${theme.palette.divider}` }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>
                        SUBMITTED LINK:
                      </Typography>
                      <Typography
                        component="a"
                        href={assignment.mySubmission.submissionUrl}
                        target="_blank"
                        rel="noreferrer"
                        variant="body2"
                        sx={{ color: 'primary.main', fontWeight: 600, wordBreak: 'break-all' }}
                      >
                        {assignment.mySubmission.submissionUrl}
                      </Typography>
                    </Box>
                  )}

                  {assignment.mySubmission?.marksObtained !== null && assignment.mySubmission?.marksObtained !== undefined && (
                    <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: `${theme.palette.success.main}12`, border: `1px solid ${theme.palette.success.main}` }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'success.main' }}>
                        Grade Awarded: {assignment.mySubmission.marksObtained} / {assignment.maxMarks || 100}
                      </Typography>
                      {assignment.mySubmission.feedback && (
                        <Typography variant="caption" color="text.secondary">
                          Faculty Feedback: &quot;{assignment.mySubmission.feedback}&quot;
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
            Attach a coursework file (PDF, ZIP, DOC) or provide a submission URL below.
          </Typography>

          <form onSubmit={handleSubmit}>
            <Box sx={{ mb: 2.5 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700 }}
              >
                {selectedFile ? `Selected: ${selectedFile.name}` : 'Attach Submission File (PDF / ZIP)'}
                <input
                  type="file"
                  hidden
                  accept=".pdf,.zip,.rar,.doc,.docx,.txt"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                />
              </Button>

              {selectedFile && (
                <Chip
                  label={`${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`}
                  size="small"
                  color="primary"
                  onDelete={() => setSelectedFile(null)}
                  sx={{ ml: 1.5, fontWeight: 700 }}
                />
              )}
            </Box>

            <TextField
              fullWidth
              label="Submission Document / Repository Link (Optional if file attached)"
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
