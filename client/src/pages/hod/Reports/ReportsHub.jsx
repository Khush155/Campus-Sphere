import React from 'react';
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Chip,
  Divider,
  useTheme,
  LinearProgress,
  Tooltip,
  Card,
  Button,
  Avatar,
} from '@mui/material';
import {
  School,
  Warning,
  CheckCircle,
  FlightTakeoff,
  HourglassBottom,
  RefreshOutlined,
  PrintOutlined,
  AssessmentOutlined,
  ReportProblemOutlined,
} from '@mui/icons-material';
import { useHodReportsQuery } from '../../../queries/reportQueries';
import WorkloadChart from './WorkloadChart';
import VacantSubjects from './VacantSubjects';

const KpiCard = ({ icon, title, value, subtitle, color = 'primary', children }) => {
  const theme = useTheme();
  const accentColor = theme.palette[color]?.main || theme.palette.primary.main;
  return (
    <Card
      sx={{
        p: 3,
        borderRadius: '16px',
        border: `1px solid ${theme.palette.divider}`,
        borderTop: `4px solid ${accentColor}`,
        boxShadow: 'none',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Avatar
          sx={{
            width: 44,
            height: 44,
            bgcolor: `${accentColor}15`,
            color: accentColor,
          }}
        >
          {icon}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', display: 'block', textTransform: 'uppercase' }}>
            {title}
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 800, color: theme.palette.ink[900], mt: 0.5, fontFamily: theme.typography.mono.fontFamily }}>
            {value ?? '—'}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
      {children && <Box sx={{ mt: 1.5 }}>{children}</Box>}
    </Card>
  );
};

const SlaBar = ({ rate }) => {
  const color = rate >= 80 ? 'success' : rate >= 60 ? 'warning' : 'error';
  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" sx={{ fontWeight: 700 }}>SLA Compliance</Typography>
        <Typography variant="caption" fontWeight={800} color={`${color}.main`}>
          {rate}%
        </Typography>
      </Box>
      <LinearProgress variant="determinate" value={rate} color={color} sx={{ height: 6, borderRadius: 3 }} />
    </Box>
  );
};

