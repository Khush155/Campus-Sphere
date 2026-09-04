import React, { useState, useEffect } from 'react';
import {
  Dialog,
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  TextField,
  CircularProgress,
  useTheme,
  IconButton,
  Zoom,
  Fade,
} from '@mui/material';
import {
  CreditCard as CardIcon,
  QrCode2 as QrCodeIcon,
  AccountBalance as BankIcon,
  CheckCircle as SuccessIcon,
  Close as CloseIcon,
  Lock as LockIcon,
} from '@mui/icons-material';

const MockPaymentGateway = ({ open, onClose, totalDues, onPaymentSuccess }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  const [step, setStep] = useState(0); // 0: Method, 1: Details, 2: Processing, 3: Success
  const [method, setMethod] = useState(null);
  const [processingText, setProcessingText] = useState('Connecting to secure bank gateway...');

  // Reset state when opened
  useEffect(() => {
    if (open) {
      setStep(0);
      setMethod(null);
      setProcessingText('Connecting to secure bank gateway...');
    }
  }, [open]);

  const handlePay = () => {
    setStep(2); // Processing
    
    // Simulate realistic processing delay
    setTimeout(() => {
      setProcessingText('Verifying OTP & Authorizing...');
      
      setTimeout(() => {
        setProcessingText('Generating Institutional Receipt...');
        
        setTimeout(() => {
          setStep(3); // Success
          
          setTimeout(() => {
            onPaymentSuccess();
          }, 1500); // Wait 1.5s on success screen before closing and refreshing
          
        }, 1200);
      }, 1500);
    }, 1500);
  };

  const renderMethodSelection = () => (
    <Fade in={step === 0}>
      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select a payment method to clear your dues of <Typography component="span" sx={{ fontWeight: 800, color: 'text.primary' }}>₹ {totalDues.toLocaleString('en-IN')}</Typography>
        </Typography>
        <Grid container spacing={2}>
          {[
            { id: 'upi', label: 'UPI / QR Code', icon: <QrCodeIcon fontSize="large" />, color: '#10b981' },
            { id: 'card', label: 'Credit / Debit Card', icon: <CardIcon fontSize="large" />, color: '#4f46e5' },
            { id: 'netbanking', label: 'Net Banking', icon: <BankIcon fontSize="large" />, color: '#f59e0b' },
          ].map((m) => (
            <Grid item xs={12} sm={4} key={m.id}>
              <Paper
                elevation={0}
                onClick={() => { setMethod(m.id); setStep(1); }}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  border: `2px solid ${theme.palette.divider}`,
                  bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: m.color,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${m.color}20`,
                  }
                }}
              >
                <Box sx={{ color: m.color, mb: 1 }}>{m.icon}</Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{m.label}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Fade>
  );

  const renderDetails = () => (
    <Fade in={step === 1} unmountOnExit>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton size="small" onClick={() => setStep(0)} sx={{ mr: 1 }}><CloseIcon /></IconButton>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {method === 'upi' ? 'Scan & Pay' : method === 'card' ? 'Enter Card Details' : 'Select Bank'}
          </Typography>
        </Box>

        {method === 'upi' && (
          <Box sx={{ textAlign: 'center', p: 3, bgcolor: isDark ? '#ffffff' : '#f8fafc', borderRadius: '16px', maxWidth: 250, mx: 'auto', border: `1px solid ${theme.palette.divider}` }}>
            <Box sx={{ 
              width: 180, height: 180, mx: 'auto', mb: 2, 
              background: 'repeating-linear-gradient(45deg, #000 0, #000 10px, #fff 10px, #fff 20px)',
              position: 'relative',
              borderRadius: '8px'
            }}>
              {/* Fake QR visual */}
              <Box sx={{ position: 'absolute', inset: 10, bgcolor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <QrCodeIcon sx={{ fontSize: 120, color: '#000' }} />
              </Box>
            </Box>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Scan using any UPI App</Typography>
            <Typography variant="h6" sx={{ color: '#0f172a', fontWeight: 800, mt: 1 }}>₹ {totalDues.toLocaleString('en-IN')}</Typography>
          </Box>
        )}

        {method === 'card' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Card Number" placeholder="0000 0000 0000 0000" fullWidth variant="outlined" InputLabelProps={{ shrink: true }} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="Expiry" placeholder="MM/YY" fullWidth variant="outlined" InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="CVV" placeholder="***" type="password" fullWidth variant="outlined" InputLabelProps={{ shrink: true }} />
              </Grid>
            </Grid>
            <TextField label="Cardholder Name" placeholder="Student Name" fullWidth variant="outlined" InputLabelProps={{ shrink: true }} />
          </Box>
        )}

        {method === 'netbanking' && (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <BankIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
            <Typography variant="body1" color="text.secondary">Mock NetBanking redirect simulation...</Typography>
          </Box>
        )}

        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={handlePay}
          sx={{ mt: 4, borderRadius: '12px', py: 1.5, fontWeight: 800, bgcolor: '#10b981', color: '#fff', '&:hover': { bgcolor: '#059669' } }}
          startIcon={<LockIcon />}
        >
          Secure Pay ₹ {totalDues.toLocaleString('en-IN')}
        </Button>
      </Box>
    </Fade>
  );

  const renderProcessing = () => (
    <Fade in={step === 2} unmountOnExit>
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <CircularProgress size={60} thickness={4} sx={{ color: '#4f46e5', mb: 3 }} />
        <Typography variant="h6" sx={{ fontWeight: 800 }}>Processing Payment</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1, fontFamily: 'monospace' }}>
          {processingText}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', mt: 4, color: 'warning.main', fontWeight: 600 }}>
          Please do not close this window or press back
        </Typography>
      </Box>
    </Fade>
  );

  const renderSuccess = () => (
    <Zoom in={step === 3} unmountOnExit>
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <SuccessIcon sx={{ fontSize: 100, color: '#10b981', mb: 2 }} />
        <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>Payment Successful!</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          ₹ {totalDues.toLocaleString('en-IN')} cleared successfully.
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', mt: 3, color: 'text.secondary' }}>
          Redirecting to digital receipt...
        </Typography>
      </Box>
    </Zoom>
  );

  return (
    <Dialog
      open={open}
      onClose={step === 2 ? undefined : onClose} // Prevent closing while processing
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          p: { xs: 1, sm: 3 },
          bgcolor: isDark ? '#1e293b' : '#ffffff',
          backgroundImage: 'none',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }
      }}
    >
      <Box sx={{ p: 1 }}>
        {step < 2 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
              <LockIcon sx={{ color: '#10b981', fontSize: 20 }} /> Secure Checkout
            </Typography>
            {step === 0 && (
              <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
            )}
          </Box>
        )}

        {step === 0 && renderMethodSelection()}
        {step === 1 && renderDetails()}
        {step === 2 && renderProcessing()}
        {step === 3 && renderSuccess()}
      </Box>
    </Dialog>
  );
};

export default MockPaymentGateway;
