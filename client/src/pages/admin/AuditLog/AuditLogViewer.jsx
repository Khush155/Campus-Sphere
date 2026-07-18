import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  TextField,
  Select,
  MenuItem,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Collapse,
  Tooltip,
  Grid,
  CircularProgress,
  Pagination,
  Chip,
  useTheme,
  Alert,
} from '@mui/material';
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  Search,
  Refresh,
} from '@mui/icons-material';

import { useAuditLogsQuery, useAuditActionsQuery } from '../../../queries/auditLogQueries';

/**
 * Custom Component to display structural highlights of modified fields.
 */
const JsonDiffViewer = ({ before, after }) => {
  const theme = useTheme();
  const beforeObj = before || {};
  const afterObj = after || {};

  // Ignore Mongoose standard tracking fields
  const ignoreFields = ['_id', 'createdAt', 'updatedAt', 'timestamp', '__v', 'id'];

  const keys = Array.from(
    new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)])
  ).filter((k) => !ignoreFields.includes(k));

  const formatVal = (v) => {
    if (v === null || v === undefined) return 'null';
    if (typeof v === 'object') return JSON.stringify(v, null, 2);
    return String(v);
  };

  return (
    <Box
      sx={{
        p: 2.5,
        bgcolor: 'rgba(28, 46, 69, 0.02)',
        borderRadius: '8px',
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      {!before && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mb: 1.5, fontWeight: 700, letterSpacing: '0.5px' }}
        >
          CREATION EVENT (All fields new)
        </Typography>
      )}
      <Grid container spacing={2}>
        {keys.map((key) => {
          const beforeVal = beforeObj[key];
          const afterVal = afterObj[key];

          const hasBefore = key in beforeObj;
          const hasAfter = key in afterObj;
          const isAdded = !hasBefore && hasAfter;
          const isRemoved = hasBefore && !hasAfter;
          const isModified =
            hasBefore &&
            hasAfter &&
            JSON.stringify(beforeVal) !== JSON.stringify(afterVal);

          let bgColor = 'transparent';
          let borderColor = 'transparent';
          let textColor = 'inherit';
          let label = '';

          if (isAdded) {
            bgColor = 'rgba(76, 175, 80, 0.06)';
            borderColor = '#4caf50';
            textColor = '#2e7d32';
            label = 'Added';
          } else if (isRemoved) {
            bgColor = 'rgba(244, 67, 54, 0.06)';
            borderColor = '#f44336';
            textColor = '#d32f2f';
            label = 'Deleted';
          } else if (isModified) {
            bgColor = 'rgba(255, 152, 0, 0.06)';
            borderColor = '#ff9800';
            textColor = '#b26a00';
            label = 'Modified';
          } else {
            // Unchanged fields - skipped to keep noise down
            return null;
          }

          return (
            <Grid item xs={12} key={key}>
              <Box
                sx={{
                  p: 1.5,
                  px: 2,
                  bgcolor: bgColor,
                  borderRadius: '6px',
                  borderLeft: `4px solid ${borderColor}`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Chip
                    label={label}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      bgcolor: borderColor,
                      color: '#ffffff',
                    }}
                  />
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, color: textColor }}>
                    {key}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    pl: 2,
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {isModified ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Box component="span" sx={{ color: '#d32f2f', textDecoration: 'line-through' }}>
                        - {formatVal(beforeVal)}
                      </Box>
                      <Box component="span" sx={{ color: '#2e7d32' }}>
                        + {formatVal(afterVal)}
                      </Box>
                    </Box>
                  ) : isRemoved ? (
                    <Box component="span" sx={{ color: '#d32f2f' }}>
                      {formatVal(beforeVal)}
                    </Box>
                  ) : (
                    <Box component="span" sx={{ color: '#2e7d32' }}>
                      {formatVal(afterVal)}
                    </Box>
                  )}
                </Box>
              </Box>
            </Grid>
          );
        })}
        {keys.length === 0 || keys.every((k) => JSON.stringify(beforeObj[k]) === JSON.stringify(afterObj[k])) ? (
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', pl: 1 }}>
              No modified fields recorded.
            </Typography>
          </Grid>
        ) : null}
      </Grid>
    </Box>
  );
};

/**
 * Expandable Row displaying individual log details.
 */
