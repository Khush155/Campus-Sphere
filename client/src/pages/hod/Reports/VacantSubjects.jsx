import React from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, useTheme } from '@mui/material';
import { ErrorOutline as ErrorOutlineIcon, CheckCircleOutline as CheckCircleIcon } from '@mui/icons-material';

const VacantSubjects = ({ data }) => {
  const theme = useTheme();

  if (!data || data.length === 0) {
    return (
      <Paper
        sx={{
          p: 3.5,
          textAlign: 'center',
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          borderTop: `4px solid ${theme.palette.success.main}`,
          boxShadow: 'none',
          bgcolor: `${theme.palette.success.main}05`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          minHeight: 280,
        }}
      >
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            bgcolor: `${theme.palette.success.main}15`,
            color: theme.palette.success.main,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1.5,
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 32 }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.ink?.[900] || '#1a1a1a' }}>
          All Subjects Fully Allocated
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 320 }}>
          100% of curriculum subjects currently have active assigned faculty. There are no vacant subjects.
        </Typography>
        <Chip
          label="0 Vacant Subjects"
          size="small"
          color="success"
          sx={{ mt: 2, fontWeight: 800, fontSize: '0.72rem' }}
        />
      </Paper>
    );
  }

  return (
    <Paper sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, borderTop: `4px solid ${theme.palette.error.main}`, boxShadow: 'none', overflow: 'hidden' }}>
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: 1 }}>
        <ErrorOutlineIcon color="error" />
        <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.ink?.[900] || '#1a1a1a' }}>
          Vacant Subjects ({data.length})
        </Typography>
      </Box>
      <TableContainer sx={{ maxHeight: 340 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Subject Code</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Sem</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((subject) => (
              <TableRow key={subject._id || subject.code} hover>
                <TableCell>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                    {subject.code}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {subject.name}
                  </Typography>
                </TableCell>
                <TableCell>Sem {subject.semester}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default VacantSubjects;