export const ReportsHub = () => {
  const theme = useTheme();
  const { data, isLoading, isError, refetch } = useHodReportsQuery();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress size={36} />
      </Box>
    );
  }

  if (isError || !data) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error" sx={{ fontWeight: 700 }}>
          Failed to load department executive reports.
        </Typography>
      </Box>
    );
  }

  const cs = data.complaintSlaStats || {};
  const ls = data.leaveStats || {};
  const ps = data.placementStats || {};
  const ah = data.attendanceHealth || {};

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* ── 1. Hero Identity Header ────────────────────────────────────────── */}
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
                icon={<AssessmentOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="DEPARTMENT EXECUTIVE ANALYTICS & INSTITUTIONAL REPORTING DESK"
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
              Department Analytics & Performance
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              Comprehensive departmental intelligence — faculty teaching workloads, student attendance health, SLA resolution metrics, exam pass rates, and vacant subject allocations.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshOutlined />}
              onClick={() => refetch()}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<PrintOutlined />}
              onClick={() => window.print()}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 700,
                background: theme.palette.primary.gradient || theme.palette.primary.main,
                color: '#ffffff',
              }}
            >
              Print Executive Report
            </Button>
          </Box>
        </Box>
      </Card>

      {/* ── 2. KPI Summary Grid ────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            icon={<Warning sx={{ fontSize: 22 }} />}
            title="At-Risk Students"
            value={ah.atRiskStudentCount ?? '—'}
            subtitle="Attendance < 75% (action required)"
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            icon={<CheckCircle sx={{ fontSize: 22 }} />}
            title="Complaint Resolution"
            value={`${cs.resolutionRate ?? 0}%`}
            subtitle={`${cs.resolved ?? 0} / ${cs.total ?? 0} resolved`}
            color="success"
          >
            <SlaBar rate={cs.slaComplianceRate ?? 0} />
          </KpiCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            icon={<HourglassBottom sx={{ fontSize: 22 }} />}
            title="Leave Turnaround"
            value={ls.avgTurnaroundDays != null ? `${ls.avgTurnaroundDays}d` : '—'}
            subtitle={`Approval rate: ${ls.approvalRate ?? 0}%`}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            icon={<FlightTakeoff sx={{ fontSize: 22 }} />}
            title="Placement Success"
            value={`${ps.selectionRate ?? 0}%`}
            subtitle={`Avg package: ${ps.avgPackageLPA ?? '—'} LPA`}
            color="primary"
          />
        </Grid>
      </Grid>

      {/* ── 3. Complaints Overview & Exam Pass Rates ───────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Avatar sx={{ width: 36, height: 36, bgcolor: `${theme.palette.signal.error}15`, color: theme.palette.signal.error }}>
                <ReportProblemOutlined sx={{ fontSize: 20 }} />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
                Grievance & Service SLA Overview
              </Typography>
            </Box>
            <Divider sx={{ mb: 2.5 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.ink[900] }}>
                  Total Registered Complaints
                </Typography>
                <Chip
                  label={cs.total ?? 0}
                  size="small"
                  color="primary"
                  sx={{ fontWeight: 800, fontFamily: theme.typography.mono.fontFamily }}
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.ink[900] }}>
                  Open Active Cases
                </Typography>
                <Chip
                  label={cs.open ?? 0}
                  size="small"
                  color="warning"
                  sx={{ fontWeight: 800, fontFamily: theme.typography.mono.fontFamily }}
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.ink[900] }}>
                  Critical Priority Complaints
                </Typography>
                <Chip
                  label={cs.critical ?? 0}
                  size="small"
                  color="error"
                  sx={{ fontWeight: 800, fontFamily: theme.typography.mono.fontFamily }}
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.ink[900] }}>
                  SLA Breached Cases
                </Typography>
                <Chip
                  label={cs.slaBreached ?? 0}
                  size="small"
                  color={cs.slaBreached > 0 ? 'error' : 'success'}
                  sx={{ fontWeight: 800, fontFamily: theme.typography.mono.fontFamily }}
                />
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Avatar sx={{ width: 36, height: 36, bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main }}>
                <School sx={{ fontSize: 20 }} />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
                Curriculum Exam Pass Rates
              </Typography>
            </Box>
            <Divider sx={{ mb: 2.5 }} />

            {(data.examPassRates || []).length === 0 ? (
              <Typography color="text.disabled" sx={{ py: 3, textAlign: 'center' }}>
                No exam results published yet.
              </Typography>
            ) : (
              (data.examPassRates || []).slice(0, 5).map((s) => (
                <Box key={s._id} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Tooltip title={`Avg Grade Point: ${s.avgGradePoint} | Needs Remedial: ${s.requiresRemedial}`}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.ink[900] }}>
                        {s.subjectCode || '—'} {s.subjectName ? `(${s.subjectName.slice(0, 24)})` : ''}
                      </Typography>
                    </Tooltip>
                    <Typography variant="caption" sx={{ fontWeight: 800, fontFamily: theme.typography.mono.fontFamily }} color={s.passRate < 60 ? 'error.main' : 'success.main'}>
                      {s.passRate}% Pass
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={s.passRate} color={s.passRate < 60 ? 'error' : 'success'} sx={{ height: 6, borderRadius: 3 }} />
                </Box>
              ))
            )}
          </Card>
        </Grid>
      </Grid>

      {/* ── 4. Workload Distribution & Vacant Subjects ────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={7}>
          <WorkloadChart data={data.workloadDistribution} />
        </Grid>
        <Grid item xs={12} lg={5}>
          <VacantSubjects data={data.vacantSubjects} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReportsHub;
