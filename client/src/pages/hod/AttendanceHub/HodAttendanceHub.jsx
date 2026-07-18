import React, { useState } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Chip, Alert, Snackbar, Tooltip, LinearProgress,
} from '@mui/material';
import { AddOutlined, WarningAmber, CheckCircle, LocalHospital } from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import {
  useAttendanceQuery,
  useAttendanceSummaryQuery,
  useBulkMarkAttendanceMutation,
  useApproveMedicalLeaveMutation,
} from '../../../queries/hodQueries';

const SESSION_TYPES = ['LECTURE', 'LAB', 'TUTORIAL'];
const AT_RISK_THRESHOLD = 75;

const AttendanceBar = ({ pct }) => {
  const color = pct < AT_RISK_THRESHOLD ? 'error' : pct < 85 ? 'warning' : 'success';
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 140 }}>
      <LinearProgress
        variant="determinate"
        value={Math.min(pct, 100)}
        color={color}
        sx={{ flex: 1, height: 8, borderRadius: 4 }}
      />
      <Typography variant="caption" fontWeight={700} color={`${color}.main`}>
        {pct}%
      </Typography>
    </Box>
  );
};

const HodAttendanceHub = () => {
  const [summarySubjectId, setSummarySubjectId] = useState('');
  const [viewMode, setViewMode] = useState('records'); // 'records' | 'summary'
  const [toast, setToast] = useState({ open: false, msg: '', severity: 'success' });

  const { data: records = [], isLoading: recordsLoading } = useAttendanceQuery();
  const { data: summaryData, isLoading: summaryLoading } = useAttendanceSummaryQuery(summarySubjectId);
  const approveMedical = useApproveMedicalLeaveMutation();

  const showToast = (msg, severity = 'success') => setToast({ open: true, msg, severity });

  const handleApproveMedical = async (id, name) => {
    try {
      await approveMedical.mutateAsync(id);
      showToast(`Medical leave approved for ${name}. Absence excluded from % calculation.`);
    } catch {
      showToast('Failed to approve medical leave.', 'error');
    }
  };

  // Columns for raw records
  const recordColumns = [
    { id: 'studentId', label: 'Student', render: (r) => r.studentId?.name || '—' },
    { id: 'subjectId', label: 'Subject', render: (r) => r.subjectId ? `${r.subjectId.name} (${r.subjectId.code})` : '—' },
    { id: 'sessionType', label: 'Session', render: (r) => <Chip label={r.sessionType || 'LECTURE'} size="small" variant="outlined" /> },
    { id: 'date', label: 'Date', render: (r) => new Date(r.date).toLocaleDateString('en-IN') },
    {
      id: 'status', label: 'Status', render: (r) => {
        const colors = { PRESENT: 'success', ABSENT: 'error', EXCUSED: 'warning', MEDICAL_LEAVE: 'info' };
        return <Chip label={r.status} size="small" color={colors[r.status] || 'default'} />;
      }
    },
    {
      id: 'actions', label: 'Actions', render: (r) =>
        r.status === 'ABSENT' && !r.isMedicalApproved ? (
          <Tooltip title="Approve as Medical Leave — exempts from % calculation">
            <Button
              size="small" variant="outlined" color="info"
              startIcon={<LocalHospital fontSize="small" />}
              onClick={() => handleApproveMedical(r._id, r.studentId?.name)}
            >
              Approve Medical
            </Button>
          </Tooltip>
        ) : r.status === 'MEDICAL_LEAVE' ? (
          <Chip label="Medical Approved" size="small" color="info" icon={<LocalHospital />} />
        ) : null
    },
  ];

  // Columns for summary view
  const summaryColumns = [
    { id: 'name', label: 'Student' },
    { id: 'email', label: 'Email' },
    { id: 'present', label: 'Present', render: (r) => <Typography color="success.main" fontWeight={700}>{r.present}</Typography> },
    { id: 'absent', label: 'Absent', render: (r) => <Typography color="error.main" fontWeight={700}>{r.absent}</Typography> },
    { id: 'medicalLeave', label: 'Medical', render: (r) => <Typography color="info.main">{r.medicalLeave}</Typography> },
    { id: 'total', label: 'Total Classes' },
    { id: 'percentage', label: 'Attendance %', render: (r) => <AttendanceBar pct={r.percentage} /> },
    {
      id: 'isAtRisk', label: 'Status', render: (r) => r.isAtRisk ? (
        <Chip icon={<WarningAmber />} label="AT RISK — Summon" size="small" color="error" />
      ) : (
        <Chip icon={<CheckCircle />} label="Adequate" size="small" color="success" variant="outlined" />
      )
    },
  ];

  const stats = summaryData?.stats || {};

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Attendance Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Track attendance, identify at-risk students (below {AT_RISK_THRESHOLD}%), approve medical leaves.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={viewMode === 'records' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('records')}
          >Raw Records</Button>
          <Button
            variant={viewMode === 'summary' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('summary')}
          >Summary / At-Risk</Button>
        </Box>
      </Box>

      {viewMode === 'summary' && (
        <Box sx={{ mb: 3 }}>
          <TextField
            label="Enter Subject ID to view summary"
            size="small"
            value={summarySubjectId}
            onChange={(e) => setSummarySubjectId(e.target.value)}
            sx={{ width: 340, mr: 2 }}
            placeholder="MongoDB ObjectId of Subject"
          />
          {stats.totalStudents > 0 && (
            <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip label={`Total Students: ${stats.totalStudents}`} color="default" />
              <Chip icon={<WarningAmber />} label={`At-Risk: ${stats.atRiskCount}`} color="error" />
              <Chip label={`Threshold: ${stats.threshold}%`} color="info" variant="outlined" />
            </Box>
          )}
        </Box>
      )}

      {viewMode === 'summary' ? (
        <DataTable
          columns={summaryColumns}
          data={summaryData?.summary || []}
          isLoading={summaryLoading}
          emptyMessage="Enter a Subject ID above to see the attendance summary."
        />
      ) : (
        <DataTable
          columns={recordColumns}
          data={records}
          isLoading={recordsLoading}
          emptyMessage="No attendance records found."
        />
      )}

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast(t => ({ ...t, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={toast.severity} onClose={() => setToast(t => ({ ...t, open: false }))} sx={{ borderRadius: 2 }}>
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default HodAttendanceHub;
