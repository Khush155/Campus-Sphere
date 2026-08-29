import React, { useState, useMemo } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  Avatar,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  RateReviewOutlined as ReviewIcon,
  CheckCircleOutlineOutlined as VerifiedIcon,
  HourglassEmptyOutlined as PendingIcon,
  SchoolOutlined as FacultyIcon,
  Close as CloseIcon,
  LockOutlined as PrivacyIcon,
  Star as StarIcon,
  MenuBookOutlined as SubjectIcon,
  EmojiEventsOutlined as ScoreIcon,
} from '@mui/icons-material';

import { useStudentSession } from '../../contexts/StudentSessionContext';
import { useMyProfileQuery } from '../../queries/userProfileQueries';
import {
  useStudentFeedbackStatusQuery,
  useSubmitFacultyFeedbackMutation,
} from '../../queries/studentQueries';
import { useToast } from '../../contexts/ToastContext';

const RATING_CRITERIA = [
  {
    key: 'courseCoverage',
    label: 'Course Coverage & Syllabus Pace',
    description: 'Completes curriculum methodically and adheres to the planned syllabus schedule.',
  },
  {
    key: 'conceptClarity',
    label: 'Teaching Clarity & Subject Mastery',
    description: 'Explains complex principles clearly and demonstrates thorough subject knowledge.',
  },
  {
    key: 'punctuality',
    label: 'Punctuality & Lecture Regularity',
    description: 'Conducts scheduled lectures regularly and respects lecture start/end timings.',
  },
  {
    key: 'doubtClearing',
    label: 'Interaction & Doubt Resolution',
    description: 'Welcomes student questions attentively and resolves academic queries effectively.',
  },
  {
    key: 'practicalRelevance',
    label: 'Practical Guidance & Real-World Context',
    description: 'Provides industry examples, lab assistance, and actionable study guidance.',
  },
];

