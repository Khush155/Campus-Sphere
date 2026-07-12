import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Divider } from '@mui/material';
import { PaymentOutlined, DownloadOutlined } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useStudentLedgerQuery, useProcessPaymentMutation } from '../../queries/feeQueries';
import api from '../../services/api';

const StudentFeePortal = () => {
  const { user } = useAuth();
  const { data: ledger, isLoading } = useStudentLedgerQuery(user.id);
  const payMutation = useProcessPaymentMutation();

  const [payModal, setPayModal] = useState({ open: false, ledgerItem: null });
  const [payForm, setPayForm] = useState({ paymentMethod: 'CREDIT_CARD' });

  const handlePay = async (e) => {
    e.preventDefault();
    const ref = `TXN-${Date.now()}`;
    await payMutation.mutateAsync({
      studentId: user.id,
      paymentData: {
        feeStructureId: payModal.ledgerItem.feeStructure._id,
        amountPaid: payModal.ledgerItem.balance,
        paymentMethod: payForm.paymentMethod,
        transactionReference: ref
      }
    });
    setPayModal({ open: false, ledgerItem: null });
  };

  const handleDownloadReceipt = async (transactionId, ref) => {
    try {
      const res = await api.get(`/fees/receipt/${transactionId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Receipt_${ref}.pdf`);
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      alert('Failed to download receipt');
    }
  };

  if (isLoading) return <Box textAlign="center" py={10}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={3}>Fee Portal</Typography>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'primary.50' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Base Fees</Typography>
              <Typography variant="h4" color="primary.main">
                ${ledger?.summary?.baseFees?.toFixed(2) || '0.00'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'error.light', bgcolor: 'error.50' }}>
            <CardContent>
              <Typography color="error.main" gutterBottom>Total Fines & Penalties</Typography>
              <Typography variant="h4" color="error.main">
                +${ledger?.summary?.totalFines?.toFixed(2) || '0.00'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'success.light', bgcolor: 'success.50' }}>
            <CardContent>
              <Typography color="success.main" gutterBottom>Total Scholarships / Discounts</Typography>
              <Typography variant="h4" color="success.main">
                -${ledger?.summary?.totalDiscounts?.toFixed(2) || '0.00'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Total Outstanding Balance</Typography>
              <Typography variant="h4" color="text.primary" fontWeight="bold">
                ${ledger?.summary?.totalBalance?.toFixed(2) || '0.00'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h6" fontWeight="bold" mb={2}>Applicable Fees & Adjustments</Typography>
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 4 }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell>Fee Details</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Total Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ledger?.ledgerDetails?.map((item) => (
                <TableRow key={item.feeStructure._id}>
                  <TableCell>
                    <Typography fontWeight="500">{item.feeStructure.title}</Typography>
                    {item.lateFee > 0 && (
                      <Typography variant="caption" color="error">Includes ${item.lateFee} late fee</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={item.feeStructure.type} color={
                        item.feeStructure.type === 'ACADEMIC' ? 'primary' :
                        item.feeStructure.type === 'DISCOUNT' ? 'success' :
                        item.feeStructure.type === 'FINE' ? 'error' : 'default'
                    } />
                  </TableCell>
                  <TableCell>{new Date(item.feeStructure.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Typography color={item.feeStructure.type === 'DISCOUNT' ? 'success.main' : 'inherit'}>
                      {item.feeStructure.type === 'DISCOUNT' ? '-' : ''}${item.amount.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {item.feeStructure.type === 'DISCOUNT' ? (
                      <Chip label="APPLIED" color="success" size="small" />
                    ) : item.isFullyPaid ? (
                      <Chip label="PAID" color="success" size="small" />
                    ) : (
                      <Chip label={`DUE: $${item.balance.toFixed(2)}`} color="warning" size="small" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {!item.isFullyPaid && item.feeStructure.type !== 'DISCOUNT' && (
                      <Button variant="contained" size="small" startIcon={<PaymentOutlined />} onClick={() => setPayModal({ open: true, ledgerItem: item })}>
                        Pay Now
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {ledger?.ledgerDetails?.length === 0 && (
                <TableRow><TableCell colSpan={6} align="center">No fees or adjustments found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Typography variant="h6" fontWeight="bold" mb={2}>Transaction History</Typography>
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Receipt</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ledger?.transactions?.map((txn) => (
                <TableRow key={txn._id}>
                  <TableCell>{new Date(txn.paymentDate).toLocaleDateString()}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{txn.transactionReference}</TableCell>
                  <TableCell>${txn.amountPaid.toFixed(2)}</TableCell>
                  <TableCell><Chip label={txn.status} color="success" size="small" /></TableCell>
                  <TableCell align="right">
                    <Button size="small" startIcon={<DownloadOutlined />} onClick={() => handleDownloadReceipt(txn._id, txn.transactionReference)}>
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {ledger?.transactions?.length === 0 && (
                <TableRow><TableCell colSpan={5} align="center">No recent transactions.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={payModal.open} onClose={() => setPayModal({ open: false, ledgerItem: null })}>
        <DialogTitle>Process Payment</DialogTitle>
        <form onSubmit={handlePay}>
          <DialogContent dividers>
            <Typography variant="subtitle1" fontWeight="bold">{payModal.ledgerItem?.feeStructure?.title}</Typography>
            <Typography variant="h4" color="primary.main" sx={{ my: 2 }}>${payModal.ledgerItem?.balance?.toFixed(2)}</Typography>
            {payModal.ledgerItem?.lateFee > 0 && (
              <Typography variant="caption" color="error" display="block" mb={2}>
                (Includes ${payModal.ledgerItem?.lateFee} late fee)
              </Typography>
            )}
            <TextField select fullWidth label="Payment Method" value={payForm.paymentMethod} onChange={e => setPayForm({ paymentMethod: e.target.value })}>
              <MenuItem value="CREDIT_CARD">Credit Card</MenuItem>
              <MenuItem value="DEBIT_CARD">Debit Card</MenuItem>
              <MenuItem value="NET_BANKING">Net Banking</MenuItem>
              <MenuItem value="UPI">UPI</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPayModal({ open: false, ledgerItem: null })}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={payMutation.isPending}>Confirm Payment</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default StudentFeePortal;
