import React from 'react';
import { Box, Pagination as MuiPagination, Typography, useTheme } from '@mui/material';

export const Pagination = ({ page = 1, totalPages = 1, total = 0, limit = 10, onPageChange }) => {
  const theme = useTheme();

  if (totalPages <= 1) return null;

  const validPage = Math.max(1, page || 1);
  const startEntry = Math.min((validPage - 1) * limit + 1, total);
  const endEntry = Math.min(validPage * limit, total);

  const monoFont = theme.typography.mono?.fontFamily || 'monospace';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 2,
        mt: 3,
        pt: 2,
        borderTop: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontFamily: monoFont,
          color: theme.palette.text.secondary,
        }}
      >
        Showing {startEntry}–{endEntry} of {total} entries
      </Typography>
      <MuiPagination
        count={totalPages}
        page={validPage}
        onChange={(e, value) => onPageChange(value)}
        shape="rounded"
        size="small"
        sx={{
          '& .MuiPaginationItem-root': {
            fontFamily: monoFont,
            '&.Mui-selected': {
              bgcolor: theme.palette.primary.main,
              color: '#ffffff',
              '&:hover': {
                bgcolor: theme.palette.primary.dark,
              },
            },
          },
        }}
      />
    </Box>
  );
};

export default Pagination;
