// client/src/pages/faculty/components/QuickActions.jsx
//
// Dashboard panel with navigation shortcuts to common faculty tasks.
// Each action displays an icon, label, and optional description.
//
// Props:
//   actions — array of action objects:
//     [
//       {
//         id:          string     — unique key
//         label:       string     — e.g. "Mark Attendance"
//         description: string     — brief context
//         icon:        ReactNode  — MUI icon element
//         color:       string     — hex accent color
//         onClick:     function   — optional navigation handler
//       }
//     ]
//
// Future: Badge counts (e.g. "12 pending") will come from API in Phase 5.7+.

import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Bolt as HeaderIcon } from '@mui/icons-material';

export const QuickActions = ({ actions }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      {/* ── Section Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
        <HeaderIcon color="primary" />
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, color: 'text.primary' }}
        >
          Quick Actions
        </Typography>
      </Box>

      <Divider sx={{ mb: 2.5 }} />

      {/* ── Actions Grid ── */}
      <Grid container spacing={2}>
        {actions.map((action) => (
          <Grid item xs={6} sm={4} md={2} key={action.id}>
            <Box
              onClick={action.onClick}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                py: 2.5,
                px: 1.5,
                borderRadius: 3,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                bgcolor: isDark
                  ? 'rgba(255, 255, 255, 0.03)'
                  : 'rgba(0, 0, 0, 0.01)',
                border: '1px solid',
                borderColor: isDark
                  ? 'rgba(255, 255, 255, 0.06)'
                  : 'rgba(0, 0, 0, 0.06)',
                '&:hover': {
                  bgcolor: isDark
                    ? 'rgba(255, 255, 255, 0.06)'
                    : `${action.color}08`,
                  borderColor: `${action.color}40`,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 12px ${action.color}15`,
                },
              }}
            >
              {/* Icon circle */}
              <Box
                sx={{
                  bgcolor: isDark
                    ? `${action.color}20`
                    : `${action.color}12`,
                  color: action.color,
                  p: 1.5,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {action.icon}
              </Box>

              {/* Label */}
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                  textAlign: 'center',
                  lineHeight: 1.3,
                  fontSize: '0.78rem',
                }}
              >
                {action.label}
              </Typography>

              {/* Description */}
              {action.description && (
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    textAlign: 'center',
                    lineHeight: 1.2,
                    fontSize: '0.65rem',
                  }}
                >
                  {action.description}
                </Typography>
              )}
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default QuickActions;
