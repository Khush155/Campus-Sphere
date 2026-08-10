// client/src/pages/faculty/components/ProfileCard.jsx
//
// Enhanced Faculty Profile Card with cover banner, initials avatar,
// structured metadata grid, status badge, and profile navigation.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Divider,
  Stack,
  Chip,
  Button,
  useTheme,
} from '@mui/material';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  Schedule as ScheduleIcon,
  CalendarMonth as CalendarIcon,
  Badge as BadgeIcon,
  Business as DepartmentIcon,
  ArrowForward as ArrowIcon,
  CheckCircle as ActiveIcon,
} from '@mui/icons-material';

/**
 * Extracts initials from a full name.
 * "Dr. Ananya Sharma" → "AS" (skips titles like Dr., Prof., Mr., Mrs.)
 */
const getInitials = (name) => {
  if (!name) return '?';
  const parts = name
    .replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s*/i, '')
    .trim()
    .split(' ')
    .filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Formats an ISO date string to a human-readable format.
 * "2019-07-15" → "15 Jul 2019"
 */
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const QuickInfoTile = ({ icon, label, value, color = 'primary.main', bg = 'rgba(79, 70, 229, 0.08)' }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      p: 1.25,
      borderRadius: 2.5,
      bgcolor: 'action.hover',
      border: '1px solid',
      borderColor: 'divider',
      transition: 'all 0.2s ease',
      '&:hover': {
        bgcolor: 'action.selected',
        transform: 'translateY(-1px)',
      },
    }}
  >
    <Box
      sx={{
        bgcolor: bg,
        color: color,
        width: 34,
        height: 34,
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {icon}
    </Box>
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 600, display: 'block', fontSize: '0.68rem', lineHeight: 1.1 }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        color="text.primary"
        sx={{
          fontWeight: 700,
          fontSize: '0.78rem',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value || '—'}
      </Typography>
    </Box>
  </Box>
);

export const ProfileCard = ({ profile = {} }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const {
    name,
    email,
    designation,
    department,
    phoneNumber,
    officeHours,
    joiningDate,
    employeeId,
  } = profile;

  return (
    <Card
      sx={{
        p: 0,
        borderRadius: '16px',
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: 'none',
        overflow: 'hidden',
        background: isDark
          ? 'linear-gradient(180deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)'
          : '#ffffff',
      }}
    >
      {/* ── Top Cover Banner ── */}
      <Box
        sx={{
          height: 80,
          background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 50%, #06b6d4 100%)',
          position: 'relative',
          px: 2.5,
          pt: 1.5,
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'flex-start',
        }}
      >
        {/* Status Pill on Banner */}
        <Chip
          icon={<ActiveIcon sx={{ fontSize: '14px !important', color: '#10b981 !important' }} />}
          label="Active Faculty"
          size="small"
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            color: '#0f172a',
            fontWeight: 800,
            fontSize: '0.68rem',
            height: 24,
            backdropFilter: 'blur(4px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          }}
        />
      </Box>

      <CardContent sx={{ p: 2.5, pt: 0 }}>
        {/* ── Overlapping Avatar & Primary Info Header ── */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mt: '-40px',
            mb: 2,
          }}
        >
          <Avatar
            sx={{
              width: 80,
              height: 80,
              fontSize: '1.75rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              border: `4px solid ${isDark ? '#1e293b' : '#ffffff'}`,
              boxShadow: '0 6px 16px rgba(79,70,229,0.3)',
            }}
          >
            {getInitials(name)}
          </Avatar>

          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              color: 'text.primary',
              lineHeight: 1.25,
              mt: 1,
              textAlign: 'center',
              fontSize: '1.1rem',
            }}
          >
            {name || 'Faculty Member'}
          </Typography>

          <Typography
            variant="body2"
            color="primary.main"
            sx={{ fontWeight: 700, mt: 0.25, fontSize: '0.82rem' }}
          >
            {designation || 'Faculty'}
          </Typography>

          {/* Department badge */}
          {department && (
            <Chip
              icon={<DepartmentIcon sx={{ fontSize: 15 }} />}
              label={`${department?.name} (${department?.code})`}
              size="small"
              sx={{
                mt: 1,
                fontWeight: 700,
                fontSize: '0.7rem',
                bgcolor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(79, 70, 229, 0.08)',
                color: 'primary.main',
                border: '1px solid',
                borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(79, 70, 229, 0.2)',
                '& .MuiChip-icon': { color: 'primary.main' },
              }}
            />
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* ── Metadata Grid Tiles ── */}
        <Stack spacing={1.25}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.25 }}>
            <QuickInfoTile
              icon={<BadgeIcon fontSize="small" />}
              label="Employee ID"
              value={employeeId}
              color="#4f46e5"
              bg="rgba(79, 70, 229, 0.1)"
            />
            <QuickInfoTile
              icon={<PhoneIcon fontSize="small" />}
              label="Phone"
              value={phoneNumber}
              color="#10b981"
              bg="rgba(16, 185, 129, 0.1)"
            />
          </Box>

          <QuickInfoTile
            icon={<EmailIcon fontSize="small" />}
            label="Email Address"
            value={email}
            color="#06b6d4"
            bg="rgba(6, 182, 212, 0.1)"
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.25 }}>
            <QuickInfoTile
              icon={<ScheduleIcon fontSize="small" />}
              label="Office Hours"
              value={officeHours}
              color="#f59e0b"
              bg="rgba(245, 158, 11, 0.1)"
            />
            <QuickInfoTile
              icon={<CalendarIcon fontSize="small" />}
              label="Joined On"
              value={formatDate(joiningDate)}
              color="#8b5cf6"
              bg="rgba(139, 92, 246, 0.1)"
            />
          </Box>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {/* Footer Action Button */}
        <Button
          fullWidth
          size="medium"
          variant="contained"
          color="primary"
          endIcon={<ArrowIcon fontSize="small" />}
          onClick={() => navigate('/profile')}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: '10px',
            py: 1,
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
            '&:hover': {
              boxShadow: '0 6px 16px rgba(79, 70, 229, 0.35)',
            },
          }}
        >
          View & Edit Full Profile
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProfileCard;
