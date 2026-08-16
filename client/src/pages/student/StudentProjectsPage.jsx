import React from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  Avatar,
  Skeleton,
  useTheme,
} from '@mui/material';
import {
  FolderOutlined as ProjectIcon,
  PersonOutlined as GuideIcon,
  GroupsOutlined as TeamIcon,
  OpenInNewOutlined as LinkIcon,
  CheckCircleOutlineOutlined as CompletedIcon,
  HourglassEmptyOutlined as InProgressIcon,
  SchoolOutlined as AcademicIcon,
} from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext';
import { useMyProfileQuery } from '../../queries/userProfileQueries';
import { useStudentProjectsQuery } from '../../queries/studentQueries';

const getStatusConfig = (status) => {
  switch (status) {
    case 'COMPLETED':
      return { label: 'COMPLETED', color: 'success', icon: <CompletedIcon fontSize="small" /> };
    case 'IN_PROGRESS':
      return { label: 'IN PROGRESS', color: 'primary', icon: <InProgressIcon fontSize="small" /> };
    case 'APPROVED':
      return { label: 'APPROVED', color: 'info', icon: <CompletedIcon fontSize="small" /> };
    case 'REJECTED':
      return { label: 'REJECTED', color: 'error', icon: <ProjectIcon fontSize="small" /> };
    case 'PROPOSED':
    default:
      return { label: 'PROPOSED', color: 'warning', icon: <InProgressIcon fontSize="small" /> };
  }
};

export const StudentProjectsPage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { user } = useAuth();
  const { data: profile } = useMyProfileQuery();

  const currentUser = profile?.user || user;
  const studentMeta = profile?.profileMeta || {};

  const { data: projectsData = [], isLoading } = useStudentProjectsQuery();

  const projects = Array.isArray(projectsData) ? projectsData : [];

  // Summary Metrics
  const totalCount = projects.length;
  const activeCount = projects.filter((p) => ['IN_PROGRESS', 'APPROVED', 'PROPOSED'].includes(p.status)).length;
  const completedCount = projects.filter((p) => p.status === 'COMPLETED').length;

  const handleOpenSubmission = (url) => {
    if (!url) return;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3.5 }}>
      {/* Header Bar */}
      <Box sx={{ mb: 3.5 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', mb: 0.5 }}>
          Academic Projects & Capstone Work
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Assigned minor, major, and capstone team projects, guide supervisors, and progress tracking for Course{' '}
          <strong>{studentMeta?.course || 'B.Tech'}</strong> (Sem {currentUser?.semester || studentMeta?.semester || 6}).
        </Typography>
      </Box>

      {/* KPI Cards Row */}
      <Grid container spacing={3} sx={{ mb: 3.5 }}>
        <Grid item xs={12} sm={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '20px',
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: isDark ? 'background.paper' : '#ffffff',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main, width: 48, height: 48 }}>
                <ProjectIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  ASSIGNED PROJECTS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  {totalCount}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '20px',
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: isDark ? 'background.paper' : '#ffffff',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: `${theme.palette.info.main}15`, color: theme.palette.info.main, width: 48, height: 48 }}>
                <InProgressIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  ACTIVE / IN-PROGRESS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'info.main' }}>
                  {activeCount}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '20px',
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: isDark ? 'background.paper' : '#ffffff',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: `${theme.palette.success.main}15`, color: theme.palette.success.main, width: 48, height: 48 }}>
                <CompletedIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  COMPLETED PROJECTS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'success.main' }}>
                  {completedCount}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Projects Grid View */}
      {isLoading ? (
        <Grid container spacing={3}>
          {[1, 2, 3].map((item) => (
            <Grid item xs={12} md={6} key={item}>
              <Skeleton variant="rounded" height={260} sx={{ borderRadius: '24px' }} />
            </Grid>
          ))}
        </Grid>
      ) : projects.length === 0 ? (
        <Paper elevation={0} sx={{ p: 6, borderRadius: '24px', textAlign: 'center', border: `1px solid ${theme.palette.divider}` }}>
          <ProjectIcon sx={{ fontSize: 56, color: 'text.secondary', opacity: 0.4, mb: 1.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
            No Academic Projects Assigned
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
            You have not been registered under any minor, major, or capstone projects for this academic term.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {projects.map((item) => {
            const statusConfig = getStatusConfig(item.status);
            const guideName = item.guideId?.name || 'Assigned Faculty Guide';
            const guideDesig = item.guideId?.designation || 'Project Supervisor';
            const guideEmail = item.guideId?.email;
            const teamMembers = Array.isArray(item.students) ? item.students : [];

            return (
              <Grid item xs={12} md={6} key={item._id}>
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
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Chip
                        icon={statusConfig.icon}
                        label={statusConfig.label}
                        color={statusConfig.color}
                        size="small"
                        sx={{ fontWeight: 800, fontSize: '0.72rem' }}
                      />
                      {item.academicYear && (
                        <Chip
                          icon={<AcademicIcon fontSize="small" />}
                          label={`AY ${item.academicYear}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 800, fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>

                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
                      {item.title}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, lineHeight: 1.6, mb: 2.5 }}>
                      {item.description}
                    </Typography>

                    {/* Faculty Guide Box */}
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: '16px',
                        bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                        border: `1px solid ${theme.palette.divider}`,
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                      }}
                    >
                      <Avatar sx={{ width: 40, height: 40, bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main }}>
                        <GuideIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>
                          PROJECT FACULTY GUIDE
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                          {guideName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {guideDesig} {guideEmail ? `• ${guideEmail}` : ''}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Team Members List */}
                    {teamMembers.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <TeamIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                            TEAM COLLABORATORS ({teamMembers.length})
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {teamMembers.map((student) => (
                            <Chip
                              key={student._id || student.email}
                              avatar={<Avatar>{student.name ? student.name.charAt(0) : 'S'}</Avatar>}
                              label={student.name ? `${student.name} ${student.rollNumber ? `(${student.rollNumber})` : ''}` : 'Student'}
                              size="small"
                              variant="outlined"
                              sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>

                  {/* Submission Link Footer */}
                  {item.submissionUrl && (
                    <Box sx={{ pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        color="primary"
                        startIcon={<LinkIcon />}
                        onClick={() => handleOpenSubmission(item.submissionUrl)}
                        sx={{ borderRadius: '12px', fontWeight: 800, textTransform: 'none' }}
                      >
                        Access Project Repository / Submission
                      </Button>
                    </Box>
                  )}
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
};

export default StudentProjectsPage;
