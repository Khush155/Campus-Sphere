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
  CircularProgress,
  Avatar,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  FolderOutlined,
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  SearchOutlined,
  RefreshOutlined,
  CheckCircleOutlined,
  CancelOutlined,
  LockOutlined,
  DescriptionOutlined,
} from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import EmptyState from '../../../components/common/EmptyState';
import ConfirmDeleteModal from '../../../components/common/ConfirmDeleteModal';
import {
  useDocumentsQuery,
  useUpdateDocumentStatusMutation,
} from '../../../queries/hodQueries';
import { useToast } from '../../../contexts/ToastContext';

const VAULT_CATEGORIES = [
  { value: 'SYLLABUS', label: 'Syllabus & Handbooks' },
  { value: 'ACCREDITATION', label: 'Institutional Accreditation' },
  { value: 'MINUTES', label: 'Meeting Minutes' },
  { value: 'MOU', label: 'MOUs & Agreements' },
  { value: 'POLICY', label: 'Department Policies' },
  { value: 'GENERAL', label: 'General Office Records' },
];

const INITIAL_VAULT_FILES = [
  {
    id: 'vault-1',
    title: 'Department Academic Curriculum Handbook 2026',
    category: 'SYLLABUS',
    scope: 'FACULTY & STAFF',
    size: '2.4 MB',
    uploadedAt: '2026-07-15',
    fileName: 'curriculum_handbook_2026.pdf',
  },
  {
    id: 'vault-2',
    title: 'NAAC Accreditation Assessment Report & Evidence',
    category: 'ACCREDITATION',
    scope: 'DEPARTMENT ONLY',
    size: '5.8 MB',
    uploadedAt: '2026-06-20',
    fileName: 'naac_accreditation_report.pdf',
  },
  {
    id: 'vault-3',
    title: 'Department Board of Studies (BOS) Minutes',
    category: 'MINUTES',
    scope: 'FACULTY & STAFF',
    size: '1.1 MB',
    uploadedAt: '2026-07-02',
    fileName: 'bos_meeting_minutes_july.pdf',
  },
];

const KpiCard = ({ title, value, subtitle, accentColor, icon }) => {
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
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
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
          {title}
        </Typography>
        {icon && <Box sx={{ color: accentColor, opacity: 0.8 }}>{icon}</Box>}
      </Box>
      <Typography variant="h3" sx={{ fontWeight: 900, color: accentColor, mt: 1, fontFamily: theme.typography.mono?.fontFamily || 'monospace', lineHeight: 1.1 }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          {subtitle}
        </Typography>
      )}
    </Card>
  );
};