export const StudentFeedbackPage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { data: profile } = useMyProfileQuery();
  const { showToast } = useToast();
  const { selectedSemester, isArchivedView } = useStudentSession();

  const studentMeta = profile?.profileMeta || {};

  // Query student allocations and feedback status for the selected semester
  const { data: feedbackData, isLoading } = useStudentFeedbackStatusQuery({
    semester: selectedSemester,
  });

  const submitMutation = useSubmitFacultyFeedbackMutation();

  const allocations = useMemo(() => {
    return feedbackData?.allocations || [];
  }, [feedbackData]);

  const stats = useMemo(() => {
    return (
      feedbackData?.stats || {
        totalAllocations: 0,
        submittedCount: 0,
        pendingCount: 0,
        completionRate: 100,
      }
    );
  }, [feedbackData]);

  // Modal State
  const [selectedAllocation, setSelectedAllocation] = useState(null);
  const [criteriaScores, setCriteriaScores] = useState({
    courseCoverage: 5,
    conceptClarity: 5,
    punctuality: 5,
    doubtClearing: 5,
    practicalRelevance: 5,
  });
  const [comments, setComments] = useState('');
  const [isViewOnly, setIsViewOnly] = useState(false);

  const averageModalScore = useMemo(() => {
    const vals = Object.values(criteriaScores);
    const sum = vals.reduce((a, b) => a + b, 0);
    return Math.round((sum / vals.length) * 10) / 10;
  }, [criteriaScores]);

  const handleOpenAppraisal = (alloc, viewOnly = false) => {
    setSelectedAllocation(alloc);
    setIsViewOnly(viewOnly);

    if (alloc.feedback) {
      setCriteriaScores({
        courseCoverage: alloc.feedback.criteriaRatings?.courseCoverage || alloc.feedback.rating || 5,
        conceptClarity: alloc.feedback.criteriaRatings?.conceptClarity || alloc.feedback.rating || 5,
        punctuality: alloc.feedback.criteriaRatings?.punctuality || alloc.feedback.rating || 5,
        doubtClearing: alloc.feedback.criteriaRatings?.doubtClearing || alloc.feedback.rating || 5,
        practicalRelevance: alloc.feedback.criteriaRatings?.practicalRelevance || alloc.feedback.rating || 5,
      });
      setComments(alloc.feedback.comments || '');
    } else {
      setCriteriaScores({
        courseCoverage: 5,
        conceptClarity: 5,
        punctuality: 5,
        doubtClearing: 5,
        practicalRelevance: 5,
      });
      setComments('');
    }
  };

  const handleCloseModal = () => {
    setSelectedAllocation(null);
    setIsViewOnly(false);
  };

  const handleScoreChange = (key, value) => {
    if (isViewOnly) return;
    setCriteriaScores((prev) => ({
      ...prev,
      [key]: value || 1,
    }));
  };

  const handleSubmitAppraisal = async (e) => {
    e.preventDefault();
    if (!selectedAllocation) return;

    if (!comments.trim()) {
      showToast('Please provide constructive comments or feedback (min 3 characters).', {
        severity: 'warning',
      });
      return;
    }

    try {
      await submitMutation.mutateAsync({
        targetRole: 'FACULTY',
        targetUser: selectedAllocation.faculty.id,
        subjectId: selectedAllocation.subject.id,
        semester: selectedSemester,
        rating: Math.round(averageModalScore),
        criteriaRatings: criteriaScores,
        comments: comments.trim(),
        isAnonymous: true,
      });

      showToast('Thank you! Your confidential feedback was submitted successfully.', {
        severity: 'success',
      });
      handleCloseModal();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to submit feedback. Please try again.', {
        severity: 'error',
      });
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3.5 }}>
      {/* ── 1. Page Header ──────────────────────────────────────────────── */}
      <Box sx={{ mb: 3.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
            Faculty &amp; Course Appraisal Desk
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
            ? `Reviewing historical faculty appraisal submissions recorded for Semester ${selectedSemester}.`
            : `Confidential end-term course evaluation for Course ${studentMeta?.course || 'B.Tech'} (Semester ${selectedSemester}).`}
        </Typography>
      </Box>

      {/* ── 2. Top Metric KPI Grid (4 Roster-Style Top-Bordered Cards) ──── */}
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
                Course Instructors
              </Typography>
              <Avatar sx={{ bgcolor: 'rgba(79, 70, 229, 0.12)', color: '#4f46e5', width: 40, height: 40, borderRadius: '10px' }}>
                <FacultyIcon fontSize="small" />
              </Avatar>
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
                {stats.totalAllocations}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Assigned faculty in Semester {selectedSemester}
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
                Appraisals Completed
              </Typography>
              <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#10b981', width: 40, height: 40, borderRadius: '10px' }}>
                <VerifiedIcon fontSize="small" />
              </Avatar>
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
                {stats.submittedCount} <Typography component="span" variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>/ {stats.totalAllocations}</Typography>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stats.completionRate}% completion index
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
                {stats.pendingCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Awaiting student evaluation
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
                Confidentiality Standard
              </Typography>
              <Avatar sx={{ bgcolor: 'rgba(6, 182, 212, 0.12)', color: '#06b6d4', width: 40, height: 40, borderRadius: '10px' }}>
                <PrivacyIcon fontSize="small" />
              </Avatar>
            </Box>
            <Box>
              <Chip
                label="100% ANONYMOUS"
                color="info"
                size="small"
                sx={{ fontWeight: 800, borderRadius: '6px' }}
              />
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.75 }}>
                NAAC / NBA Accreditation standard
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* ── 3. Confidentiality Guarantee Banner ─────────────────────────── */}
      <Alert
        severity="info"
        icon={<PrivacyIcon fontSize="inherit" />}
        sx={{
          mb: 3.5,
          borderRadius: '16px',
          fontWeight: 600,
          border: `1px solid ${theme.palette.info.main}`,
        }}
      >
        <strong>Confidential Student Appraisal:</strong> Your feedback is strictly anonymous. Neither the subject instructor nor the department head can view your name or roll number. Scores and remarks are aggregated to improve academic quality.
      </Alert>

      {/* ── 4. Course Faculty Appraisal Cards Grid ──────────────────────── */}
      {isLoading ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontWeight: 700 }}>
            Loading course instructors for Semester {selectedSemester}...
          </Typography>
        </Box>
      ) : allocations.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: '24px',
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: isDark ? 'background.paper' : '#ffffff',
          }}
        >
          <ReviewIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
            No Course Instructor Allocations Found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 450, mx: 'auto', mt: 1 }}>
            There are no active faculty subject allocations configured for your cohort in Semester {selectedSemester} yet.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {allocations.map((alloc) => {
            const isCompleted = alloc.isSubmitted;

            return (
              <Grid item xs={12} md={6} lg={4} key={alloc.allocationId || alloc.faculty.id + alloc.subject.id}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: '20px',
                    border: `1px solid ${theme.palette.divider}`,
                    borderTop: `4px solid ${isCompleted ? '#10b981' : '#f59e0b'}`,
                    bgcolor: isDark ? 'background.paper' : '#ffffff',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 12px 28px rgba(0,0,0,0.06)',
                    },
                  }}
                >
                  <Box>
                    {/* Header: Subject Code & Status */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: 'rgba(79, 70, 229, 0.1)', color: 'primary.main', width: 36, height: 36, borderRadius: '10px' }}>
                          <SubjectIcon fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', fontFamily: 'monospace' }}>
                            {alloc.subject.code}
                          </Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
                            {alloc.subject.name}
                          </Typography>
                        </Box>
                      </Box>

                      <Chip
                        label={isCompleted ? 'EVALUATED' : 'PENDING'}
                        color={isCompleted ? 'success' : 'warning'}
                        size="small"
                        sx={{ fontWeight: 800, fontSize: '0.68rem', borderRadius: '6px' }}
                      />
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Faculty Profile Details */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar
                        src={alloc.faculty.profilePicUrl}
                        sx={{ width: 48, height: 48, borderRadius: '14px', bgcolor: 'primary.main', fontWeight: 800 }}
                      >
                        {alloc.faculty.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                          {alloc.faculty.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {alloc.faculty.specialization}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          {alloc.faculty.email}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Submitted Rating Preview */}
                    {isCompleted && alloc.feedback && (
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: '12px',
                          bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(16, 185, 129, 0.05)',
                          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(16, 185, 129, 0.2)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mb: 2,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Rating value={alloc.feedback.rating} readOnly size="small" precision={0.5} />
                          <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.primary' }}>
                            {alloc.feedback.rating} / 5
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Submitted on {new Date(alloc.feedback.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Actions */}
                  <Box sx={{ pt: 2 }}>
                    {isCompleted ? (
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<ScoreIcon fontSize="small" />}
                        onClick={() => handleOpenAppraisal(alloc, true)}
                        sx={{ borderRadius: '12px', fontWeight: 800, textTransform: 'none' }}
                      >
                        View My Submission
                      </Button>
                    ) : isArchivedView ? (
                      <Button
                        fullWidth
                        disabled
                        variant="outlined"
                        sx={{ borderRadius: '12px', fontWeight: 800, textTransform: 'none' }}
                      >
                        Appraisal Closed (Archived)
                      </Button>
                    ) : (
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<ReviewIcon fontSize="small" />}
                        onClick={() => handleOpenAppraisal(alloc, false)}
                        sx={{
                          borderRadius: '12px',
                          fontWeight: 800,
                          textTransform: 'none',
                          py: 1,
                          boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
                        }}
                      >
                        Submit Appraisal
                      </Button>
                    )}
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* ── 5. Interactive Appraisal Modal ───────────────────────────────── */}
      <Dialog
        open={Boolean(selectedAllocation)}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            p: 1,
            bgcolor: isDark ? 'background.paper' : '#ffffff',
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pb: 1 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={selectedAllocation?.subject.code || 'COURSE'}
                color="primary"
                size="small"
                sx={{ fontWeight: 800 }}
              />
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
                {selectedAllocation?.faculty.name}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Course Appraisal for {selectedAllocation?.subject.name} • Semester {selectedSemester}
            </Typography>
          </Box>

          <IconButton onClick={handleCloseModal} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleSubmitAppraisal}>
          <DialogContent dividers sx={{ pt: 2.5 }}>
            {/* Overall Score Summary Header */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                mb: 3,
                borderRadius: '16px',
                bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(79, 70, 229, 0.05)',
                border: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  Calculated Overall Score
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
                    {averageModalScore}
                  </Typography>
                  <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700 }}>
                    / 5.0
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ textAlign: 'right' }}>
                <Rating
                  value={averageModalScore}
                  precision={0.1}
                  readOnly
                  emptyIcon={<StarIcon style={{ opacity: 0.4 }} fontSize="inherit" />}
                />
                <Typography variant="caption" display="block" color="text.secondary">
                  Computed from 5 accreditation parameters
                </Typography>
              </Box>
            </Paper>

            {/* 5-Criteria Ratings List */}
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: 'text.primary' }}>
              Academic Evaluation Parameters:
            </Typography>

            <Grid container spacing={2.5}>
              {RATING_CRITERIA.map((crit, idx) => (
                <Grid item xs={12} key={crit.key}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: '12px',
                      border: `1px solid ${theme.palette.divider}`,
                      bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#fafafa',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 2,
                    }}
                  >
                    <Box sx={{ maxWidth: '65%' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                        {idx + 1}. {crit.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {crit.description}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Rating
                        name={crit.key}
                        value={criteriaScores[crit.key] || 5}
                        readOnly={isViewOnly}
                        onChange={(_, val) => handleScoreChange(crit.key, val)}
                        size="medium"
                      />
                      <Chip
                        label={`${criteriaScores[crit.key] || 5} ★`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontWeight: 800, minWidth: 42 }}
                      />
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* Qualitative Remarks */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
                Constructive Remarks &amp; Feedback:
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                disabled={isViewOnly}
                placeholder="Share constructive feedback regarding teaching pace, clarity, or positive appreciation..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                InputProps={{
                  sx: { borderRadius: '14px' },
                }}
              />
            </Box>

            {/* Anonymity Notice */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2.5, color: 'text.secondary' }}>
              <PrivacyIcon sx={{ fontSize: 18, color: '#10b981' }} />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                100% Confidential: Your identity will not be visible to faculty or department heads.
              </Typography>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 2.5 }}>
            <Button
              onClick={handleCloseModal}
              variant="outlined"
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 800 }}
            >
              {isViewOnly ? 'Close' : 'Cancel'}
            </Button>

            {!isViewOnly && (
              <Button
                type="submit"
                variant="contained"
                disabled={submitMutation.isPending}
                startIcon={submitMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <ReviewIcon />}
                sx={{
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 800,
                  px: 3,
                }}
              >
                {submitMutation.isPending ? 'Submitting...' : 'Submit Appraisal'}
              </Button>
            )}
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default StudentFeedbackPage;
