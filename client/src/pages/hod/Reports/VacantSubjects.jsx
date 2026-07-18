import React from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, useTheme } from '@mui/material';
import { ErrorOutline as ErrorOutlineIcon } from '@mui/icons-material';

const VacantSubjects = ({ data }) => {
  const theme = useTheme();

  if (!data || data.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Typography color="text.secondary">All subjects currently have assigned faculty.</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', overflow: 'hidden' }}>
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: 1 }}>
        <ErrorOutlineIcon color="error" />
        <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
          Vacant Subjects ({data.length})
        </Typography>
      </Box>
      <TableContainer sx={{ maxHeight: 340 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Subject Code</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Branch</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Sem</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Credits</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((subject) => (
              <TableRow key={subject._id || subject.code} hover>
                <TableCell>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {subject.code}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {subject.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={subject.branchCode || subject.branchName} size="small" />
                </TableCell>
                <TableCell>{subject.semester}</TableCell>
                <TableCell>{subject.credits}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default VacantSubjects;
