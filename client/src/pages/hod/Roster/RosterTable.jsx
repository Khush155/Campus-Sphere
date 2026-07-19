import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Typography,
  Chip,
  CircularProgress
} from '@mui/material';
import { useUsersQuery } from '../../../queries/userQueries';
import Pagination from '../../../components/common/Pagination';
import EmptyState from '../../../components/common/EmptyState';
import { format } from 'date-fns';

const RosterTable = ({ role, searchQuery, batchFilters }) => {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: response, isLoading } = useUsersQuery({
    role,
    search: searchQuery,
    page,
    limit,
    course: batchFilters?.course,
    branch: batchFilters?.branch,
    semester: batchFilters?.semester,
    group: batchFilters?.group,
  });

  const users = response?.data || [];
  const meta = response?.meta || { total: 0, pages: 0 };

  const getInitials = (name) => {
    if (!name) return 'CS';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (users.length === 0) {
    return (
      <Box sx={{ p: 4 }}>
        <EmptyState
          type="users"
          title={`No ${role.toLowerCase()}s found`}
          description={searchQuery ? "Try adjusting your search query." : `There are no ${role.toLowerCase()}s in this department yet.`}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <TableContainer>
        <Table sx={{ minWidth: 600 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>User</TableCell>
              {role === 'STUDENT' && <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Batch</TableCell>}
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Joined</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 600 }}>
                      {getInitials(user.name)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {user.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                {role === 'STUDENT' && (
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {user.semester ? `Semester ${user.semester}` : 'N/A'}
                    </Typography>
                    {user.group && (
                      <Chip 
                        label={user.group} 
                        size="small" 
                        sx={{ mt: 0.5, fontSize: '0.65rem', height: 20 }} 
                      />
                    )}
                  </TableCell>
                )}
                <TableCell>
                  <Chip
                    label={user.status}
                    size="small"
                    color={user.status === 'ACTIVE' ? 'success' : 'error'}
                    sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Pagination
        page={page}
        limit={limit}
        total={meta.total}
        totalPages={meta.pages}
        onPageChange={setPage}
      />
    </Box>
  );
};

export default RosterTable;
