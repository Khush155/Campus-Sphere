import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Button,
  Skeleton,
  useTheme,
} from '@mui/material';
import {
  ReceiptLongOutlined as FeeIcon,
  CheckCircleOutlineOutlined as VerifiedIcon,
  DownloadOutlined as DownloadIcon,
  VisibilityOutlined as ViewIcon,
  PrintOutlined as PrintIcon,
} from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext';
import { useMyProfileQuery } from '../../queries/userProfileQueries';
import { useStudentFeeReceiptsQuery } from '../../queries/studentQueries';

export const StudentFeesPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === 'dark';
  const { user: authUser } = useAuth();
  const { data: profile, isLoading } = useMyProfileQuery();
  const { data: receipts = [], isLoading: isReceiptsLoading } = useStudentFeeReceiptsQuery();

  const currentUser = profile?.user || authUser;
  const studentMeta = profile?.profileMeta || {};

  const feeStatus = currentUser?.feeStatus || 'CLEARED';
  const feeDues = currentUser?.feeDues || { tuition: 0, hostel: 0, library: 0, lab: 0 };
  const noDuesIssuedAt = currentUser?.noDuesIssuedAt;

  const totalDues =
    Number(feeDues.tuition || 0) +
    Number(feeDues.hostel || 0) +
    Number(feeDues.library || 0) +
    Number(feeDues.lab || 0);

  const clearanceLabel =
    feeStatus === 'OVERDUE'
      ? 'FEE OVERDUE'
      : feeStatus === 'PENDING' || totalDues > 0
      ? 'PAYMENT PENDING'
      : 'ALL DUES CLEARED';

  const clearanceColor =
    totalDues > 0 ? (feeStatus === 'OVERDUE' ? 'error' : 'warning') : 'success';

  const totalPaidAmount = Math.max(0, 63000 - totalDues);

  const baseFeeStructure = [
    { key: 'tuition', head: 'Semester Tuition Fee', baseAmount: 45000 },
    { key: 'lab', head: 'Laboratory & Computer Facility Fee', baseAmount: 8500 },
    { key: 'library', head: 'Library & Learning Resources Fee', baseAmount: 3000 },
    { key: 'hostel', head: 'Hostel & Residential Accommodation Fee', baseAmount: 6500 },
  ];

  const feeItems = baseFeeStructure.map((item) => {
    const due = Number(feeDues[item.key] || 0);
    const isPaid = due === 0;
    const status = isPaid ? 'PAID' : feeStatus === 'OVERDUE' ? 'OVERDUE' : 'PENDING';
    const statusColor = isPaid ? 'success' : status === 'OVERDUE' ? 'error' : 'warning';
    const date = isPaid
      ? noDuesIssuedAt
        ? new Date(noDuesIssuedAt).toLocaleDateString()
        : '2026-07-15'
      : 'Due Now';
    const amount = isPaid ? `₹ ${item.baseAmount.toLocaleString('en-IN')}` : `₹ ${due.toLocaleString('en-IN')} (Due)`;
    return { head: item.head, amount, status, statusColor, date };
  });

  return (
    <Container maxWidth="xl" sx={{ py: 3.5 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', mb: 0.5 }}>
            Institutional Fee Dues & Receipts Statement
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Official fee clearance status for Course <strong>{studentMeta?.course || 'B.Tech'}</strong> (Sem{' '}
            {currentUser?.semester || studentMeta?.semester || 1}).
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={() => {
            if (receipts && receipts.length > 0 && receipts[0].receiptId) {
              navigate(`/student/fees/receipt/${receipts[0].receiptId}`);
            } else {
              window.print();
            }
          }}
          sx={{
            borderRadius: '12px',
            px: 3,
            py: 1.25,
            fontWeight: 800,
            textTransform: 'none',
            boxShadow: '0 8px 20px rgba(79, 70, 229, 0.25)',
          }}
        >
          Download Fee Receipt
        </Button>
      </Box>

      {/* KPI Cards (4 Roster-Style Top-Bordered Cards) */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
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
                Clearance Status
              </Typography>
              <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#10b981', width: 40, height: 40, borderRadius: '10px' }}>
                <VerifiedIcon fontSize="small" />
              </Avatar>
            </Box>
            <Box>
              <Chip label={clearanceLabel} color={clearanceColor} sx={{ fontWeight: 800, borderRadius: '6px' }} />
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.75 }}>
                {totalDues === 0 ? 'No pending dues on record' : 'Payment required'}
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
                Total Fees Paid
              </Typography>
              <Avatar sx={{ bgcolor: 'rgba(79, 70, 229, 0.12)', color: '#4f46e5', width: 40, height: 40, borderRadius: '10px' }}>
                <FeeIcon fontSize="small" />
              </Avatar>
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
                ₹ {totalPaidAmount.toLocaleString('en-IN')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Cumulative settled installments
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
              borderTop: totalDues > 0 ? '4px solid #ef4444' : '4px solid #06b6d4',
              bgcolor: isDark ? 'background.paper' : '#ffffff',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                Outstanding Dues
              </Typography>
              <Avatar
                sx={{
                  bgcolor: totalDues > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(6, 182, 212, 0.12)',
                  color: totalDues > 0 ? '#ef4444' : '#06b6d4',
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                }}
              >
                <FeeIcon fontSize="small" />
              </Avatar>
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: totalDues > 0 ? 'error.main' : 'success.main', fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
                ₹ {totalDues.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {totalDues > 0 ? 'Due for clearance' : 'Full balance cleared'}
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
                Issued Receipts
              </Typography>
              <Avatar sx={{ bgcolor: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', width: 40, height: 40, borderRadius: '10px' }}>
                <FeeIcon fontSize="small" />
              </Avatar>
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
                {receipts.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Downloadable verified vouchers
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Fee Table */}
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
            Fee Head Breakdown Statement
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>FEE HEAD DESCRIPTION</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>AMOUNT</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>PAYMENT DATE</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>STATUS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4, fontWeight: 600 }}>
                    Loading fee clearance statement...
                  </TableCell>
                </TableRow>
              ) : (
                feeItems.map((item) => (
                  <TableRow key={item.head} hover>
                    <TableCell sx={{ fontWeight: 800, color: 'text.primary' }}>{item.head}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{item.amount}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>{item.date}</TableCell>
                    <TableCell>
                      <Chip label={item.status} color={item.statusColor} size="small" sx={{ fontWeight: 800 }} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Official Payment Receipts Section */}
      <Paper
        elevation={0}
        sx={{
          mt: 3.5,
          borderRadius: '24px',
          border: `1px solid ${theme.palette.divider}`,
          overflow: 'hidden',
          bgcolor: isDark ? 'background.paper' : '#ffffff',
        }}
      >
        <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
            Official Fee Payment Receipts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Verified institutional receipts for cleared fee transactions
          </Typography>
        </Box>

        {isReceiptsLoading ? (
          <Box sx={{ p: 4 }}>
            <Skeleton variant="rectangular" height={80} sx={{ borderRadius: '12px' }} />
          </Box>
        ) : receipts.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <FeeIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
              No Fee Receipts Available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Official payment receipts will be generated once institutional fee dues are cleared.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>RECEIPT NO.</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>TRANSACTION ID</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>PAYMENT DATE</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>AMOUNT PAID</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>STATUS</TableCell>
                  <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>ACTIONS</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {receipts.map((rcp) => (
                  <TableRow key={rcp.receiptId} hover>
                    <TableCell sx={{ fontWeight: 800, color: 'text.primary', fontFamily: 'monospace' }}>
                      {rcp.receiptNumber}
                    </TableCell>

                    <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontFamily: 'monospace' }}>
                      {rcp.transactionId}
                    </TableCell>

                    <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      {new Date(rcp.paymentDate).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </TableCell>

                    <TableCell sx={{ fontWeight: 800, color: 'success.main' }}>
                      ₹ {rcp.totalPaid.toLocaleString('en-IN')}
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={rcp.isCleared ? 'CLEARED' : rcp.feeStatus}
                        color={rcp.isCleared ? 'success' : 'warning'}
                        size="small"
                        sx={{ fontWeight: 800 }}
                      />
                    </TableCell>

                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ViewIcon />}
                          onClick={() => navigate(`/student/fees/receipt/${rcp.receiptId}`)}
                          sx={{ borderRadius: '8px', fontWeight: 800, textTransform: 'none' }}
                        >
                          View Receipt
                        </Button>

                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          startIcon={<PrintIcon />}
                          onClick={() => navigate(`/student/fees/receipt/${rcp.receiptId}`)}
                          sx={{ borderRadius: '8px', fontWeight: 800, textTransform: 'none' }}
                        >
                          Print / PDF
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Container>
  );
};

export default StudentFeesPage;
