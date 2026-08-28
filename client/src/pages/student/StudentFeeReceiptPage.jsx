import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Divider,
  Skeleton,
  useTheme,
} from '@mui/material';
import {
  PrintOutlined as PrintIcon,
  ArrowBackOutlined as BackIcon,
  SchoolOutlined as SchoolIcon,
  VerifiedOutlined as VerifiedIcon,
  QrCode2Outlined as QrIcon,
  ReceiptLongOutlined as FeeIcon,
  CheckCircleOutlineOutlined as CheckIcon,
} from '@mui/icons-material';

import { useStudentFeeReceiptQuery } from '../../queries/studentQueries';

export const StudentFeeReceiptPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { receiptId } = useParams();

  const { data: receipt, isLoading, isError } = useStudentFeeReceiptQuery(receiptId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3.5 }}>
      {/* Top Navigation & Actions */}
      <Box
        sx={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
          '@media print': { display: 'none' },
        }}
      >
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={() => navigate('/student/fees')}
          sx={{ borderRadius: '12px', fontWeight: 800, textTransform: 'none' }}
        >
          Back to Fee Dues
        </Button>

        <Button
          variant="contained"
          color="primary"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          sx={{
            borderRadius: '12px',
            px: 3,
            py: 1.25,
            fontWeight: 800,
            textTransform: 'none',
            boxShadow: '0 8px 20px rgba(79, 70, 229, 0.25)',
          }}
        >
          Print / Save PDF Receipt
        </Button>
      </Box>

      {/* Main Print-Ready Fee Receipt Document */}
      {isLoading ? (
        <Paper sx={{ p: 4, borderRadius: '24px' }}>
          <Skeleton variant="text" width="40%" height={40} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={300} sx={{ borderRadius: '16px' }} />
        </Paper>
      ) : isError || !receipt ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '24px', border: `1px solid ${theme.palette.divider}` }}>
          <FeeIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
            Fee Receipt Not Found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            The requested fee payment receipt could not be retrieved or you do not have permission to view it.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/student/fees')} sx={{ borderRadius: '12px', fontWeight: 800 }}>
            Return to Fee Statement
          </Button>
        </Paper>
      ) : (
        <Paper
          id="printable-receipt-area"
          elevation={0}
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: '24px',
            border: `2px solid ${theme.palette.divider}`,
            bgcolor: '#ffffff',
            color: '#0f172a',
            position: 'relative',
            overflow: 'hidden',
            '@media print': {
              border: '1px solid #000000',
              borderRadius: 0,
              p: 3,
              boxShadow: 'none',
            },
          }}
        >
          {/* Header Banner */}
          <Box
            sx={{
              textAlign: 'center',
              pb: 3,
              mb: 3.5,
              borderBottom: `2px dashed ${theme.palette.divider}`,
              position: 'relative',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 1 }}>
              <SchoolIcon sx={{ fontSize: 40, color: '#4f46e5' }} />
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: '0.04em' }}>
                CAMPUS-SPHERE UNIVERSITY OF TECHNOLOGY
              </Typography>
            </Box>

            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#475569', letterSpacing: '0.1em' }}>
              ACCOUNTS & FINANCE DEPARTMENT • OFFICIAL FEE PAYMENT RECEIPT
            </Typography>

            <Chip
              icon={<VerifiedIcon fontSize="small" style={{ color: '#059669' }} />}
              label="VERIFIED TRANSACTION • OFFICIAL INSTITUTIONAL SEAL"
              size="small"
              sx={{
                mt: 1.5,
                fontWeight: 800,
                bgcolor: '#ecfdf5',
                color: '#047857',
                border: '1px solid #a7f3d0',
              }}
            />
          </Box>

          {/* Receipt & Student Summary Grid */}
          <Grid container spacing={3} sx={{ mb: 3.5 }}>
            <Grid item xs={12} sm={3} sx={{ textAlign: 'center' }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  bgcolor: '#f8fafc',
                  display: 'inline-block',
                  width: '100%',
                  maxWidth: 180,
                }}
              >
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    mx: 'auto',
                    mb: 1.5,
                    bgcolor: '#e0e7ff',
                    color: '#4f46e5',
                    fontSize: '2rem',
                    fontWeight: 800,
                    border: '2px solid #4f46e5',
                  }}
                >
                  {receipt.studentName?.charAt(0) || 'S'}
                </Avatar>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <QrIcon sx={{ fontSize: 24, color: '#475569' }} />
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.65rem' }}>
                    #{receipt.receiptId}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} sm={9}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                    RECEIPT NUMBER
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
                    {receipt.receiptNumber}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                    TRANSACTION REFERENCE
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#4f46e5', fontFamily: 'monospace' }}>
                    {receipt.transactionId}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                    CANDIDATE NAME
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                    {receipt.studentName}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                    UNIVERSITY ROLL NUMBER
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                    {receipt.rollNumber}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                    COURSE & BRANCH
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                    {receipt.course} • {receipt.branch}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                    SEMESTER & ACADEMIC YEAR
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                    Semester {receipt.semester} • {receipt.academicYear}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                    PAYMENT DATE & MODE
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                    {new Date(receipt.paymentDate).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    • {receipt.paymentMode}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                    CLEARANCE STATUS
                  </Typography>
                  <Box sx={{ mt: 0.2 }}>
                    <Chip
                      icon={<CheckIcon fontSize="small" style={{ color: '#059669' }} />}
                      label={receipt.isCleared ? 'ALL DUES CLEARED' : 'PARTIAL DUES PENDING'}
                      size="small"
                      sx={{
                        fontWeight: 800,
                        bgcolor: receipt.isCleared ? '#ecfdf5' : '#fffbeb',
                        color: receipt.isCleared ? '#047857' : '#b45309',
                        border: receipt.isCleared ? '1px solid #a7f3d0' : '1px solid #fde68a',
                      }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          {/* Fee Itemization Table */}
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5 }}>
            Itemized Fee Breakdown Statement
          </Typography>

          <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: '16px', mb: 3.5 }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, color: '#0f172a' }}>FEE HEAD DESCRIPTION</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#0f172a' }}>SCHEDULED AMOUNT</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#0f172a' }}>PAID AMOUNT</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#0f172a' }}>OUTSTANDING DUES</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#0f172a', textAlign: 'center' }}>STATUS</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {receipt.feeBreakdown.map((item) => (
                  <TableRow key={item.head} hover>
                    <TableCell sx={{ fontWeight: 800, color: '#0f172a' }}>{item.head}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#334155' }}>
                      ₹ {item.baseAmount.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#047857' }}>
                      ₹ {item.paidAmount.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: item.dueAmount > 0 ? '#b91c1c' : '#475569' }}>
                      ₹ {item.dueAmount.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={item.status}
                        size="small"
                        sx={{
                          fontWeight: 800,
                          fontSize: '0.68rem',
                          bgcolor: item.status === 'PAID' ? '#ecfdf5' : '#fef2f2',
                          color: item.status === 'PAID' ? '#047857' : '#b91c1c',
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Totals Summary Card */}
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: '16px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0', mb: 4 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                  TOTAL SCHEDULED FEE
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  ₹ {receipt.totalBaseFee.toLocaleString('en-IN')}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                  TOTAL AMOUNT PAID
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#047857' }}>
                  ₹ {receipt.totalPaid.toLocaleString('en-IN')}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                  TOTAL OUTSTANDING DUES
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: receipt.totalDues > 0 ? '#b91c1c' : '#047857' }}>
                  ₹ {receipt.totalDues.toLocaleString('en-IN')}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          <Divider sx={{ my: 3 }} />

          {/* Official Signatures Row */}
          <Grid container spacing={3} sx={{ pt: 1 }}>
            <Grid item xs={6} sx={{ textAlign: 'left' }}>
              <Box sx={{ borderBottom: '1px solid #94a3b8', width: 180, mb: 1, height: 32 }} />
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f172a' }}>
                Student Candidate Signature
              </Typography>
            </Grid>

            <Grid item xs={6} sx={{ textAlign: 'right' }}>
              <Box sx={{ borderBottom: '1px solid #94a3b8', width: 180, ml: 'auto', mb: 1, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#059669', letterSpacing: '0.05em' }}>
                  [DIGITALLY SEALED]
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f172a' }}>
                Finance Officer / Registrar
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Container>
  );
};

export default StudentFeeReceiptPage;
