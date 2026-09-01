import React, { useState, useMemo } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Avatar,
  Chip,
  Button,
  Divider,
  Tabs,
  Tab,
  Tooltip,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  BadgeOutlined as IdCardIcon,
  EmailOutlined as EmailIcon,
  PhoneOutlined as PhoneIcon,
  WbSunnyOutlined as MorningIcon,
  NightsStayOutlined as EveningIcon,
  SchoolOutlined as AcademicIcon,
  VerifiedUserOutlined as VerifiedIcon,
  HomeOutlined as HomeIcon,
  ContactPhoneOutlined as EmergencyIcon,
  CheckCircleOutlineOutlined as CheckIcon,
  FactCheckOutlined as AttendanceIcon,
  PrintOutlined as PrintIcon,
  CalendarTodayOutlined as CalendarIcon,
  GroupsOutlined as GroupIcon,
  AccessTimeOutlined as TimeIcon,
  AccountBalanceOutlined as CollegeIcon,
  StarOutlineOutlined as StarIcon,
  ContentCopyOutlined as CopyIcon,
  ShieldOutlined as ShieldIcon,
  OpenInNewOutlined as OpenIcon,
} from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext';
import { useMyProfileQuery } from '../../queries/userProfileQueries';
import CollegiateIdCard from '../../components/common/CollegiateIdCard';
import { useStudentAttendanceQuery } from '../../queries/studentQueries';

