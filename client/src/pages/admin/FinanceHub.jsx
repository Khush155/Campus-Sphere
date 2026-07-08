import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  CircularProgress,
} from '@mui/material';
import {
  AccountBalance as FinanceIcon,
  AttachMoney as RevenueIcon,
  Download as DownloadIcon,
  NotificationsActive as NotifyIcon,
  CheckCircle as PaidIcon,
  Warning as PendingIcon,
} from '@mui/icons-material';
import FeeStructureTab from './FeeManagement/FeeStructureTab';
import PaymentTab from './FeeManagement/PaymentTab';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const FinanceHub = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const { data: structuresData, isLoading: loadStr } = useQuery({
    queryKey: ['feeStructures'],
    queryFn: () => api.get('/fees/structures').then(res => res.data.data),
  });

  const { data: paymentsData, isLoading: loadPay } = useQuery({
    queryKey: ['feePayments'],
    queryFn: () => api.get('/fees/payments').then(res => res.data.data),
  });

  const { data: dashboardData, isLoading: loadDash } = useQuery({
    queryKey: ['collegeAdminStats'],
    queryFn: () => api.get('/dashboard/college-admin').then(res => res.data.data),
  });

  if (loadStr || loadPay || loadDash) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  const structures = structuresData || [];
  const payments = paymentsData || [];
  const totalStudents = dashboardData?.totalStudents || 0;

  // Assuming every student needs to pay every active structure for simple calculation
  const totalExpectedBase = structures.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalExpected = totalExpectedBase * totalStudents;

  const totalCollected = payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amountPaid, 0);

  const totalPending = totalExpected - totalCollected;

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const revenueStats = [
    { title: 'Total Fees Expected', value: formatCurrency(totalExpected), icon: <FinanceIcon sx={{ fontSize: 40 }} />, color: '#4f46e5' },
    { title: 'Fees Collected', value: formatCurrency(totalCollected), icon: <PaidIcon sx={{ fontSize: 40 }} />, color: '#10b981' },
    { title: 'Pending Dues', value: formatCurrency(totalPending > 0 ? totalPending : 0), icon: <PendingIcon sx={{ fontSize: 40 }} />, color: '#f59e0b' },
  ];

  // Dummy pending payments list for UI illustration
  const pendingPayments = [
    { id: '101', name: 'Rahul Verma', course: 'B.Tech CSE', amount: '₹45,000', dueDate: '15 July 2026' },
    { id: '102', name: 'Amit Singh', course: 'B.Tech ECE', amount: '₹22,500', dueDate: '15 July 2026' },
  ];

  const exportFinancialReport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "ID,Student Name,Course,Amount Pending,Due Date\n"
      + pendingPayments.map(p => `${p.id},${p.name},${p.course},${p.amount},${p.dueDate}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "financial_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 4, display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
            <RevenueIcon fontSize="large" color="primary" />
            Finance & Fees Hub
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor institutional revenue and manage fee structures.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<DownloadIcon />} sx={{ borderRadius: 2 }} onClick={exportFinancialReport}>
          Export Financial Report
        </Button>
      </Box>

      {/* Layer 1: Revenue Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {revenueStats.map((stat) => (
          <Grid item xs={12} sm={4} key={stat.title}>
            <Card sx={{ height: '100%', borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 3 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                    {stat.title}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
                    {stat.value}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    bgcolor: `${stat.color}15`,
                    color: stat.color,
                    p: 1.5,
                    borderRadius: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {stat.icon}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <Box sx={{ px: 3, pt: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab label="Overview" sx={{ fontWeight: 600, minHeight: 48 }} />
            <Tab label="Fee Structures" sx={{ fontWeight: 600, minHeight: 48 }} />
            <Tab label="Payments & Receipts" sx={{ fontWeight: 600, minHeight: 48 }} />
          </Tabs>
        </Box>

        <Box sx={{ p: { xs: 2, md: 4 } }}>
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={4}>
              {/* Layer 2: Revenue Chart (Mock Progress) */}
              <Grid item xs={12} md={5}>
                <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 3, height: '100%' }} elevation={0}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Collection Progress</Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>January 2026</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>95%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={95} sx={{ height: 10, borderRadius: 5, bgcolor: 'action.hover' }} />
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>February 2026</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>88%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={88} color="secondary" sx={{ height: 10, borderRadius: 5, bgcolor: 'action.hover' }} />
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>March 2026 (Current)</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>72%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={72} color="warning" sx={{ height: 10, borderRadius: 5, bgcolor: 'action.hover' }} />
                  </Box>
                </Card>
              </Grid>

              {/* Layer 3: Pending Payments */}
              <Grid item xs={12} md={7}>
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                  <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Critical Pending Dues</Typography>
                  </Box>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Due Date</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pendingPayments.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{row.course}</Typography>
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'error.main' }}>{row.amount}</TableCell>
                          <TableCell>{row.dueDate}</TableCell>
                          <TableCell align="center">
                            <Button size="small" variant="outlined" color="warning" startIcon={<NotifyIcon />}>
                              Notify
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <FeeStructureTab />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <PaymentTab />
          </TabPanel>
        </Box>
      </Card>
    </Box>
  );
};

export default FinanceHub;
