import React from 'react';
import { Box, Typography, Button, useTheme } from '@mui/material';

// 1. Folder Outline for Departments
const FolderIcon = () => (
  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);

// 2. Card Stack Outline for Courses
const StackIcon = () => (
  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

// 3. Branches Node Outline for Branches
const BranchIcon = () => (
  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="6" y1="3" x2="6" y2="15" />
    <circle cx="18" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <path d="M18 9a9 9 0 0 1-9 9" />
  </svg>
);

// 4. Book Outline for Subjects
const BookIcon = () => (
  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

// 5. Profile Outline for Users Roster
const UserOutlineIcon = () => (
  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const EmptyState = ({ type, title, description, actionText, onAction }) => {
  const theme = useTheme();

  const getIcon = () => {
    switch (type) {
      case 'departments':
        return <FolderIcon />;
      case 'courses':
        return <StackIcon />;
      case 'branches':
        return <BranchIcon />;
      case 'subjects':
        return <BookIcon />;
      case 'users':
        return <UserOutlineIcon />;
      default:
        return <FolderIcon />;
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        p: 6,
        borderRadius: '16px',
        bgcolor: theme.custom.surface.raised,
        border: `1px solid ${theme.custom.border.subtle}`,
        position: 'relative',
        overflow: 'hidden',
        minHeight: '260px',
      }}
    >
      {/* Background Subtle Watermark */}
      <Box
        sx={{
          position: 'absolute',
          bottom: -15,
          right: -15,
          opacity: 0.04,
          color: theme.palette.primary.main,
          transform: 'rotate(-10deg)',
          pointerEvents: 'none',
        }}
      >
        {getIcon()}
      </Box>

      {/* Main Illustration Icon */}
      <Box
        sx={{
          color: theme.palette.brass[500],
          mb: 3,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {getIcon()}
      </Box>

      {/* Details */}
      <Typography
        variant="h5"
        component="h3"
        sx={{
          fontFamily: theme.typography.h1.fontFamily,
          fontWeight: 700,
          color: theme.palette.ink[900],
          mb: 1,
        }}
      >
        {title}
      </Typography>

      <Typography
        variant="body2"
        sx={{
          color: theme.palette.text.secondary,
          maxWidth: 320,
          mb: actionText ? 3.5 : 0,
          lineHeight: 1.5,
        }}
      >
        {description}
      </Typography>

      {actionText && onAction && (
        <Button
          variant="contained"
          onClick={onAction}
          sx={{
            bgcolor: theme.palette.primary.main,
            color: theme.palette.ink[900],
            fontWeight: 700,
            textTransform: 'none',
            px: 3,
            '&:hover': { bgcolor: theme.palette.primary.light },
          }}
        >
          {actionText}
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;