const Row = ({ log }) => {
  const [open, setOpen] = useState(false);
  const theme = useTheme();

  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return theme.palette.brass[500];
      case 'COLLEGE_ADMIN':
        return '#0288d1';
      case 'HOD':
        return '#7b1fa2';
      case 'FACULTY':
        return '#388e3c';
      default:
        return '#616161';
    }
  };

  const formatActionName = (action) => {
    return action
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  const formatTargetRef = (logItem) => {
    if (!logItem.targetModel) return 'System';
    let label = logItem.targetModel;
    if (logItem.after?.name) {
      label += `: ${logItem.after.name}`;
    } else if (logItem.after?.title) {
      label += `: ${logItem.after.title}`;
    } else if (logItem.after?.academicYear) {
      label += `: ${logItem.after.academicYear}`;
    } else if (logItem.targetId) {
      label += ` (ID: ${logItem.targetId.substring(18)})`;
    }
    return label;
  };

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Tooltip title={new Date(log.timestamp).toLocaleString()} arrow>
            <Typography variant="body2" sx={{ cursor: 'pointer', borderBottom: '1px dotted grey', display: 'inline' }}>
              {getRelativeTime(log.timestamp)}
            </Typography>
          </Tooltip>
        </TableCell>
        <TableCell>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {log.actorId?.name || 'Deleted Actor'}
            </Typography>
            {log.actorId?.role && (
              <Chip
                label={log.actorId.role.replace('_', ' ')}
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  bgcolor: getRoleColor(log.actorId.role),
                  color: '#ffffff',
                  mt: 0.5,
                }}
              />
            )}
          </Box>
        </TableCell>
        <TableCell>
          <Chip
            label={formatActionName(log.action)}
            variant="outlined"
            size="small"
            sx={{ fontWeight: 600, color: theme.palette.ink[900], borderColor: 'rgba(28, 46, 69, 0.2)' }}
          />
        </TableCell>
        <TableCell>
          <Typography variant="body2" color="text.secondary">
            {formatTargetRef(log)}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
            {log.ipAddress || 'N/A'}
          </Typography>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2, mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom component="div" sx={{ fontWeight: 700, mb: 1.5 }}>
                Field Differences Diff
              </Typography>
              <JsonDiffViewer before={log.before} after={log.after} />
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

export const AuditLogViewer = () => {
  const theme = useTheme();
  const [page, setPage] = useState(1);
  const limit = 10;

  // Filter state values
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [targetModel, setTargetModel] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Queries
  const { data: actionsList, isLoading: loadingActions } = useAuditActionsQuery();
  
  const {
    data: logsData,
    isLoading: loadingLogs,
    error,
    refetch,
  } = useAuditLogsQuery({
    page,
    limit,
    search: search || undefined,
    action: action || undefined,
    targetModel: targetModel || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const handleResetFilters = () => {
    setSearch('');
    setAction('');
    setTargetModel('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          Failed to load audit logs.
        </Alert>
      </Box>
    );
  }

  const logs = logsData?.logs || [];
  const total = logsData?.total || 0;
  const pageCount = Math.ceil(total / limit);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, p: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontFamily: theme.typography.h1.fontFamily,
              fontWeight: 700,
              color: theme.palette.ink[900],
              mb: 0.5,
            }}
          >
            Audit Logs Trail
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Trace administrative updates, config settings modifications, notices updates, and authorization logs.
          </Typography>
        </Box>
        <IconButton onClick={() => refetch()} title="Refresh Logs" sx={{ border: `1px solid ${theme.palette.divider}` }}>
          <Refresh />
        </IconButton>
      </Box>

      {/* Filter Bar */}
      <Card
        sx={{
          p: 3,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: 'none',
          borderRadius: '12px',
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search actor or action..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              InputProps={{
                startAdornment: <Search fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={2.5}>
            <Select
              fullWidth
              size="small"
              displayEmpty
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(1);
              }}
              disabled={loadingActions}
            >
              <MenuItem value="">All Actions</MenuItem>
              {actionsList?.map((act) => (
                <MenuItem key={act} value={act}>
                  {act.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')}
                </MenuItem>
              ))}
            </Select>
          </Grid>

          <Grid item xs={12} sm={2}>
            <Select
              fullWidth
              size="small"
              displayEmpty
              value={targetModel}
              onChange={(e) => {
                setTargetModel(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">All Target Types</MenuItem>
              <MenuItem value="CollegeProfile">College Profile</MenuItem>
              <MenuItem value="AcademicSession">Academic Session</MenuItem>
              <MenuItem value="Notice">Notice</MenuItem>
              <MenuItem value="User">User / HOD</MenuItem>
            </Select>
          </Grid>

          <Grid item xs={12} sm={1.75}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="From"
              InputLabelProps={{ shrink: true }}
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
            />
          </Grid>

          <Grid item xs={12} sm={1.75}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="To"
              InputLabelProps={{ shrink: true }}
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
            />
          </Grid>

          <Grid item xs={12} sm={1} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={handleResetFilters}
              sx={{ textTransform: 'none', fontWeight: 600, py: 1 }}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Logs Table */}
      <TableContainer
        component={Paper}
        sx={{
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: 'none',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <Table>
          <TableHead sx={{ bgcolor: 'rgba(28, 46, 69, 0.02)' }}>
            <TableRow>
              <TableCell width={50} />
              <TableCell>Timestamp</TableCell>
              <TableCell>Actor</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Target Details</TableCell>
              <TableCell>IP Address</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loadingLogs ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={32} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Loading audit trail...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : logs.length > 0 ? (
              logs.map((log) => <Row key={log._id} log={log} />)
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {total === 0 && search === '' && action === '' && targetModel === '' && dateFrom === '' && dateTo === ''
                      ? 'No activity recorded yet'
                      : 'No matching audit log entries'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try adjusting or clearing your query filters.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination Footer */}
      {pageCount > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={pageCount}
            page={page}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
          />
        </Box>
      )}
    </Box>
  );
};
export default AuditLogViewer;
