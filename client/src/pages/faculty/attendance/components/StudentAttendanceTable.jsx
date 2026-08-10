// client/src/pages/faculty/attendance/components/StudentAttendanceTable.jsx
//
// Interactive student list where faculty marks attendance.
// Features live search, status filtering tabs, student avatar badges,
// row highlight tints, and bulk status actions.

import React, { useState, useMemo } from 'react';
import {
  Paper,
  Typography,
  Box,
  Chip,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  ToggleButtonGroup,
  ToggleButton,
  Button,
  ButtonGroup,
  TextField,
  InputAdornment,
  Avatar,
  Tooltip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  HowToReg as HeaderIcon,
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  MedicalServices as MedicalIcon,
  Badge as DutyIcon,
  Search as SearchIcon,
  RestartAlt as ClearSearchIcon,
} from '@mui/icons-material';

import { ATTENDANCE_STATUS } from '../attendanceConstants';

/**
 * Maps status values to MUI icons for buttons and tabs.
 */
const STATUS_ICONS = {
  PRESENT: <PresentIcon sx={{ fontSize: 16 }} />,
  ABSENT: <AbsentIcon sx={{ fontSize: 16 }} />,
  MEDICAL_LEAVE: <MedicalIcon sx={{ fontSize: 16 }} />,
  DUTY_LEAVE: <DutyIcon sx={{ fontSize: 16 }} />,
};

/**
 * Helper to derive 2-letter uppercase initials from student name.
 */
