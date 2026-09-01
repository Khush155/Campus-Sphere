import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Grid,
  Card,
  useTheme,
  Avatar,
  Divider,
  InputAdornment,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Checkbox,
  ListItemText,
} from '@mui/material';
import {
  AddOutlined,
  BusinessOutlined,
  WorkOutline,
  VerifiedOutlined,
  AssignmentTurnedInOutlined,
  RefreshOutlined,
  FlightTakeoffOutlined,
  SchoolOutlined,
  SearchOutlined,
  TrendingUpOutlined,
  PeopleOutlined,
  AccessTimeOutlined,
  WarningAmberOutlined,
  ChevronRightOutlined,
  HowToRegOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  GradingOutlined,
  EmojiEventsOutlined,
  DeleteOutline,
} from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import EmptyState from '../../../components/common/EmptyState';
import {
  usePlacementsQuery,
  useCreatePlacementsMutation,
  useDeletePlacementDriveMutation,
  usePlacementApplicationsQuery,
  useIssueNocMutation,
  useUpdateApplicationRoundMutation,
  useFinalizeApplicationMutation,
} from '../../../queries/hodQueries';
import { useBranchesQuery } from '../../../queries/collegeQueries';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';

const DRIVE_TYPES = ['PLACEMENT', 'INTERNSHIP'];
const STATUS_COLORS = { UPCOMING: 'warning', ONGOING: 'success', COMPLETED: 'default', CANCELLED: 'error' };

