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
  DownloadOutlined,
  ShieldOutlined,
  VerifiedUserOutlined,
  FolderOpenOutlined,
  HistoryToggleOffOutlined,
  ContentCopyOutlined,
} from '@mui/icons-material';

import {
  useAuditLogsQuery,
  useAuditActionsQuery,
  useAuditTargetModelsQuery,
} from '../../../queries/auditLogQueries';
import { useToast } from '../../../contexts/ToastContext';

/**
 * Custom Component to display structural highlights of modified fields.
 */
const JsonDiffViewer = ({ before, after }) => {
  const theme = useTheme();
  const { showToast } = useToast();
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

  const copyPayloadJson = () => {
    const fullPayload = JSON.stringify({ before, after }, null, 2);
    navigator.clipboard.writeText(fullPayload);
    showToast('Audit log payload copied to clipboard.');
  };

  return (
    <Box
      sx={{
        p: 2.5,
        bgcolor: theme.custom?.surface?.sunken || 'rgba(0,0,0,0.02)',
        borderRadius: '12px',
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 700, letterSpacing: '0.5px', fontFamily: theme.typography.mono.fontFamily }}
        >
          {!before ? 'CREATION EVENT (INITIAL PAYLOAD SNAPSHOT)' : 'STRUCTURAL FIELD DIFFERENCE TRAIL'}
        </Typography>
        <Button
          size="small"
          startIcon={<ContentCopyOutlined sx={{ fontSize: '0.85rem !important' }} />}
          onClick={copyPayloadJson}
          sx={{ textTransform: 'none', fontSize: '0.72rem', fontWeight: 700 }}
        >
          Copy JSON Payload
        </Button>
      </Box>
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
            bgColor = 'rgba(16, 185, 129, 0.08)';
            borderColor = theme.palette.signal?.success || '#10b981';
            textColor = theme.palette.signal?.success || '#10b981';
            label = 'Added';
          } else if (isRemoved) {
            bgColor = 'rgba(239, 68, 68, 0.08)';
            borderColor = theme.palette.signal?.error || '#ef4444';
            textColor = theme.palette.signal?.error || '#ef4444';
            label = 'Deleted';
          } else if (isModified) {
            bgColor = 'rgba(184, 134, 62, 0.08)';
            borderColor = theme.palette.brass?.[500] || '#b8863e';
            textColor = theme.palette.brass?.[500] || '#b8863e';
            label = 'Modified';
          } else {
            return null;
          }

          return (
            <Grid item xs={12} key={key}>
              <Box
                sx={{
                  p: 1.5,
                  px: 2,
                  bgcolor: bgColor,
                  borderRadius: '8px',
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
                  <Typography variant="body2" sx={{ fontFamily: theme.typography.mono.fontFamily, fontWeight: 700, color: textColor }}>
                    {key}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    pl: 2,
                    fontFamily: theme.typography.mono.fontFamily,
                    fontSize: '0.82rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {isModified ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Box component="span" sx={{ color: theme.palette.signal?.error || '#ef4444', textDecoration: 'line-through' }}>
                        - {formatVal(beforeVal)}
                      </Box>
                      <Box component="span" sx={{ color: theme.palette.signal?.success || '#10b981' }}>
                        + {formatVal(afterVal)}
                      </Box>
                    </Box>
                  ) : isRemoved ? (
                    <Box component="span" sx={{ color: theme.palette.signal?.error || '#ef4444' }}>
                      {formatVal(beforeVal)}
                    </Box>
                  ) : (
                    <Box component="span" sx={{ color: theme.palette.signal?.success || '#10b981' }}>
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
              No modified fields recorded in payload diff.
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
        return theme.palette.brass?.[500] || '#b8863e';
      case 'COLLEGE_ADMIN':
        return theme.palette.primary.main;
      case 'HOD':
        return '#8b5cf6';
      case 'FACULTY':
        return '#10b981';
      default:
        return '#6b7280';
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
    const model = logItem.targetModel;
    
    // 1. If targetUser details were populated from backend lookup
    if (logItem.targetUser?.name || logItem.targetUser?.email) {
      const u = logItem.targetUser;
      const label = u.name ? (u.email ? `${u.name} (${u.email})` : u.name) : u.email;
      return `${model}: ${label}`;
    }
    
    // 2. Inspect after or before snapshots for descriptive identifier
    const data = (logItem.after && Object.keys(logItem.after).length > 0) ? logItem.after : (logItem.before || {});
    const descriptor = data.name || data.title || data.email || data.academicYear || data.rollNumber;
    
    if (descriptor) {
      return `${model}: ${descriptor}`;
    }
    
    if (logItem.targetId) {
      return `${model} (${logItem.targetId})`;
    }
    return model;
  };

  const formatExactTimestamp = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  return (
    <>
      <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Tooltip title={formatExactTimestamp(log.timestamp)} arrow>
            <Typography variant="body2" sx={{ cursor: 'pointer', borderBottom: '1px dotted grey', display: 'inline', fontFamily: theme.typography.mono.fontFamily, fontSize: '0.8rem' }}>
              {getRelativeTime(log.timestamp)}
            </Typography>
          </Tooltip>
        </TableCell>
        <TableCell>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {log.actorId?.name || 'System / Auto'}
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
            size="small"
            sx={{ fontWeight: 700, fontSize: '0.7rem', color: theme.palette.primary.main, bgcolor: `${theme.palette.primary.main}15` }}
          />
        </TableCell>
        <TableCell>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
            {formatTargetRef(log)}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: theme.typography.mono.fontFamily, fontSize: '0.78rem' }}>
            {formatExactTimestamp(log.timestamp)}
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
  const isDark = theme.palette.mode === 'dark';
  const { showToast } = useToast();
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
  const { data: targetModelsList, isLoading: loadingTargets } = useAuditTargetModelsQuery();

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

  const applyPresetFilter = (presetType) => {
    handleResetFilters();
    if (presetType === 'security') {
      setAction('COLLEGE_PROFILE_UPDATED');
    } else if (presetType === 'certificates') {
      setAction('CERTIFICATE_GENERATED');
    } else if (presetType === 'promotions') {
      setAction('BULK_SEMESTER_PROMOTION');
    } else if (presetType === 'notices') {
      setTargetModel('Notice');
    }
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const exportAuditCsv = () => {
    const logs = logsData?.logs || [];
    if (logs.length === 0) {
      showToast('No audit log entries to export.', { severity: 'error' });
      return;
    }

    const headers = ['Timestamp', 'Actor', 'Role', 'Action', 'Target Model', 'Target ID', 'IP Address'];
    const rows = logs.map((log) => [
      `"${new Date(log.timestamp).toISOString()}"`,
      `"${log.actorId?.name || 'System'}"`,
      `"${log.actorId?.role || 'N/A'}"`,
      `"${log.action}"`,
      `"${log.targetModel || 'N/A'}"`,
      `"${log.targetId || 'N/A'}"`,
      `"${log.ipAddress || '127.0.0.1'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_trail_export_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Audit trail exported as CSV successfully.');
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, pb: 6 }}>
      {/* ── 1. Glassmorphic Luxury Header Bar ────────────────────────────── */}
      <Card
        sx={{
          p: 3.5,
          borderRadius: '22px',
          border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
          background: isDark
            ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.12) 0%, rgba(16, 185, 129, 0.06) 100%)'
            : 'linear-gradient(135deg, rgba(79, 70, 229, 0.06) 0%, rgba(16, 185, 129, 0.04) 100%)',
          backdropFilter: 'blur(12px)',
          boxShadow: theme.custom?.elevation?.raised || '0 8px 24px rgba(0,0,0,0.03)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2.5,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
            <Chip
              icon={<ShieldOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
              label="IMMUTABLE SECURITY AUDIT STREAM"
              size="small"
              sx={{
                bgcolor: `${theme.palette.primary.main}15`,
                color: theme.palette.primary.main,
                fontFamily: theme.typography.mono?.fontFamily || 'monospace',
                fontWeight: 800,
                fontSize: '0.68rem',
                letterSpacing: '0.06em',
                borderRadius: '8px',
              }}
            />
            <Chip
              label={`${total} Entries Logged`}
              size="small"
              sx={{
                bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
                border: `1px solid ${theme.palette.divider}`,
                fontFamily: theme.typography.mono?.fontFamily || 'monospace',
                fontSize: '0.72rem',
                fontWeight: 700,
                borderRadius: '6px',
              }}
            />
          </Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 800,
              color: 'text.primary',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              mb: 0.5,
            }}
          >
            Audit Logs &amp; Security Trail
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              maxWidth: 680,
            }}
          >
            Trace administrative operations, security policy updates, notice broadcasts, and student promotion history with cryptographic immutability.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<DownloadOutlined />}
            onClick={exportAuditCsv}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: '10px',
              px: 2.5,
              height: '42px',
              borderColor: theme.palette.divider,
              bgcolor: theme.palette.background.paper,
            }}
          >
            Export CSV
          </Button>
          <Tooltip title="Refresh Audit Stream" arrow>
            <IconButton
              onClick={() => refetch()}
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: '10px',
                width: 42,
                height: 42,
                bgcolor: theme.palette.background.paper,
              }}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Card>

      {/* ── 2. Top Summary KPI Cards ─────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: '18px',
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: 'none',
              bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
              borderTop: `4px solid ${theme.palette.primary.main}`,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              transition: 'all 0.25s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: isDark ? '0 12px 28px rgba(0,0,0,0.3)' : '0 12px 28px rgba(0,0,0,0.06)',
              },
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                bgcolor: `${theme.palette.primary.main}15`,
                color: theme.palette.primary.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HistoryToggleOffOutlined sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', letterSpacing: '0.04em' }}>
                TOTAL AUDIT LOGS
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
                {total} Records
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: '18px',
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: 'none',
              bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
              borderTop: '4px solid #8b5cf6',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              transition: 'all 0.25s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: isDark ? '0 12px 28px rgba(0,0,0,0.3)' : '0 12px 28px rgba(0,0,0,0.06)',
              },
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                bgcolor: '#8b5cf615',
                color: '#8b5cf6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <VerifiedUserOutlined sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', letterSpacing: '0.04em' }}>
                SYSTEM ACTIONS
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
                {actionsList?.length || 0} Action Types
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: '18px',
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: 'none',
              bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
              borderTop: '4px solid #10b981',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              transition: 'all 0.25s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: isDark ? '0 12px 28px rgba(0,0,0,0.3)' : '0 12px 28px rgba(0,0,0,0.06)',
              },
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                bgcolor: '#10b98115',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FolderOpenOutlined sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', letterSpacing: '0.04em' }}>
                AUDITED ENTITIES
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
                {targetModelsList?.length || 4} Entities
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: '18px',
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: 'none',
              bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
              borderTop: `4px solid ${theme.palette.brass?.[500] || '#b8863e'}`,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              transition: 'all 0.25s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: isDark ? '0 12px 28px rgba(0,0,0,0.3)' : '0 12px 28px rgba(0,0,0,0.06)',
              },
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                bgcolor: `${theme.palette.brass?.[500] || '#b8863e'}18`,
                color: theme.palette.brass?.[500] || '#b8863e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldOutlined sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', letterSpacing: '0.04em' }}>
                LOG INTEGRITY
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#10b981', fontSize: '0.95rem' }}>
                100% Immutable
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* ── 3. Filter Bar & Quick Preset Chips ───────────────────────────── */}
      <Card
        sx={{
          p: 3,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: 'none',
          borderRadius: '18px',
          bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
        }}
      >
        {/* Preset Category Chips */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mr: 0.5, fontFamily: theme.typography.mono.fontFamily }}>
            PRESETS:
          </Typography>
          <Chip
            label="All Activity"
            size="small"
            onClick={handleResetFilters}
            variant={!action && !targetModel ? 'filled' : 'outlined'}
            color="primary"
            sx={{ fontWeight: 700, fontSize: '0.72rem' }}
          />
          <Chip
            label="Certificates"
            size="small"
            onClick={() => applyPresetFilter('certificates')}
            variant={action === 'CERTIFICATE_GENERATED' ? 'filled' : 'outlined'}
            color="primary"
            sx={{ fontWeight: 700, fontSize: '0.72rem' }}
          />
          <Chip
            label="Promotions"
            size="small"
            onClick={() => applyPresetFilter('promotions')}
            variant={action === 'BULK_SEMESTER_PROMOTION' ? 'filled' : 'outlined'}
            color="primary"
            sx={{ fontWeight: 700, fontSize: '0.72rem' }}
          />
          <Chip
            label="Profile Updates"
            size="small"
            onClick={() => applyPresetFilter('security')}
            variant={action === 'COLLEGE_PROFILE_UPDATED' ? 'filled' : 'outlined'}
            color="primary"
            sx={{ fontWeight: 700, fontSize: '0.72rem' }}
          />
          <Chip
            label="Notice Broadcasts"
            size="small"
            onClick={() => applyPresetFilter('notices')}
            variant={targetModel === 'Notice' ? 'filled' : 'outlined'}
            color="primary"
            sx={{ fontWeight: 700, fontSize: '0.72rem' }}
          />
        </Box>

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
                  {act.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')}
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
              disabled={loadingTargets}
            >
              <MenuItem value="">All Target Types</MenuItem>
              {(targetModelsList || ['User', 'CollegeProfile', 'AcademicSession', 'Notice', 'Department', 'Course', 'Branch', 'Subject', 'PromotionBatch']).map((modelName) => (
                <MenuItem key={modelName} value={modelName}>
                  {modelName}
                </MenuItem>
              ))}
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

      {/* ── 4. Logs Table ─────────────────────────────────────────────────── */}
      <TableContainer
        component={Paper}
        sx={{
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: 'none',
          borderRadius: '18px',
          overflow: 'hidden',
        }}
      >
        <Table>
          <TableHead sx={{ bgcolor: theme.custom?.surface?.sunken || 'rgba(28, 46, 69, 0.02)' }}>
            <TableRow>
              <TableCell width={50} />
              <TableCell sx={{ fontWeight: 700 }}>TIMESTAMP</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>ACTOR</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>ACTION</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>TARGET DETAILS</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>EXACT TIMESTAMP</TableCell>
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
