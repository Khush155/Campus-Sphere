/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { Box, Typography, Button, IconButton, useTheme } from '@mui/material';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastItem = ({ toast, onClose, theme }) => {
  const [exiting, setExiting] = useState(false);

  const handleClose = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      onClose(toast.id);
    }, 150); // Matches 150ms toastExit motion token
  }, [toast.id, onClose]);

  React.useEffect(() => {
    const duration = toast.duration !== undefined 
      ? toast.duration 
      : (toast.severity === 'error' ? 8000 : 4500);

    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, toast.severity, handleClose]);

  const isSuccess = toast.severity === 'success';
  const isError = toast.severity === 'error';
  
  const getStyles = () => {
    if (isSuccess) {
      return {
        borderColor: theme.palette.signal.success,
        iconColor: theme.palette.signal.success,
        bgTint: 'rgba(63, 110, 82, 0.12)',
        icon: <CheckCircleOutlinedIcon sx={{ color: theme.palette.signal.success, fontSize: '1.25rem' }} />,
      };
    } else if (isError) {
      return {
        borderColor: theme.palette.signal.error,
        iconColor: theme.palette.signal.error,
        bgTint: 'rgba(179, 67, 43, 0.12)',
        icon: <ErrorOutlinedIcon sx={{ color: theme.palette.signal.error, fontSize: '1.25rem' }} />,
      };
    } else {
      return {
        borderColor: theme.palette.primary.main,
        iconColor: theme.palette.primary.main,
        bgTint: theme.custom?.surface?.raised || theme.palette.background.paper,
        icon: <InfoOutlinedIcon sx={{ color: theme.palette.primary.main, fontSize: '1.25rem' }} />,
      };
    }
  };

  const styleConfig = getStyles();
  const hasNumbers = /\d/.test(toast.message);

  return (
    <Box
      sx={{
        pointerEvents: 'auto',
        minWidth: 320,
        maxWidth: 480,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1.5,
        bgcolor: theme.palette.background.paper,
        backgroundImage: `linear-gradient(${styleConfig.bgTint}, ${styleConfig.bgTint})`,
        borderLeft: `4px solid ${styleConfig.borderColor}`,
        borderRadius: `${theme.shape.borderRadius}px`,
        boxShadow: theme.custom?.elevation?.overlay || theme.shadows[4],
        color: theme.palette.text.primary,
        animation: exiting
          ? 'toastSlideExit 150ms cubic-bezier(0.4, 0, 1, 1) forwards'
          : 'toastSlideEnter 200ms cubic-bezier(0, 0, 0.2, 1) forwards',
        '@keyframes toastSlideEnter': {
          '0%': { opacity: 0, transform: 'translateY(16px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        '@keyframes toastSlideExit': {
          '0%': { opacity: 1, transform: 'translateY(0)' },
          '100%': { opacity: 0, transform: 'translateY(12px)' },
        },
      }}
    >
      {styleConfig.icon}
      
      <Typography
        variant="body2"
        sx={{
          flex: 1,
          fontFamily: hasNumbers ? theme.typography.mono.fontFamily : theme.typography.body2.fontFamily,
          fontSize: '0.85rem',
          fontWeight: 500,
          color: theme.palette.text.primary,
          lineHeight: 1.4,
        }}
      >
        {toast.message}
      </Typography>

      {toast.onUndo && (
        <Button
          size="small"
          onClick={() => {
            toast.onUndo();
            handleClose();
          }}
          sx={{
            color: theme.palette.primary.main,
            fontWeight: 700,
            fontSize: '0.75rem',
            fontFamily: theme.typography.mono.fontFamily,
            px: 1,
            py: 0.25,
            minWidth: 'auto',
            textTransform: 'uppercase',
            '&:hover': {
              bgcolor: theme.custom?.interaction?.hoverTint || 'rgba(0,0,0,0.04)',
            },
          }}
        >
          Undo
        </Button>
      )}

      <IconButton
        size="small"
        onClick={handleClose}
        aria-label="close toast"
        sx={{
          color: theme.palette.text.secondary,
          p: 0.5,
          '&:hover': { color: theme.palette.text.primary },
        }}
      >
        <CloseIcon sx={{ fontSize: '1rem' }} />
      </IconButton>
    </Box>
  );
};

export const ToastProvider = ({ children }) => {
  const theme = useTheme();
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, options = {}) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    const severity = typeof options === 'string' ? options : (options.severity || 'success');
    const onUndo = typeof options === 'object' ? options.onUndo : null;
    const duration = typeof options === 'object' ? options.duration : undefined;

    setToasts((prev) => [
      ...prev,
      { id, message, severity, onUndo, duration }
    ].slice(-4)); // Keep max 4 toasts visible at once

    return id;
  }, []);

  const hideToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      
      {/* Toast Fixed Stack Container at Center-Bottom */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1400,
          display: 'flex',
          flexDirection: 'column-reverse', // Newest at bottom of stack
          gap: 1,
          alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={hideToast} theme={theme} />
        ))}
      </Box>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
