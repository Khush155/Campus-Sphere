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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  useTheme,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  PrintOutlined as PrintIcon,
  SchoolOutlined as SchoolIcon,
  VerifiedOutlined as VerifiedIcon,
  QrCode2Outlined as QrIcon,
  AssignmentTurnedInOutlined as ExamIcon,
  LockOutlined as LockIcon,
  AccountBalanceWalletOutlined as FeeIcon,
  WarningAmberOutlined as AlertIcon,
  ArrowForward as ArrowIcon,
  EventNoteOutlined as LeaveIcon,
} from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext';
import { useMyProfileQuery } from '../../queries/userProfileQueries';
import { useStudentExaminationsQuery, useStudentAttendanceQuery } from '../../queries/studentQueries';

export const StudentHallTicketPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useMyProfileQuery();

  const currentUser = profile?.user || user;
  const studentMeta = profile?.profileMeta || {};
  const branchObj = currentUser?.branchId;
  const branchId = typeof branchObj === 'object' ? branchObj?._id : branchObj;
  const semesterNum = currentUser?.semester || studentMeta?.semester || 6;
  const sectionGroup = currentUser?.group || 'A1';
  const studentId = currentUser?._id || currentUser?.id;

  const { data: examsData = [], isLoading: isExamsLoading } = useStudentExaminationsQuery({
    branchId: branchId || undefined,
    semester: semesterNum || undefined,
  });

  const { data: attendanceData } = useStudentAttendanceQuery(studentId);

  // 1. Fee Clearance Verification
  const tuitionDues = currentUser?.feeDues?.tuition || 0;
  const hostelDues = currentUser?.feeDues?.hostel || 0;
  const libraryDues = currentUser?.feeDues?.library || 0;
  const labDues = currentUser?.feeDues?.lab || 0;
  const totalDues = tuitionDues + hostelDues + libraryDues + labDues;
  const isFeeDue = currentUser?.feeStatus === 'DUE' || totalDues > 0;

  // 2. Attendance Clearance Verification (< 75% is detained)
  const attendanceRecords = Array.isArray(attendanceData)
    ? attendanceData
    : attendanceData?.summary || attendanceData?.records || [];

  const totalClasses = attendanceRecords.reduce((acc, curr) => acc + (curr.totalClasses || 0), 0);
  const attendedClasses = attendanceRecords.reduce((acc, curr) => acc + (curr.attendedClasses || 0) + (curr.medicalClasses || 0), 0);
  const attendancePercentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 100;
  const isAttendanceDetained = totalClasses >= 5 && attendancePercentage < 75;

  const isEligible = !isFeeDue && !isAttendanceDetained;

  const studentName = currentUser?.name || 'Student Candidate';
  const rollNumber = currentUser?.rollNumber || studentMeta?.rollNumber || 'N/A';
  const courseName = studentMeta?.course || currentUser?.courseId?.name || 'B.Tech';
  const branchName = studentMeta?.branch || currentUser?.branchId?.name || 'Computer Science & Engineering';

  // Filter or sort scheduled examinations
  const scheduledExams = Array.isArray(examsData) ? examsData : [];

  const handlePrint = () => {
    if (!isEligible) return;
    window.print();
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3.5 }}>
      {/* Header Bar */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3.5,
          flexWrap: 'wrap',
          gap: 2,
          '@media print': { display: 'none' },
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', mb: 0.5 }}>
            Official Examination Admit Card & Hall Ticket
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Official candidate admit ticket for upcoming semester examinations and laboratory evaluations.
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="primary"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          disabled={!isEligible}
          sx={{
            borderRadius: '12px',
            px: 3,
            py: 1.25,
            fontWeight: 800,
            textTransform: 'none',
            boxShadow: isEligible ? '0 8px 20px rgba(79, 70, 229, 0.25)' : 'none',
          }}
        >
          {isEligible ? 'Print / Download Hall Ticket PDF' : 'Hall Ticket Withheld'}
        </Button>
      </Box>

      {/* ── Security / Withholding Banners (if not eligible) ──────────────── */}
      {!isEligible && (
        <Box sx={{ mb: 3.5, display: 'flex', flexDirection: 'column', gap: 2.5, '@media print': { display: 'none' } }}>
          {isFeeDue && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                border: '1px solid #fecaca',
                bgcolor: '#fef2f2',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2.5,
                flexWrap: 'wrap',
              }}
            >
              <Avatar sx={{ bgcolor: '#fee2e2', color: '#dc2626', width: 48, height: 48 }}>
                <FeeIcon />
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 260 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#991b1b' }}>
                    Admit Card Withheld — Outstanding Tuition & Fee Dues
                  </Typography>
                  <Chip
                    label={`DUE: ₹${totalDues.toLocaleString('en-IN')}`}
                    size="small"
                    sx={{ bgcolor: '#dc2626', color: '#ffffff', fontWeight: 800 }}
                  />
                </Box>
                <Typography variant="body2" sx={{ color: '#7f1d1d', lineHeight: 1.6 }}>
                  As per University Examination Bylaws, hall tickets are conditionally withheld for candidates with pending semester fee dues. Please clear your institutional dues online or present your fee receipt to the Accounts Department to unlock your official examination hall ticket.
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    size="small"
                    endIcon={<ArrowIcon />}
                    onClick={() => navigate('/student/fees')}
                    sx={{
                      bgcolor: '#dc2626',
                      '&:hover': { bgcolor: '#b91c1c' },
                      fontWeight: 800,
                      borderRadius: '8px',
                      textTransform: 'none',
                    }}
                  >
                    Clear Fee Dues Online
                  </Button>
                </Box>
              </Box>
            </Paper>
          )}

          {isAttendanceDetained && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                border: '1px solid #fed7aa',
                bgcolor: '#fff7ed',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2.5,
                flexWrap: 'wrap',
              }}
            >
              <Avatar sx={{ bgcolor: '#ffedd5', color: '#ea580c', width: 48, height: 48 }}>
                <AlertIcon />
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 260 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#9a3412' }}>
                    Candidate Detained — Attendance Shortage (&lt;75%)
                  </Typography>
                  <Chip
                    label={`CURRENT ATTENDANCE: ${attendancePercentage}%`}
                    size="small"
                    sx={{ bgcolor: '#ea580c', color: '#ffffff', fontWeight: 800 }}
                  />
                </Box>
                <Typography variant="body2" sx={{ color: '#7c2d12', lineHeight: 1.6 }}>
                  Your cumulative attendance across registered coursework stands at <strong>{attendancePercentage}%</strong>, which is below the mandatory <strong>75% statutory requirement</strong>. Your candidate admit ticket has been automatically withheld. If you have valid medical certificates or institutional duty leaves, apply for official condonation with your Head of Department.
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    endIcon={<ArrowIcon />}
                    onClick={() => navigate('/student/attendance')}
                    sx={{
                      borderColor: '#ea580c',
                      color: '#ea580c',
                      '&:hover': { borderColor: '#c2410c', bgcolor: '#fff' },
                      fontWeight: 800,
                      borderRadius: '8px',
                      textTransform: 'none',
                    }}
                  >
                    View Attendance Register
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<LeaveIcon />}
                    onClick={() => navigate('/student/leave')}
                    sx={{
                      bgcolor: '#ea580c',
                      '&:hover': { bgcolor: '#c2410c' },
                      fontWeight: 800,
                      borderRadius: '8px',
                      textTransform: 'none',
                    }}
                  >
                    Submit Medical Exemption
                  </Button>
                </Box>
              </Box>
            </Paper>
          )}
        </Box>
      )}

      {/* Hall Ticket Document Container */}
      <Paper
        id="printable-hall-ticket"
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 4 },
          borderRadius: '24px',
          border: `2px solid ${theme.palette.divider}`,
          bgcolor: '#ffffff',
          color: '#0f172a',
          position: 'relative',
          overflow: 'hidden',
          '@media print': {
            border: '1px solid #000000',
            borderRadius: 0,
            p: 2,
            boxShadow: 'none',
          },
        }}
      >
        {/* Official Diagonal Watermark when Withheld */}
        {!isEligible && (
          <Box
            sx={{
              position: 'absolute',
              top: '45%',
              left: '50%',
              transform: 'translate(-50%, -50%) rotate(-25deg)',
              pointerEvents: 'none',
              zIndex: 10,
              opacity: 0.16,
              border: '6px solid #dc2626',
              px: 6,
              py: 2,
              borderRadius: '16px',
              textAlign: 'center',
            }}
          >
            <Typography
              variant="h1"
              sx={{
                fontWeight: 900,
                color: '#dc2626',
                letterSpacing: '0.1em',
                whiteSpace: 'nowrap',
                fontSize: { xs: '2.2rem', sm: '3.8rem' },
              }}
            >
              WITHHELD / DETAINED
            </Typography>
          </Box>
        )}

        {/* Document Header Seal Banner */}
        <Box
          sx={{
            textAlign: 'center',
            pb: 2.5,
            mb: 3,
            borderBottom: `2px solid ${theme.palette.divider}`,
            position: 'relative',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 1 }}>
            <SchoolIcon sx={{ fontSize: 36, color: '#4f46e5' }} />
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: '0.04em' }}>
              CAMPUS-SPHERE UNIVERSITY OF TECHNOLOGY
            </Typography>
          </Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#475569', letterSpacing: '0.1em' }}>
            OFFICE OF THE CONTROLLER OF EXAMINATIONS • OFFICIAL ADMIT TICKET
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap', mt: 1.5 }}>
            <Chip
              icon={isEligible ? <VerifiedIcon fontSize="small" style={{ color: '#059669' }} /> : <LockIcon fontSize="small" style={{ color: '#dc2626' }} />}
              label={isEligible ? "OFFICIAL EXAM CANDIDATE" : "ADMIT TICKET CONDITIONAL / WITHHELD"}
              size="small"
              sx={{
                fontWeight: 800,
                bgcolor: isEligible ? '#ecfdf5' : '#fef2f2',
                color: isEligible ? '#047857' : '#b91c1c',
                border: isEligible ? '1px solid #a7f3d0' : '1px solid #fecaca',
              }}
            />
            <Chip
              label={isFeeDue ? `FEES: ₹${totalDues.toLocaleString('en-IN')} DUE` : 'FEE STATUS: CLEARED'}
              size="small"
              sx={{
                fontWeight: 800,
                bgcolor: isFeeDue ? '#fef2f2' : '#f0fdf4',
                color: isFeeDue ? '#dc2626' : '#15803d',
                border: isFeeDue ? '1px solid #fecaca' : '1px solid #bbf7d0',
              }}
            />
            <Chip
              label={`ATTENDANCE: ${attendancePercentage}% ${isAttendanceDetained ? '(SHORTAGE <75%)' : '(COMPLIANT ≥75%)'}`}
              size="small"
              sx={{
                fontWeight: 800,
                bgcolor: isAttendanceDetained ? '#fff7ed' : '#f0fdf4',
                color: isAttendanceDetained ? '#c2410c' : '#15803d',
                border: isAttendanceDetained ? '1px solid #fed7aa' : '1px solid #bbf7d0',
              }}
            />
          </Box>
        </Box>

        {/* Candidate Information & QR Verification Grid */}
        <Grid container spacing={3} sx={{ mb: 3.5 }}>
          <Grid item xs={12} sm={3} sx={{ textAlign: 'center' }}>
            <Box
              sx={{
                p: 2,
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                bgcolor: '#f8fafc',
                display: 'inline-block',
                width: '100%',
                maxWidth: 180,
              }}
            >
              <Avatar
                src={currentUser?.profilePicUrl}
                sx={{
                  width: 96,
                  height: 96,
                  mx: 'auto',
                  mb: 1.5,
                  bgcolor: '#e0e7ff',
                  color: '#4f46e5',
                  fontSize: '2.2rem',
                  fontWeight: 800,
                  border: '2px solid #4f46e5',
                }}
              >
                {studentName.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                <QrIcon sx={{ fontSize: 28, color: '#475569' }} />
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.65rem' }}>
                  REF: #{String(currentUser?._id || '2310993001').slice(-6).toUpperCase()}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={9}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                  CANDIDATE FULL NAME
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  {studentName}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                  UNIVERSITY ROLL NUMBER
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  {rollNumber}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                  DEGREE COURSE & PROGRAM
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  {courseName}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                  BRANCH / DISCIPLINE
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  {branchName}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                  CURRENT SEMESTER & SECTION
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  Semester {semesterNum} • Group {sectionGroup}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                  EXAMINATION CENTER / BLOCK
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: '#4f46e5' }}>
                  Main Academic Block - Examination Center A
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* Examination Schedule Table */}
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5 }}>
          Authorized Examination Schedule & Slot Allotment
        </Typography>

        <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: '16px', mb: 3 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f1f5f9' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: '#0f172a' }}>SUBJECT CODE & NAME</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#0f172a' }}>TYPE</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#0f172a' }}>DATE & SLOT</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#0f172a' }}>REPORTING TIME</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#0f172a' }}>VENUE & HALL</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#0f172a', textAlign: 'center' }}>INVIGILATOR SIGN</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {isExamsLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3, fontWeight: 600 }}>
                    Loading official exam datesheet...
                  </TableCell>
                </TableRow>
              ) : scheduledExams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <ExamIcon sx={{ fontSize: 40, color: '#94a3b8', mb: 0.5 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                      No Examination Schedule Found
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Official datesheet notifications will automatically populate here when published by the Controller of Examinations.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                scheduledExams.map((exam) => (
                  <TableRow key={exam._id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                        {exam.subjectId?.name || exam.title}
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#4f46e5' }}>
                        {exam.subjectId?.code || 'CS601'}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={exam.type || 'EXTERNAL'}
                        size="small"
                        sx={{ fontWeight: 800, fontSize: '0.68rem', bgcolor: '#e0e7ff', color: '#3730a3' }}
                      />
                    </TableCell>

                    <TableCell sx={{ fontWeight: 700, color: '#334155' }}>
                      {new Date(exam.date).toLocaleDateString()} ({exam.datesheetSlot || 'MORNING'})
                    </TableCell>

                    <TableCell sx={{ fontWeight: 700, color: '#334155' }}>
                      {exam.reportingTime || '09:00 AM'} ({exam.duration || 180} Mins)
                    </TableCell>

                    <TableCell sx={{ fontWeight: 700, color: '#334155' }}>
                      {exam.venue || 'Main Exam Block - Room 302'}
                    </TableCell>

                    <TableCell align="center" sx={{ width: 140 }}>
                      <Box sx={{ borderBottom: '1px dashed #cbd5e1', height: 28, mx: 'auto' }} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* General Candidate Instructions & Signature Footer */}
        <Box sx={{ p: 2.5, borderRadius: '16px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0', mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
            Rules & Conduct Instructions for Candidates:
          </Typography>
          <Typography variant="caption" component="div" sx={{ color: '#475569', fontWeight: 600, lineHeight: 1.6 }}>
            1. Candidates must carry a physical copy of this Admit Card along with their official University Identity Card.
            <br />
            2. Reporting time is 30 minutes prior to exam commencement. Late entry is strictly prohibited after 15 minutes.
            <br />
            3. Electronic devices, smartwatches, and unauthorized materials are strictly forbidden inside the hall.
          </Typography>
        </Box>

        <Divider sx={{ my: 2.5 }} />

        {/* Official Signatures Row */}
        <Grid container spacing={3} sx={{ pt: 1 }}>
          <Grid item xs={6} sx={{ textAlign: 'left' }}>
            <Box sx={{ borderBottom: '1px solid #94a3b8', width: 180, mb: 1, height: 32 }} />
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f172a' }}>
              Candidate Signature
            </Typography>
          </Grid>

          <Grid item xs={6} sx={{ textAlign: 'right' }}>
            <Box sx={{ borderBottom: '1px solid #94a3b8', width: 180, ml: 'auto', mb: 1, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#059669', letterSpacing: '0.05em' }}>
                [DIGITALLY SEALED]
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f172a' }}>
              Controller of Examinations
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default StudentHallTicketPage;
