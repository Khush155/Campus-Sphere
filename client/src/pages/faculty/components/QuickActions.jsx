// client/src/pages/faculty/components/QuickActions.jsx
//
// Compact, sleek quick action bar for faculty dashboard.
// Formatted in a single horizontal row on desktop with compact horizontal tile layout.

import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  useTheme,
} from '@mui/material';
import { Bolt as HeaderIcon } from '@mui/icons-material';

export const QuickActions = ({ actions = [] }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Paper
      sx={{
        p: 2,
        borderRadius: '14px',
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: 'none',
        background: isDark
          ? 'linear-gradient(180deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)'
          : '#ffffff',
      }}
    >
      {/* ── Section Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <HeaderIcon sx={{ fontSize: 20, color: 'primary.main' }} />
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '0.02em', textTransform: 'uppercase', fontSize: '0.75rem' }}
        >
          Quick Shortcuts
        </Typography>
      </Box>

      {/* ── Compact Actions Grid (1 row on desktop md=2) ── */}
      <Grid container spacing={1.5}>
        {actions.map((action) => (
          <Grid item xs={6} sm={4} md={2} key={action.id}>
            <Box
              onClick={action.onClick}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                py: 1,
                px: 1.25,
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                border: '1px solid',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
                '&:hover': {
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : `${action.color}10`,
                  borderColor: `${action.color}50`,
                  transform: 'translateY(-1px)',
                  boxShadow: `0 3px 10px ${action.color}20`,
                },
              }}
            >
              {/* Compact Icon Box */}
              <Box
                sx={{
                  bgcolor: isDark ? `${action.color}25` : `${action.color}15`,
                  color: action.color,
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {action.icon}
              </Box>

              {/* Label & Micro Description */}
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    color: 'text.primary',
                    lineHeight: 1.15,
                    fontSize: '0.75rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {action.label}
                </Typography>
                {action.description && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      display: 'block',
                      lineHeight: 1.1,
                      fontSize: '0.65rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      mt: 0.2,
                    }}
                  >
                    {action.description}
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default QuickActions;
