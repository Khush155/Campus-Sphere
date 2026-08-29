import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  useTheme,
} from '@mui/material';
import {
  SchoolOutlined,
  PlayArrowOutlined,
  WarningAmberOutlined,
  CheckCircleOutlineOutlined,
  ArrowForwardOutlined,
  AutorenewOutlined,
} from '@mui/icons-material';
import {
  useDepartmentsQuery,
  useCoursesQuery,
  useBranchesQuery,
} from '../../../queries/collegeQueries';
import {
  usePromotionPreviewMutation,
  useExecutePromotionMutation,
} from '../../../queries/promotionQueries';
import ConfirmDeleteModal from '../../../components/common/ConfirmDeleteModal';
import { useToast } from '../../../contexts/ToastContext';

export const BulkPromotion = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Scope selection state
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');

  // Loaded preview data
  const [previewData, setPreviewData] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);

  // Queries for select choices
  const { data: depts } = useDepartmentsQuery();
  const { data: courses } = useCoursesQuery();
  const { data: branches } = useBranchesQuery();

  // Mutations
  const previewMutation = usePromotionPreviewMutation();
  const executeMutation = useExecutePromotionMutation();

  // Filter branches based on course selection
  const filteredBranches = useMemo(() => {
    if (!selectedCourse) return [];
    return branches?.filter(
      (b) => String(b.courseId?._id || b.courseId) === String(selectedCourse)
    ) || [];
  }, [branches, selectedCourse]);

  // Reset dependent fields when course changes
  useEffect(() => {
    setSelectedBranch('');
    setPreviewData(null);
    setExecutionResult(null);
  }, [selectedCourse]);

  // Reset preview if filters change
  useEffect(() => {
    setPreviewData(null);
    setExecutionResult(null);
  }, [selectedDept, selectedBranch]);

  const handlePreview = async () => {
    setExecutionResult(null);
    const scope = {
      ...(selectedDept && { departmentId: selectedDept }),
      ...(selectedCourse && { courseId: selectedCourse }),
      ...(selectedBranch && { branchId: selectedBranch }),
    };

    try {
      const data = await previewMutation.mutateAsync(scope);
      setPreviewData(data);
      showToast(`Promotion preview computed (${data.totalPromote} to promote, ${data.totalGraduate} to graduate).`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to compute promotion preview.', { severity: 'error' });
    }
  };

  const handleExecute = async () => {
    setShowConfirm(false);
    const scope = {
      ...(selectedDept && { departmentId: selectedDept }),
      ...(selectedCourse && { courseId: selectedCourse }),
      ...(selectedBranch && { branchId: selectedBranch }),
    };

    try {
      const result = await executeMutation.mutateAsync(scope);
      setExecutionResult(result);
      setPreviewData(null);
      showToast(`Successfully promoted ${result.promotedCount} and graduated ${result.graduatedCount} students!`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to execute promotion run.', { severity: 'error' });
    }
  };

  const hasEligibleStudents = previewData && (previewData.totalPromote > 0 || previewData.totalGraduate > 0);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, pb: 6 }}>
      {/* ── 1. Hero Header Banner Card (Glassmorphic Luxury Bar) ───────────── */}
      <Card
        sx={{
          p: 3.5,
          borderRadius: '22px',
          border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
          background: isDark
            ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.12) 0%, rgba(184, 134, 62, 0.06) 100%)'
            : 'linear-gradient(135deg, rgba(79, 70, 229, 0.06) 0%, rgba(184, 134, 62, 0.04) 100%)',
          backdropFilter: 'blur(12px)',
          boxShadow: theme.custom?.elevation?.raised || '0 8px 24px rgba(0,0,0,0.03)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2.5,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
            <Chip
              icon={<AutorenewOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
              label="INSTITUTIONAL PROMOTION ENGINE"
              size="small"
              sx={{
                bgcolor: `${theme.palette.primary.main}15`,
                color: theme.palette.primary.main,
                fontFamily: theme.typography.mono?.fontFamily || 'monospace',
                fontWeight: 800,
                fontSize: '0.68rem',
                letterSpacing: '0.06em',
                borderRadius: '8px',
              }}
            />
            {selectedCourse && (
              <Chip
                label={`Course: ${courses?.find((c) => c._id === selectedCourse)?.code || 'Filtered'}`}
                size="small"
                sx={{
                  bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
                  border: `1px solid ${theme.palette.divider}`,
                  fontFamily: theme.typography.mono?.fontFamily || 'monospace',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  borderRadius: '6px',
                }}
              />
            )}
          </Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 800,
              color: 'text.primary',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              mb: 0.5,
            }}
          >
            Bulk Semester &amp; Year Promotion
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              maxWidth: 680,
            }}
          >
            Advance student cohorts college-wide or filter by department, degree course, and specialization branch with automated graduation checks.
          </Typography>
        </Box>
      </Card>

      {/* ── 2. Scope Selector Form ────────────────────────────────────────── */}
      <Card
        sx={{
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '18px',
          boxShadow: 'none',
          bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 3 }}>
            Select Promotion Scope
          </Typography>
          <Grid container spacing={3} alignItems="flex-end">
            <Grid item xs={12} sm={3}>
              <Typography
                component="label"
                htmlFor="dept-scope-input"
                sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}
              >
                Department (Optional)
              </Typography>
              <TextField
                id="dept-scope-input"
                select
                fullWidth
                size="small"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                SelectProps={{ displayEmpty: true }}
              >
                <MenuItem value="">Entire College</MenuItem>
                {depts?.map((d) => (
                  <MenuItem key={d._id} value={d._id}>
                    {d.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={3}>
              <Typography
                component="label"
                htmlFor="course-scope-input"
                sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}
              >
                Course (Optional)
              </Typography>
              <TextField
                id="course-scope-input"
                select
                fullWidth
                size="small"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                SelectProps={{ displayEmpty: true }}
              >
                <MenuItem value="">All Courses</MenuItem>
                {courses?.map((c) => (
                  <MenuItem key={c._id} value={c._id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={3}>
              <Typography
                component="label"
                htmlFor="branch-scope-input"
                sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}
              >
                Specialization Branch (Optional)
              </Typography>
              <TextField
                id="branch-scope-input"
                select
                fullWidth
                size="small"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                disabled={!selectedCourse}
                SelectProps={{ displayEmpty: true }}
              >
                <MenuItem value="">All Branches</MenuItem>
                {filteredBranches.map((b) => (
                  <MenuItem key={b._id} value={b._id}>
                    {b.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={3}>
              <Button
                variant="contained"
                fullWidth
                startIcon={
                  previewMutation.isPending ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <PlayArrowOutlined />
                  )
                }
                onClick={handlePreview}
                disabled={previewMutation.isPending}
                sx={{
                  background: theme.palette.primary.gradient || theme.palette.primary.main,
                  color: '#ffffff',
                  fontWeight: 700,
                  height: '40px',
                  textTransform: 'none',
                  borderRadius: '8px',
                  boxShadow: `0 4px 14px ${theme.palette.primary.main}35`,
                }}
              >
                {previewMutation.isPending ? 'Computing...' : 'Preview Promotion'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Warnings & Alerts */}
      {previewData?.recentWarning && (
        <Alert
          severity="warning"
          icon={<WarningAmberOutlined />}
          sx={{ borderRadius: '12px', border: `1px solid ${theme.palette.warning.light}` }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Accidental Double Promotion Check
          </Typography>
          <Typography variant="body2">{previewData.recentWarning}</Typography>
        </Alert>
      )}

      {/* Execution Success Display */}
      {executionResult && (
        <Card
          sx={{
            border: `1px solid ${theme.palette.signal.success}`,
            bgcolor: 'rgba(16, 185, 129, 0.04)',
            borderRadius: '16px',
            boxShadow: 'none',
          }}
        >
          <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CheckCircleOutlineOutlined sx={{ color: theme.palette.signal.success, fontSize: 36 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.signal.success }}>
                  Promotion Executed Successfully
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  The database has been updated inside an atomic transactional boundary.
                </Typography>
              </Box>
            </Box>

            <Divider />

            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  PROMOTED STUDENTS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, fontFamily: theme.typography.mono.fontFamily, color: theme.palette.primary.main }}>
                  {executionResult.promotedCount}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  GRADUATED STUDENTS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, fontFamily: theme.typography.mono.fontFamily, color: theme.palette.brass?.[500] || '#b8863e' }}>
                  {executionResult.graduatedCount}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  size="small"
                  endIcon={<ArrowForwardOutlined />}
                  onClick={() => navigate('/admin/audit-logs?search=BULK_SEMESTER_PROMOTION')}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Verify in Audit Logs
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Preview Calculations Results */}
      {previewData && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Summary metrics and action button */}
          <Card sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '16px', boxShadow: 'none' }}>
            <CardContent sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ display: 'flex', gap: 6 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    STUDENTS TO PROMOTE
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: theme.typography.mono.fontFamily, color: theme.palette.primary.main }}>
                    {previewData.totalPromote}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    STUDENTS TO GRADUATE
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: theme.typography.mono.fontFamily, color: theme.palette.brass?.[500] || '#b8863e' }}>
                    {previewData.totalGraduate}
                  </Typography>
                </Box>
              </Box>

              <Button
                variant="contained"
                color="error"
                disabled={!hasEligibleStudents || executeMutation.isPending}
                onClick={() => setShowConfirm(true)}
                sx={{
                  fontWeight: 700,
                  textTransform: 'none',
                  px: 3,
                  py: 1,
                  borderRadius: '8px',
                }}
              >
                Execute Promotion Run
              </Button>
            </CardContent>
          </Card>

          {/* Branch-wise breakdown */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
              Outcome Breakdown by Branch
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(previewData.grouped).map(([branch, counts]) => (
                <Grid item xs={12} sm={4} md={3} key={branch}>
                  <Card sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '12px', boxShadow: 'none' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: theme.palette.ink[900] }}>
                        {branch}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">
                          Promote: <strong>{counts.promote}</strong>
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Graduate: <strong>{counts.graduate}</strong>
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              {Object.keys(previewData.grouped).length === 0 && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No branch-specific stats computed.
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>

          {/* Detailed outcome list */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
              Detailed Student Outcomes ({previewData.details.length})
            </Typography>
            <TableContainer component={Paper} sx={{ border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: '12px', maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead sx={{ bgcolor: theme.custom?.surface?.sunken || 'rgba(28, 46, 69, 0.02)' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>STUDENT</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>EMAIL</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>BRANCH</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">CURRENT SEMESTER</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">OUTCOME</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">NEW SEMESTER</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewData.details.map((student, idx) => (
                    <TableRow key={student.studentId || idx} hover>
                      <TableCell sx={{ fontWeight: 600 }}>
                        <Box>{student.name}</Box>
                        {student.rollNumber && (
                          <Typography variant="caption" sx={{ color: theme.palette.primary.main, fontFamily: theme.typography.mono.fontFamily, fontSize: '0.7rem', fontWeight: 700 }}>
                            Roll: {student.rollNumber}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontFamily: theme.typography.mono.fontFamily }}>
                        {student.email}
                      </TableCell>
                      <TableCell>{student.branchName}</TableCell>
                      <TableCell align="center" sx={{ fontFamily: theme.typography.mono.fontFamily }}>
                        {student.currentSemester}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={student.outcome}
                          size="small"
                          color={student.outcome === 'PROMOTE' ? 'primary' : 'warning'}
                          sx={{ fontWeight: 700, fontSize: '0.65rem', height: 20 }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ fontFamily: theme.typography.mono.fontFamily, fontWeight: 700 }}>
                        {student.newSemester ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {previewData.details.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                        No active ongoing students match this scope filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      )}

      {/* Empty Preview State */}
      {previewData && !hasEligibleStudents && (
        <Card sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '16px', py: 6, textAlign: 'center' }}>
          <SchoolOutlined sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.5 }}>
            No Students Found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No active ongoing students match the selected scope filters.
          </Typography>
        </Card>
      )}

      {/* Execution Confirmation Modal */}
      <ConfirmDeleteModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleExecute}
        title="Confirm Bulk Student Promotion"
        description={`You are about to promote ${previewData?.totalPromote} students and graduate ${previewData?.totalGraduate} students. This will batch update student profile attributes. Please double-check your scope filters before execution.`}
        actionText={executeMutation.isPending ? 'Executing...' : 'Confirm Promotion'}
        typedConfirmation={true}
        confirmationWord="PROMOTE"
      />
    </Box>
  );
};

export default BulkPromotion;
