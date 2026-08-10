import React from 'react';
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
  useTheme,
} from '@mui/material';
import {
  ReceiptLongOutlined as FeeIcon,
  CheckCircleOutlineOutlined as VerifiedIcon,
  DownloadOutlined as DownloadIcon,
} from '@mui/icons-material';

import { useMyProfileQuery } from '../../queries/userProfileQueries';

export const StudentFeesPage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { data: profile } = useMyProfileQuery();

  const studentMeta = profile?.profileMeta || {};

  const feeItems = [
    { head: 'Semester Tuition Fee', amount: '₹ 45,000', status: 'PAID', date: '2026-07-15' },
    { head: 'Laboratory & Computer Facility Fee', amount: '₹ 8,500', status: 'PAID', date: '2026-07-15' },
    { head: 'Library & Learning Resources Fee', amount: '₹ 3,000', status: 'PAID', date: '2026-07-15' },
    { head: 'Examination & Assessment Fee', amount: '₹ 2,500', status: 'PAID', date: '2026-07-15' },
    { head: 'Campus Development Fund', amount: '₹ 4,000', status: 'PAID', date: '2026-07-15' },
  ];

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
            {studentMeta?.semester || 6}).
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={() => window.print()}
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

      {/* KPI Cards */}
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
              <Avatar sx={{ bgcolor: `${theme.palette.success.main}15`, color: theme.palette.success.main, width: 48, height: 48 }}>
                <VerifiedIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  CLEARANCE STATUS
                </Typography>
                <Chip label="ALL DUES CLEARED" color="success" sx={{ fontWeight: 800, mt: 0.5 }} />
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
              <Avatar sx={{ bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main, width: 48, height: 48 }}>
                <FeeIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  TOTAL FEES PAID
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  ₹ 63,000
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
              <Avatar sx={{ bgcolor: `${theme.palette.info.main}15`, color: theme.palette.info.main, width: 48, height: 48 }}>
                <FeeIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  OUTSTANDING DUES
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'success.main' }}>
                  ₹ 0.00
                </Typography>
              </Box>
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
              {feeItems.map((item) => (
                <TableRow key={item.head} hover>
                  <TableCell sx={{ fontWeight: 800, color: 'text.primary' }}>{item.head}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{item.amount}</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>{item.date}</TableCell>
                  <TableCell>
                    <Chip label={item.status} color="success" size="small" sx={{ fontWeight: 800 }} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default StudentFeesPage;
