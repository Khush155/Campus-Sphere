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
  Divider,
  Skeleton,
  useTheme,
} from '@mui/material';
import {
  SchoolOutlined as SchoolIcon,
  FolderOutlined as ProjectIcon,
  CodeOutlined as SkillIcon,
  CardMembershipOutlined as CertIcon,
  DescriptionOutlined as ResumeIcon,
  OpenInNewOutlined as LinkIcon,
  CheckCircleOutlineOutlined as ActiveIcon,
  BadgeOutlined as RollIcon,
} from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext';
import { useMyProfileQuery } from '../../queries/userProfileQueries';
import { useStudentProjectsQuery } from '../../queries/studentQueries';

export const StudentPortfolioPage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { user } = useAuth();
  const { data: profile, isLoading: isProfileLoading } = useMyProfileQuery();

  const currentUser = profile?.user || user;
  const studentMeta = profile?.profileMeta || {};

  const { data: projectsData = [], isLoading: isProjectsLoading } = useStudentProjectsQuery();
  const projects = Array.isArray(projectsData) ? projectsData : [];

  const studentName = currentUser?.name || 'Student';
  const rollNumber = currentUser?.rollNumber || studentMeta?.rollNumber || 'N/A';
  const courseName = studentMeta?.course || currentUser?.courseId?.name || 'B.Tech';
  const branchName = studentMeta?.branch || currentUser?.branchId?.name || 'Computer Science & Engineering';
  const semesterNum = currentUser?.semester || studentMeta?.semester || 'N/A';
  const cgpaVal = currentUser?.cgpa !== undefined && currentUser?.cgpa !== null ? currentUser.cgpa : null;
  const profilePic = currentUser?.profilePicUrl || '';

  const specializationText = currentUser?.specialization || '';
  const qualificationText = currentUser?.qualification || '';

  const handleOpenLink = (url) => {
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
          Student Academic & Professional Portfolio
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Official institutional showcase of academic standing, faculty-supervised projects, technical competencies, and verified records.
        </Typography>
      </Box>

      <Grid container spacing={3.5}>
        {/* Left Column: Student Profile Overview Card */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3.5,
              borderRadius: '24px',
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: isDark ? 'background.paper' : '#ffffff',
              textAlign: 'center',
            }}
          >
            {isProfileLoading ? (
              <Box sx={{ py: 3 }}>
                <Skeleton variant="circular" width={100} height={100} sx={{ mx: 'auto', mb: 2 }} />
                <Skeleton variant="text" height={32} sx={{ mb: 1 }} />
                <Skeleton variant="text" height={20} width="60%" sx={{ mx: 'auto' }} />
              </Box>
            ) : (
              <Box>
                <Avatar
                  src={profilePic}
                  sx={{
                    width: 104,
                    height: 104,
                    mx: 'auto',
                    mb: 2,
                    bgcolor: `${theme.palette.primary.main}20`,
                    color: theme.palette.primary.main,
                    fontSize: '2.5rem',
                    fontWeight: 800,
                    border: `3px solid ${theme.palette.primary.main}`,
                  }}
                >
                  {studentName.charAt(0).toUpperCase()}
                </Avatar>

                <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
                  {studentName}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
                  <RollIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                    Roll No: <strong>{rollNumber}</strong>
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1, mb: 3 }}>
                  <Chip label={courseName} color="primary" size="small" sx={{ fontWeight: 800 }} />
                  <Chip label={branchName} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                  <Chip label={`Semester ${semesterNum}`} size="small" color="info" sx={{ fontWeight: 800 }} />
                </Box>

                <Divider sx={{ my: 2.5 }} />

                {/* Key Metrics */}
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: '16px',
                        bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                        border: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>
                        CUMULATIVE GPA
                      </Typography>
                      <Typography variant="h6" color="primary" sx={{ fontWeight: 800, mt: 0.5 }}>
                        {cgpaVal !== null ? `${cgpaVal} / 10` : 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: '16px',
                        bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                        border: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>
                        ACADEMIC STATUS
                      </Typography>
                      <Chip
                        icon={<ActiveIcon fontSize="small" />}
                        label={currentUser?.academicStatus || 'ONGOING'}
                        color="success"
                        size="small"
                        sx={{ fontWeight: 800, mt: 0.5, fontSize: '0.68rem' }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Right Column: Projects, Skills, Certifications, Resume */}
        <Grid item xs={12} md={8}>
          {/* Section 1: Academic Projects & Capstone Assignments */}
          <Paper
            elevation={0}
            sx={{
              p: 3.5,
              borderRadius: '24px',
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: isDark ? 'background.paper' : '#ffffff',
              mb: 3.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
              <Avatar sx={{ bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main }}>
                <ProjectIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  Academic & Capstone Projects ({projects.length})
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Faculty-supervised course projects and technical implementations
                </Typography>
              </Box>
            </Box>

            {isProjectsLoading ? (
              <Skeleton variant="rounded" height={160} sx={{ borderRadius: '16px' }} />
            ) : projects.length === 0 ? (
              <Box sx={{ p: 4, borderRadius: '16px', textAlign: 'center', bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', border: `1px dashed ${theme.palette.divider}` }}>
                <ProjectIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.4, mb: 1 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  No Academic Projects Logged
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Projects assigned by department faculty will automatically render in your portfolio.
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {projects.map((proj) => (
                  <Grid item xs={12} key={proj._id}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: '16px',
                        border: `1px solid ${theme.palette.divider}`,
                        bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                          {proj.title}
                        </Typography>
                        <Chip
                          label={proj.status || 'IN_PROGRESS'}
                          color={proj.status === 'COMPLETED' ? 'success' : 'primary'}
                          size="small"
                          sx={{ fontWeight: 800, fontSize: '0.7rem' }}
                        />
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 1.5, fontSize: '0.88rem' }}>
                        {proj.description}
                      </Typography>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                          Guide: <strong>{proj.guideId?.name || 'Faculty Guide'}</strong> ({proj.guideId?.designation || 'Supervisor'})
                        </Typography>

                        {proj.submissionUrl && (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<LinkIcon />}
                            onClick={() => handleOpenLink(proj.submissionUrl)}
                            sx={{ textTransform: 'none', fontWeight: 800, borderRadius: '8px' }}
                          >
                            Repository / Submission Link
                          </Button>
                        )}
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>

          {/* Section 2: Technical & Core Competencies (Skills) */}
          <Paper
            elevation={0}
            sx={{
              p: 3.5,
              borderRadius: '24px',
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: isDark ? 'background.paper' : '#ffffff',
              mb: 3.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
              <Avatar sx={{ bgcolor: `${theme.palette.info.main}15`, color: theme.palette.info.main }}>
                <SkillIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  Technical Skills & Competencies
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Specialization competencies and domain skills
                </Typography>
              </Box>
            </Box>

            {specializationText || qualificationText ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {specializationText && (
                  <Chip
                    icon={<SkillIcon fontSize="small" />}
                    label={`Specialization: ${specializationText}`}
                    color="primary"
                    sx={{ fontWeight: 800 }}
                  />
                )}
                {qualificationText && (
                  <Chip
                    icon={<SchoolIcon fontSize="small" />}
                    label={`Qualification: ${qualificationText}`}
                    variant="outlined"
                    sx={{ fontWeight: 700 }}
                  />
                )}
              </Box>
            ) : (
              <Box sx={{ p: 3, borderRadius: '16px', textAlign: 'center', bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', border: `1px dashed ${theme.palette.divider}` }}>
                <SkillIcon sx={{ fontSize: 36, color: 'text.secondary', opacity: 0.4, mb: 0.5 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  No Additional Specialization Skills Logged
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Update your profile specialization in settings to display verified skill badges here.
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Section 3: Verified Achievements & Certifications */}
          <Paper
            elevation={0}
            sx={{
              p: 3.5,
              borderRadius: '24px',
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: isDark ? 'background.paper' : '#ffffff',
              mb: 3.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
              <Avatar sx={{ bgcolor: `${theme.palette.warning.main}15`, color: theme.palette.warning.main }}>
                <CertIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  Achievements & Certifications
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  External course certifications and hackathon achievements
                </Typography>
              </Box>
            </Box>

            <Box sx={{ p: 3, borderRadius: '16px', textAlign: 'center', bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', border: `1px dashed ${theme.palette.divider}` }}>
              <CertIcon sx={{ fontSize: 36, color: 'text.secondary', opacity: 0.4, mb: 0.5 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                No Extracurricular Certifications Logged
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Verified institutional certificates and awards will appear here once approved by department admin.
              </Typography>
            </Box>
          </Paper>

          {/* Section 4: Curriculum Vitae & Resume */}
          <Paper
            elevation={0}
            sx={{
              p: 3.5,
              borderRadius: '24px',
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: isDark ? 'background.paper' : '#ffffff',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
              <Avatar sx={{ bgcolor: `${theme.palette.success.main}15`, color: theme.palette.success.main }}>
                <ResumeIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  Curriculum Vitae & Resume Document
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Professional resume file attached to placement profile
                </Typography>
              </Box>
            </Box>

            <Box sx={{ p: 3, borderRadius: '16px', textAlign: 'center', bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', border: `1px dashed ${theme.palette.divider}` }}>
              <ResumeIcon sx={{ fontSize: 36, color: 'text.secondary', opacity: 0.4, mb: 0.5 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                No Custom Resume Document Attached
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Upload your latest resume PDF in placement settings to enable one-click drive submission download.
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default StudentPortfolioPage;
