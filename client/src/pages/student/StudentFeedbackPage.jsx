import React, { useState, useMemo } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Button,
  Avatar,
  Chip,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  Skeleton,
  useTheme,
} from '@mui/material';
import {
  RateReviewOutlined as ReviewIcon,
  PersonOutlined as PersonIcon,
  CheckCircleOutlineOutlined as SuccessIcon,
  StarOutlined as StarIcon,
} from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext';
import { useMyProfileQuery } from '../../queries/userProfileQueries';
import { useSubjectsQuery } from '../../queries/collegeQueries';
import {
  useStudentFeedbackQuery,
  useSubmitFeedbackMutation,
} from '../../queries/studentQueries';
import { useToast } from '../../contexts/ToastContext';

export const StudentFeedbackPage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { user: authUser } = useAuth();
  const { showToast } = useToast();
  const { data: profile } = useMyProfileQuery();

  const currentUser = profile?.user || authUser;
  const studentMeta = profile?.profileMeta || {};
  const branchObj = currentUser?.branchId;
  const branchId = typeof branchObj === 'object' ? branchObj?._id : branchObj;
  const semesterVal = currentUser?.semester || studentMeta?.semester;

  const [activeTab, setActiveTab] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');

  const { data: liveSubjects = [], isLoading: isSubjectsLoading } = useSubjectsQuery({
    branchId: branchId || undefined,
    semester: semesterVal || undefined,
  });

  const { data: myFeedback = [], isLoading: isFeedbackLoading } = useStudentFeedbackQuery();
  const submitMutation = useSubmitFeedbackMutation();

  const feedbackList = Array.isArray(myFeedback) ? myFeedback : [];

  // Filter unique faculty instructors from enrolled subjects
  const facultyList = useMemo(() => {
    const subjects = Array.isArray(liveSubjects) ? liveSubjects : [];
    const map = new Map();
    subjects.forEach((sub) => {
      if (sub.facultyId) {
        const facId = typeof sub.facultyId === 'object' ? sub.facultyId._id : sub.facultyId;
        const facName = typeof sub.facultyId === 'object' ? sub.facultyId.name : 'Faculty Instructor';
        const facEmail = typeof sub.facultyId === 'object' ? sub.facultyId.email : '';
        if (facId && !map.has(facId)) {
          map.set(facId, {
            id: facId,
            name: facName,
            email: facEmail,
            subjectName: sub.name,
            subjectCode: sub.code,
          });
        }
      }
    });
    return Array.from(map.values());
  }, [liveSubjects]);

  const handleOpenReview = (faculty) => {
    setSelectedFaculty(faculty);
    setRating(5);
    setComments('');
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedFaculty(null);
    setRating(5);
    setComments('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedFaculty) return;
    if (!comments || comments.trim().length < 3) {
      showToast('Please provide feedback comments of at least 3 characters.', { severity: 'error' });
      return;
    }

    const payload = {
      targetRole: 'FACULTY',
      targetUser: selectedFaculty.id,
      rating: Number(rating),
      comments: comments.trim(),
    };

    submitMutation.mutate(payload, {
      onSuccess: () => {
        showToast('Faculty teaching evaluation submitted successfully!');
        handleCloseModal();
      },
      onError: (err) => {
        showToast(err.response?.data?.message || err.message || 'Feedback submission failed', {
          severity: 'error',
        });
      },
    });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3.5 }}>
      {/* Header */}
      <Box sx={{ mb: 3.5 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', mb: 0.5 }}>
          Faculty Teaching & Course Feedback Desk
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Submit official teaching evaluations and rate course instructors for Semester {semesterVal || 'N/A'}.
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper elevation={0} sx={{ mb: 3.5, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, bgcolor: isDark ? 'background.paper' : '#ffffff' }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{ px: 3, '& .MuiTab-root': { fontWeight: 800, textTransform: 'none', py: 2 } }}
        >
          <Tab label={`Course Instructors (${facultyList.length})`} />
          <Tab label={`My Submitted Evaluations (${feedbackList.length})`} />
        </Tabs>
      </Paper>

      {/* TAB 0: Course Instructors */}
      {activeTab === 0 && (
        <Box>
          {isSubjectsLoading ? (
            <Grid container spacing={3}>
              {[1, 2, 3].map((i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Skeleton variant="rounded" height={220} sx={{ borderRadius: '20px' }} />
                </Grid>
              ))}
            </Grid>
          ) : facultyList.length === 0 ? (
            <Paper elevation={0} sx={{ p: 5, borderRadius: '24px', textAlign: 'center', border: `1px solid ${theme.palette.divider}` }}>
              <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
                No Faculty Instructors Assigned
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                Course instructors assigned to your semester subjects will appear here for teaching evaluation.
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {facultyList.map((fac) => {
                const hasReviewed = feedbackList.some((f) => String(f.targetUser?._id || f.targetUser?.id || f.targetUser) === String(fac.id));

                return (
                  <Grid item xs={12} sm={6} md={4} key={fac.id}>
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Avatar sx={{ width: 48, height: 48, bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main, fontWeight: 800 }}>
                            {fac.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                              {fac.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                              {fac.email}
                            </Typography>
                          </Box>
                        </Box>

                        <Chip
                          label={`Subject: ${fac.subjectName}`}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ fontWeight: 800, mb: 2 }}
                        />

                        {hasReviewed && (
                          <Chip
                            icon={<SuccessIcon fontSize="small" />}
                            label="Evaluation Submitted This Month"
                            color="success"
                            size="small"
                            sx={{ fontWeight: 800, display: 'flex', mb: 2 }}
                          />
                        )}
                      </Box>

                      <Button
                        fullWidth
                        variant={hasReviewed ? 'outlined' : 'contained'}
                        color={hasReviewed ? 'secondary' : 'primary'}
                        startIcon={<ReviewIcon />}
                        onClick={() => handleOpenReview(fac)}
                        sx={{ borderRadius: '12px', fontWeight: 800, textTransform: 'none', mt: 2 }}
                      >
                        {hasReviewed ? 'Submit Follow-Up Evaluation' : 'Rate & Review Instructor'}
                      </Button>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      )}

      {/* TAB 1: Submitted History */}
      {activeTab === 1 && (
        <Box>
          {isFeedbackLoading ? (
            <Skeleton variant="rounded" height={200} sx={{ borderRadius: '24px' }} />
          ) : feedbackList.length === 0 ? (
            <Paper elevation={0} sx={{ p: 5, borderRadius: '24px', textAlign: 'center', border: `1px solid ${theme.palette.divider}` }}>
              <StarIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
                No Submitted Feedback Records
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                Teaching evaluations submitted by you will appear here.
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {feedbackList.map((fb) => (
                <Grid item xs={12} sm={6} key={fb._id || fb.id}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: '20px',
                      border: `1px solid ${theme.palette.divider}`,
                      bgcolor: isDark ? 'background.paper' : '#ffffff',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                        {fb.targetUser?.name || 'Faculty Instructor'}
                      </Typography>
                      <Rating value={fb.rating || 5} readOnly size="small" />
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 2, fontStyle: 'italic' }}>
                      &quot;{fb.comments}&quot;
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.5, borderTop: `1px solid ${theme.palette.divider}` }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                        Submitted: {new Date(fb.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Typography>
                      <Chip label="VERIFIED SUBMISSION" size="small" color="success" sx={{ fontWeight: 800, fontSize: '0.65rem' }} />
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Review Dialog */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>
          Submit Teaching Evaluation for {selectedFaculty?.name}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 2.5 }}>
              Subject: <strong>{selectedFaculty?.subjectName}</strong>
            </Typography>

            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block', mb: 1 }}>
                OVERALL TEACHING RATING (1 TO 5 STARS)
              </Typography>
              <Rating
                value={rating}
                onChange={(_, val) => setRating(val || 1)}
                size="large"
                sx={{ fontSize: '2.5rem' }}
              />
            </Box>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Evaluation Comments / Remarks"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Provide constructive feedback regarding course coverage, clarity, and teaching effectiveness..."
              required
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseModal} sx={{ fontWeight: 700 }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={submitMutation.isPending} sx={{ borderRadius: '12px', fontWeight: 800, px: 3 }}>
              {submitMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default StudentFeedbackPage;
