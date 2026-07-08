import React, { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Box,
  Typography,
  Card,
  TextField,
  MenuItem,
  Button,
  Drawer,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  Chip,
  IconButton,
  useTheme,
  Skeleton,
} from '@mui/material';
import {
  SearchOutlined,
  AddOutlined,
  CloseOutlined,
  ReceiptOutlined,
  DownloadOutlined,
  PaymentOutlined,
} from '@mui/icons-material';
import { useStudentsQuery } from '../../../queries/studentQueries';
import { useStudentFeesQuery, useRecordPaymentMutation, downloadPaymentReceipt, useFeeStructuresQuery } from '../../../queries/feeQueries';

const PAYMENT_METHODS = ['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE'];

const paymentSchema = z.object({
  feeStructureId: z.string().min(1, 'Fee structure is required'),
  amount: z.number({ invalid_type_error: 'Amount is required' }).min(1, 'Amount must be greater than 0'),
  transactionReference: z.string().min(3, 'Transaction reference is required (min 3 chars)').max(100),
  paymentMethod: z.enum(PAYMENT_METHODS, { errorMap: () => ({ message: 'Select a payment method' }) }),
  remarks: z.string().max(200).optional().or(z.literal('')),
  paidAt: z.string().optional(),
});

const getPaymentMethodColor = (method) => {
  const map = { CASH: 'success', UPI: 'primary', BANK_TRANSFER: 'info', CHEQUE: 'warning' };
  return map[method] || 'default';
};

