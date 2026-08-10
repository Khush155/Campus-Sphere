import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Box,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { FactCheckOutlined } from '@mui/icons-material';
import { useSubjectsQuery } from '../../../queries/collegeQueries';
import { useUsersQuery } from '../../../queries/userQueries';
import { useBulkMarkAttendanceMutation } from '../../../queries/hodQueries';
import { useToast } from '../../../contexts/ToastContext';

export const MarkAttendanceModal = ({ open, onClose, deptId, onSuccess }) => {
  const theme = useTheme();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    subjectId: '',
    date: new Date().toISOString().split('T')[0],
    sessionType: 'LECTURE',
  });

  const [studentStatuses, setStudentStatuses] = useState({});

  const { data: subjects = [] } = useSubjectsQuery(deptId ? { departmentId: deptId } : {});

  const { data: studentsResponse, isLoading: studentsLoading } = useUsersQuery({
    role: 'STUDENT',
    departmentId: deptId,
    limit: 500,
  });

  const students = useMemo(() => {
    if (!studentsResponse) return [];
    return studentsResponse.data || (Array.isArray(studentsResponse) ? studentsResponse : []);
  }, [studentsResponse]);

  const bulkMarkMutation = useBulkMarkAttendanceMutation();

  const handleStatusChange = (studentId, status) => {
    setStudentStatuses((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status) => {
    const next = {};
    students.forEach((s) => {
      next[s._id || s.id] = status;
    });
    setStudentStatuses(next);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.subjectId) {
      showToast('Please select a subject.', { severity: 'error' });
      return;
    }

    const records = students.map((s) => {
      const id = s._id || s.id;
      return {
        studentId: id,
        status: studentStatuses[id] || 'PRESENT',
      };
    });

    bulkMarkMutation.mutate(
      {
        subjectId: formData.subjectId,
        date: formData.date,
        sessionType: formData.sessionType,
        records,
      },
      {
        onSuccess: () => {
          showToast(`Successfully marked attendance for ${records.length} students.`);
          if (onSuccess) onSuccess();
          onClose();
        },
        onError: (err) => {
          showToast(err.response?.data?.message || 'Failed to submit attendance.', { severity: 'error' });
        },
      }
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
      <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
        <FactCheckOutlined color="primary" />
        Mark Session Attendance
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={5}>
              <TextField
                select
                fullWidth
                size="small"
                label="Curriculum Subject"
                value={formData.subjectId}
                onChange={(e) => setFormData((prev) => ({ ...prev, subjectId: e.target.value }))}
                required
              >
                <MenuItem value="">Select Subject</MenuItem>
                {subjects.map((s) => (
                  <MenuItem key={s._id || s.id} value={s._id || s.id}>
                    {s.code ? `${s.code} — ` : ''}{s.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3.5}>
              <TextField
                type="date"
                fullWidth
                size="small"
                label="Session Date"
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={3.5}>
              <TextField
                select
                fullWidth
                size="small"
                label="Session Type"
                value={formData.sessionType}
                onChange={(e) => setFormData((prev) => ({ ...prev, sessionType: e.target.value }))}
                required
              >
                <MenuItem value="LECTURE">Lecture</MenuItem>
                <MenuItem value="LAB">Practical / Lab</MenuItem>
                <MenuItem value="TUTORIAL">Tutorial</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              Student Roster ({students.length} Enrolled)
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" variant="outlined" color="success" onClick={() => handleMarkAll('PRESENT')}>
                Mark All Present
              </Button>
              <Button size="small" variant="outlined" color="error" onClick={() => handleMarkAll('ABSENT')}>
                Mark All Absent
              </Button>
            </Box>
          </Box>

          {studentsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : students.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              No students found in department roster.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: 380, overflowY: 'auto', pr: 1 }}>
              {students.map((s) => {
                const sId = s._id || s.id;
                const status = studentStatuses[sId] || 'PRESENT';

                return (
                  <Box
                    key={sId}
                    sx={{
                      p: 1.5,
                      borderRadius: '12px',
                      border: `1px solid ${theme.palette.divider}`,
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'space-between',
                      flexWrap: 'wrap',
                      gap: 1.5,
                      bgcolor: status === 'PRESENT' ? `${theme.palette.success.main}08` : status === 'ABSENT' ? `${theme.palette.error.main}08` : `${theme.palette.info.main}08`,
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 200 }}>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: theme.palette.ink?.[900] }}>
                        {s.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {s.email} {s.group ? `• Group ${s.group}` : ''}
                      </Typography>
                    </Box>

                    <RadioGroup
                      row
                      value={status}
                      onChange={(e) => handleStatusChange(sId, e.target.value)}
                      sx={{ gap: 1 }}
                    >
                      <FormControlLabel value="PRESENT" control={<Radio size="small" color="success" />} label="Present" />
                      <FormControlLabel value="ABSENT" control={<Radio size="small" color="error" />} label="Absent" />
                      <FormControlLabel value="MEDICAL_LEAVE" control={<Radio size="small" color="info" />} label="Medical" />
                    </RadioGroup>
                  </Box>
                );
              })}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} variant="outlined" sx={{ borderRadius: '8px', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={bulkMarkMutation.isPending} sx={{ borderRadius: '8px', fontWeight: 700 }}>
            {bulkMarkMutation.isPending ? 'Saving...' : 'Submit Session Attendance'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default MarkAttendanceModal;
