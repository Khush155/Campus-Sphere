import React from 'react';
import { 
  Box, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Paper, CircularProgress, Typography, IconButton, Tooltip
} from '@mui/material';
import { EditOutlined, DeleteOutline } from '@mui/icons-material';

const DataTable = ({ 
  columns, 
  data, 
  isLoading, 
  isError, 
  emptyMessage = 'No data available',
  onEdit,
  onDelete,
  customActions
}) => {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error">An error occurred while fetching data.</Typography>
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 2, border: '1px dashed grey' }}>
        <Typography color="text.secondary">{emptyMessage}</Typography>
      </Box>
    );
  }

  const hasActions = onEdit || onDelete || customActions;

  return (
    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
      <Table sx={{ minWidth: 650 }}>
        <TableHead sx={{ bgcolor: 'background.default' }}>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col.id} sx={{ fontWeight: 'bold' }}>{col.label}</TableCell>
            ))}
            {hasActions && <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={row._id || index} hover>
              {columns.map((col) => (
                <TableCell key={col.id}>
                  {col.render ? col.render(row) : row[col.id]}
                </TableCell>
              ))}
              {hasActions && (
                <TableCell align="right">
                  {customActions && customActions(row)}
                  {onEdit && (
                    <Tooltip title="Edit">
                      <IconButton size="small" color="primary" onClick={() => onEdit(row)}>
                        <EditOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {onDelete && (
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => onDelete(row)}>
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default DataTable;