export const HodDocumentsHub = () => {
  const theme = useTheme();
  const { showToast } = useToast();

  const [viewMode, setViewMode] = useState('vault'); // 'vault' | 'requests'

  // Vault Files Local State
  const [vaultFiles, setVaultFiles] = useState(() => {
    const saved = localStorage.getItem('hod_vault_files');
    return saved ? JSON.parse(saved) : INITIAL_VAULT_FILES;
  });

  // Save vault files to localStorage
  const updateVaultFiles = (newFiles) => {
    setVaultFiles(newFiles);
    localStorage.setItem('hod_vault_files', JSON.stringify(newFiles));
  };

  // Upload Vault Modal State
  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [vaultForm, setVaultForm] = useState({
    title: '',
    category: 'SYLLABUS',
    scope: 'DEPARTMENT ONLY',
    description: '',
  });
  const [uploadFile, setUploadFile] = useState(null);
  const [deleteVaultId, setDeleteVaultId] = useState(null);

  // Student Document Request Modals
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [processStatus, setProcessStatus] = useState('APPROVED');
  const [processingNotes, setProcessingNotes] = useState('');
  const [documentRef, setDocumentRef] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Search & Filter
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Queries
  const { data: documentRequests = [], isLoading, isError, refetch } = useDocumentsQuery();
  const updateStatusMutation = useUpdateDocumentStatusMutation();

  const requestsList = useMemo(() => (Array.isArray(documentRequests) ? documentRequests : []), [documentRequests]);
  const pendingRequests = requestsList.filter((r) => r.status === 'PENDING' || r.status === 'UNDER_REVIEW').length;
  const processedRequests = requestsList.filter((r) => r.status === 'PROCESSED' || r.status === 'READY_FOR_PICKUP' || r.status === 'APPROVED').length;
  const slaBreachedCount = requestsList.filter((r) => r.slaBreached).length;

  const filteredVault = useMemo(() => {
    if (!debouncedSearch) return vaultFiles;
    const q = debouncedSearch.toLowerCase();
    return vaultFiles.filter(
      (f) => (f.title?.toLowerCase() || '').includes(q) || (f.category?.toLowerCase() || '').includes(q)
    );
  }, [vaultFiles, debouncedSearch]);

  const filteredRequests = useMemo(() => {
    if (!debouncedSearch) return requestsList;
    const q = debouncedSearch.toLowerCase();
    return requestsList.filter(
      (r) =>
        (r.studentId?.name?.toLowerCase() || '').includes(q) ||
        (r.documentType?.toLowerCase() || '').includes(q) ||
        (r.purpose?.toLowerCase() || '').includes(q)
    );
  }, [requestsList, debouncedSearch]);

  // Vault Upload Submit
  const handleVaultSubmit = (e) => {
    e.preventDefault();
    if (!vaultForm.title) {
      showToast('Please enter a document title.', { severity: 'error' });
      return;
    }

    const newDoc = {
      id: `vault-${Date.now()}`,
      title: vaultForm.title,
      category: vaultForm.category,
      scope: vaultForm.scope,
      size: uploadFile ? `${(uploadFile.size / (1024 * 1024)).toFixed(1)} MB` : '1.2 MB',
      uploadedAt: new Date().toISOString().split('T')[0],
      fileName: uploadFile ? uploadFile.name : `${vaultForm.title.toLowerCase().replace(/\s+/g, '_')}.pdf`,
    };

    updateVaultFiles([newDoc, ...vaultFiles]);
    showToast(`Uploaded document "${newDoc.title}" to secure vault!`);
    setOpenUploadModal(false);
    setVaultForm({ title: '', category: 'SYLLABUS', scope: 'DEPARTMENT ONLY', description: '' });
    setUploadFile(null);
  };

  const handleDeleteVaultConfirm = () => {
    if (!deleteVaultId) return;
    const updated = vaultFiles.filter((f) => f.id !== deleteVaultId);
    updateVaultFiles(updated);
    showToast('Vault document deleted successfully.');
    setDeleteVaultId(null);
  };

  // Student Request Handlers
  const openProcessModal = (doc) => {
    setSelectedDoc(doc);
    setProcessStatus(doc.status === 'PENDING' ? 'APPROVED' : doc.status);
    setProcessingNotes(doc.processingNotes || '');
    setDocumentRef(doc.documentRef || '');
    setProcessModalOpen(true);
  };

  const openRejectModal = (doc) => {
    setSelectedDoc(doc);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const handleProcessSubmit = () => {
    if (!selectedDoc) return;
    updateStatusMutation.mutate(
      {
        id: selectedDoc._id || selectedDoc.id,
        status: processStatus,
        processingNotes,
        documentRef,
      },
      {
        onSuccess: () => {
          showToast(`Student request status updated to ${processStatus}.`);
          setProcessModalOpen(false);
          setSelectedDoc(null);
          refetch();
        },
        onError: (err) => showToast(err.response?.data?.message || 'Failed to update request', { severity: 'error' }),
      }
    );
  };

  const handleRejectSubmit = () => {
    if (!selectedDoc) return;
    if (!rejectionReason) {
      showToast('Please provide a reason for rejecting this document request.', { severity: 'error' });
      return;
    }

    updateStatusMutation.mutate(
      {
        id: selectedDoc._id || selectedDoc.id,
        status: 'REJECTED',
        rejectionReason,
      },
      {
        onSuccess: () => {
          showToast(`Student document request rejected.`);
          setRejectModalOpen(false);
          setSelectedDoc(null);
          refetch();
        },
        onError: (err) => showToast(err.response?.data?.message || 'Failed to reject request', { severity: 'error' }),
      }
    );
  };

  const requestColumns = [
    {
      id: 'student',
      label: 'Student Name & Roll',
      render: (r) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 34, height: 34, bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main, fontWeight: 700 }}>
            {r.studentId?.name?.charAt(0) || 'S'}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
              {r.studentId?.name || 'Student'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {r.studentId?.email || 'N/A'}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'type',
      label: 'Document Certificate',
      render: (r) => (
        <Chip label={r.documentType || 'BONAFIDE'} size="small" color="primary" variant="outlined" sx={{ fontWeight: 800, fontSize: '0.68rem' }} />
      ),
    },
    {
      id: 'purpose',
      label: 'Purpose & Addressed To',
      render: (r) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{r.purpose}</Typography>
          {r.addressedTo && <Typography variant="caption" color="text.secondary">For: {r.addressedTo}</Typography>}
        </Box>
      ),
    },
    {
      id: 'urgency',
      label: 'Urgency & SLA',
      render: (r) => (
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <Chip label={r.urgency || 'NORMAL'} size="small" color={r.urgency === 'URGENT' ? 'error' : 'default'} sx={{ fontWeight: 800, fontSize: '0.62rem' }} />
          {r.slaBreached && <Chip label="SLA BREACHED" size="small" color="error" sx={{ fontWeight: 800, fontSize: '0.62rem' }} />}
        </Box>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      render: (r) => {
        const colors = { PENDING: 'warning', UNDER_REVIEW: 'info', APPROVED: 'primary', PROCESSED: 'success', READY_FOR_PICKUP: 'success', REJECTED: 'error' };
        return <Chip label={r.status || 'PENDING'} size="small" color={colors[r.status] || 'default'} sx={{ fontWeight: 800, fontSize: '0.65rem' }} />;
      },
    },
    {
      id: 'actions',
      label: 'Certificate Actions',
      render: (r) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="contained"
            startIcon={<CheckCircleOutlined />}
            onClick={() => openProcessModal(r)}
            disabled={updateStatusMutation.isPending}
            sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 700, fontSize: '0.72rem' }}
          >
            Process
          </Button>
          {r.status === 'PENDING' && (
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<CancelOutlined />}
              onClick={() => openRejectModal(r)}
              disabled={updateStatusMutation.isPending}
              sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem' }}
            >
              Reject
            </Button>
          )}
        </Box>
      ),
    },
  ];

  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* ── 1. Hero Identity Banner ────────────────────────────────────────── */}
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Chip
                icon={<LockOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="DEPARTMENT SECURE FILE VAULT & STUDENT CERTIFICATE DESK"
                size="small"
                sx={{
                  bgcolor: `${theme.palette.primary.main}15`,
                  color: theme.palette.primary.main,
                  fontWeight: 800,
                  fontFamily: theme.typography.mono?.fontFamily || 'monospace',
                  letterSpacing: '0.05em',
                  fontSize: '0.7rem',
                }}
              />
            </Box>
            <Typography variant="h4" sx={{ fontFamily: theme.typography.h1?.fontFamily, fontWeight: 800, color: theme.palette.ink[900] }}>
              Department Documents & Secure Vault
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              Upload & safely store official department files (Syllabus, Accreditations, MOUs, Policies) and process student certificate requests.
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
              startIcon={<UploadOutlined />}
              onClick={() => setOpenUploadModal(true)}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 700,
                background: theme.palette.primary.gradient || theme.palette.primary.main,
                color: '#ffffff',
              }}
            >
              Upload to Secure Vault
            </Button>
          </Box>
        </Box>
      </Card>

      {/* ── 2. KPI Summary Grid ────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="VAULT SECURED FILES"
            value={vaultFiles.length}
            subtitle="Stored department archives"
            accentColor={theme.palette.ink[900]}
            icon={<FolderOutlined sx={{ fontSize: 20 }} />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="PENDING CERTIFICATES"
            value={isLoading ? <CircularProgress size={24} /> : pendingRequests}
            subtitle="Awaiting HOD verification"
            accentColor={theme.palette.warning.main}
            icon={<DescriptionOutlined sx={{ fontSize: 20 }} />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="PROCESSED CERTIFICATES"
            value={isLoading ? <CircularProgress size={24} /> : processedRequests}
            subtitle="Issued & signed documents"
            accentColor={theme.palette.signal.success}
            icon={<CheckCircleOutlined sx={{ fontSize: 20 }} />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="SLA BREACHED REQUESTS"
            value={isLoading ? <CircularProgress size={24} /> : slaBreachedCount}
            subtitle="Overdue certificate SLA"
            accentColor={theme.palette.signal.error}
            icon={<CancelOutlined sx={{ fontSize: 20 }} />}
          />
        </Grid>
      </Grid>

      {/* ── 3. Mode Switcher & Content ────────────────────────────────────── */}
      <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <TextField
            size="small"
            placeholder={viewMode === 'vault' ? 'Search vault documents by title...' : 'Search student certificate requests...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 260 }}
            InputProps={{
              startAdornment: <SearchOutlined sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} />,
            }}
          />

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, next) => next && setViewMode(next)}
            size="small"
            sx={{ bgcolor: theme.custom?.surface?.sunken || 'rgba(0,0,0,0.03)' }}
          >
            <ToggleButton value="vault">
              <FolderOutlined sx={{ fontSize: 18, mr: 0.5 }} /> Department Secure Vault ({vaultFiles.length})
            </ToggleButton>
            <ToggleButton value="requests">
              <DescriptionOutlined sx={{ fontSize: 18, mr: 0.5 }} /> Student Certificate Requests ({requestsList.length})
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* ── 4. Main Body: Vault Cards vs Certificate Requests ───────────── */}
        {viewMode === 'vault' ? (
          filteredVault.length === 0 ? (
            <EmptyState
              type="reports"
              title="No Documents Stored in Vault"
              description="Upload syllabus handbooks, accreditation reports, or department policies to store them safely."
              actionText="Upload Document"
              onAction={() => setOpenUploadModal(true)}
            />
          ) : (
            <Grid container spacing={2.5}>
              {filteredVault.map((file) => (
                <Grid item xs={12} sm={6} md={4} key={file.id}>
                  <Card
                    sx={{
                      p: 3,
                      borderRadius: '14px',
                      border: `1px solid ${theme.palette.divider}`,
                      boxShadow: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      justify: 'space-between',
                      gap: 2,
                      height: '100%',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                        borderColor: theme.palette.primary.main,
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Avatar
                        sx={{
                          width: 44,
                          height: 44,
                          bgcolor: `${theme.palette.primary.main}15`,
                          color: theme.palette.primary.main,
                        }}
                      >
                        <DescriptionOutlined sx={{ fontSize: 22 }} />
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: theme.palette.ink[900], lineHeight: 1.3 }}>
                          {file.title}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                          <Chip label={file.category} size="small" color="primary" variant="outlined" sx={{ fontWeight: 800, fontSize: '0.62rem', height: 18 }} />
                          <Chip label={file.scope} size="small" sx={{ fontWeight: 700, fontSize: '0.62rem', height: 18 }} />
                        </Box>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: theme.typography.mono.fontFamily }}>
                        {file.size} • {file.uploadedAt}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Download File">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<DownloadOutlined />}
                            onClick={() => {
                              showToast(`Downloading ${file.fileName}...`);
                            }}
                            sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.75rem' }}
                          >
                            Download
                          </Button>
                        </Tooltip>
                        <Tooltip title="Delete Document">
                          <IconButton size="small" color="error" onClick={() => setDeleteVaultId(file.id)}>
                            <DeleteOutlined sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )
        ) : (
          <DataTable columns={requestColumns} data={filteredRequests} isLoading={isLoading} isError={isError} emptyMessage="No student certificate requests found." />
        )}
      </Card>

      {/* ── 5. Upload to Secure Vault Modal ────────────────────────────────── */}
      <Dialog open={openUploadModal} onClose={() => setOpenUploadModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Upload Document to Secure Vault</DialogTitle>
        <form onSubmit={handleVaultSubmit}>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Document Title" value={vaultForm.title} onChange={(e) => setVaultForm({ ...vaultForm, title: e.target.value })} required fullWidth placeholder="e.g. Department Academic Syllabus 2026" />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField select label="Document Category" value={vaultForm.category} onChange={(e) => setVaultForm({ ...vaultForm, category: e.target.value })} required fullWidth>
                  {VAULT_CATEGORIES.map((c) => (
                    <MenuItem key={c.value} value={c.value}>
                      {c.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField select label="Access Security Scope" value={vaultForm.scope} onChange={(e) => setVaultForm({ ...vaultForm, scope: e.target.value })} required fullWidth>
                  <MenuItem value="DEPARTMENT ONLY">DEPARTMENT ONLY</MenuItem>
                  <MenuItem value="FACULTY & STAFF">FACULTY & STAFF</MenuItem>
                  <MenuItem value="PUBLIC ACADEMIC">PUBLIC ACADEMIC</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <Box sx={{ border: `2px dashed ${theme.palette.divider}`, p: 3, borderRadius: '12px', textAlign: 'center', bgcolor: theme.custom?.surface?.sunken || 'rgba(0,0,0,0.02)' }}>
              <input type="file" id="vault-file-input" style={{ display: 'none' }} onChange={(e) => setUploadFile(e.target.files[0] || null)} />
              <label htmlFor="vault-file-input">
                <Button variant="outlined" component="span" startIcon={<UploadOutlined />} sx={{ borderRadius: '8px', fontWeight: 700 }}>
                  Choose PDF / File
                </Button>
              </label>
              <Typography variant="caption" sx={{ display: 'block', mt: 1, fontWeight: 600 }}>
                {uploadFile ? `Selected: ${uploadFile.name}` : 'No file attached yet (Mock PDF generated if blank)'}
              </Typography>
            </Box>

            <TextField label="Optional File Notes / Reference" multiline rows={2} value={vaultForm.description} onChange={(e) => setVaultForm({ ...vaultForm, description: e.target.value })} fullWidth />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpenUploadModal(false)} variant="outlined" sx={{ borderRadius: '8px' }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" sx={{ borderRadius: '8px', fontWeight: 700 }}>
              Save to Secure Vault
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── 6. Process Certificate Request Modal ───────────────────────────── */}
      <Dialog open={processModalOpen} onClose={() => setProcessModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Process Student Certificate Request</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Processing <strong>{selectedDoc?.documentType}</strong> request for <strong>{selectedDoc?.studentId?.name}</strong>.
          </Typography>

          <TextField select fullWidth label="Update Request Status" value={processStatus} onChange={(e) => setProcessStatus(e.target.value)} required>
            <MenuItem value="APPROVED">APPROVED</MenuItem>
            <MenuItem value="PROCESSED">PROCESSED (Signed)</MenuItem>
            <MenuItem value="READY_FOR_PICKUP">READY FOR PICKUP</MenuItem>
          </TextField>

          <TextField
            fullWidth
            label="Signed PDF Document URL / Reference"
            value={documentRef}
            onChange={(e) => setDocumentRef(e.target.value)}
            placeholder="https://campussphere.edu/docs/bonafide_signed_1042.pdf"
            helperText="Link or path to issued PDF certificate."
          />

          <TextField
            fullWidth
            multiline
            rows={2}
            label="Internal HOD Processing Notes"
            value={processingNotes}
            onChange={(e) => setProcessingNotes(e.target.value)}
            placeholder="e.g. Identity and fee clearance verified."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setProcessModalOpen(false)} variant="outlined" sx={{ borderRadius: '8px' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleProcessSubmit}
            disabled={updateStatusMutation.isPending}
            sx={{ borderRadius: '8px', fontWeight: 700 }}
          >
            {updateStatusMutation.isPending ? 'Processing...' : 'Save Certificate Status'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── 7. Reject Request Modal ───────────────────────────────────────── */}
      <Dialog open={rejectModalOpen} onClose={() => setRejectModalOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800, color: theme.palette.signal.error }}>Reject Certificate Request</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to decline this <strong>{selectedDoc?.documentType}</strong> request for <strong>{selectedDoc?.studentId?.name}</strong>?
          </Typography>

          <TextField
            required
            fullWidth
            multiline
            rows={3}
            label="Reason for Rejection"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="e.g. Fee dues pending at accounts desk."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRejectModalOpen(false)} variant="outlined" sx={{ borderRadius: '8px' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleRejectSubmit}
            disabled={updateStatusMutation.isPending}
            sx={{ borderRadius: '8px', fontWeight: 700 }}
          >
            {updateStatusMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Vault Document Modal */}
      {deleteVaultId && (
        <ConfirmDeleteModal
          open={Boolean(deleteVaultId)}
          title="Delete Vault Document"
          content="Are you sure you want to remove this document from the secure vault? This file will be permanently deleted."
          onConfirm={handleDeleteVaultConfirm}
          onClose={() => setDeleteVaultId(null)}
        />
      )}
    </Box>
  );
};

export default HodDocumentsHub;
