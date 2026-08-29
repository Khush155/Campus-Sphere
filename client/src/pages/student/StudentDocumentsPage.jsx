import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  useTheme,
} from '@mui/material';
import {
  FolderOutlined as FolderIcon,
  AddOutlined as AddIcon,
  VerifiedOutlined as VerifiedIcon,
  HourglassEmptyOutlined as PendingIcon,
  CheckCircleOutlineOutlined as ApprovedIcon,
  CancelOutlined as RejectedIcon,
  DownloadOutlined as DownloadIcon,
  ArticleOutlined as DocIcon,
} from '@mui/icons-material';

import { useMyProfileQuery } from '../../queries/userProfileQueries';
import {
  useStudentDocumentsQuery,
  useRequestDocumentMutation,
} from '../../queries/studentQueries';
import { useToast } from '../../contexts/ToastContext';

const DOCUMENT_TYPES = [
  { value: 'BONAFIDE', label: 'Bonafide Certificate' },
  { value: 'NOC', label: 'No Objection Certificate (NOC)' },
  { value: 'LOR', label: 'Letter of Recommendation (LOR)' },
  { value: 'TRANSCRIPT', label: 'Academic Official Transcript' },
  { value: 'CHARACTER_CERTIFICATE', label: 'Character Certificate' },
  { value: 'MIGRATION_CERTIFICATE', label: 'Migration Certificate' },
  { value: 'PROVISIONAL_CERTIFICATE', label: 'Provisional Degree Certificate' },
];

const getStatusConfig = (status) => {
  switch (status) {
    case 'APPROVED':
    case 'PROCESSED':
      return { label: 'APPROVED', color: 'success', icon: <ApprovedIcon fontSize="small" /> };
    case 'READY_FOR_PICKUP':
      return { label: 'READY FOR PICKUP', color: 'success', icon: <VerifiedIcon fontSize="small" /> };
    case 'UNDER_REVIEW':
      return { label: 'UNDER REVIEW', color: 'info', icon: <PendingIcon fontSize="small" /> };
    case 'REJECTED':
      return { label: 'REJECTED', color: 'error', icon: <RejectedIcon fontSize="small" /> };
    case 'PENDING':
    default:
      return { label: 'PENDING REVIEW', color: 'warning', icon: <PendingIcon fontSize="small" /> };
  }
};

const getDocumentTypeLabel = (type) => {
  const match = DOCUMENT_TYPES.find((d) => d.value === type);
  return match ? match.label : type || 'Certificate Request';
};

