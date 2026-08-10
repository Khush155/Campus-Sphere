import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Chip,
  Button,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Drawer,
  CircularProgress,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Checkbox,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  AccountBalanceWalletOutlined,
  SearchOutlined,
  PrintOutlined,
  RefreshOutlined,
  EditOutlined,
  SchoolOutlined,
  VerifiedOutlined,
  NotificationsOutlined,
  DoneAllOutlined,
} from '@mui/icons-material';
import { useUsersQuery, useUpdateUserMutation } from '../../../queries/userQueries';
import { useDepartmentsQuery } from '../../../queries/collegeQueries';
import { useCollegeProfileQuery } from '../../../queries/collegeProfileQueries';
import { useToast } from '../../../contexts/ToastContext';
import EmptyState from '../../../components/common/EmptyState';

export const FeeClearanceHub = () => {
  const theme = useTheme();
  const { showToast } = useToast();

  // Filters
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected Student for Dues Drawer
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [tuitionDues, setTuitionDues] = useState(0);
  const [hostelDues, setHostelDues] = useState(0);
  const [libraryDues, setLibraryDues] = useState(0);
  const [labDues, setLabDues] = useState(0);
  const [feeStatus, setFeeStatus] = useState('CLEARED');

  // Bulk Selection State
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [isBulkClearing, setIsBulkClearing] = useState(false);

  // Selected Student for No-Dues Pass Preview Modal
  const [clearanceModalUser, setClearanceModalUser] = useState(null);

  // Queries & Mutations
  const { data: studentsData, isLoading: loadingStudents, refetch } = useUsersQuery({
    role: 'STUDENT',
    limit: 200,
  });
  const { data: depts } = useDepartmentsQuery();
  const { data: profile } = useCollegeProfileQuery();
  const updateUserMutation = useUpdateUserMutation();

  const students = studentsData?.data || [];

  // Metrics
  const totalStudents = students.length;
  const clearedCount = students.filter((s) => s.feeStatus === 'CLEARED' || !s.feeStatus).length;
  const pendingCount = students.filter((s) => s.feeStatus === 'PENDING').length;
  const overdueCount = students.filter((s) => s.feeStatus === 'OVERDUE').length;

  // Filtered List
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      search === '' ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.rollNumber && s.rollNumber.toLowerCase().includes(search.toLowerCase()));

    const matchesDept =
      deptFilter === '' || String(s.departmentId?._id || s.departmentId) === String(deptFilter);

    const sStatus = s.feeStatus || 'CLEARED';
    const matchesStatus = statusFilter === '' || sStatus === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  // Bulk Selection Handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedStudentIds(filteredStudents.map((s) => s.id || s._id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkClearDues = async () => {
    if (selectedStudentIds.length === 0) return;
    setIsBulkClearing(true);
    try {
      await Promise.all(
        selectedStudentIds.map((id) =>
          updateUserMutation.mutateAsync({
            id,
            data: {
              feeStatus: 'CLEARED',
              feeDues: { tuition: 0, hostel: 0, library: 0, lab: 0 },
            },
          })
        )
      );
      showToast(`Successfully cleared all outstanding fee dues for ${selectedStudentIds.length} selected student(s).`);
      setSelectedStudentIds([]);
      refetch();
    } catch (err) {
      showToast('Failed to complete bulk clearance.', { severity: 'error' });
    } finally {
      setIsBulkClearing(false);
    }
  };

  const handleSendReminder = (s) => {
    showToast(`Fee due reminder notification sent to ${s.name} (${s.email}).`, { severity: 'info' });
  };

  // Open Edit Dues Drawer
  const handleOpenEditDrawer = (s) => {
    setSelectedStudent(s);
    setTuitionDues(s.feeDues?.tuition || 0);
    setHostelDues(s.feeDues?.hostel || 0);
    setLibraryDues(s.feeDues?.library || 0);
    setLabDues(s.feeDues?.lab || 0);
    setFeeStatus(s.feeStatus || 'CLEARED');
  };

  // Submit Dues Update
  const handleSaveDues = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      await updateUserMutation.mutateAsync({
        id: selectedStudent.id || selectedStudent._id,
        data: {
          feeStatus,
          feeDues: {
            tuition: Number(tuitionDues || 0),
            hostel: Number(hostelDues || 0),
            library: Number(libraryDues || 0),
            lab: Number(labDues || 0),
          },
        },
      });

      showToast(`Updated fee dues and clearance status for ${selectedStudent.name}.`);
      setSelectedStudent(null);
      refetch();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update fee clearance.', {
        severity: 'error',
      });
    }
  };

  // Quick 1-Click Clear All Dues
  const handleQuickClearAll = async (s) => {
    try {
      await updateUserMutation.mutateAsync({
        id: s.id || s._id,
        data: {
          feeStatus: 'CLEARED',
          feeDues: { tuition: 0, hostel: 0, library: 0, lab: 0 },
        },
      });
      showToast(`Cleared all dues for ${s.name}. Issued No-Dues status.`);
      refetch();
    } catch (err) {
      showToast('Failed to clear student dues.', { severity: 'error' });
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* ── 1. Hero Identity Banner ────────────────────────────────────────── */}
      <Card
        sx={{
          p: 3.5,
          borderRadius: '16px',
          border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}0D 0%, ${theme.palette.brass?.[500] || '#b8863e'}0A 100%)`,
          boxShadow: 'none',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Chip
                icon={<AccountBalanceWalletOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="INSTITUTIONAL FINANCIAL & NO-DUES CLEARANCE DESK"
                size="small"
                sx={{
                  bgcolor: `${theme.palette.primary.main}15`,
                  color: theme.palette.primary.main,
                  fontWeight: 800,
                  fontFamily: theme.typography.mono.fontFamily,
                  letterSpacing: '0.05em',
                  fontSize: '0.7rem',
                }}
              />
            </Box>
            <Typography variant="h4" sx={{ fontFamily: theme.typography.h1.fontFamily, fontWeight: 800, color: theme.palette.ink[900] }}>
              Student Fee Dues & Clearance Desk
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              Monitor tuition fees, hostel, library, and lab dues, record payments, and issue official No-Dues Clearance Passes.
            </Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={<RefreshOutlined />}
            onClick={() => refetch()}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
          >
            Refresh Fee Roster
          </Button>
        </Box>
      </Card>

      {/* ── 2. KPI Summary Grid ────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
              ENROLLED STUDENTS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.ink[900], mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {loadingStudents ? <CircularProgress size={24} /> : totalStudents}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Active student accounts
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.signal.success }}>
              100% CLEARED ACCOUNTS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.signal.success, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {loadingStudents ? <CircularProgress size={24} /> : clearedCount}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              No outstanding dues
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.warning.main }}>
              PENDING DUES ACCOUNTS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.warning.main, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {loadingStudents ? <CircularProgress size={24} /> : pendingCount}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Pending fee clearance
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.signal.error }}>
              OVERDUE / BLOCKED ACCOUNTS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.signal.error, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {loadingStudents ? <CircularProgress size={24} /> : overdueCount}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Blocked from certificates/exams
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* ── 3. Filters & Dues Directory Table ─────────────────────────────── */}
      <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by student name, roll no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchOutlined sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} />,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Clearance Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              SelectProps={{ displayEmpty: true }}
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="CLEARED">100% Cleared Only</MenuItem>
              <MenuItem value="PENDING">Pending Dues Only</MenuItem>
              <MenuItem value="OVERDUE">Overdue / Blocked Only</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Department"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              SelectProps={{ displayEmpty: true }}
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="">All Departments</MenuItem>
              {depts?.map((d) => (
                <MenuItem key={d._id} value={d._id}>
                  {d.name} ({d.code})
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>

        {loadingStudents ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : filteredStudents.length === 0 ? (
          <EmptyState
            type="reports"
            title="No Student Fee Records Found"
            description="No student accounts match the active search or fee clearance filter."
            actionText="Reset Filters"
            onAction={() => {
              setSearch('');
              setStatusFilter('');
              setDeptFilter('');
            }}
          />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {selectedStudentIds.length > 0 && (
              <Box
                sx={{
                  p: 1.5,
                  px: 2.5,
                  borderRadius: '10px',
                  bgcolor: `${theme.palette.primary.main}12`,
                  border: `1px solid ${theme.palette.primary.main}30`,
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 2,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.ink[900] }}>
                  {selectedStudentIds.length} student(s) selected for bulk action
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    startIcon={<DoneAllOutlined />}
                    disabled={isBulkClearing}
                    onClick={handleBulkClearDues}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '6px' }}
                  >
                    {isBulkClearing ? 'Clearing Dues...' : 'Clear All Dues for Selected'}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setSelectedStudentIds([])}
                    sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '6px' }}
                  >
                    Deselect All
                  </Button>
                </Box>
              </Box>
            )}

            <TableContainer>
              <Table size="medium">
                <TableHead sx={{ bgcolor: theme.custom?.surface?.sunken || 'rgba(0,0,0,0.02)' }}>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={
                          selectedStudentIds.length > 0 &&
                          selectedStudentIds.length < filteredStudents.length
                        }
                        checked={
                          filteredStudents.length > 0 &&
                          selectedStudentIds.length === filteredStudents.length
                        }
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>STUDENT NAME & ROLL NO</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>BRANCH & SEMESTER</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>OUTSTANDING DUES (₹)</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>FINANCIAL STATUS</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>ACTIONS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStudents.map((s) => {
                    const sId = s.id || s._id;
                    const isSelected = selectedStudentIds.includes(sId);
                    const sStatus = s.feeStatus || 'CLEARED';
                    const duesObj = s.feeDues || { tuition: 0, hostel: 0, library: 0, lab: 0 };
                    const totalOutstanding =
                      (duesObj.tuition || 0) +
                      (duesObj.hostel || 0) +
                      (duesObj.library || 0) +
                      (duesObj.lab || 0);

                    return (
                      <TableRow key={sId} hover selected={isSelected}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleToggleSelect(sId)}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: `${theme.palette.primary.main}18`, color: theme.palette.primary.main, fontSize: '0.85rem', fontWeight: 700 }}>
                              {s.name?.charAt(0) || 'S'}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.ink[900] }}>
                                {s.name}
                              </Typography>
                              <Typography variant="caption" sx={{ fontFamily: theme.typography.mono.fontFamily, color: theme.palette.primary.main, fontWeight: 700 }}>
                                {s.rollNumber ? `Roll: ${s.rollNumber}` : s.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        <TableCell sx={{ fontSize: '0.82rem' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {s.branch || 'General'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: theme.typography.mono.fontFamily }}>
                            Semester {s.semester || 1}
                          </Typography>
                        </TableCell>

                        <TableCell sx={{ fontFamily: theme.typography.mono.fontFamily, fontWeight: 700, fontSize: '0.88rem' }}>
                          {totalOutstanding > 0 ? (
                            <Typography variant="body2" sx={{ fontWeight: 800, color: theme.palette.signal.error }}>
                              ₹{totalOutstanding.toLocaleString('en-IN')}
                            </Typography>
                          ) : (
                            <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.signal.success }}>
                              ₹0 (Fully Paid)
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={sStatus}
                            size="small"
                            color={
                              sStatus === 'CLEARED'
                                ? 'success'
                                : sStatus === 'PENDING'
                                ? 'warning'
                                : 'error'
                            }
                            sx={{ fontWeight: 800, fontSize: '0.65rem', height: 22 }}
                          />
                        </TableCell>

                        <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            {sStatus !== 'CLEARED' && (
                              <>
                                <Tooltip title="Send Fee Due Alert Notification">
                                  <IconButton
                                    size="small"
                                    color="warning"
                                    onClick={() => handleSendReminder(s)}
                                    sx={{ borderRadius: '6px' }}
                                  >
                                    <NotificationsOutlined fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Button
                                  size="small"
                                  variant="text"
                                  color="success"
                                  onClick={() => handleQuickClearAll(s)}
                                  sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.72rem' }}
                                >
                                  Clear Dues
                                </Button>
                              </>
                            )}
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<EditOutlined />}
                              onClick={() => handleOpenEditDrawer(s)}
                              sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.75rem' }}
                            >
                              Update
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              disabled={sStatus !== 'CLEARED'}
                              startIcon={<VerifiedOutlined />}
                              onClick={() => setClearanceModalUser(s)}
                              sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 700, fontSize: '0.75rem' }}
                            >
                              Pass
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Card>

      {/* ── 4. Dues Update Drawer ──────────────────────────────────────────── */}
      <Drawer
        anchor="right"
        open={Boolean(selectedStudent)}
        onClose={() => setSelectedStudent(null)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 440 }, p: 4, bgcolor: theme.palette.background.paper } }}
      >
        {selectedStudent && (
          <Box component="form" onSubmit={handleSaveDues} sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, height: '100%', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography variant="h5" sx={{ fontFamily: theme.typography.h1.fontFamily, fontWeight: 700, color: theme.palette.ink[900], mb: 0.5 }}>
                  Update Fee Dues & Status
                </Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                  Record outstanding fees and manage financial clearance for {selectedStudent.name}.
                </Typography>
              </Box>

              <Card sx={{ p: 2.5, bgcolor: theme.custom?.surface?.sunken || 'rgba(0,0,0,0.02)', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.ink[900] }}>
                  {selectedStudent.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontFamily: theme.typography.mono.fontFamily }}>
                  {selectedStudent.rollNumber ? `Roll No: ${selectedStudent.rollNumber}` : selectedStudent.email}
                </Typography>
              </Card>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography component="label" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, mb: 1 }}>
                    Tuition Dues (₹)
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    size="small"
                    value={tuitionDues}
                    onChange={(e) => setTuitionDues(e.target.value)}
                  />
                </Grid>

                <Grid item xs={6}>
                  <Typography component="label" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, mb: 1 }}>
                    Hostel Dues (₹)
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    size="small"
                    value={hostelDues}
                    onChange={(e) => setHostelDues(e.target.value)}
                  />
                </Grid>

                <Grid item xs={6}>
                  <Typography component="label" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, mb: 1 }}>
                    Library Dues (₹)
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    size="small"
                    value={libraryDues}
                    onChange={(e) => setLibraryDues(e.target.value)}
                  />
                </Grid>

                <Grid item xs={6}>
                  <Typography component="label" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, mb: 1 }}>
                    Laboratory Dues (₹)
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    size="small"
                    value={labDues}
                    onChange={(e) => setLabDues(e.target.value)}
                  />
                </Grid>
              </Grid>

              <Box>
                <Typography component="label" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, mb: 1 }}>
                  Clearance Status
                </Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={feeStatus}
                  onChange={(e) => setFeeStatus(e.target.value)}
                >
                  <MenuItem value="CLEARED">CLEARED (100% Paid / No Dues)</MenuItem>
                  <MenuItem value="PENDING">PENDING (Installment Pending)</MenuItem>
                  <MenuItem value="OVERDUE">OVERDUE (Blocked from Certificates/Exams)</MenuItem>
                </TextField>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" fullWidth onClick={() => setSelectedStudent(null)} sx={{ color: theme.palette.text.secondary }}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={updateUserMutation.isPending}
                sx={{
                  background: theme.palette.primary.gradient || theme.palette.primary.main,
                  color: '#ffffff',
                  fontWeight: 700,
                }}
              >
                {updateUserMutation.isPending ? 'Saving...' : 'Save Dues Record'}
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>

      {/* ── 5. Printable No-Dues Clearance Pass Modal ──────────────────────── */}
      <Dialog
        open={Boolean(clearanceModalUser)}
        onClose={() => setClearanceModalUser(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
      >
        {clearanceModalUser && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
                Official No-Dues Clearance Pass
              </Typography>
            </DialogTitle>
            <DialogContent>
              <Box
                id="printable-no-dues-pass"
                sx={{
                  p: 3.5,
                  borderRadius: '12px',
                  border: `2px double ${theme.palette.brass?.[500] || '#b8863e'}80`,
                  bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
                  textAlign: 'center',
                }}
              >
                <SchoolOutlined sx={{ fontSize: 36, color: theme.palette.primary.main, mb: 1 }} />
                <Typography variant="h6" sx={{ fontFamily: theme.typography.h1.fontFamily, fontWeight: 800, color: theme.palette.ink[900] }}>
                  {profile?.name || 'CAMPUS SPHERE ACADEMY'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  OFFICIAL INSTITUTIONAL FINANCIAL CLEARANCE CERTIFICATE
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Typography variant="body2" sx={{ textAlign: 'left', lineHeight: 1.8, color: theme.palette.ink[900] }}>
                  This is to certify that student <strong>{clearanceModalUser.name}</strong> (Roll No: <strong>{clearanceModalUser.rollNumber || 'N/A'}</strong>) enrolled in <strong>{clearanceModalUser.branch || 'Degree Course'}</strong> has cleared all outstanding institutional dues including Tuition Fees, Library Books Return, Hostel Dues, and Laboratory Balance.
                </Typography>

                <Box sx={{ mt: 3, p: 2, bgcolor: `${theme.palette.signal.success}10`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <VerifiedOutlined sx={{ color: theme.palette.signal.success }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: theme.palette.signal.success }}>
                    FINANCIAL STATUS: 100% CLEARED & ELIGIBLE
                  </Typography>
                </Box>

                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pt: 2 }}>
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                      Date of Issue: {new Date().toLocaleDateString('en-IN')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem', fontFamily: theme.typography.mono.fontFamily }}>
                      Pass ID: PASS-{Math.floor(100000 + Math.random() * 900000)}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, display: 'block' }}>
                      College Administrator
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                      Authorized Registrar Stamp
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5 }}>
              <Button onClick={() => setClearanceModalUser(null)} variant="outlined" sx={{ borderRadius: '8px' }}>
                Close
              </Button>
              <Button onClick={() => window.print()} variant="contained" startIcon={<PrintOutlined />} sx={{ borderRadius: '8px', fontWeight: 700 }}>
                Print Clearance Pass
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default FeeClearanceHub;