const getInitials = (name = '') => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return 'ST';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const StudentAttendanceTable = ({
  students = [],
  attendanceRecords = {},
  onStatusChange,
  onMarkAll,
  disabled = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');

  // Compute status counts for filter badges
  const filterCounts = useMemo(() => {
    const counts = { ALL: students.length, PRESENT: 0, ABSENT: 0, MEDICAL_LEAVE: 0, DUTY_LEAVE: 0 };
    students.forEach((s) => {
      const status = attendanceRecords[s.id] || 'PRESENT';
      if (counts[status] !== undefined) counts[status]++;
    });
    return counts;
  }, [students, attendanceRecords]);

  // Filter students based on search query and selected filter tab
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const currentStatus = attendanceRecords[student.id] || 'PRESENT';
      
      // Filter by status tab
      if (activeFilter !== 'ALL' && currentStatus !== activeFilter) {
        return false;
      }
      
      // Search by name or roll number
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = student.name?.toLowerCase().includes(query);
        const matchesRoll = student.rollNumber?.toLowerCase().includes(query);
        return matchesName || matchesRoll;
      }
      
      return true;
    });
  }, [students, attendanceRecords, activeFilter, searchQuery]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: '100%',
        borderRadius: '16px',
        border: `1px solid ${theme.palette.divider}`,
        background: theme.palette.background.paper,
      }}
    >
      {/* ── 1. Header & Bulk Actions Toolbar ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          mb: 2.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: `${theme.palette.primary.main}15`,
              color: theme.palette.primary.main,
            }}
          >
            <HeaderIcon fontSize="small" />
          </Avatar>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
                Student Attendance Roster
              </Typography>
              <Chip
                label={`${students.length} Total`}
                size="small"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  height: 22,
                  bgcolor: `${theme.palette.primary.main}12`,
                  color: theme.palette.primary.main,
                }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary">
              Toggle statuses individually or perform bulk operations for the batch
            </Typography>
          </Box>
        </Box>

        {/* Bulk Action Buttons */}
        <ButtonGroup
          size="small"
          variant="outlined"
          disabled={disabled || students.length === 0}
          sx={{ borderRadius: '8px' }}
        >
          {ATTENDANCE_STATUS.map((status) => (
            <Tooltip key={status.value} title={`Mark all ${students.length} students as ${status.label}`}>
              <Button
                onClick={() => onMarkAll(status.value)}
                startIcon={STATUS_ICONS[status.value]}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  borderColor: `${status.color}40`,
                  color: status.color,
                  '&:hover': {
                    borderColor: status.color,
                    bgcolor: `${status.color}15`,
                  },
                }}
              >
                All {status.label}
              </Button>
            </Tooltip>
          ))}
        </ButtonGroup>
      </Box>

      {/* ── 2. Search & Status Filter Controls ── */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          mb: 2.5,
          p: 1.5,
          borderRadius: '12px',
          bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        {/* Live Search Input */}
        <TextField
          size="small"
          placeholder="Search student by name or roll no..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={disabled || students.length === 0}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <Button
                  size="small"
                  onClick={() => setSearchQuery('')}
                  sx={{ minWidth: 'auto', p: 0.5, color: 'text.secondary' }}
                >
                  <ClearSearchIcon fontSize="small" />
                </Button>
              </InputAdornment>
            ),
          }}
          sx={{
            width: { xs: '100%', sm: 300 },
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              bgcolor: theme.palette.background.paper,
            },
          }}
        />

        {/* Filter Chips */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Chip
            clickable
            size="small"
            label={`All (${filterCounts.ALL})`}
            onClick={() => setActiveFilter('ALL')}
            sx={{
              fontWeight: 700,
              fontSize: '0.72rem',
              borderRadius: '6px',
              bgcolor: activeFilter === 'ALL' ? theme.palette.primary.main : `${theme.palette.text.primary}0D`,
              color: activeFilter === 'ALL' ? '#ffffff' : 'text.primary',
              '&:hover': {
                bgcolor: activeFilter === 'ALL' ? theme.palette.primary.dark : `${theme.palette.text.primary}1A`,
              },
            }}
          />
          {ATTENDANCE_STATUS.map((status) => {
            const isActive = activeFilter === status.value;
            const count = filterCounts[status.value] || 0;
            return (
              <Chip
                key={status.value}
                clickable
                size="small"
                icon={STATUS_ICONS[status.value]}
                label={`${status.shortLabel} (${count})`}
                onClick={() => setActiveFilter(status.value)}
                sx={{
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  borderRadius: '6px',
                  bgcolor: isActive ? status.color : `${status.color}15`,
                  color: isActive ? '#ffffff' : status.color,
                  border: `1px solid ${isActive ? status.color : `${status.color}30`}`,
                  '& .MuiChip-icon': {
                    color: isActive ? '#ffffff !important' : `${status.color} !important`,
                  },
                  '&:hover': {
                    bgcolor: isActive ? status.color : `${status.color}25`,
                  },
                }}
              />
            );
          })}
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* ── 3. Table / Empty States ── */}
      {students.length === 0 ? (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.secondary' }}>
            No students enrolled or loaded
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            Please select a valid subject, section, and date from the controls panel above.
          </Typography>
        </Box>
      ) : filteredStudents.length === 0 ? (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
            No matching students found
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, mb: 2 }}>
            {`No student matches the search filter "${searchQuery}" or status "${activeFilter}".`}
          </Typography>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setSearchQuery('');
              setActiveFilter('ALL');
            }}
            sx={{ borderRadius: '8px', textTransform: 'none' }}
          >
            Clear Filters
          </Button>
        </Box>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)' }}>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', width: 55, py: 1.5 }}>
                  #
                </TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', width: 140, py: 1.5 }}>
                  Roll Number
                </TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', py: 1.5 }}>
                  Student Name
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', width: 220, py: 1.5 }}>
                  Attendance Status
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredStudents.map((student, index) => {
                const currentStatus = attendanceRecords[student.id] || 'PRESENT';
                const statusMeta = ATTENDANCE_STATUS.find((s) => s.value === currentStatus) || ATTENDANCE_STATUS[0];
                const initials = getInitials(student.name);

                return (
                  <TableRow
                    key={student.id}
                    sx={{
                      transition: 'all 0.15s ease',
                      borderLeft: `4px solid ${statusMeta.color}`,
                      bgcolor:
                        currentStatus === 'ABSENT'
                          ? isDark ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.04)'
                          : currentStatus === 'MEDICAL_LEAVE'
                          ? isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.04)'
                          : currentStatus === 'DUTY_LEAVE'
                          ? isDark ? 'rgba(249, 115, 22, 0.08)' : 'rgba(249, 115, 22, 0.04)'
                          : isDark ? 'rgba(16, 185, 129, 0.03)' : 'rgba(16, 185, 129, 0.01)',
                      '&:hover': {
                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.03)',
                      },
                    }}
                  >
                    {/* Index */}
                    <TableCell sx={{ py: 1.25 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.78rem' }}>
                        {index + 1}
                      </Typography>
                    </TableCell>

                    {/* Roll Number */}
                    <TableCell sx={{ py: 1.25 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 700,
                          fontFamily: theme.typography.mono?.fontFamily || 'monospace',
                          fontSize: '0.8rem',
                          color: 'text.primary',
                        }}
                      >
                        {student.rollNumber}
                      </Typography>
                    </TableCell>

                    {/* Student Avatar & Name */}
                    <TableCell sx={{ py: 1.25 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            bgcolor: `${statusMeta.color}20`,
                            color: statusMeta.color,
                            border: `1px solid ${statusMeta.color}40`,
                          }}
                        >
                          {initials}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem', color: 'text.primary' }}>
                            {student.name}
                          </Typography>
                          {student.email && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              {student.email}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Status Toggle Group */}
                    <TableCell align="right" sx={{ py: 1.25 }}>
                      <ToggleButtonGroup
                        exclusive
                        value={currentStatus}
                        onChange={(_event, newStatus) => {
                          if (newStatus !== null) {
                            onStatusChange(student.id, newStatus);
                          }
                        }}
                        disabled={disabled}
                        size="small"
                        sx={{ height: 32 }}
                      >
                        {ATTENDANCE_STATUS.map((status) => {
                          const isActive = currentStatus === status.value;
                          return (
                            <ToggleButton
                              key={status.value}
                              value={status.value}
                              aria-label={status.label}
                              sx={{
                                px: 1.5,
                                py: 0.25,
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                minWidth: 40,
                                textTransform: 'none',
                                border: '1px solid',
                                borderColor: isActive ? `${status.color} !important` : 'divider',
                                bgcolor: isActive ? `${status.color} !important` : 'transparent',
                                color: isActive ? '#ffffff !important' : status.color,
                                transition: 'all 0.15s ease',
                                '&:hover': {
                                  bgcolor: isActive ? status.color : `${status.color}20`,
                                },
                              }}
                            >
                              {status.shortLabel}
                            </ToggleButton>
                          );
                        })}
                      </ToggleButtonGroup>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      )}
    </Paper>
  );
};

export default StudentAttendanceTable;

