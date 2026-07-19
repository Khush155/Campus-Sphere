import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  TextField,
  useTheme,
  Grid
} from '@mui/material';
import { SearchOutlined } from '@mui/icons-material';
import { useUsersQuery } from '../../queries/userQueries';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';

const StudentOverview = () => {
  const theme = useTheme();
  
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  // Debounce search conceptually
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const { data: usersData, isLoading } = useUsersQuery({
    role: 'STUDENT',
    page,
    limit: 10,
    search: debouncedSearch || undefined
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: theme.palette.ink?.[900] || 'text.primary' }}>
          Student Overview
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View all students currently enrolled in your department across all branches and semesters.
        </Typography>
      </Box>

      {/* Filter Bar */}
      <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(28, 46, 69, 0.02)', border: `1px solid ${theme.palette.divider}` }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchOutlined fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ bgcolor: 'background.paper' }}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Data Table */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={32} />
        </Box>
      ) : !usersData?.data || usersData.data.length === 0 ? (
        <EmptyState
          type="users"
          title="No Students Found"
          description={search ? "No students match your search criteria." : "No students have been enrolled in your department yet."}
          actionText={search ? "Clear Search" : ""}
          onAction={search ? () => setSearch('') : undefined}
        />
      ) : (
        <TableContainer component={Card} sx={{ border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: '12px' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', py: 2 }}>NAME</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', py: 2 }}>EMAIL</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', py: 2 }}>COURSE / BRANCH</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', py: 2 }}>SEMESTER</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', py: 2 }}>STATUS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usersData.data.map((user) => {
                const isInactive = user.status === 'INACTIVE';
                return (
                  <TableRow key={user.id} hover sx={{ opacity: isInactive ? 0.6 : 1 }}>
                    <TableCell sx={{ fontWeight: 600 }}>{user.name}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>{user.email}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                      {user.course || 'N/A'} - {user.branch || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`SEM ${user.semester || '-'}`}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(63, 110, 82, 0.1)',
                          color: theme.palette.signal?.success || 'success.main',
                          fontWeight: 700,
                          fontSize: '0.65rem'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: isInactive ? 'error.main' : 'success.main' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: isInactive ? 'error.main' : 'success.main' }}>
                          {user.status}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          <Box sx={{ p: 2 }}>
            <Pagination
              page={page}
              totalPages={usersData.meta.totalPages}
              total={usersData.meta.total}
              limit={usersData.meta.limit}
              onPageChange={setPage}
            />
          </Box>
        </TableContainer>
      )}
    </Box>
  );
};

export default StudentOverview;
