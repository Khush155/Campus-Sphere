import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  Typography,
  useTheme,
  Box,
} from '@mui/material';

export const ConfirmDeleteModal = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  actionText = 'Deactivate',
  typedConfirmation = false,
  confirmationWord = 'DEACTIVATE',
}) => {
  const theme = useTheme();
  const [confirmInput, setConfirmInput] = useState('');

  // Clear input when modal opens/closes
  useEffect(() => {
    if (!open) {
      setConfirmInput('');
    }
  }, [open]);

  const handleConfirm = () => {
    if (typedConfirmation && confirmInput.trim().toUpperCase() !== confirmationWord.toUpperCase()) {
      return;
    }
    onConfirm();
    onClose();
  };

  const isConfirmDisabled = typedConfirmation && confirmInput.trim().toUpperCase() !== confirmationWord.toUpperCase();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="confirm-delete-dialog-title"
      aria-describedby="confirm-delete-dialog-description"
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: theme.palette.background.paper,
          p: 1,
        },
      }}
    >
      <DialogTitle
        id="confirm-delete-dialog-title"
        sx={{
          fontFamily: theme.typography.h3.fontFamily,
          fontWeight: 700,
          color: theme.palette.text.primary,
        }}
      >
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText
          id="confirm-delete-dialog-description"
          sx={{
            fontFamily: theme.typography.body2.fontFamily,
            color: theme.palette.text.secondary,
            fontSize: '0.9rem',
            mb: typedConfirmation ? 2 : 0,
          }}
        >
          {description}
        </DialogContentText>
        
        {typedConfirmation && (
          <Box sx={{ mt: 2 }}>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mb: 1,
                fontFamily: theme.typography.body2.fontFamily,
                fontWeight: 600,
                color: theme.palette.text.primary,
              }}
            >
              Please type <Box component="span" sx={{ fontFamily: theme.typography.mono.fontFamily, color: theme.palette.primary.main }}>{confirmationWord}</Box> to proceed.
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder={confirmationWord}
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontFamily: theme.typography.mono.fontFamily,
                },
              }}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          sx={{
            color: theme.palette.text.secondary,
            fontFamily: theme.typography.button.fontFamily,
            fontWeight: 600,
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={isConfirmDisabled}
          variant="contained"
          sx={{
            bgcolor: theme.palette.signal.error,
            color: '#ffffff',
            fontWeight: 700,
            fontFamily: theme.typography.button.fontFamily,
            '&:hover': {
              bgcolor: '#9c311c',
            },
            '&.Mui-disabled': {
              bgcolor: 'rgba(28, 46, 69, 0.12)',
            },
          }}
        >
          {actionText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDeleteModal;
