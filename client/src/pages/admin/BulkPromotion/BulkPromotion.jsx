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

export const BulkPromotion = () => {
  const theme = useTheme();
  const navigate = useNavigate();

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
    } catch (err) {
      // Handled globally / automatically
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
      setPreviewData(null); // Clear preview as it's now completed
    } catch (err) {
      // Handled globally
    }
  };

  const hasEligibleStudents = previewData && (previewData.totalPromote > 0 || previewData.totalGraduate > 0);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, pb: 6 }}>
      {/* Header */}
      <Box sx={{ borderBottom: `1px solid ${theme.custom.border.subtle}`, pb: 2.5 }}>
        <Typography
          variant="h4"
          sx={{
            fontFamily: theme.typography.h1.fontFamily,
            fontWeight: 700,
            color: theme.palette.ink[900],
            mb: 0.5,
          }}
        >
          Bulk Semester & Year Promotion
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Advance student batches college-wide or filter by department, course, and specialization branch.
        </Typography>
      </Box>

      {/* Scope Selector Form */}
      <Card sx={{ border: `1px solid ${theme.custom.border.subtle}`, borderRadius: '16px', boxShadow: 'none' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 3 }}>
            Select Promotion Scope
          </Typography>
          <Grid container spacing={3} alignItems="flex-end">
            <Grid item xs={12} sm={3}>
              <Typography
                component="label"
                sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}
              >
                Department (Optional)
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
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
                sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}
              >
                Course (Optional)
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
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
                sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}
              >
                Specialization Branch (Optional)
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                disabled={!selectedCourse}
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
                  bgcolor: theme.palette.primary.main,
                  color: theme.palette.ink[900],
                  fontWeight: 700,
                  height: '40px',
                  textTransform: 'none',
                  '&:hover': { bgcolor: theme.palette.primary.light },
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
            border: `1px solid ${theme.palette.success.light}`,
            bgcolor: 'rgba(46, 125, 50, 0.02)',
            borderRadius: '16px',
            boxShadow: 'none',
          }}
        >
          <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CheckCircleOutlineOutlined sx={{ color: theme.palette.success.main, fontSize: 36 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                  Promotion Executed Successfully
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  The database has been updated inside a transactional boundary.
                </Typography>
              </Box>
            </Box>

            <Divider />

            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  PROMOTED STUDENTS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, fontFamily: theme.typography.mono.fontFamily }}>
                  {executionResult.promotedCount}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  GRADUATED STUDENTS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, fontFamily: theme.typography.mono.fontFamily }}>
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
          <Card sx={{ border: `1px solid ${theme.custom.border.subtle}`, borderRadius: '16px', boxShadow: 'none' }}>
            <CardContent sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ display: 'flex', gap: 6 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    STUDENTS TO PROMOTE
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: theme.typography.mono.fontFamily }}>
                    {previewData.totalPromote}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    STUDENTS TO GRADUATE
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: theme.typography.mono.fontFamily }}>
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
                  <Card sx={{ border: `1px solid ${theme.custom.border.subtle}`, borderRadius: '12px', boxShadow: 'none' }}>
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
            <TableContainer component={Paper} sx={{ border: `1px solid ${theme.custom.border.subtle}`, boxShadow: 'none', borderRadius: '12px', maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
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
                      <TableCell sx={{ fontWeight: 600 }}>{student.name}</TableCell>
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
        <Card sx={{ border: `1px solid ${theme.custom.border.subtle}`, borderRadius: '16px', py: 6, textAlign: 'center' }}>
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
