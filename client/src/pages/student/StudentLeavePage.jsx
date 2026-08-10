import React, { useState, useMemo } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Button,
  Chip,
  Modal,
  TextField,
  MenuItem,
  Divider,
  useTheme,
} from '@mui/material';
import {
  EventNoteOutlined as LeaveIcon,
  AddOutlined as AddIcon,
} from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext';
import { useLeaveQuery, useCreateLeaveMutation } from '../../queries/hodQueries';
import { useToast } from '../../contexts/ToastContext';

export const StudentLeavePage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { user } = useAuth();
  const { showToast } = useToast();

  const [openModal, setOpenModal] = useState(false);
  const [leaveType, setLeaveType] = useState('CASUAL');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');

  const { data: leavesData = [], isLoading } = useLeaveQuery();
  const createMutation = useCreateLeaveMutation();

  const myLeaves = useMemo(() => {
    if (!leavesData) return [];
    const list = Array.isArray(leavesData) ? leavesData : (leavesData.data || []);
    return list.filter((l) => {
      const uId = typeof l.userId === 'object' ? l.userId?._id : l.userId;
      return String(uId) === String(user?.id || user?._id);
    });
  }, [leavesData, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) {
      showToast('Please fill all required fields.', { severity: 'error' });
      return;
    }

    try {
      await createMutation.mutateAsync({
        leaveType,
        startDate,
        endDate,
        reason,
        departmentId: user?.departmentId?._id || user?.departmentId || user?.department,
      });
      showToast('Leave request submitted to HOD successfully!');
      setOpenModal(false);
      setReason('');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit leave request.', { severity: 'error' });
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3.5 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', mb: 0.5 }}>
            Student Leave Applications Desk
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Submit leave requests to your Head of Department (HOD) and track approval status.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenModal(true)}
          sx={{
            borderRadius: '12px',
            px: 3,
            py: 1.25,
            fontWeight: 800,
            textTransform: 'none',
            boxShadow: '0 8px 20px rgba(79, 70, 229, 0.25)',
          }}
        >
          Apply for Leave
        </Button>
      </Box>

      {/* Leave Request List */}
      <Grid container spacing={3}>
        {isLoading ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>Loading leave records...</Paper>
          </Grid>
        ) : myLeaves.length === 0 ? (
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: '24px', border: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700 }}>
                No leave applications submitted yet.
              </Typography>
            </Paper>
          </Grid>
        ) : (
          myLeaves.map((leave) => (
            <Grid item xs={12} md={6} key={leave._id}>
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
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LeaveIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                      {leave.leaveType} LEAVE
                    </Typography>
                  </Box>

                  <Chip
                    label={leave.status}
                    color={leave.status === 'APPROVED' ? 'success' : leave.status === 'REJECTED' ? 'error' : 'warning'}
                    size="small"
                    sx={{ fontWeight: 800 }}
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Reason: &quot;{leave.reason}&quot;
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.5, borderTop: `1px solid ${theme.palette.divider}` }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    Dates: {new Date(leave.startDate).toLocaleDateString()} — {new Date(leave.endDate).toLocaleDateString()}
                  </Typography>

                  {leave.remarks && (
                    <Typography variant="caption" color="primary" sx={{ fontWeight: 700 }}>
                      HOD Remark: {leave.remarks}
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid>
          ))
        )}
      </Grid>

      {/* Modal */}
      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <Paper
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: 480 },
            p: 3.5,
            borderRadius: '24px',
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Apply for Academic Leave
          </Typography>

          <form onSubmit={handleSubmit}>
            <TextField
              select
              fullWidth
              label="Leave Category"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              sx={{ mb: 2 }}
            >
              <MenuItem value="CASUAL">Casual Leave</MenuItem>
              <MenuItem value="SICK">Medical / Sick Leave</MenuItem>
              <MenuItem value="EMERGENCY">Emergency Leave</MenuItem>
              <MenuItem value="ACADEMIC">Academic Event Leave</MenuItem>
            </TextField>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <TextField
                  type="date"
                  fullWidth
                  label="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  type="date"
                  fullWidth
                  label="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              multiline
              rows={3}
              required
              label="Reason for Leave"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              sx={{ mb: 3 }}
            />

            <Divider sx={{ mb: 2.5 }} />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
              <Button onClick={() => setOpenModal(false)} sx={{ textTransform: 'none', fontWeight: 700 }}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" loading={createMutation.isPending} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 800 }}>
                Submit Application
              </Button>
            </Box>
          </form>
        </Paper>
      </Modal>
    </Container>
  );
};

export default StudentLeavePage;
