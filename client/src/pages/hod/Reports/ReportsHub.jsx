/* eslint-disable */
import React from 'react';
import {
  Box, Typography, Grid, CircularProgress, Paper, Chip, Divider,
  useTheme, LinearProgress, Tooltip,
} from '@mui/material';
import {
  People, School, Warning, CheckCircle, BarChart,
  Assignment, FlightTakeoff, HourglassBottom,
} from '@mui/icons-material';
import { useHodReportsQuery } from '../../../queries/reportQueries';
import WorkloadChart from './WorkloadChart';
import VacantSubjects from './VacantSubjects';

const KpiCard = ({ icon, title, value, subtitle, color = 'primary', children }) => {
  const theme = useTheme();
  return (
    <Paper sx={{
      p: 3, borderRadius: 3, height: '100%',
      borderLeft: `4px solid ${theme.palette[color]?.main || theme.palette.primary.main}`,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Box sx={{
          p: 1.2, borderRadius: 2, bgcolor: `${color}.${theme.palette.mode === 'dark' ? 'dark' : 'light'}`,
          color: `${color}.main`, display: 'flex', alignItems: 'center',
        }}>
          {icon}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="overline" color="text.secondary" lineHeight={1}>{title}</Typography>
          <Typography variant="h4" fontWeight={800} color={`${color}.main`}>{value ?? '—'}</Typography>
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Box>
      </Box>
      {children && <Box sx={{ mt: 2 }}>{children}</Box>}
    </Paper>
  );
};

const SlaBar = ({ rate }) => {
  const color = rate >= 80 ? 'success' : rate >= 60 ? 'warning' : 'error';
  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption">SLA Compliance</Typography>
        <Typography variant="caption" fontWeight={700} color={`${color}.main`}>{rate}%</Typography>
      </Box>
      <LinearProgress variant="determinate" value={rate} color={color} sx={{ height: 6, borderRadius: 3 }} />
    </Box>
  );
};

const ReportsHub = () => {
  const theme = useTheme();
  const { data, isLoading, isError } = useHodReportsQuery();

  if (isLoading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
  );
  if (isError || !data) return (
    <Box sx={{ p: 4, textAlign: 'center' }}><Typography color="error">Failed to load reports.</Typography></Box>
  );

  const cs = data.complaintSlaStats || {};
  const ls = data.leaveStats || {};
  const ps = data.placementStats || {};
  const ah = data.attendanceHealth || {};
  const projectStats = data.projectStats || [];

  const projectTotal = projectStats.reduce((s, p) => s + p.count, 0);

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 1, sm: 3 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Department Reports</Typography>
        <Typography variant="body1" color="text.secondary">
          8-KPI enterprise dashboard — workload, attendance health, SLA compliance, placement success, and more.
        </Typography>
      </Box>

      {/* KPI Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard icon={<Warning />} title="At-Risk Students" value={ah.atRiskStudentCount ?? '—'} subtitle="Attendance < 75% (require summon)" color="error" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard icon={<CheckCircle />} title="Complaint Resolution" value={`${cs.resolutionRate ?? 0}%`} subtitle={`${cs.resolved ?? 0} / ${cs.total ?? 0} resolved`} color="success">
            <SlaBar rate={cs.slaComplianceRate ?? 0} />
          </KpiCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard icon={<HourglassBottom />} title="Leave Turnaround" value={ls.avgTurnaroundDays != null ? `${ls.avgTurnaroundDays}d` : '—'} subtitle={`Approval rate: ${ls.approvalRate ?? 0}%`} color="info" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard icon={<FlightTakeoff />} title="Placement Success" value={`${ps.selectionRate ?? 0}%`} subtitle={`Avg package: ${ps.avgPackageLPA ?? '—'} LPA`} color="primary" />
        </Grid>
      </Grid>

      {/* Projects + Complaints breakdown */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Assignment color="primary" />
              <Typography variant="h6" fontWeight={700}>Projects by Status</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {projectStats.length === 0 ? <Typography color="text.disabled">No project data.</Typography> :
              projectStats.map(p => {
                const pct = projectTotal > 0 ? Math.round((p.count / projectTotal) * 100) : 0;
                const colors = { PROPOSED: 'info', APPROVED: 'success', IN_PROGRESS: 'warning', COMPLETED: 'default', REJECTED: 'error' };
                return (
                  <Box key={p._id} sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Chip label={p._id} size="small" color={colors[p._id] || 'default'} sx={{ mb: 0.5 }} />
                      <Typography variant="caption" fontWeight={700}>{p.count}</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={pct} color={colors[p._id] || 'primary'} sx={{ height: 5, borderRadius: 3 }} />
                  </Box>
                );
              })
            }
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Warning color="error" />
              <Typography variant="h6" fontWeight={700}>Complaint Overview</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Total Complaints</Typography>
                <Typography fontWeight={700}>{cs.total ?? 0}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Open</Typography>
                <Chip label={cs.open ?? 0} size="small" color="warning" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Critical Priority</Typography>
                <Chip label={cs.critical ?? 0} size="small" color="error" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">SLA Breached</Typography>
                <Chip label={cs.slaBreached ?? 0} size="small" color={cs.slaBreached > 0 ? 'error' : 'success'} />
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <School color="primary" />
              <Typography variant="h6" fontWeight={700}>Exam Pass Rates</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {(data.examPassRates || []).length === 0 ? <Typography color="text.disabled">No exam results published.</Typography> :
              (data.examPassRates || []).slice(0, 5).map(s => (
                <Box key={s._id} sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Tooltip title={`Avg Grade Point: ${s.avgGradePoint} | Needs Remedial: ${s.requiresRemedial}`}>
                      <Typography variant="caption" fontWeight={600}>{s.subjectCode || '—'} {s.subjectName ? `(${s.subjectName.slice(0, 20)})` : ''}</Typography>
                    </Tooltip>
                    <Typography variant="caption" fontWeight={700} color={s.passRate < 60 ? 'error.main' : 'success.main'}>
                      {s.passRate}%
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={s.passRate} color={s.passRate < 60 ? 'error' : 'success'} sx={{ height: 5, borderRadius: 3 }} />
                </Box>
              ))
            }
          </Paper>
        </Grid>
      </Grid>

      {/* Workload + Vacant */}
      <Grid container spacing={4}>
        <Grid item xs={12} lg={7}><WorkloadChart data={data.workloadDistribution} /></Grid>
        <Grid item xs={12} lg={5}><VacantSubjects data={data.vacantSubjects} /></Grid>
      </Grid>
    </Box>
  );
};

export default ReportsHub;
