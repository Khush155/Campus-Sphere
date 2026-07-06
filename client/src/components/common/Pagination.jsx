import React from 'react';
import { Box, Pagination as MuiPagination, Typography, useTheme } from '@mui/material';

export const Pagination = ({ page, totalPages, total, limit, onPageChange }) => {
  const theme = useTheme();

  if (totalPages <= 1) return null;

  const startEntry = (page - 1) * limit + 1;
  const endEntry = Math.min(page * limit, total);

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
          fontFamily: theme.typography.mono.fontFamily,
          color: theme.palette.text.secondary,
        }}
      >
        Showing {startEntry}–{endEntry} of {total} entries
      </Typography>
      <MuiPagination
        count={totalPages}
        page={page}
        onChange={(e, value) => onPageChange(value)}
        shape="rounded"
        size="small"
        sx={{
          '& .MuiPaginationItem-root': {
            fontFamily: theme.typography.mono.fontFamily,
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