export const PaymentTab = () => {
  const theme = useTheme();

  // Student search state
  const [studentSearch, setStudentSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [serverError, setServerError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  // Debounce student search
  const handleSearchChange = useCallback((val) => {
    setStudentSearch(val);
    clearTimeout(window._studentSearchTimer);
    window._studentSearchTimer = setTimeout(() => setDebouncedSearch(val), 350);
  }, []);

  const { data: studentsData, isLoading: searchLoading } = useStudentsQuery(
    debouncedSearch ? { search: debouncedSearch, limit: 8 } : { limit: 0 }
  );
  const searchResults = debouncedSearch ? (studentsData?.data || []) : [];

  // Selected student fees
  const { data: studentFees, isLoading: feesLoading, isError: feesError } = useStudentFeesQuery(
    selectedStudent?.id
  );

  // Fee structures for dropdown in payment drawer
  const { data: feeStructures } = useFeeStructuresQuery({});

  const { mutateAsync: recordPayment, isLoading: isRecording } = useRecordPaymentMutation();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      feeStructureId: '',
      amount: '',
      transactionReference: '',
      paymentMethod: '',
      remarks: '',
      paidAt: '',
    },
  });

  const handleOpenDrawer = () => {
    reset();
    setServerError('');
    setDrawerOpen(true);
  };

  const handleCloseDrawer = useCallback(() => {
    if (!isRecording) {
      setDrawerOpen(false);
      reset();
      setServerError('');
    }
  }, [isRecording, reset]);

  const onSubmit = async (data) => {
    setServerError('');
    try {
      const payload = {
        studentId: selectedStudent.id,
        feeStructureId: data.feeStructureId,
        amount: Number(data.amount),
        transactionReference: data.transactionReference,
        paymentMethod: data.paymentMethod,
        remarks: data.remarks || '',
        ...(data.paidAt ? { paidAt: data.paidAt } : {}),
      };
      await recordPayment(payload);
      handleCloseDrawer();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to record payment. Please try again.';
      setServerError(msg);
    }
  };

  const handleDownloadReceipt = async (payment) => {
    setDownloadingId(payment.id);
    try {
      await downloadPaymentReceipt(payment.id, payment.transactionReference);
    } catch {
      // silently fail — browser will show an error if download fails
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Student Search */}
      <Card sx={{ p: 2.5, border: `1px solid ${theme.custom.border.subtle}`, borderRadius: '14px', boxShadow: 'none', bgcolor: theme.custom.surface.raised }}>
        <Typography sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, color: theme.palette.ink[900], mb: 1.5, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Search Student
        </Typography>
        <Box sx={{ position: 'relative' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by student name or email…"
            value={studentSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            InputProps={{ startAdornment: <SearchOutlined sx={{ mr: 1, color: theme.palette.text.secondary, fontSize: 18 }} /> }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
          />
          {/* Autocomplete Dropdown */}
          {debouncedSearch && searchResults.length > 0 && !selectedStudent && (
            <Card sx={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, mt: 0.5, border: `1px solid ${theme.custom.border.subtle}`, borderRadius: '10px', boxShadow: theme.custom?.elevation?.overlay, overflow: 'hidden' }}>
              <List sx={{ p: 0 }}>
                {searchResults.map((s, i) => (
                  <ListItem
                    key={s.id}
                    button
                    onClick={() => { setSelectedStudent(s); setStudentSearch(s.name); setDebouncedSearch(''); }}
                    sx={{
                      py: 1,
                      px: 2,
                      borderBottom: i < searchResults.length - 1 ? `1px solid ${theme.custom.border.subtle}` : 'none',
                      '&:hover': { bgcolor: theme.custom.interaction.hoverTint },
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: theme.palette.ink[900] }}>{s.name}</Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: theme.palette.text.secondary, fontFamily: theme.typography.mono.fontFamily }}>{s.email}</Typography>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Card>
          )}
          {searchLoading && debouncedSearch && (
            <Box sx={{ position: 'absolute', top: '50%', right: 12, transform: 'translateY(-50%)' }}>
              <CircularProgress size={16} />
            </Box>
          )}
        </Box>

        {selectedStudent && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2, p: 1.5, borderRadius: '8px', bgcolor: theme.custom.interaction.hoverTint, border: `1px solid ${theme.palette.primary.main}` }}>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 700, color: theme.palette.ink[900], fontSize: '0.88rem' }}>{selectedStudent.name}</Typography>
              <Typography sx={{ fontSize: '0.75rem', color: theme.palette.text.secondary, fontFamily: theme.typography.mono.fontFamily }}>{selectedStudent.email}</Typography>
            </Box>
            <Button size="small" variant="contained" startIcon={<AddOutlined />} onClick={handleOpenDrawer} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', flexShrink: 0 }}>
              Record Payment
            </Button>
            <IconButton size="small" onClick={() => { setSelectedStudent(null); setStudentSearch(''); }} sx={{ flexShrink: 0 }}>
              <CloseOutlined fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Card>

      {/* Payment History */}
      {selectedStudent && (
        <Box>
          {feesLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} sx={{ p: 2.5, border: `1px solid ${theme.custom.border.subtle}`, borderRadius: '12px', boxShadow: 'none' }}>
                  <Skeleton variant="text" width="60%" height={20} />
                  <Skeleton variant="text" width="40%" height={16} sx={{ mt: 1 }} />
                </Card>
              ))}
            </Box>
          ) : feesError ? (
            <Alert severity="error" sx={{ borderRadius: '10px' }}>Failed to load payment records.</Alert>
          ) : !studentFees?.payments?.length ? (
            <Card sx={{ p: 4, border: `1px solid ${theme.custom.border.subtle}`, borderRadius: '14px', boxShadow: 'none', textAlign: 'center', bgcolor: theme.custom.surface.raised }}>
              <ReceiptOutlined sx={{ fontSize: 40, color: theme.palette.text.disabled, mb: 1 }} />
              <Typography sx={{ color: theme.palette.text.secondary }}>No payment records found for this student.</Typography>
            </Card>
          ) : (
            <Box>
              {/* Summary Banner */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, color: theme.palette.ink[900], fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {studentFees.payments.length} Payment{studentFees.payments.length !== 1 ? 's' : ''}
                </Typography>
                <Typography sx={{ fontFamily: theme.typography.mono.fontFamily, fontWeight: 700, color: theme.palette.primary.main, fontSize: '1rem' }}>
                  Total: ₹{studentFees.totalPaid.toLocaleString('en-IN')}
                </Typography>
              </Box>

              {/* Payment Cards */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {studentFees.payments.map((payment) => (
                  <Card
                    key={payment.id}
                    sx={{
                      p: 2.5,
                      border: `1px solid ${theme.custom.border.subtle}`,
                      borderRadius: '12px',
                      boxShadow: 'none',
                      bgcolor: theme.custom.surface.raised,
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box>
                        <Typography sx={{ fontWeight: 700, color: theme.palette.ink[900], fontSize: '0.88rem' }}>
                          {payment.feeStructure?.label || 'Fee Payment'}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: theme.palette.text.secondary, fontFamily: theme.typography.mono.fontFamily, mt: 0.25 }}>
                          Ref: {payment.transactionReference}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontFamily: theme.typography.mono.fontFamily, fontWeight: 700, fontSize: '1rem', color: theme.palette.primary.main }}>
                        ₹{payment.amount.toLocaleString('en-IN')}
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 1.5 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label={payment.paymentMethod.replace('_', ' ')}
                          color={getPaymentMethodColor(payment.paymentMethod)}
                          size="small"
                          sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                        />
                        {payment.feeStructure?.academicYear && (
                          <Chip label={payment.feeStructure.academicYear} size="small" variant="outlined" sx={{ fontSize: '0.7rem', fontFamily: theme.typography.mono.fontFamily }} />
                        )}
                        {payment.feeStructure?.semester && (
                          <Chip label={`Sem ${payment.feeStructure.semester}`} size="small" sx={{ fontSize: '0.7rem', fontFamily: theme.typography.mono.fontFamily }} />
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography sx={{ fontSize: '0.75rem', color: theme.palette.text.secondary }}>
                          {new Date(payment.paidAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={downloadingId === payment.id ? <CircularProgress size={12} /> : <DownloadOutlined />}
                          onClick={() => handleDownloadReceipt(payment)}
                          disabled={downloadingId === payment.id}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            py: 0.5,
                            borderColor: theme.custom.border.subtle,
                            color: theme.palette.text.secondary,
                            '&:hover': { borderColor: theme.palette.primary.main, color: theme.palette.primary.main },
                          }}
                        >
                          Receipt
                        </Button>
                      </Box>
                    </Box>
                    {payment.remarks && (
                      <Typography sx={{ mt: 1, fontSize: '0.78rem', color: theme.palette.text.secondary, fontStyle: 'italic' }}>
                        "{payment.remarks}"
                      </Typography>
                    )}
                  </Card>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* Record Payment Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleCloseDrawer}
        PaperProps={{ sx: { width: { xs: '100%', sm: 440 }, bgcolor: theme.palette.background.default } }}
      >
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.custom.border.subtle}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <PaymentOutlined sx={{ color: theme.palette.primary.main }} />
            <Typography variant="h6" sx={{ fontFamily: theme.typography.h1.fontFamily, fontWeight: 600, color: theme.palette.ink[900] }}>
              Record Payment
            </Typography>
          </Box>
          <IconButton onClick={handleCloseDrawer} disabled={isRecording} size="small">
            <CloseOutlined fontSize="small" />
          </IconButton>
        </Box>

        {selectedStudent && (
          <Box sx={{ px: 3, py: 2, bgcolor: theme.custom.surface.raised, borderBottom: `1px solid ${theme.custom.border.subtle}` }}>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: theme.palette.text.secondary, mb: 0.5 }}>
              Student
            </Typography>
            <Typography sx={{ fontWeight: 600, color: theme.palette.ink[900] }}>{selectedStudent.name}</Typography>
            <Typography sx={{ fontSize: '0.78rem', color: theme.palette.text.secondary, fontFamily: theme.typography.mono.fontFamily }}>{selectedStudent.email}</Typography>
          </Box>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5, overflowY: 'auto', flex: 1 }}>
          {serverError && <Alert severity="error" sx={{ borderRadius: '10px' }}>{serverError}</Alert>}

          <Controller
            name="feeStructureId"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                fullWidth
                size="small"
                label="Fee Structure *"
                error={!!errors.feeStructureId}
                helperText={errors.feeStructureId?.message}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              >
                <MenuItem value="">Select fee structure</MenuItem>
                {(feeStructures || []).map((fs) => (
                  <MenuItem key={fs.id} value={fs.id}>
                    {fs.label} — {fs.course?.name} Sem {fs.semester} ({fs.academicYear}) — ₹{fs.amount.toLocaleString('en-IN')}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                size="small"
                label="Amount Paid (₹) *"
                type="number"
                inputProps={{ min: 1, step: 1 }}
                value={field.value === '' ? '' : field.value}
                onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                error={!!errors.amount}
                helperText={errors.amount?.message}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            )}
          />

          <Controller
            name="transactionReference"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                size="small"
                label="Transaction Reference *"
                placeholder="e.g. UPI12345678 / CHQ-001"
                error={!!errors.transactionReference}
                helperText={errors.transactionReference?.message || 'Must be unique — prevents duplicate payments'}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            )}
          />

          <Controller
            name="paymentMethod"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                fullWidth
                size="small"
                label="Payment Method *"
                error={!!errors.paymentMethod}
                helperText={errors.paymentMethod?.message}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              >
                {PAYMENT_METHODS.map((m) => (
                  <MenuItem key={m} value={m}>{m.replace('_', ' ')}</MenuItem>
                ))}
              </TextField>
            )}
          />

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Controller
                name="paidAt"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    size="small"
                    label="Payment Date (optional)"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.paidAt}
                    helperText={errors.paidAt?.message || 'Defaults to today if left blank'}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="remarks"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    size="small"
                    label="Remarks (optional)"
                    multiline
                    rows={2}
                    placeholder="Any notes about this payment"
                    error={!!errors.remarks}
                    helperText={errors.remarks?.message}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                  />
                )}
              />
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ p: 3, borderTop: `1px solid ${theme.custom.border.subtle}`, display: 'flex', gap: 2 }}>
          <Button fullWidth variant="outlined" onClick={handleCloseDrawer} disabled={isRecording} sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '10px' }}>
            Cancel
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={handleSubmit(onSubmit)}
            disabled={isRecording}
            startIcon={isRecording ? <CircularProgress size={16} color="inherit" /> : <PaymentOutlined />}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px' }}
          >
            {isRecording ? 'Recording…' : 'Record Payment'}
          </Button>
        </Box>
      </Drawer>
    </Box>
  );
};

export default PaymentTab;