// Generate consistent gradient from a string
const getAvatarGradient = (name = '') => {
  const colors = [
    ['#6366f1', '#8b5cf6'], ['#3b82f6', '#06b6d4'], ['#10b981', '#22c55e'],
    ['#f59e0b', '#ef4444'], ['#ec4899', '#f43f5e'], ['#14b8a6', '#0ea5e9'],
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return `linear-gradient(135deg, ${colors[idx][0]}, ${colors[idx][1]})`;
};

const isDeadlineSoon = (deadline) => {
  if (!deadline) return false;
  const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
  return days >= 0 && days <= 3;
};

const isDeadlinePast = (deadline) => {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
};

const KpiCard = ({ label, value, sublabel, accentColor, icon }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Card
      sx={{
        p: 2.5,
        borderRadius: '18px',
        border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
        borderTop: `4px solid ${accentColor}`,
        bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
        boxShadow: theme.custom?.elevation?.raised || 'none',
        height: '100%',
        transition: 'all 0.25s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: isDark ? '0 12px 28px rgba(0,0,0,0.3)' : '0 12px 28px rgba(0,0,0,0.06)',
          borderColor: accentColor,
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.06em', color: accentColor, textTransform: 'uppercase', fontSize: '0.65rem' }}>
          {label}
        </Typography>
        <Box sx={{ color: accentColor, opacity: 0.7 }}>{icon}</Box>
      </Box>
      <Typography variant="h3" sx={{ fontWeight: 900, color: accentColor, mt: 1, fontFamily: theme.typography.mono?.fontFamily || 'monospace', lineHeight: 1.1 }}>
        {value}
      </Typography>
      {sublabel && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          {sublabel}
        </Typography>
      )}
    </Card>
  );
};

export const HodPlacementsHub = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();
  const deptId = user?.departmentId?._id || user?.departmentId || user?.department?.id || user?.department;

  const [viewMode, setViewMode] = useState('drives'); // 'drives' | 'students'
  const [driveTypeFilter, setDriveTypeFilter] = useState('ALL');
  const [nocFilter, setNocFilter] = useState('ALL'); // 'ALL' | 'ISSUED' | 'PENDING'
  const [search, setSearch] = useState('');
  const [openModal, setOpenModal] = useState(false);

  const currentYear = new Date().getFullYear();
  const { data: allBranches = [] } = useBranchesQuery();
  const deptBranches = useMemo(() => {
    if (!deptId) return allBranches;
    return allBranches.filter((b) => {
      const bDeptId = typeof b.departmentId === 'object' ? b.departmentId?._id || b.departmentId?.id : b.departmentId;
      return !bDeptId || String(bDeptId) === String(deptId);
    });
  }, [allBranches, deptId]);

  const [formData, setFormData] = useState({
    companyName: '',
    role: '',
    packageInfo: '',
    driveDate: '',
    applicationDeadline: '',
    jobDescription: '',
    selectionProcess: '',
    driveType: 'PLACEMENT',
    cgpa: '',
    backlogs: '',
    eligibleStanding: 'FINAL_YEAR',
    graduatingBatchYear: currentYear,
    eligibleBranches: [],
  });

  const { data: drives = [], isLoading: drivesLoading, refetch: refetchDrives } = usePlacementsQuery();
  const { data: allApplications = [], isLoading: appsLoading, refetch: refetchApps } = usePlacementApplicationsQuery({});
  const createMutation = useCreatePlacementsMutation();
  const deleteDriveMutation = useDeletePlacementDriveMutation();
  const issueNocMutation = useIssueNocMutation();
  const updateRoundMutation = useUpdateApplicationRoundMutation();
  const finalizeMutation = useFinalizeApplicationMutation();

  // Delete drive confirm state
  const [driveToDelete, setDriveToDelete] = useState(null);

  // Applicants Desk Dialog State
  const [selectedDriveForApplicants, setSelectedDriveForApplicants] = useState(null);

  // Round modal state
  const [roundModalApp, setRoundModalApp] = useState(null);
  const [roundForm, setRoundForm] = useState({
    round: 1,
    roundName: 'Technical Interview',
    status: 'CLEARED',
    score: '',
    feedback: '',
  });

  // Finalize modal state
  const [finalizeModalApp, setFinalizeModalApp] = useState(null);
  const [finalizeForm, setFinalizeForm] = useState({
    finalStatus: 'SELECTED',
    offerPackageLPA: '',
  });

  const handleRefresh = () => { refetchDrives(); refetchApps(); };

  const handleDeleteDrive = async () => {
    if (!driveToDelete) return;
    try {
      await deleteDriveMutation.mutateAsync(driveToDelete._id || driveToDelete.id);
      showToast(`Drive "${driveToDelete.companyName} – ${driveToDelete.role}" deleted successfully.`);
      setDriveToDelete(null);
      handleRefresh();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete drive.', { severity: 'error' });
    }
  };

  const handleIssueNoc = async (appId, studentName) => {
    try {
      await issueNocMutation.mutateAsync(appId);
      showToast(`NOC issued successfully for ${studentName || 'student'}.`);
      handleRefresh();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to issue NOC', { severity: 'error' });
    }
  };

  const handleOpenRoundModal = (app) => {
    const nextRound = (app.interviewRounds?.length || 0) + 1;
    setRoundModalApp(app);
    setRoundForm({
      round: nextRound,
      roundName: nextRound === 1 ? 'Aptitude Screening' : nextRound === 2 ? 'Technical Round 1' : nextRound === 3 ? 'Technical Round 2' : 'HR Interview',
      status: 'CLEARED',
      score: '',
      feedback: '',
    });
  };

  const handleOpenFinalizeModal = (app) => {
    setFinalizeModalApp(app);
    setFinalizeForm({
      finalStatus: 'SELECTED',
      offerPackageLPA: app.offerPackageLPA || (app.driveId?.packageInfo ? parseFloat(app.driveId.packageInfo) || '' : ''),
    });
  };

  const handleSubmitRound = async (e) => {
    e.preventDefault();
    if (!roundModalApp) return;
    try {
      await updateRoundMutation.mutateAsync({
        appId: roundModalApp._id || roundModalApp.id,
        round: Number(roundForm.round),
        roundName: roundForm.roundName,
        status: roundForm.status,
        score: roundForm.score !== '' ? Number(roundForm.score) : undefined,
        feedback: roundForm.feedback || undefined,
      });
      showToast(`Round ${roundForm.round} (${roundForm.status}) recorded for ${roundModalApp.studentId?.name || 'student'}.`);
      setRoundModalApp(null);
      handleRefresh();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update round', { severity: 'error' });
    }
  };

  const handleSubmitFinalize = async (e) => {
    e.preventDefault();
    if (!finalizeModalApp) return;
    try {
      await finalizeMutation.mutateAsync({
        appId: finalizeModalApp._id || finalizeModalApp.id,
        finalStatus: finalizeForm.finalStatus,
        offerPackageLPA: finalizeForm.offerPackageLPA !== '' ? Number(finalizeForm.offerPackageLPA) : undefined,
      });
      showToast(`Candidate ${finalizeModalApp.studentId?.name || 'student'} marked as ${finalizeForm.finalStatus}!`);
      setFinalizeModalApp(null);
      handleRefresh();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to finalize candidate', { severity: 'error' });
    }
  };

  // Selected applications
  const selectedApplications = useMemo(() => {
    return allApplications.filter((a) => a.finalStatus === 'SELECTED' || a.status === 'SELECTED');
  }, [allApplications]);

  // In-review applications
  const inReviewApplications = useMemo(() => {
    return allApplications.filter((a) => a.status === 'IN_PROCESS' || a.status === 'SHORTLISTED' || a.status === 'APPLIED');
  }, [allApplications]);

  // Filtered drives
  const filteredDrives = useMemo(() => {
    let list = drives;
    if (driveTypeFilter !== 'ALL') list = list.filter((d) => d.driveType === driveTypeFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((d) => d.companyName?.toLowerCase().includes(q) || d.role?.toLowerCase().includes(q));
    }
    return list;
  }, [drives, driveTypeFilter, search]);

  // Filtered placed students
  const filteredStudents = useMemo(() => {
    let list = selectedApplications;
    if (nocFilter === 'ISSUED') list = list.filter((a) => a.isNocIssued);
    if (nocFilter === 'PENDING') list = list.filter((a) => !a.isNocIssued);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.studentId?.name?.toLowerCase().includes(q) || a.driveId?.companyName?.toLowerCase().includes(q));
    }
    return list;
  }, [selectedApplications, nocFilter, search]);

  // KPI Stats
  const totalDrives = drives.length;
  const activeDrives = drives.filter((d) => d.status === 'ONGOING' || d.status === 'UPCOMING').length;
  const totalApplicationsCount = allApplications.length;
  const inReviewCount = inReviewApplications.length;
  const selectedCount = selectedApplications.length;
  const nocIssuedCount = selectedApplications.filter((a) => a.isNocIssued).length;
  const nocConversionRate = selectedCount > 0 ? Math.round((nocIssuedCount / selectedCount) * 100) : 0;

  const driveColumns = [
    {
      id: 'company',
      label: 'Company & Role',
      render: (r) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 38, height: 38, background: getAvatarGradient(r.companyName), fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
            {r.companyName?.charAt(0)?.toUpperCase() || 'C'}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 800, color: theme.palette.ink?.[900] || '#1a1a1a' }}>
              {r.companyName}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <WorkOutline sx={{ fontSize: 12, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">{r.role}</Typography>
            </Box>
          </Box>
        </Box>
      ),
    },
    {
      id: 'driveType',
      label: 'Category',
      render: (r) => (
        <Chip
          label={r.driveType || 'PLACEMENT'}
          size="small"
          color={r.driveType === 'INTERNSHIP' ? 'secondary' : 'primary'}
          variant="outlined"
          sx={{ fontWeight: 800, fontSize: '0.68rem' }}
        />
      ),
    },
    {
      id: 'packageInfo',
      label: 'Package Offer',
      render: (r) => r.packageInfo ? (
        <Chip label={r.packageInfo} size="small" color="success" variant="outlined" sx={{ fontWeight: 800, fontSize: '0.7rem' }} />
      ) : (
        <Typography variant="caption" color="text.disabled">Not Disclosed</Typography>
      ),
    },
    {
      id: 'eligibility',
      label: 'Target & Eligibility',
      render: (r) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            <Chip
              label={
                r.eligibleStanding === 'ALL_YEARS'
                  ? 'All Years'
                  : r.eligibleStanding === 'PRE_FINAL_YEAR'
                  ? `Pre-Final (${r.graduatingBatchYear ? `'${String(r.graduatingBatchYear).slice(2)}` : 'Intern'})`
                  : `Final Year (${r.graduatingBatchYear ? `'${String(r.graduatingBatchYear).slice(2)}` : 'Grad'})`
              }
              size="small"
              color={r.eligibleStanding === 'PRE_FINAL_YEAR' ? 'secondary' : 'primary'}
              sx={{ fontWeight: 800, fontSize: '0.62rem', height: 20 }}
            />
            {r.eligibleBranches && r.eligibleBranches.length > 0 ? (
              <Chip
                label={r.eligibleBranches.map((b) => b.code || b.name).join(', ')}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 700, fontSize: '0.62rem', height: 20 }}
              />
            ) : (
              <Chip
                label="All Dept Branches"
                size="small"
                variant="outlined"
                sx={{ fontWeight: 700, fontSize: '0.62rem', height: 20 }}
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {r.eligibilityCriteria?.cgpa && (
              <Chip label={`CGPA ≥ ${r.eligibilityCriteria.cgpa}`} size="small" sx={{ fontWeight: 700, fontSize: '0.62rem', height: 18 }} />
            )}
            {r.eligibilityCriteria?.backlogs !== undefined && (
              <Chip label={`Backlogs ≤ ${r.eligibilityCriteria.backlogs}`} size="small" color="warning" sx={{ fontWeight: 700, fontSize: '0.62rem', height: 18 }} />
            )}
            {!r.eligibilityCriteria?.cgpa && r.eligibilityCriteria?.backlogs === undefined && (
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Open Cutoff</Typography>
            )}
          </Box>
        </Box>
      ),
    },
    {
      id: 'dates',
      label: 'Timeline',
      render: (r) => {
        const soon = isDeadlineSoon(r.applicationDeadline);
        const past = isDeadlinePast(r.applicationDeadline);
        return (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTimeOutlined sx={{ fontSize: 12, color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {new Date(r.driveDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </Typography>
            </Box>
            {r.applicationDeadline && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                {(soon || past) && <WarningAmberOutlined sx={{ fontSize: 12, color: past ? 'error.main' : 'warning.main' }} />}
                <Typography variant="caption" sx={{ color: past ? 'error.main' : soon ? 'warning.main' : 'text.secondary', fontWeight: soon || past ? 700 : 400 }}>
                  Deadline: {new Date(r.applicationDeadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  {soon && !past ? ' (Soon!)' : past ? ' (Closed)' : ''}
                </Typography>
              </Box>
            )}
          </Box>
        );
      },
    },
    {
      id: 'status',
      label: 'Status',
      render: (r) => (
        <Chip label={r.status || 'UPCOMING'} size="small" color={STATUS_COLORS[r.status] || 'default'} sx={{ fontWeight: 800, fontSize: '0.65rem' }} />
      ),
    },
    {
      id: 'applicants',
      label: 'Candidates Desk',
      render: (r) => {
        const driveApps = allApplications.filter(
          (a) => String(a.driveId?._id || a.driveId?.id || a.driveId) === String(r._id || r.id)
        );
        const selectedInDrive = driveApps.filter(
          (a) => a.finalStatus === 'SELECTED' || a.status === 'SELECTED'
        ).length;

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Button
              size="small"
              variant="contained"
              color="primary"
              startIcon={<PeopleOutlined sx={{ fontSize: 16 }} />}
              onClick={() => setSelectedDriveForApplicants(r)}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.72rem',
                whiteSpace: 'nowrap',
                py: 0.5,
                px: 1.5,
              }}
            >
              {driveApps.length} Applicants {selectedInDrive > 0 ? `(${selectedInDrive} Hired)` : ''}
            </Button>
            <IconButton
              size="small"
              color="error"
              onClick={() => setDriveToDelete(r)}
              title="Delete this drive"
              sx={{ opacity: 0.65, '&:hover': { opacity: 1 } }}
            >
              <DeleteOutline sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        );
      },
    },
  ];

  const studentColumns = [
    {
      id: 'studentName',
      label: 'Selected Student',
      render: (r) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 36, height: 36, background: getAvatarGradient(r.studentId?.name), fontWeight: 800, fontSize: 15 }}>
            {r.studentId?.name?.charAt(0) || 'S'}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 800, color: theme.palette.ink?.[900] || '#1a1a1a' }}>
              {r.studentId?.name || 'Student'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {r.studentId?.email}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'company',
      label: 'Hired By',
      render: (r) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 26, height: 26, background: getAvatarGradient(r.driveId?.companyName), fontSize: 12, fontWeight: 800 }}>
            {r.driveId?.companyName?.charAt(0) || 'C'}
          </Avatar>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>{r.driveId?.companyName || 'N/A'}</Typography>
        </Box>
      ),
    },
    {
      id: 'role',
      label: 'Role & Type',
      render: (r) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>{r.driveId?.role || '—'}</Typography>
          <Chip label={r.driveId?.driveType || 'PLACEMENT'} size="small" variant="outlined" color="primary" sx={{ fontSize: '0.62rem', height: 18, mt: 0.3 }} />
        </Box>
      ),
    },
    {
      id: 'package',
      label: 'Package',
      render: (r) => r.offerPackageLPA ? (
        <Chip label={`${r.offerPackageLPA} LPA`} size="small" color="success" sx={{ fontWeight: 800, fontSize: '0.7rem' }} />
      ) : (
        <Typography variant="caption" color="text.disabled">—</Typography>
      ),
    },
    {
      id: 'nocStatus',
      label: 'NOC Certificate',
      render: (r) => r.isNocIssued ? (
        <Chip
          icon={<VerifiedOutlined sx={{ fontSize: '0.8rem !important' }} />}
          label={`Issued ${new Date(r.nocIssueDate).toLocaleDateString('en-IN')}`}
          color="success"
          size="small"
          sx={{ fontWeight: 800, fontSize: '0.65rem' }}
        />
      ) : (
        <Button
          size="small"
          variant="contained"
          color="primary"
          startIcon={<AssignmentTurnedInOutlined />}
          onClick={() => handleIssueNoc(r._id || r.id, r.studentId?.name)}
          disabled={issueNocMutation.isPending}
          sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 700, fontSize: '0.72rem' }}
        >
          Issue NOC
        </Button>
      ),
    },
  ];

  const handleChange = (e) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      companyName: formData.companyName,
      role: formData.role,
      packageInfo: formData.packageInfo,
      driveDate: formData.driveDate,
      applicationDeadline: formData.applicationDeadline || undefined,
      jobDescription: formData.jobDescription,
      selectionProcess: formData.selectionProcess,
      driveType: formData.driveType,
      eligibleStanding: formData.eligibleStanding,
      graduatingBatchYear: formData.graduatingBatchYear ? Number(formData.graduatingBatchYear) : undefined,
      eligibleBranches: formData.eligibleBranches.length > 0 ? formData.eligibleBranches : undefined,
      eligibilityCriteria: {
        cgpa: formData.cgpa ? parseFloat(formData.cgpa) : undefined,
        backlogs: formData.backlogs !== '' ? parseInt(formData.backlogs) : undefined,
      },
      departmentIds: deptId ? [deptId] : [],
    };
    createMutation.mutate(payload, {
      onSuccess: () => {
        setOpenModal(false);
        showToast(`Placement drive for ${formData.companyName} created!`);
        setFormData({
          companyName: '',
          role: '',
          packageInfo: '',
          driveDate: '',
          applicationDeadline: '',
          jobDescription: '',
          selectionProcess: '',
          driveType: 'PLACEMENT',
          cgpa: '',
          backlogs: '',
          eligibleStanding: 'FINAL_YEAR',
          graduatingBatchYear: currentYear,
          eligibleBranches: [],
        });
        handleRefresh();
      },
      onError: (err) => showToast(err.response?.data?.message || 'Failed to create drive.', { severity: 'error' }),
    });
  };
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* ── 1. Hero Banner ─────────────────────────────────────────────────── */}
      <Card
        sx={{
          p: { xs: 2.5, md: 3.5 },
          borderRadius: '22px',
          border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
          background: isDark
            ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.14) 0%, rgba(184, 134, 62, 0.08) 100%)'
            : 'linear-gradient(135deg, rgba(79, 70, 229, 0.06) 0%, rgba(184, 134, 62, 0.04) 100%)',
          backdropFilter: 'blur(12px)',
          boxShadow: isDark
            ? '0 18px 40px -15px rgba(0,0,0,0.5)'
            : '0 18px 40px -15px rgba(79, 70, 229, 0.08)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Chip
              icon={<FlightTakeoffOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
              label="STUDENT PLACEMENTS, INTERNSHIPS & NOC DESK"
              size="small"
              sx={{ bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main, fontWeight: 800, fontSize: '0.68rem', letterSpacing: '0.05em', mb: 1.5 }}
            />
            <Typography variant="h4" sx={{ fontFamily: theme.typography.h1?.fontFamily, fontWeight: 800, color: theme.palette.ink?.[900] || '#1a1a1a' }}>
              Placements & Capstone Internships
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5, maxWidth: 560 }}>
              Post campus recruitment drives, manage eligibility cutoffs, track selected students, and issue official No Objection Certificates (NOC).
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button variant="outlined" startIcon={<RefreshOutlined />} onClick={handleRefresh} sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}>
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddOutlined />}
              onClick={() => setOpenModal(true)}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, background: theme.palette.primary.gradient || theme.palette.primary.main, color: '#fff' }}
            >
              Post Recruitment Drive
            </Button>
          </Box>
        </Box>
      </Card>

      {/* ── 2. KPI Cards ───────────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        {[
          { label: 'Recruitment Drives', value: totalDrives, sublabel: 'Total drives posted', accentColor: theme.palette.ink?.[700] || '#374151', icon: <BusinessOutlined sx={{ fontSize: 20 }} /> },
          { label: 'Active Recruitments', value: activeDrives, sublabel: 'Ongoing & upcoming', accentColor: theme.palette.success.main, icon: <TrendingUpOutlined sx={{ fontSize: 20 }} /> },
          { label: 'Selected Students', value: selectedCount, sublabel: 'Placed & interning', accentColor: theme.palette.primary.main, icon: <PeopleOutlined sx={{ fontSize: 20 }} /> },
          { label: 'NOC Certificates Issued', value: nocIssuedCount, sublabel: 'Official NOC passes', accentColor: theme.palette.brass?.[500] || '#b8863e', icon: <VerifiedOutlined sx={{ fontSize: 20 }} /> },
        ].map((kpi) => (
          <Grid item xs={12} sm={6} md={3} key={kpi.label}>
            <KpiCard {...kpi} color={kpi.accentColor} />
          </Grid>
        ))}
      </Grid>

      {/* ── 3. Placement & NOC Pipeline Funnel ─────────────────────────────── */}
      <Card
        sx={{
          p: 3,
          borderRadius: '18px',
          border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
          bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
          boxShadow: theme.custom?.elevation?.raised || 'none',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: theme.palette.ink?.[900] || 'text.primary', letterSpacing: '-0.01em' }}>
              Student Placement & NOC Clearance Pipeline
            </Typography>
            <Typography variant="caption" color="text.secondary">
              End-to-end student recruitment stages: from drive applications to company interview rounds, offer selections, and official NOC releases.
            </Typography>
          </Box>
          <Chip
            icon={<VerifiedOutlined sx={{ fontSize: '0.85rem !important' }} />}
            label={`${nocConversionRate}% NOC Clearance Rate`}
            size="small"
            color="success"
            sx={{ fontWeight: 800, fontSize: '0.7rem' }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap' }}>
          {[
            {
              step: '1. Registered Applicants',
              value: totalApplicationsCount,
              desc: 'Total student drive applications',
              color: theme.palette.primary.main,
              icon: <HowToRegOutlined sx={{ fontSize: 18 }} />,
            },
            {
              step: '2. Under Evaluation',
              value: inReviewCount,
              desc: 'In screening & interview rounds',
              color: theme.palette.warning.main,
              icon: <AccessTimeOutlined sx={{ fontSize: 18 }} />,
            },
            {
              step: '3. Offers / Selected',
              value: selectedCount,
              desc: 'Placed candidates & hires',
              color: theme.palette.success.main,
              icon: <CheckCircleOutlined sx={{ fontSize: 18 }} />,
            },
            {
              step: '4. Official NOC Issued',
              value: nocIssuedCount,
              desc: 'Clearance granted for joining',
              color: theme.palette.brass?.[500] || '#b8863e',
              icon: <VerifiedOutlined sx={{ fontSize: 18 }} />,
            },
          ].map((stage, idx) => (
            <React.Fragment key={stage.step}>
              <Box
                sx={{
                  flex: 1,
                  minWidth: 160,
                  p: 2,
                  borderRadius: '12px',
                  bgcolor: `${stage.color}0c`,
                  border: `1px solid ${stage.color}25`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    bgcolor: `${stage.color}18`,
                    color: stage.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {stage.icon}
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: stage.color, fontFamily: theme.typography.mono?.fontFamily || 'monospace', lineHeight: 1.1 }}>
                    {stage.value}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.primary', display: 'block', fontSize: '0.72rem', mt: 0.2 }}>
                    {stage.step}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.64rem' }}>
                    {stage.desc}
                  </Typography>
                </Box>
              </Box>
              {idx < 3 && (
                <Box sx={{ display: { xs: 'none', md: 'flex' }, color: 'text.disabled' }}>
                  <ChevronRightOutlined fontSize="small" />
                </Box>
              )}
            </React.Fragment>
          ))}
        </Box>

        <Box sx={{ mt: 2.5, pt: 2, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            <strong>Active Drives:</strong> {activeDrives} of {totalDrives} recruitment drives currently open for department candidates.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {nocIssuedCount} of {selectedCount} selected students have completed institutional NOC formalities.
          </Typography>
        </Box>
      </Card>

      {/* ── 4. Table with Filters ──────────────────────────────────────────── */}
      <Card sx={{ borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', overflow: 'hidden' }}>
        {/* Toolbar — single row: view toggle | type filter | search */}
        <Box sx={{ px: 3, pt: 2.5, pb: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
            {/* View Toggle */}
            <Box sx={{ display: 'flex', gap: 0.75, flexShrink: 0 }}>
              <Chip
                icon={<BusinessOutlined sx={{ fontSize: '0.9rem !important' }} />}
                label={`Drives (${drives.length})`}
                onClick={() => setViewMode('drives')}
                color={viewMode === 'drives' ? 'primary' : 'default'}
                variant={viewMode === 'drives' ? 'filled' : 'outlined'}
                sx={{ fontWeight: 800, cursor: 'pointer', fontSize: '0.75rem' }}
              />
              <Chip
                icon={<SchoolOutlined sx={{ fontSize: '0.9rem !important' }} />}
                label={`Placed Students (${selectedApplications.length})`}
                onClick={() => setViewMode('students')}
                color={viewMode === 'students' ? 'primary' : 'default'}
                variant={viewMode === 'students' ? 'filled' : 'outlined'}
                sx={{ fontWeight: 800, cursor: 'pointer', fontSize: '0.75rem' }}
              />
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />

            {/* Sub-filter chips — type or NOC */}
            {viewMode === 'drives' && (
              <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', flexWrap: 'wrap' }}>
                {['ALL', 'PLACEMENT', 'INTERNSHIP'].map((t) => (
                  <Chip
                    key={t}
                    label={t}
                    size="small"
                    onClick={() => setDriveTypeFilter(t)}
                    color={driveTypeFilter === t ? 'primary' : 'default'}
                    variant={driveTypeFilter === t ? 'filled' : 'outlined'}
                    sx={{ fontWeight: 700, cursor: 'pointer', fontSize: '0.68rem' }}
                  />
                ))}
              </Box>
            )}
            {viewMode === 'students' && (
              <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', flexWrap: 'wrap' }}>
                {['ALL', 'ISSUED', 'PENDING'].map((n) => (
                  <Chip
                    key={n}
                    label={n}
                    size="small"
                    onClick={() => setNocFilter(n)}
                    color={nocFilter === n ? (n === 'ISSUED' ? 'success' : n === 'PENDING' ? 'warning' : 'primary') : 'default'}
                    variant={nocFilter === n ? 'filled' : 'outlined'}
                    sx={{ fontWeight: 700, cursor: 'pointer', fontSize: '0.68rem' }}
                  />
                ))}
              </Box>
            )}

            {/* Search — pushed to the right */}
            <Box sx={{ ml: 'auto', flexShrink: 0 }}>
              <TextField
                size="small"
                placeholder={viewMode === 'drives' ? 'Search company or role...' : 'Search student or company...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlined sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> }}
                sx={{ minWidth: 240 }}
              />
            </Box>
          </Box>
        </Box>

        {/* Table */}
        <Box sx={{ p: 3 }}>
          {viewMode === 'drives' ? (
            filteredDrives.length === 0 && !drivesLoading ? (
              <EmptyState type="reports" title="No Drives Found" description="No placement drives match the current filters." actionText="Post First Drive" onAction={() => setOpenModal(true)} />
            ) : (
              <DataTable columns={driveColumns} data={filteredDrives} isLoading={drivesLoading} emptyMessage="No placement drives posted yet." />
            )
          ) : (
            filteredStudents.length === 0 && !appsLoading ? (
              <EmptyState type="reports" title="No Students Found" description="No selected students match the current NOC filter." />
            ) : (
              <DataTable columns={studentColumns} data={filteredStudents} isLoading={appsLoading} emptyMessage="No students have been selected yet." />
            )
          )}
        </Box>
      </Card>

      {/* ── 5. Post Drive Modal ───────────────────────────────────────────── */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800, borderBottom: `1px solid ${theme.palette.divider}`, pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: `${theme.palette.primary.main}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FlightTakeoffOutlined sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
            </Box>
            Post Placement / Internship Drive
          </Box>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 3 }}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={8}>
                <TextField label="Company Name" name="companyName" value={formData.companyName} onChange={handleChange} required fullWidth placeholder="e.g. Google, Microsoft, TCS" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField select label="Drive Type" name="driveType" value={formData.driveType} onChange={handleChange} fullWidth>
                  {DRIVE_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField label="Job Role / Designation" name="role" value={formData.role} onChange={handleChange} required fullWidth placeholder="e.g. Software Development Engineer" />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField label="Package Offer" name="packageInfo" value={formData.packageInfo} onChange={handleChange} fullWidth placeholder="e.g. 12 LPA or 30k/mo Stipend" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Selection Process" name="selectionProcess" value={formData.selectionProcess} onChange={handleChange} fullWidth placeholder="Aptitude → Technical → HR" />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField label="Drive Date" name="driveDate" type="date" value={formData.driveDate} onChange={handleChange} required fullWidth InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Application Deadline" name="applicationDeadline" type="date" value={formData.applicationDeadline} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
              </Grid>

              <Grid item xs={12}>
                <Divider><Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>ACADEMIC STANDING & ELIGIBILITY CRITERIA</Typography></Divider>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Eligible Academic Standing"
                  name="eligibleStanding"
                  value={formData.eligibleStanding}
                  onChange={handleChange}
                  fullWidth
                  helperText="Calculated dynamically across any degree duration"
                >
                  <MenuItem value="FINAL_YEAR">Final Year Only (Graduating Batch)</MenuItem>
                  <MenuItem value="PRE_FINAL_YEAR">Pre-Final Year (Summer Internship Batch)</MenuItem>
                  <MenuItem value="ALL_YEARS">All Academic Years (Open)</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Target Graduating Batch Year"
                  name="graduatingBatchYear"
                  type="number"
                  value={formData.graduatingBatchYear}
                  onChange={handleChange}
                  fullWidth
                  placeholder="e.g. 2026"
                  helperText="Class of graduating batch (e.g. 2026)"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="eligible-branches-label">Target Department Branches</InputLabel>
                  <Select
                    labelId="eligible-branches-label"
                    multiple
                    value={formData.eligibleBranches}
                    onChange={(e) => {
                      const val = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
                      setFormData((p) => ({ ...p, eligibleBranches: val }));
                    }}
                    input={<OutlinedInput label="Target Department Branches" />}
                    renderValue={(selected) => {
                      if (selected.length === 0) return 'All Department Branches (Open to all)';
                      return deptBranches
                        .filter((b) => selected.includes(b._id || b.id))
                        .map((b) => b.code || b.name)
                        .join(', ');
                    }}
                  >
                    {deptBranches.map((branch) => {
                      const bId = branch._id || branch.id;
                      return (
                        <MenuItem key={bId} value={bId}>
                          <Checkbox checked={formData.eligibleBranches.indexOf(bId) > -1} />
                          <ListItemText primary={`${branch.name} (${branch.code})`} />
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField label="Min CGPA Cutoff" name="cgpa" type="number" inputProps={{ min: 0, max: 10, step: 0.1 }} value={formData.cgpa} onChange={handleChange} fullWidth helperText="Leave blank for no minimum" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Max Backlogs Allowed" name="backlogs" type="number" inputProps={{ min: 0 }} value={formData.backlogs} onChange={handleChange} fullWidth helperText="Leave blank for no restriction" />
              </Grid>

              <Grid item xs={12}>
                <TextField label="Job Description" name="jobDescription" value={formData.jobDescription} onChange={handleChange} multiline rows={3} fullWidth placeholder="Describe the role, responsibilities, and required skills..." />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
            <Button onClick={() => setOpenModal(false)} variant="outlined" sx={{ borderRadius: '8px' }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending} sx={{ borderRadius: '8px', fontWeight: 700, px: 4 }}>
              {createMutation.isPending ? 'Posting...' : 'Post Recruitment Drive'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── Delete Drive Confirmation Dialog ────────────────────────────────── */}
      <Dialog
        open={Boolean(driveToDelete)}
        onClose={() => setDriveToDelete(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '18px', p: 1 } }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              bgcolor: 'error.lighter',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <DeleteOutline sx={{ color: 'error.main', fontSize: 20 }} />
          </Box>
          Delete Placement Drive
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            You are about to permanently delete:
          </Typography>
          <Box
            sx={{
              p: 1.5,
              borderRadius: '10px',
              bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'),
              border: (t) => `1px solid ${t.palette.divider}`,
              mb: 2,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 800 }}>
              {driveToDelete?.companyName} — {driveToDelete?.role}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {driveToDelete?.driveType} &nbsp;•&nbsp; {driveToDelete && new Date(driveToDelete.driveDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Typography>
          </Box>
          <Typography variant="caption" color="error.main" sx={{ fontWeight: 700 }}>
            ⚠ This will also delete all student applications for this drive. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1.5 }}>
          <Button
            onClick={() => setDriveToDelete(null)}
            variant="outlined"
            sx={{ borderRadius: '8px', fontWeight: 700 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteDrive}
            variant="contained"
            color="error"
            disabled={deleteDriveMutation.isPending}
            startIcon={<DeleteOutline />}
            sx={{ borderRadius: '8px', fontWeight: 800, px: 3 }}
          >
            {deleteDriveMutation.isPending ? 'Deleting…' : 'Delete Drive'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── 6. Candidates Evaluation Desk Dialog ──────────────────────────── */}
      <Dialog
        open={Boolean(selectedDriveForApplicants)}
        onClose={() => setSelectedDriveForApplicants(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: '18px' } }}
      >
        <DialogTitle sx={{ pb: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Drive Candidate Evaluation Desk
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedDriveForApplicants?.companyName} • {selectedDriveForApplicants?.role} ({selectedDriveForApplicants?.driveType})
              </Typography>
            </Box>
            <IconButton onClick={() => setSelectedDriveForApplicants(null)} size="small">
              <CloseOutlined />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {(() => {
            const currentDriveApplicants = allApplications.filter(
              (a) => String(a.driveId?._id || a.driveId?.id || a.driveId) === String(selectedDriveForApplicants?._id || selectedDriveForApplicants?.id)
            );

            if (currentDriveApplicants.length === 0) {
              return (
                <EmptyState
                  title="No Applications Recorded"
                  description="No department students have applied for this recruitment drive yet. When students submit applications through their portal, they will appear here."
                  icon={<PeopleOutlined sx={{ fontSize: 48, color: 'text.secondary' }} />}
                />
              );
            }

            return (
              <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '12px' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem' }}>Student Candidate</TableCell>
                      <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem' }}>Academic Profile</TableCell>
                      <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem' }}>Current Stage</TableCell>
                      <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem' }}>Interview Rounds History</TableCell>
                      <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem' }}>Offer / Outcome</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentDriveApplicants.map((app) => {
                      const isSelected = app.finalStatus === 'SELECTED' || app.status === 'SELECTED';
                      const isRejected = app.finalStatus === 'REJECTED' || app.status === 'REJECTED';

                      return (
                        <TableRow key={app._id || app.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                              <Avatar sx={{ width: 32, height: 32, fontSize: 13, fontWeight: 800, background: getAvatarGradient(app.studentId?.name) }}>
                                {app.studentId?.name?.charAt(0) || 'S'}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                                  {app.studentId?.name || 'Student'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                                  {app.studentId?.rollNumber || app.studentId?.email}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>

                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.75 }}>
                              <Chip
                                label={`CGPA ${app.cgpaAtApplication ?? app.studentId?.cgpa ?? '—'}`}
                                size="small"
                                sx={{ height: 20, fontSize: '0.64rem', fontWeight: 700 }}
                              />
                              <Chip
                                label={`${app.backlogsAtApplication ?? 0} Backlogs`}
                                size="small"
                                color={app.backlogsAtApplication > 0 ? 'warning' : 'default'}
                                sx={{ height: 20, fontSize: '0.64rem', fontWeight: 700 }}
                              />
                            </Box>
                          </TableCell>

                          <TableCell>
                            <Chip
                              label={app.status || 'APPLIED'}
                              size="small"
                              color={isSelected ? 'success' : isRejected ? 'error' : 'primary'}
                              variant="outlined"
                              sx={{ fontWeight: 800, fontSize: '0.65rem', height: 22 }}
                            />
                          </TableCell>

                          <TableCell>
                            {app.interviewRounds && app.interviewRounds.length > 0 ? (
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {app.interviewRounds.map((r, idx) => (
                                  <Chip
                                    key={idx}
                                    label={`R${r.round}: ${r.roundName || 'Round'} (${r.status})`}
                                    size="small"
                                    color={r.status === 'CLEARED' ? 'success' : r.status === 'FAILED' ? 'error' : 'default'}
                                    sx={{ height: 20, fontSize: '0.62rem', fontWeight: 700 }}
                                  />
                                ))}
                              </Box>
                            ) : (
                              <Typography variant="caption" color="text.disabled">No rounds recorded</Typography>
                            )}
                          </TableCell>

                          <TableCell>
                            {isSelected ? (
                              <Chip
                                icon={<EmojiEventsOutlined sx={{ fontSize: '0.75rem !important' }} />}
                                label={`${app.offerPackageLPA ? `${app.offerPackageLPA} LPA` : 'Offer Released'}`}
                                color="success"
                                size="small"
                                sx={{ fontWeight: 800, fontSize: '0.65rem' }}
                              />
                            ) : isRejected ? (
                              <Chip label="Not Selected" color="error" size="small" sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
                            ) : (
                              <Typography variant="caption" color="text.secondary">In Evaluation</Typography>
                            )}
                          </TableCell>

                          <TableCell align="right">
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<GradingOutlined sx={{ fontSize: 15 }} />}
                                onClick={() => handleOpenRoundModal(app)}
                                sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.68rem', py: 0.3 }}
                              >
                                Log Round
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                color={isSelected ? 'success' : 'primary'}
                                startIcon={<CheckCircleOutlined sx={{ fontSize: 15 }} />}
                                onClick={() => handleOpenFinalizeModal(app)}
                                sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.68rem', py: 0.3 }}
                              >
                                Finalize
                              </Button>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            );
          })()}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button onClick={() => setSelectedDriveForApplicants(null)} variant="outlined" sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}>
            Close Desk
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── 7. Record Interview Round Modal ───────────────────────────────── */}
      <Dialog
        open={Boolean(roundModalApp)}
        onClose={() => setRoundModalApp(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            Record Interview Round Result
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Candidate: {roundModalApp?.studentId?.name} ({roundModalApp?.driveId?.companyName})
          </Typography>
        </DialogTitle>
        <form onSubmit={handleSubmitRound}>
          <DialogContent sx={{ pt: 2.5 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Round #"
                  type="number"
                  fullWidth
                  size="small"
                  value={roundForm.round}
                  onChange={(e) => setRoundForm((p) => ({ ...p, round: e.target.value }))}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  label="Round Name"
                  placeholder="e.g. Aptitude, Technical 1, System Design, HR"
                  fullWidth
                  size="small"
                  value={roundForm.roundName}
                  onChange={(e) => setRoundForm((p) => ({ ...p, roundName: e.target.value }))}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Round Outcome"
                  fullWidth
                  size="small"
                  value={roundForm.status}
                  onChange={(e) => setRoundForm((p) => ({ ...p, status: e.target.value }))}
                  required
                >
                  <MenuItem value="CLEARED">CLEARED (Passed)</MenuItem>
                  <MenuItem value="FAILED">FAILED (Rejected)</MenuItem>
                  <MenuItem value="SCHEDULED">SCHEDULED</MenuItem>
                  <MenuItem value="PENDING">PENDING</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Score / Rating (Optional)"
                  type="number"
                  fullWidth
                  size="small"
                  placeholder="e.g. 85"
                  value={roundForm.score}
                  onChange={(e) => setRoundForm((p) => ({ ...p, score: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Evaluation Feedback / Notes"
                  multiline
                  rows={3}
                  fullWidth
                  size="small"
                  placeholder="Interview feedback, areas of strength, weaknesses..."
                  value={roundForm.feedback}
                  onChange={(e) => setRoundForm((p) => ({ ...p, feedback: e.target.value }))}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Button onClick={() => setRoundModalApp(null)} variant="outlined" sx={{ borderRadius: '8px' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={updateRoundMutation.isPending}
              sx={{ borderRadius: '8px', fontWeight: 700, px: 3 }}
            >
              {updateRoundMutation.isPending ? 'Saving...' : 'Save Round Result'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── 8. Finalize Candidate Selection Modal ─────────────────────────── */}
      <Dialog
        open={Boolean(finalizeModalApp)}
        onClose={() => setFinalizeModalApp(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            Finalize Candidate Outcome
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Candidate: {finalizeModalApp?.studentId?.name}
          </Typography>
        </DialogTitle>
        <form onSubmit={handleSubmitFinalize}>
          <DialogContent sx={{ pt: 2.5 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  select
                  label="Final Decision"
                  fullWidth
                  size="small"
                  value={finalizeForm.finalStatus}
                  onChange={(e) => setFinalizeForm((p) => ({ ...p, finalStatus: e.target.value }))}
                  required
                >
                  <MenuItem value="SELECTED">SELECTED (Offer Issued)</MenuItem>
                  <MenuItem value="REJECTED">REJECTED</MenuItem>
                  <MenuItem value="WAITLISTED">WAITLISTED</MenuItem>
                </TextField>
              </Grid>
              {finalizeForm.finalStatus === 'SELECTED' && (
                <Grid item xs={12}>
                  <TextField
                    label="Offer Package (LPA)"
                    type="number"
                    fullWidth
                    size="small"
                    placeholder="e.g. 12.5"
                    value={finalizeForm.offerPackageLPA}
                    onChange={(e) => setFinalizeForm((p) => ({ ...p, offerPackageLPA: e.target.value }))}
                    helperText="Annual package offered in Lakhs Per Annum"
                  />
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Button onClick={() => setFinalizeModalApp(null)} variant="outlined" sx={{ borderRadius: '8px' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color={finalizeForm.finalStatus === 'SELECTED' ? 'success' : 'primary'}
              disabled={finalizeMutation.isPending}
              sx={{ borderRadius: '8px', fontWeight: 700, px: 3 }}
            >
              {finalizeMutation.isPending ? 'Confirming...' : 'Confirm Decision'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default HodPlacementsHub;
