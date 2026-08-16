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
  ReportProblemOutlined as ComplaintIcon,
  AddOutlined as AddIcon,
  CheckCircleOutlineOutlined as ResolvedIcon,
  HourglassEmptyOutlined as PendingIcon,
  ErrorOutlineOutlined as OpenIcon,
  TrendingUpOutlined as EscalatedIcon,
} from '@mui/icons-material';

import { useMyProfileQuery } from '../../queries/userProfileQueries';
import {
  useStudentComplaintsQuery,
  useCreateComplaintMutation,
} from '../../queries/studentQueries';

const COMPLAINT_CATEGORIES = [
  { value: 'ACADEMIC', label: 'Academic & Curriculum' },
  { value: 'INFRASTRUCTURE', label: 'Campus Infrastructure & Labs' },
  { value: 'FACULTY_CONDUCT', label: 'Faculty Conduct' },
  { value: 'HARASSMENT', label: 'Harassment & Safety' },
  { value: 'ADMINISTRATIVE', label: 'Administrative & Fees' },
  { value: 'OTHER', label: 'Other General Grievance' },
];

const getStatusConfig = (status) => {
  switch (status) {
    case 'RESOLVED':
    case 'CLOSED':
      return { label: status, color: 'success', icon: <ResolvedIcon fontSize="small" /> };
    case 'UNDER_REVIEW':
    case 'IN_PROGRESS':
      return { label: status.replace('_', ' '), color: 'info', icon: <PendingIcon fontSize="small" /> };
    case 'ESCALATED':
      return { label: 'ESCALATED', color: 'error', icon: <EscalatedIcon fontSize="small" /> };
    case 'OPEN':
    default:
      return { label: 'OPEN', color: 'warning', icon: <OpenIcon fontSize="small" /> };
  }
};

const getCategoryLabel = (cat) => {
  const match = COMPLAINT_CATEGORIES.find((c) => c.value === cat);
  return match ? match.label : cat || 'General';
};

export const StudentComplaintsPage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { data: profile } = useMyProfileQuery();

  const studentMeta = profile?.profileMeta || {};

  const { data: complaintsData = [], isLoading } = useStudentComplaintsQuery();
  const createMutation = useCreateComplaintMutation();

  const complaints = Array.isArray(complaintsData) ? complaintsData : [];

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [category, setCategory] = useState('ACADEMIC');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  // Summary Metrics
  const totalCount = complaints.length;
  const openCount = complaints.filter((c) => ['OPEN', 'UNDER_REVIEW', 'IN_PROGRESS', 'ESCALATED'].includes(c.status)).length;
  const resolvedCount = complaints.filter((c) => ['RESOLVED', 'CLOSED'].includes(c.status)).length;

  const handleOpenModal = () => {
    setCategory('ACADEMIC');
    setTitle('');
    setDescription('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmitComplaint = (e) => {
    e.preventDefault();
    if (!title || title.trim().length < 5) {
      setFormError('Subject title must be at least 5 characters long.');
      return;
    }
    if (!description || description.trim().length < 10) {
      setFormError('Please provide a detailed description (at least 10 characters).');
      return;
    }

    setFormError('');
    createMutation.mutate(
      {
        category,
        title: title.trim(),
        description: description.trim(),
      },
      {
        onSuccess: () => {
          setIsModalOpen(false);
        },
        onError: (err) => {
          setFormError(err.response?.data?.message || 'Failed to lodge complaint.');
        },
      }
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3.5 }}>
      {/* Header Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', mb: 0.5 }}>
            Student Grievance & Complaint Redressal Desk
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Lodge academic, infrastructure, or conduct issues directly to department HOD & administration for Course{' '}
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
          Lodge New Complaint
        </Button>
      </Box>

      {/* KPI Cards Row */}
      <Grid container spacing={3} sx={{ mb: 3.5 }}>
        <Grid item xs={12} sm={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '20px',
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: isDark ? 'background.paper' : '#ffffff',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main, width: 48, height: 48 }}>
                <ComplaintIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  SUBMITTED GRIEVANCES
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  {totalCount}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '20px',
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: isDark ? 'background.paper' : '#ffffff',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: `${theme.palette.warning.main}15`, color: theme.palette.warning.main, width: 48, height: 48 }}>
                <PendingIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  ACTIVE / IN-REVIEW
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'warning.main' }}>
                  {openCount}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '20px',
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: isDark ? 'background.paper' : '#ffffff',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: `${theme.palette.success.main}15`, color: theme.palette.success.main, width: 48, height: 48 }}>
                <ResolvedIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  RESOLVED COMPLAINTS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'success.main' }}>
                  {resolvedCount}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Complaints History Table */}
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
            Submitted Complaints History & Redressal Status
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>COMPLAINT ID & CATEGORY</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>SUBJECT / TITLE</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>SUBMISSION DATE</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>STATUS</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>ADMIN / HOD RESPONSE</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, fontWeight: 600 }}>
                    Loading grievance records...
                  </TableCell>
                </TableRow>
              ) : complaints.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <ComplaintIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.4, mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
                      No Grievances Submitted
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Click &quot;Lodge New Complaint&quot; above to report an academic or campus issue.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                complaints.map((item) => {
                  const statusConfig = getStatusConfig(item.status);
                  const categoryLabel = getCategoryLabel(item.category);

                  const lastNote =
                    item.resolutionRemarks ||
                    (item.statusHistory && item.statusHistory.length > 0
                      ? item.statusHistory[item.statusHistory.length - 1].note
                      : null);

                  return (
                    <TableRow key={item._id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                          {categoryLabel}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Ref: #{String(item._id).slice(-6).toUpperCase()}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ maxWidth: 280 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                          {item.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {item.description}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        {new Date(item.createdAt).toLocaleDateString()}
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

                      <TableCell sx={{ maxWidth: 220 }}>
                        {lastNote ? (
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {lastNote}
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            Awaiting investigation
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

      {/* Lodge New Complaint Modal */}
      <Dialog open={isModalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth paperProps={{ style: { borderRadius: 20 } }}>
        <form onSubmit={handleSubmitComplaint}>
          <DialogTitle sx={{ fontWeight: 800, fontSize: '1.25rem', pb: 1 }}>
            Lodge Student Grievance / Complaint
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
                  label="Complaint Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                >
                  {COMPLAINT_CATEGORIES.map((cat) => (
                    <MenuItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Subject / Title"
                  placeholder="Brief summary of the issue (min 5 characters)..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Detailed Complaint Description"
                  placeholder="Explain the grievance clearly with relevant dates, subject names, or locations (min 10 characters)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
              disabled={createMutation.isPending}
              sx={{ fontWeight: 800, textTransform: 'none', borderRadius: '10px', px: 3 }}
            >
              {createMutation.isPending ? 'Submitting...' : 'Lodge Grievance'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default StudentComplaintsPage;
