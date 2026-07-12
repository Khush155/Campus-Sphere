const fs = require('fs');
const path = require('path');

const studentCode = import React, { useState } from 'react';
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
    const ref = \\\TXN-\\\\\\;
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
      const res = await api.get(\\\/fees/receipt/\\\\\\, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', \\\Receipt_\\\.pdf\\\);
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
                $\\\
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'error.light', bgcolor: 'error.50' }}>
            <CardContent>
              <Typography color="error.main" gutterBottom>Total Fines & Penalties</Typography>
              <Typography variant="h4" color="error.main">
                +$\\\
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'success.light', bgcolor: 'success.50' }}>
            <CardContent>
              <Typography color="success.main" gutterBottom>Total Scholarships / Discounts</Typography>
              <Typography variant="h4" color="success.main">
                -$\\\
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Total Outstanding Balance</Typography>
              <Typography variant="h4" color="text.primary" fontWeight="bold">
                $\\\
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
                      <Typography variant="caption" color="error">Includes $\\\ late fee</Typography>
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
                      {item.feeStructure.type === 'DISCOUNT' ? '-' : ''}$\\\
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {item.feeStructure.type === 'DISCOUNT' ? (
                      <Chip label="APPLIED" color="success" size="small" />
                    ) : item.isFullyPaid ? (
                      <Chip label="PAID" color="success" size="small" />
                    ) : (
                      <Chip label={\\\DUE: $\\\\\\} color="warning" size="small" />
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
                  <TableCell>$\\\</TableCell>
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
            <Typography variant="h4" color="primary.main" sx={{ my: 2 }}>$\\\</Typography>
            {payModal.ledgerItem?.lateFee > 0 && (
              <Typography variant="caption" color="error" display="block" mb={2}>
                (Includes $\\\ late fee)
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
;

const adminCode = import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Tabs, Tab, Divider, Alert } from '@mui/material';
import { AddCardOutlined, SearchOutlined, ReceiptLong } from '@mui/icons-material';
import { useFeeStructuresQuery, useCreateFeeStructureMutation, useStudentLedgerQuery, useCreateAdjustmentMutation } from '../../../queries/feeQueries';
import { useCoursesQuery, useBranchesQuery } from '../../../queries/collegeQueries';
import EmptyState from '../../../components/common/EmptyState';

const FeeManagementHub = () => {
  const [tabIndex, setTabIndex] = useState(0);

  const { data: fees = [] } = useFeeStructuresQuery();
  const { data: courses } = useCoursesQuery();
  const { data: branches } = useBranchesQuery();
  const createMutation = useCreateFeeStructureMutation();
  const createAdjustmentMutation = useCreateAdjustmentMutation();

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '', amount: '', type: 'ACADEMIC', courseId: '', branchId: '', semester: '', dueDate: '', lateFeePerDay: 0, studentId: ''
  });

  const [searchStudentId, setSearchStudentId] = useState('');
  const [activeStudentId, setActiveStudentId] = useState(null);
  const { data: ledger, isLoading: isLedgerLoading } = useStudentLedgerQuery(activeStudentId);

  const [adjOpen, setAdjOpen] = useState(false);
  const [adjData, setAdjData] = useState({ title: '', amount: '', type: 'DISCOUNT', dueDate: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData, amount: Number(formData.amount), lateFeePerDay: Number(formData.lateFeePerDay) };
    if (!payload.courseId) delete payload.courseId;
    if (!payload.branchId) delete payload.branchId;
    if (!payload.semester) delete payload.semester;
    if (!payload.studentId) delete payload.studentId;

    await createMutation.mutateAsync(payload);
    setOpen(false);
    setFormData({ title: '', amount: '', type: 'ACADEMIC', courseId: '', branchId: '', semester: '', dueDate: '', lateFeePerDay: 0, studentId: '' });
  };

  const handleSearch = () => {
    if (searchStudentId) {
      setActiveStudentId(searchStudentId);
    }
  };

  const handleAdjustmentSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...adjData, amount: Number(adjData.amount) };
    await createAdjustmentMutation.mutateAsync({ studentId: activeStudentId, adjustmentData: payload });
    setAdjOpen(false);
    setAdjData({ title: '', amount: '', type: 'DISCOUNT', dueDate: '' });
  };

  const getCourseName = (id) => courses?.find(c => c._id === id)?.name || 'All Courses';
  const getBranchName = (id) => branches?.find(b => b._id === id)?.name || 'All Branches';

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Finance & Fee Management</Typography>
        {tabIndex === 0 && (
          <Button variant="contained" startIcon={<AddCardOutlined />} onClick={() => setOpen(true)}>
            Create Fee Structure
          </Button>
        )}
      </Box>

      <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)} sx={{ mb: 3 }}>
        <Tab label="Global Fee Structures" />
        <Tab label="Student Billing Profiles" />
      </Tabs>

      {tabIndex === 0 && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell>Title</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Mapping</TableCell>
                  <TableCell>Due Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                      <EmptyState message="No fee structures created yet." />
                    </TableCell>
                  </TableRow>
                ) : (
                  fees.map(fee => (
                    <TableRow key={fee._id}>
                      <TableCell fontWeight="500">{fee.title}</TableCell>
                      <TableCell>
                        <Chip label={fee.type} size="small" color={
                          fee.type === 'ACADEMIC' ? 'primary' :
                          fee.type === 'DISCOUNT' ? 'success' :
                          fee.type === 'FINE' ? 'error' : 'warning'
                        } />
                      </TableCell>
                      <TableCell>$\\\</TableCell>
                      <TableCell>
                        <Typography variant="body2">{fee.studentId ? \\\Specific Student (\\\)\\\ : getCourseName(fee.courseId)}</Typography>
                        {!fee.studentId && (
                          <Typography variant="caption" color="text.secondary">
                            {getBranchName(fee.branchId)} {fee.semester ? \\\| Sem: \\\\\\ : ''}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(fee.dueDate).toLocaleDateString()}
                        {fee.lateFeePerDay > 0 && (
                          <Typography variant="caption" color="error" display="block">
                            +$ \\\/day late
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {tabIndex === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Find Student Ledger</Typography>
                <Box display="flex" gap={1}>
                  <TextField 
                    fullWidth 
                    size="small" 
                    placeholder="Enter Student ID" 
                    value={searchStudentId}
                    onChange={(e) => setSearchStudentId(e.target.value)}
                  />
                  <Button variant="contained" onClick={handleSearch}><SearchOutlined /></Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={8}>
            {!activeStudentId ? (
              <EmptyState message="Search for a student to view their ledger." icon={<ReceiptLong sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />} />
            ) : isLedgerLoading ? (
              <Typography>Loading ledger...</Typography>
            ) : !ledger ? (
              <Alert severity="error">Student not found or no ledger available.</Alert>
            ) : (
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box>
                      <Typography variant="h6">{ledger.student.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{ledger.student.email}</Typography>
                    </Box>
                    <Button variant="outlined" color="primary" onClick={() => setAdjOpen(true)}>
                      Apply Custom Adjustment
                    </Button>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2} mb={3}>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">Base Fees</Typography>
                      <Typography variant="h6">$\\\</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="error.main">Total Fines</Typography>
                      <Typography variant="h6" color="error.main">+$\\\</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="success.main">Total Discounts</Typography>
                      <Typography variant="h6" color="success.main">-$\\\</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Box display="flex" justifyContent="space-between" mt={1}>
                        <Typography variant="subtitle1" fontWeight="bold">Total Outstanding Balance</Typography>
                        <Typography variant="h5" fontWeight="bold" color="primary">$\\\</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      )}

      {/* Global Fee Modal */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Fee Structure</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth label="Fee Title" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Amount ($)" type="number" required value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
              </Grid>
              <Grid item xs={6}>
                <TextField select fullWidth label="Fee Type" required value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                  <MenuItem value="ACADEMIC">Academic Tuition</MenuItem>
                  <MenuItem value="ADDITIONAL">Additional (Global)</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>Mapping (Leave blank to apply globally to all students)</Typography>
              </Grid>
              <Grid item xs={6}>
                <TextField select fullWidth label="Specific Course (Optional)" value={formData.courseId} onChange={e => setFormData({ ...formData, courseId: e.target.value })}>
                  <MenuItem value=""><em>All Courses</em></MenuItem>
                  {courses?.map(c => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField select fullWidth label="Specific Branch (Optional)" value={formData.branchId} onChange={e => setFormData({ ...formData, branchId: e.target.value })}>
                  <MenuItem value=""><em>All Branches</em></MenuItem>
                  {branches?.filter(b => !formData.courseId || b.courseId === formData.courseId).map(b => <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Specific Semester (Optional)" type="number" inputProps={{ min: 1, max: 12 }} value={formData.semester} onChange={e => setFormData({ ...formData, semester: e.target.value })} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Due Date" type="date" required InputLabelProps={{ shrink: true }} value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Late Fee per Day ($)" type="number" inputProps={{ min: 0, step: "any" }} value={formData.lateFeePerDay} onChange={e => setFormData({ ...formData, lateFeePerDay: e.target.value })} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Create Fee</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Adjustment Modal */}
      <Dialog open={adjOpen} onClose={() => setAdjOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Apply Custom Student Adjustment</DialogTitle>
        <form onSubmit={handleAdjustmentSubmit}>
          <DialogContent dividers>
            <Alert severity="info" sx={{ mb: 2 }}>This adjustment applies exclusively to {ledger?.student?.name}.</Alert>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth label="Adjustment Title" placeholder="e.g. Sports Scholarship, Library Fine" required value={adjData.title} onChange={e => setAdjData({ ...adjData, title: e.target.value })} />
              </Grid>
              <Grid item xs={6}>
                <TextField select fullWidth label="Type" required value={adjData.type} onChange={e => setAdjData({ ...adjData, type: e.target.value })}>
                  <MenuItem value="DISCOUNT">Discount / Scholarship (Reduces Due)</MenuItem>
                  <MenuItem value="FINE">Fine / Penalty (Increases Due)</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Amount ($)" type="number" required inputProps={{ min: 0 }} value={adjData.amount} onChange={e => setAdjData({ ...adjData, amount: e.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Due Date / Valid Date" type="date" required InputLabelProps={{ shrink: true }} value={adjData.dueDate} onChange={e => setAdjData({ ...adjData, dueDate: e.target.value })} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAdjOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color={adjData.type === 'DISCOUNT' ? 'success' : 'error'}>Apply {adjData.type === 'DISCOUNT' ? 'Discount' : 'Fine'}</Button>
          </DialogActions>
        </form>
      </Dialog>

    </Box>
  );
};

export default FeeManagementHub;
;

fs.writeFileSync(path.join(__dirname, 'client/src/pages/student/StudentFeePortal.jsx'), studentCode, 'utf8');
fs.writeFileSync(path.join(__dirname, 'client/src/pages/admin/Finance/FeeManagementHub.jsx'), adminCode, 'utf8');

console.log('Files fixed successfully.');