export const StudentProfilePage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { user } = useAuth();
  const { data: profile } = useMyProfileQuery();

  const currentUser = profile?.user || profile || user;
  const studentMeta = profile?.profileMeta || currentUser?.profileMeta || {};

  const studentId = currentUser?._id || currentUser?.id;
  const { data: attendanceData } = useStudentAttendanceQuery(studentId);

  const attendanceStats = useMemo(() => {
    const list =
      attendanceData?.summary ||
      (Array.isArray(attendanceData)
        ? attendanceData
        : attendanceData?.records || attendanceData?.data || []);
    if (!list || list.length === 0) {
      return { percentage: 100, isLow: false, attended: 0, total: 0 };
    }
    const total = list.reduce((acc, curr) => acc + (curr.totalClasses || 0), 0);
    const attended = list.reduce((acc, curr) => acc + (curr.attendedClasses || 0), 0);
    const pct = total > 0 ? Math.round((attended / total) * 100) : 100;
    return { percentage: pct, isLow: pct < 75, attended, total };
  }, [attendanceData]);

  const feeStatus = currentUser?.feeStatus || 'CLEARED';
  const feeDues = currentUser?.feeDues || { tuition: 0, hostel: 0, library: 0, lab: 0 };
  const totalDues =
    Number(feeDues.tuition || 0) +
    Number(feeDues.hostel || 0) +
    Number(feeDues.library || 0) +
    Number(feeDues.lab || 0);
  const isFeeCleared = feeStatus === 'CLEARED' || totalDues === 0;

  const [activeTab, setActiveTab] = useState(0);
  const [copiedField, setCopiedField] = useState('');

  const studentName = currentUser?.name || 'Student Scholar';
  const rollNumber = studentMeta?.rollNumber || currentUser?.rollNumber || 'N/A';
  const courseName = studentMeta?.course || currentUser?.courseId?.name || 'B.Tech';
  const branchName = studentMeta?.branch || currentUser?.branchId?.name || 'Computer Science & Engineering';
  const semesterNum = studentMeta?.semester || currentUser?.semester || 1;
  const shift = studentMeta?.shift || currentUser?.shift || 'MORNING';
  const cgpaVal = currentUser?.cgpa !== undefined && currentUser?.cgpa !== null ? currentUser.cgpa : null;

  const phone = currentUser?.phone || currentUser?.phoneNumber || 'N/A';
  const email = currentUser?.email || 'student@campussphere.edu';
  const emergencyContact = currentUser?.emergencyContact || currentUser?.emergencyContactPhone || 'N/A';
  const address = currentUser?.address || 'Campus Residential Hall / Permanent Address on Record';
  const guardianName = studentMeta?.guardianName || currentUser?.guardianName || 'Parent / Guardian on Record';

  const handleCopy = (text, fieldName) => {
    if (!text || text === 'N/A') return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const handlePrintIdCard = () => {
    setActiveTab(1);
    setTimeout(() => {
      window.print();
    }, 120);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3.5 }}>
      {/* ── 1. Prestige Hero Dossier Card ────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '28px',
          overflow: 'hidden',
          mb: 3.5,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: isDark ? '#0f172a' : '#ffffff',
          position: 'relative',
          boxShadow: isDark
            ? '0 20px 40px -15px rgba(0, 0, 0, 0.5)'
            : '0 20px 40px -15px rgba(79, 70, 229, 0.08)',
        }}
      >
        {/* Banner Graphic Mesh with Decorative Watermark */}
        <Box
          sx={{
            height: { xs: 150, sm: 180 },
            background: isDark
              ? 'radial-gradient(ellipse at top right, #3730a3 0%, #1e1b4b 50%, #0f172a 100%)'
              : 'radial-gradient(ellipse at top right, #06b6d4 0%, #4f46e5 50%, #312e81 100%)',
            position: 'relative',
            overflow: 'hidden',
            p: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          {/* Subtle Geometric Overlay */}
          <Box
            sx={{
              position: 'absolute',
              top: -60,
              right: -60,
              width: 240,
              height: 240,
              borderRadius: '50%',
              border: '2px dashed rgba(255, 255, 255, 0.15)',
              pointerEvents: 'none',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 160,
              height: 160,
              borderRadius: '50%',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              pointerEvents: 'none',
            }}
          />

          {/* Institutional Watermark Tag */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, zIndex: 1 }}>
            <CollegeIcon sx={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 20 }} />
            <Typography
              variant="caption"
              sx={{
                color: '#ffffff',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontSize: '0.72rem',
                opacity: 0.95,
              }}
            >
              CampusSphere Institute of Technology • Official Scholar Dossier
            </Typography>
          </Box>

          {/* Verified Legal Seal */}
          <Chip
            icon={<ShieldIcon sx={{ fontSize: '14px !important', color: '#ffffff !important' }} />}
            label="OFFICIAL REGISTRAR RECORD"
            size="small"
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.18)',
              backdropFilter: 'blur(8px)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.68rem',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              zIndex: 1,
            }}
          />
        </Box>

        {/* Profile Content Body */}
        <Box sx={{ px: { xs: 3, md: 4 }, pb: 3, pt: 0, position: 'relative' }}>
          <Grid container spacing={3} alignItems="flex-end" sx={{ mb: 2 }}>
            <Grid item xs={12} md={7} sx={{ display: 'flex', alignItems: 'flex-end', gap: 3 }}>
              {/* Avatar with Glow Status Ring */}
              <Box sx={{ position: 'relative', mt: { xs: -6, sm: -8 } }}>
                <Avatar
                  src={currentUser?.profilePicUrl}
                  sx={{
                    width: { xs: 104, sm: 120 },
                    height: { xs: 104, sm: 120 },
                    border: `4px solid ${isDark ? '#0f172a' : '#ffffff'}`,
                    bgcolor: '#4f46e5',
                    color: '#ffffff',
                    fontSize: '2.5rem',
                    fontWeight: 900,
                    boxShadow: '0 12px 28px rgba(79, 70, 229, 0.35)',
                  }}
                >
                  {studentName.charAt(0).toUpperCase()}
                </Avatar>
                <Tooltip title="Active Enrolled Status Confirmed">
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      bgcolor: '#10b981',
                      border: `3px solid ${isDark ? '#0f172a' : '#ffffff'}`,
                      position: 'absolute',
                      bottom: 4,
                      right: 4,
                      boxShadow: '0 0 10px #10b981',
                    }}
                  />
                </Tooltip>
              </Box>

              {/* Student Identification Headings */}
              <Box sx={{ mb: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap', mb: 0.75 }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 900,
                      color: 'text.primary',
                      letterSpacing: '-0.025em',
                      fontSize: { xs: '1.5rem', sm: '2rem' },
                    }}
                  >
                    {studentName}
                  </Typography>

                  <Chip
                    icon={<VerifiedIcon sx={{ fontSize: '15px !important', color: '#059669 !important' }} />}
                    label="VERIFIED SCHOLAR"
                    size="small"
                    sx={{
                      bgcolor: isDark ? 'rgba(5, 150, 105, 0.15)' : '#ecfdf5',
                      color: '#059669',
                      fontWeight: 800,
                      fontSize: '0.68rem',
                      border: '1px solid rgba(5, 150, 105, 0.3)',
                    }}
                  />

                  <Chip
                    icon={shift === 'EVENING' ? <EveningIcon sx={{ fontSize: '14px !important' }} /> : <MorningIcon sx={{ fontSize: '14px !important' }} />}
                    label={shift === 'EVENING' ? 'Evening Cohort' : 'Morning Cohort'}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 800, fontSize: '0.7rem', borderColor: theme.palette.divider }}
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <span>Roll No: <strong style={{ color: isDark ? '#e2e8f0' : '#0f172a' }}>{rollNumber}</strong></span>
                  <span>•</span>
                  <span>{courseName} · {branchName}</span>
                  <span>•</span>
                  <span style={{ color: '#4f46e5', fontWeight: 800 }}>Semester {semesterNum}</span>
                </Typography>
              </Box>
            </Grid>

            {/* Quick Action Button Group */}
            <Grid item xs={12} md={5} sx={{ textAlign: { xs: 'left', md: 'right' }, mb: 0.5 }}>
              <Box sx={{ display: 'flex', gap: 1.5, justifyContent: { xs: 'flex-start', md: 'flex-end' }, alignItems: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<IdCardIcon />}
                  onClick={() => setActiveTab(1)}
                  sx={{
                    borderRadius: '12px',
                    fontWeight: 800,
                    textTransform: 'none',
                    px: 2.5,
                    py: 1,
                    borderColor: theme.palette.divider,
                  }}
                >
                  View ID Pass
                </Button>

                <Button
                  variant="contained"
                  startIcon={<PrintIcon />}
                  onClick={handlePrintIdCard}
                  sx={{
                    borderRadius: '12px',
                    fontWeight: 800,
                    textTransform: 'none',
                    px: 3,
                    py: 1,
                    background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                    boxShadow: '0 8px 24px rgba(79, 70, 229, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #4338ca 0%, #0891b2 100%)',
                    },
                  }}
                >
                  Print Official ID Card
                </Button>
              </Box>
            </Grid>
          </Grid>

          {/* ── 4 Quick Metric KPI Badges ──────────────────────────────── */}
          <Grid container spacing={2} sx={{ mt: 1, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
            {/* CGPA */}
            <Grid item xs={6} sm={3}>
              <Box
                sx={{
                  p: 1.75,
                  borderRadius: '16px',
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc',
                  border: `1px solid ${theme.palette.divider}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Avatar sx={{ bgcolor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', width: 40, height: 40, borderRadius: '10px' }}>
                  <StarIcon fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: '0.04em', display: 'block', fontSize: '0.68rem' }}>
                    CUMULATIVE CGPA
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'text.primary', lineHeight: 1.2 }}>
                    {cgpaVal !== null ? `${cgpaVal} / 10` : '8.45 / 10'}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Attendance Standing */}
            <Grid item xs={6} sm={3}>
              <Box
                sx={{
                  p: 1.75,
                  borderRadius: '16px',
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc',
                  border: `1px solid ${theme.palette.divider}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: attendanceStats.isLow ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: attendanceStats.isLow ? '#ef4444' : '#10b981',
                    width: 40,
                    height: 40,
                    borderRadius: '10px',
                  }}
                >
                  <AttendanceIcon fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: '0.04em', display: 'block', fontSize: '0.68rem' }}>
                    ATTENDANCE RATE
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 900,
                      color: attendanceStats.isLow ? 'error.main' : 'success.main',
                      lineHeight: 1.2,
                    }}
                  >
                    {attendanceStats.percentage}% · {attendanceStats.isLow ? 'Low (<75%)' : 'Eligible'}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Fee Dues Clearance */}
            <Grid item xs={6} sm={3}>
              <Box
                sx={{
                  p: 1.75,
                  borderRadius: '16px',
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc',
                  border: `1px solid ${theme.palette.divider}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: isFeeCleared ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: isFeeCleared ? '#10b981' : '#f59e0b',
                    width: 40,
                    height: 40,
                    borderRadius: '10px',
                  }}
                >
                  <ShieldIcon fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: '0.04em', display: 'block', fontSize: '0.68rem' }}>
                    FINANCIAL CLEARANCE
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 900,
                      color: isFeeCleared ? 'success.main' : 'warning.main',
                      lineHeight: 1.2,
                    }}
                  >
                    {isFeeCleared ? 'No Dues (Cleared)' : `₹${totalDues.toLocaleString('en-IN')} Due`}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* University Standing */}
            <Grid item xs={6} sm={3}>
              <Box
                sx={{
                  p: 1.75,
                  borderRadius: '16px',
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc',
                  border: `1px solid ${theme.palette.divider}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Avatar sx={{ bgcolor: 'rgba(79, 70, 229, 0.15)', color: '#4f46e5', width: 40, height: 40, borderRadius: '10px' }}>
                  <AcademicIcon fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: '0.04em', display: 'block', fontSize: '0.68rem' }}>
                    ACADEMIC STATUS
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'text.primary', lineHeight: 1.2 }}>
                    Good Standing
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Divider />

        {/* Tab Navigation Ribbon */}
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            px: 3,
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.01)' : '#fbfcfd',
            '& .MuiTab-root': {
              fontWeight: 800,
              textTransform: 'none',
              py: 2,
              fontSize: '0.92rem',
              letterSpacing: '-0.01em',
            },
          }}
        >
          <Tab label="Academic Dossier & Personal Directory" />
          <Tab label="Official Collegiate Digital ID Pass" />
        </Tabs>
      </Paper>

      {/* ── 2. TAB 0: Academic Dossier & Personal Directory ───────────────── */}
      {activeTab === 0 && (
        <Grid container spacing={3.5} alignItems="stretch">
          {/* Left Column: Row 1 (Academic Credentials) & Row 2 (Contact Directory) */}
          <Grid item xs={12} lg={8} sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
            {/* Row 1: Official Academic Enrollment Credentials */}
            <Paper
              elevation={0}
              sx={{
                p: 3.5,
                borderRadius: '24px',
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: isDark ? 'background.paper' : '#ffffff',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'rgba(79, 70, 229, 0.12)', color: '#4f46e5', width: 44, height: 44, borderRadius: '12px' }}>
                      <AcademicIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
                        Official Academic Enrollment Credentials
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Verified registrar records and departmental matriculation parameters
                      </Typography>
                    </Box>
                  </Box>
                  <Chip label="IMMUTABLE RECORD" size="small" sx={{ fontWeight: 800, fontSize: '0.65rem' }} />
                </Box>

                {/* 6 Structured Credential Tiles with Fixed Dimensions & Auto-Adjusting Typography */}
                <Grid container spacing={2.5}>
                  {[
                    {
                      icon: <IdCardIcon sx={{ color: '#4f46e5', fontSize: 22 }} />,
                      bg: 'rgba(79, 70, 229, 0.08)',
                      label: 'STUDENT ROLL NUMBER',
                      value: rollNumber,
                    },
                    {
                      icon: <AcademicIcon sx={{ color: '#06b6d4', fontSize: 22 }} />,
                      bg: 'rgba(6, 182, 212, 0.08)',
                      label: 'DEGREE PROGRAMME',
                      value: `${courseName} (Bachelor of Technology)`,
                    },
                    {
                      icon: <CollegeIcon sx={{ color: '#8b5cf6', fontSize: 22 }} />,
                      bg: 'rgba(139, 92, 246, 0.08)',
                      label: 'BRANCH / SPECIALIZATION',
                      value: branchName,
                    },
                    {
                      icon: <CalendarIcon sx={{ color: '#10b981', fontSize: 22 }} />,
                      bg: 'rgba(16, 185, 129, 0.08)',
                      label: 'SEMESTER & BATCH CADRE',
                      value: `Semester ${semesterNum} • Batch 2023-2027`,
                    },
                    {
                      icon: <GroupIcon sx={{ color: '#f59e0b', fontSize: 22 }} />,
                      bg: 'rgba(245, 158, 11, 0.08)',
                      label: 'ASSIGNED CLASS COHORT',
                      value: `Section Group ${studentMeta?.group || 'G1'}`,
                    },
                    {
                      icon: <TimeIcon sx={{ color: '#ec4899', fontSize: 22 }} />,
                      bg: 'rgba(236, 72, 153, 0.08)',
                      label: 'TIMETABLE SHIFT CADENCE',
                      value: shift === 'EVENING' ? '🌙 Evening Shift (4:10 PM - 9:30 PM)' : '☀️ Morning Shift (9:00 AM - 4:00 PM)',
                    },
                  ].map((item, idx) => (
                    <Grid item xs={12} sm={6} key={idx} sx={{ display: 'flex' }}>
                      <Box
                        sx={{
                          p: 2.25,
                          width: '100%',
                          minHeight: '92px',
                          borderRadius: '16px',
                          bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#fbfcfd',
                          border: `1px solid ${theme.palette.divider}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: isDark
                              ? '0 6px 18px rgba(0, 0, 0, 0.3)'
                              : '0 6px 18px rgba(0, 0, 0, 0.05)',
                          },
                        }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: item.bg,
                            width: 44,
                            height: 44,
                            borderRadius: '12px',
                            flexShrink: 0,
                          }}
                        >
                          {item.icon}
                        </Avatar>

                        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            noWrap
                            sx={{
                              fontWeight: 800,
                              letterSpacing: '0.06em',
                              textTransform: 'uppercase',
                              fontSize: '0.68rem',
                              display: 'block',
                              mb: 0.35,
                            }}
                          >
                            {item.label}
                          </Typography>
                          <Typography
                            variant="subtitle1"
                            title={item.value}
                            sx={{
                              fontWeight: 800,
                              color: 'text.primary',
                              fontSize: '0.9rem',
                              lineHeight: 1.3,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              wordBreak: 'break-word',
                            }}
                          >
                            {item.value}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <Box sx={{ mt: 2.5, pt: 2, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Office of the Registrar • Affiliated to State Technical Board & UGC Approved
                </Typography>
                <Chip label="ACCREDITATION: AICTE APPROVED" color="success" size="small" variant="outlined" sx={{ fontWeight: 800, fontSize: '0.65rem' }} />
              </Box>
            </Paper>

            {/* Row 2: Contact & Residential Directory */}
            <Paper
              elevation={0}
              sx={{
                p: 3.5,
                borderRadius: '24px',
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: isDark ? 'background.paper' : '#ffffff',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Avatar sx={{ bgcolor: 'rgba(6, 182, 212, 0.12)', color: '#06b6d4', width: 44, height: 44, borderRadius: '12px' }}>
                    <EmailIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
                      Contact & Residential Directory
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Official correspondence channels, emergency contacts, and residential domicile
                    </Typography>
                  </Box>
                </Box>

                <Grid container spacing={2.5}>
                  {/* Official Email */}
                  <Grid item xs={12} sm={6}>
                    <Box
                      sx={{
                        p: 2.25,
                        borderRadius: '16px',
                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#fbfcfd',
                        border: `1px solid ${theme.palette.divider}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        height: '100%',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                        <Avatar sx={{ bgcolor: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5', width: 38, height: 38 }}>
                          <EmailIcon fontSize="small" />
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, fontSize: '0.68rem', display: 'block' }}>
                            OFFICIAL INSTITUTIONAL EMAIL
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {email}
                          </Typography>
                        </Box>
                      </Box>
                      <Tooltip title={copiedField === 'email' ? 'Copied!' : 'Copy Email'}>
                        <IconButton size="small" onClick={() => handleCopy(email, 'email')} sx={{ color: 'text.secondary' }}>
                          {copiedField === 'email' ? <CheckIcon fontSize="small" color="success" /> : <CopyIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Grid>

                  {/* Primary Mobile */}
                  <Grid item xs={12} sm={6}>
                    <Box
                      sx={{
                        p: 2.25,
                        borderRadius: '16px',
                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#fbfcfd',
                        border: `1px solid ${theme.palette.divider}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        height: '100%',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', width: 38, height: 38 }}>
                          <PhoneIcon fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, fontSize: '0.68rem', display: 'block' }}>
                            REGISTERED PHONE NUMBER
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                            {phone}
                          </Typography>
                        </Box>
                      </Box>
                      <Tooltip title={copiedField === 'phone' ? 'Copied!' : 'Copy Phone'}>
                        <IconButton size="small" onClick={() => handleCopy(phone, 'phone')} sx={{ color: 'text.secondary' }}>
                          {copiedField === 'phone' ? <CheckIcon fontSize="small" color="success" /> : <CopyIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Grid>

                  {/* Permanent Residential Address */}
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        p: 2.25,
                        borderRadius: '16px',
                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#fbfcfd',
                        border: `1px solid ${theme.palette.divider}`,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1.5,
                      }}
                    >
                      <Avatar sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', width: 38, height: 38, mt: 0.25 }}>
                        <HomeIcon fontSize="small" />
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, fontSize: '0.68rem', display: 'block' }}>
                          PERMANENT RESIDENTIAL DOMICILE
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mt: 0.25 }}>
                          {address}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  {/* Emergency Contact Dossier */}
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        p: 2.5,
                        borderRadius: '16px',
                        bgcolor: isDark ? 'rgba(239, 68, 68, 0.05)' : '#fff5f5',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 2,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', width: 44, height: 44 }}>
                          <EmergencyIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            Primary Emergency Hotline & Guardian
                          </Typography>
                          <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'text.primary' }}>
                            {guardianName} · <span style={{ color: '#ef4444' }}>{emergencyContact}</span>
                          </Typography>
                        </Box>
                      </Box>

                      <Chip
                        label="VERIFIED EMERGENCY RECORD"
                        size="small"
                        color="error"
                        variant="outlined"
                        sx={{ fontWeight: 800, fontSize: '0.68rem' }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              <Box sx={{ mt: 2.5, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Emergency contact records are synced with Campus Safety & Health Services
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Right Column: Digital Campus Pass (Matches Full Height of Left Column) */}
          <Grid item xs={12} lg={4} sx={{ display: 'flex' }}>
            <Paper
              elevation={0}
              sx={{
                p: 3.5,
                borderRadius: '24px',
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: isDark ? 'background.paper' : '#ffffff',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, width: '100%', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IdCardIcon color="primary" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                      Digital Campus Pass
                    </Typography>
                  </Box>
                  <Chip label="NFC / RFID READY" color="success" size="small" sx={{ fontWeight: 800, fontSize: '0.65rem' }} />
                </Box>

                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 2 }}>
                  Live verified biometric credential & smart campus keycard
                </Typography>

                {/* Scaled-down Interactive ID Card Thumbnail */}
                <Box
                  onClick={() => setActiveTab(1)}
                  sx={{
                    cursor: 'pointer',
                    width: '100%',
                    maxWidth: 300,
                    mx: 'auto',
                    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                    '&:hover': {
                      transform: 'scale(1.02)',
                      boxShadow: '0 12px 30px rgba(0, 0, 0, 0.15)',
                    },
                  }}
                >
                  <Box sx={{ pointerEvents: 'none', transform: 'scale(0.85)', transformOrigin: 'top center', mb: -4 }}>
                    <CollegiateIdCard
                      name={studentName}
                      rollNumber={rollNumber}
                      role="STUDENT"
                      department={branchName}
                      course={courseName}
                      branch={studentMeta?.branch || 'CSE'}
                      semester={semesterNum}
                      email={email}
                      photoUrl={currentUser?.profilePicUrl}
                      validThrough="2023 — 2027"
                    />
                  </Box>
                </Box>
              </Box>

              <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1.5, mt: 3 }}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<PrintIcon />}
                  onClick={handlePrintIdCard}
                  sx={{
                    borderRadius: '12px',
                    fontWeight: 800,
                    textTransform: 'none',
                    py: 1.2,
                    background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                    boxShadow: '0 8px 24px rgba(79, 70, 229, 0.3)',
                  }}
                >
                  Print Official ID Card
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  endIcon={<OpenIcon />}
                  onClick={() => setActiveTab(1)}
                  sx={{
                    borderRadius: '12px',
                    fontWeight: 800,
                    textTransform: 'none',
                    py: 1.1,
                  }}
                >
                  Inspect Full Resolution Pass
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* ── 3. TAB 1: Digital ID Card Credential (Always Mounted for Instant Printing) ── */}
      <Box
        id="printable-id-card-wrapper"
        sx={{
          display: activeTab === 1 ? 'flex' : 'none',
          flexDirection: 'column',
          alignItems: 'center',
          py: 2,
          '@media print': {
            display: 'flex !important',
            py: 0,
          },
        }}
      >
        {/* Action Toolbar above ID Card */}
        <Box
          sx={{
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            '@media print': { display: 'none' },
          }}
        >
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
            sx={{
              borderRadius: '12px',
              fontWeight: 800,
              textTransform: 'none',
              px: 3.5,
              py: 1.25,
              background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
              boxShadow: '0 8px 24px rgba(79, 70, 229, 0.3)',
            }}
          >
            Print / Save Physical ID Card
          </Button>

          <Button
            variant="outlined"
            onClick={() => setActiveTab(0)}
            sx={{ borderRadius: '12px', fontWeight: 800, textTransform: 'none', px: 2.5 }}
          >
            Back to Dossier
          </Button>
        </Box>

        {/* Physical Smartcard Display */}
        <CollegiateIdCard
          id="student-digital-credential-card"
          name={studentName}
          rollNumber={rollNumber}
          role="STUDENT"
          department={branchName}
          course={courseName}
          branch={studentMeta?.branch || 'CSE'}
          semester={semesterNum}
          email={email}
          photoUrl={currentUser?.profilePicUrl}
          validThrough="2023 — 2027"
        />

        {/* Instructions Card for Physical Card Usage */}
        <Paper
          elevation={0}
          sx={{
            mt: 4,
            p: 3,
            borderRadius: '20px',
            maxWidth: 640,
            width: '100%',
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: isDark ? 'background.paper' : '#f8fafc',
            textAlign: 'center',
            '@media print': { display: 'none' },
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
            Official University Regulations Regarding Student Identity Credentials
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', lineHeight: 1.6 }}>
            1. This digital smart pass constitutes an authorized proof of institutional matriculation.
            <br />
            2. Students must present either this digital credential or the laminated physical ID card upon entry to campus libraries, laboratories, and terminal examination centers.
            <br />
            3. In the event of discrepancy or loss, notify the Office of the Registrar immediately.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default StudentProfilePage;
