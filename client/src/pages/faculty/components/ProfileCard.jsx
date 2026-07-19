// client/src/pages/faculty/components/ProfileCard.jsx
//
// Displays the faculty member's profile information in a card layout.
// Shows avatar, name, designation, department, and contact details.
//
// Props:
//   profile — object matching the shape of mockFacultyProfile:
//     {
//       name:         string   — full name (e.g. "Dr. Ananya Sharma")
//       email:        string   — institutional email
//       designation:  string   — matches Faculty.designation enum
//       department:   { name: string, code: string }
//       phoneNumber:  string
//       officeHours:  string   — e.g. "Mon, Wed 2:00 PM - 4:00 PM"
//       joiningDate:  string   — ISO date string
//       employeeId:   string   — display-only identifier
//     }
//
// Future: When backend is connected, this same prop shape will come from
// GET /api/v1/faculty/:id (populated with User + Department data).

import React from 'react';
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
} from '@mui/material';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  Schedule as ScheduleIcon,
  CalendarMonth as CalendarIcon,
  Badge as BadgeIcon,
  Business as DepartmentIcon,
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

/**
 * A single row displaying an icon, label, and value.
 * Extracted as a local helper to keep the main component clean.
 * Not exported — it's an implementation detail of ProfileCard.
 */
const InfoRow = ({ icon, label, value }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 1 }}>
    <Box sx={{ color: 'text.secondary', mt: 0.25, minWidth: 20 }}>
      {icon}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 500, display: 'block', mb: 0.25 }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        color="text.primary"
        sx={{ fontWeight: 600, wordBreak: 'break-word' }}
      >
        {value || '—'}
      </Typography>
    </Box>
  </Box>
);

export const ProfileCard = ({ profile }) => {
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
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        {/* ── Header: Avatar + Name + Designation ── */}
        <Stack alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
          <Avatar
            sx={{
              width: 72,
              height: 72,
              fontSize: '1.5rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
            }}
          >
            {getInitials(name)}
          </Avatar>

          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.3 }}
            >
              {name}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontWeight: 500, mt: 0.5 }}
            >
              {designation}
            </Typography>
          </Box>

          {/* Department badge */}
          <Chip
            icon={<DepartmentIcon sx={{ fontSize: 16 }} />}
            label={`${department?.name} (${department?.code})`}
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: '0.75rem',
              bgcolor: 'rgba(79, 70, 229, 0.08)',
              color: 'primary.main',
              '& .MuiChip-icon': { color: 'primary.main' },
            }}
          />
        </Stack>

        <Divider sx={{ mb: 1 }} />

        {/* ── Detail Rows ── */}
        <Stack spacing={0.5}>
          <InfoRow
            icon={<BadgeIcon fontSize="small" />}
            label="Employee ID"
            value={employeeId}
          />
          <InfoRow
            icon={<EmailIcon fontSize="small" />}
            label="Email"
            value={email}
          />
          <InfoRow
            icon={<PhoneIcon fontSize="small" />}
            label="Phone"
            value={phoneNumber}
          />
          <InfoRow
            icon={<ScheduleIcon fontSize="small" />}
            label="Office Hours"
            value={officeHours}
          />
          <InfoRow
            icon={<CalendarIcon fontSize="small" />}
            label="Joining Date"
            value={formatDate(joiningDate)}
          />
        </Stack>
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            size="small"
            color="primary"
            onClick={() => window.location.href = '/profile'}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            View Full Profile
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProfileCard;
