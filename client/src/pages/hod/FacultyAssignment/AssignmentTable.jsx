import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  Chip,
  Typography,
  Button,
  useTheme,
  Box
} from '@mui/material';
import { AssignmentIndOutlined, CancelOutlined } from '@mui/icons-material';
import Pagination from '../../../components/common/Pagination';
import EmptyState from '../../../components/common/EmptyState';

const AssignmentTable = ({ assignments, meta, onPageChange, onRevokeClick }) => {
  const theme = useTheme();

  if (!assignments || assignments.length === 0) {
    return (
      <EmptyState
        type="subjects"
        title="No Assignments Found"
        description="No faculty assignments match the selected filters."
      />
    );
  }

  return (
    <Card sx={{ border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: '12px' }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', py: 2 }}>SUBJECT</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', py: 2 }}>FACULTY</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', py: 2 }}>STATUS</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.8rem', py: 2 }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assignments.map((assignment) => {
              const subject = assignment.subjectId;
              const faculty = assignment.facultyId;
              const isActive = assignment.status === 'ACTIVE';

              return (
                <TableRow key={assignment._id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{subject?.name}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                      {subject?.code} • {subject?.branchId?.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {faculty ? (
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{faculty.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{faculty.email}</Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>Unknown</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={assignment.status}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        bgcolor: isActive ? 'rgba(63, 110, 82, 0.1)' : 'rgba(179, 67, 43, 0.1)',
                        color: isActive ? theme.palette.signal.success : theme.palette.signal.error,
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {isActive && (
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        startIcon={<CancelOutlined />}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                        onClick={() => onRevokeClick(assignment)}
                      >
                        Revoke
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      
      {meta && (
        <Box sx={{ p: 2 }}>
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={meta.limit}
            onPageChange={onPageChange}
          />
        </Box>
      )}
    </Card>
  );
};

export default AssignmentTable;