export const StudentDocumentsPage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { showToast } = useToast();
  const { data: profile } = useMyProfileQuery();

  const studentMeta = profile?.profileMeta || {};

  const { data: documentsData = [], isLoading } = useStudentDocumentsQuery();
  const requestMutation = useRequestDocumentMutation();

  const documents = Array.isArray(documentsData) ? documentsData : [];

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [documentType, setDocumentType] = useState('BONAFIDE');
  const [purpose, setPurpose] = useState('');
  const [formError, setFormError] = useState('');

  // Summary Metrics
  const totalCount = documents.length;
  const pendingCount = documents.filter((d) => ['PENDING', 'UNDER_REVIEW'].includes(d.status)).length;
  const readyCount = documents.filter((d) => ['APPROVED', 'PROCESSED', 'READY_FOR_PICKUP'].includes(d.status)).length;

  const handleOpenModal = () => {
    setDocumentType('BONAFIDE');
    setPurpose('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmitRequest = (e) => {
    e.preventDefault();
    if (!purpose || purpose.trim().length < 5) {
      setFormError('Please enter a clear purpose (at least 5 characters).');
      return;
    }

    setFormError('');
    requestMutation.mutate(
      { documentType, purpose: purpose.trim() },
      {
        onSuccess: () => {
          showToast('Document request submitted successfully!');
          setIsModalOpen(false);
        },
        onError: (err) => {
          setFormError(err.response?.data?.message || 'Failed to submit document request.');
        },
      }
    );
  };

  const handleDownloadDoc = (docRef) => {
    if (!docRef) return;
    if (docRef.startsWith('http://') || docRef.startsWith('https://')) {
      window.open(docRef, '_blank', 'noopener,noreferrer');
    } else {
      window.open(docRef, '_blank');
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3.5 }}>
      {/* Header Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', mb: 0.5 }}>
            Official Documents & Certificates Desk
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Request official Bonafide, NOC, Character, and Transcript documents for Course{' '}
            <strong>{studentMeta?.course || 'B.Tech'}</strong>.
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenModal}
          sx={{
            borderRadius: '12px',
            px: 3,
            py: 1.25,
            fontWeight: 800,
            textTransform: 'none',
            boxShadow: '0 8px 20px rgba(79, 70, 229, 0.25)',
          }}
        >
          Request New Document
        </Button>
      </Box>

      {/* KPI Cards Row (4 Roster-Style Top-Bordered Cards) */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: '14px',
              border: `1px solid ${theme.palette.divider}`,
              borderTop: '4px solid #4f46e5',
              bgcolor: isDark ? 'background.paper' : '#ffffff',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                Total Requests
              </Typography>
              <Avatar sx={{ bgcolor: 'rgba(79, 70, 229, 0.12)', color: '#4f46e5', width: 40, height: 40, borderRadius: '10px' }}>
                <FolderIcon fontSize="small" />
              </Avatar>
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
                {totalCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Submitted applications
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: '14px',
              border: `1px solid ${theme.palette.divider}`,
              borderTop: '4px solid #10b981',
              bgcolor: isDark ? 'background.paper' : '#ffffff',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                Approved & Issued
              </Typography>
              <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#10b981', width: 40, height: 40, borderRadius: '10px' }}>
                <ApprovedIcon fontSize="small" />
              </Avatar>
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'success.main', fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
                {readyCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Ready for download / pickup
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: '14px',
              border: `1px solid ${theme.palette.divider}`,
              borderTop: '4px solid #f59e0b',
              bgcolor: isDark ? 'background.paper' : '#ffffff',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                Pending Review
              </Typography>
              <Avatar sx={{ bgcolor: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', width: 40, height: 40, borderRadius: '10px' }}>
                <PendingIcon fontSize="small" />
              </Avatar>
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'warning.main', fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
                {pendingCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Dean & HOD verification
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: '14px',
              border: `1px solid ${theme.palette.divider}`,
              borderTop: '4px solid #06b6d4',
              bgcolor: isDark ? 'background.paper' : '#ffffff',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                Standard Turnaround
              </Typography>
              <Avatar sx={{ bgcolor: 'rgba(6, 182, 212, 0.12)', color: '#06b6d4', width: 40, height: 40, borderRadius: '10px' }}>
                <VerifiedIcon fontSize="small" />
              </Avatar>
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
                ~3 Days
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Official institutional SLA
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Requests History Table */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '24px',
          border: `1px solid ${theme.palette.divider}`,
          overflow: 'hidden',
          bgcolor: isDark ? 'background.paper' : '#ffffff',
        }}
      >
        <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
            Submitted Certificate & Document Applications
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>DOCUMENT TYPE & ID</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>STATED PURPOSE</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>REQUEST DATE</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>SLA DEADLINE</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>STATUS</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>ACTION / REMARKS</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, fontWeight: 600 }}>
                    Loading document request history...
                  </TableCell>
                </TableRow>
              ) : documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <DocIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.4, mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
                      No Document Requests Found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Click &quot;Request New Document&quot; above to apply for official certificates online.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((item) => {
                  const statusConfig = getStatusConfig(item.status);
                  const typeLabel = getDocumentTypeLabel(item.documentType);

                  return (
                    <TableRow key={item._id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                          {typeLabel}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Ref: #{String(item._id).slice(-6).toUpperCase()}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ maxWidth: 220 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          {item.purpose}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </TableCell>

                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        {item.slaDeadline ? new Date(item.slaDeadline).toLocaleDateString() : '3 Working Days'}
                      </TableCell>

                      <TableCell>
                        <Chip
                          icon={statusConfig.icon}
                          label={statusConfig.label}
                          color={statusConfig.color}
                          size="small"
                          sx={{ fontWeight: 800, fontSize: '0.72rem' }}
                        />
                      </TableCell>

                      <TableCell>
                        {item.documentRef ? (
                          <Button
                            size="small"
                            variant="outlined"
                            color="success"
                            startIcon={<DownloadIcon />}
                            onClick={() => handleDownloadDoc(item.documentRef)}
                            sx={{ textTransform: 'none', fontWeight: 800, borderRadius: '8px' }}
                          >
                            Download PDF
                          </Button>
                        ) : item.status === 'REJECTED' && item.rejectionReason ? (
                          <Typography variant="caption" color="error.main" sx={{ fontWeight: 700 }}>
                            Reason: {item.rejectionReason}
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            In Processing
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Request New Document Modal */}
      <Dialog open={isModalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth paperProps={{ style: { borderRadius: 20 } }}>
        <form onSubmit={handleSubmitRequest}>
          <DialogTitle sx={{ fontWeight: 800, fontSize: '1.25rem', pb: 1 }}>
            Apply for Official Document / Certificate
          </DialogTitle>

          <DialogContent dividers>
            {formError && (
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: '12px', fontWeight: 600 }}>
                {formError}
              </Alert>
            )}

            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Select Document Type"
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                >
                  {DOCUMENT_TYPES.map((dt) => (
                    <MenuItem key={dt.value} value={dt.value}>
                      {dt.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Purpose of Document / Application Reason"
                  placeholder="e.g. Required for bank education loan processing or internship NOC..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  required
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={handleCloseModal} sx={{ fontWeight: 800, textTransform: 'none', color: 'text.secondary' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={requestMutation.isPending}
              sx={{ fontWeight: 800, textTransform: 'none', borderRadius: '10px', px: 3 }}
            >
              {requestMutation.isPending ? 'Submitting...' : 'Submit Document Request'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default StudentDocumentsPage;
