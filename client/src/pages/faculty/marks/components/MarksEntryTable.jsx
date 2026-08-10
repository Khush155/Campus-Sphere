// client/src/pages/faculty/marks/components/MarksEntryTable.jsx
//
// Presentational component rendering student grade sheets in a structured table.
// Features live search, student avatar badges, letter grade pills, and row highlights.

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Typography,
  Checkbox,
  Chip,
  Box,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Avatar,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Edit as EditIcon,
  AddComment as AddCommentIcon,
  Search as SearchIcon,
  RestartAlt as ClearSearchIcon,
} from '@mui/icons-material';

/**
 * Helper to derive 2-letter uppercase initials from student name.
 */
const getInitials = (name = '') => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return 'ST';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Color and styling mapping for letter grades.
 */
const getGradeBadgeProps = (grade, isAbsent) => {
  if (isAbsent) return { label: 'ABSENT', color: '#ef4444', bgcolor: 'rgba(239, 68, 68, 0.12)' };
  switch (grade) {
    case 'O':
    case 'A+':
      return { label: grade, color: '#10b981', bgcolor: 'rgba(16, 185, 129, 0.15)' };
    case 'A':
    case 'B+':
      return { label: grade, color: '#3b82f6', bgcolor: 'rgba(59, 130, 246, 0.15)' };
    case 'B':
    case 'C':
      return { label: grade, color: '#f59e0b', bgcolor: 'rgba(245, 158, 11, 0.15)' };
    case 'F':
    default:
      return { label: grade || 'F', color: '#ef4444', bgcolor: 'rgba(239, 68, 68, 0.15)' };
  }
};

export const MarksEntryTable = ({
  records = [],
  onRecordChange,
  onMarksChange,
  onRemarksChange,
  onAbsentToggle,
  disabled = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedStudentName, setSelectedStudentName] = useState('');
  const [tempFeedback, setTempFeedback] = useState('');

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const q = searchQuery.toLowerCase().trim();
    return records.filter(
      (r) => r.name?.toLowerCase().includes(q) || r.rollNumber?.toLowerCase().includes(q)
    );
  }, [records, searchQuery]);

  const handleScoreChange = (studentId, value) => {
    if (onRecordChange) {
      onRecordChange(studentId, 'marksObtained', value);
    } else if (onMarksChange) {
      onMarksChange(studentId, value);
    }
  };

  const handleAbsentChange = (studentId, isAbsent) => {
    if (onRecordChange) {
      onRecordChange(studentId, 'marksObtained', isAbsent ? null : 0);
    } else if (onAbsentToggle) {
      onAbsentToggle(studentId, isAbsent);
    }
  };

  const handleRemarksSubmit = () => {
    if (onRecordChange) {
      onRecordChange(selectedStudentId, 'remarks', tempFeedback);
    } else if (onRemarksChange) {
      onRemarksChange(selectedStudentId, tempFeedback);
    }
    setDialogOpen(false);
  };

  const handleOpenFeedback = (studentId, name, currentRemarks) => {
    setSelectedStudentId(studentId);
    setSelectedStudentName(name);
    setTempFeedback(currentRemarks || '');
    setDialogOpen(true);
  };

  if (records.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }} elevation={0}>
        <Typography variant="body1" color="text.secondary">
          No students loaded. Ensure your section has enrolled students.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Search Header Bar */}
      <Box
        sx={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          p: 1.5,
          borderRadius: '12px',
          bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <TextField
          size="small"
          placeholder="Search student by name or roll no..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
            width: { xs: '100%', sm: 320 },
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              bgcolor: theme.palette.background.paper,
            },
          }}
        />

        <Chip
          label={`${filteredRecords.length} / ${records.length} Students Listed`}
          size="small"
          sx={{
            fontWeight: 700,
            fontSize: '0.72rem',
            bgcolor: `${theme.palette.primary.main}12`,
            color: theme.palette.primary.main,
          }}
        />
      </Box>

      {/* Table Container */}
      <TableContainer
        component={Paper}
        elevation={0}
        variant="outlined"
        sx={{
          borderRadius: '14px',
          border: `1px solid ${theme.palette.divider}`,
          overflow: 'hidden',
          bgcolor: theme.palette.background.paper,
        }}
      >
        <Table size="small">
          <TableHead sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', py: 1.5, width: 140 }}>
                Roll Number
              </TableCell>
              <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', py: 1.5 }}>
                Student Name
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', py: 1.5, width: 90 }}>
                Absent
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', py: 1.5, width: 160 }}>
                Score Obtained
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', py: 1.5, width: 90 }}>
                Grade
              </TableCell>
              <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', py: 1.5, width: 220 }}>
                Remarks / Feedback
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700 }}>
                    {`No student matches search query "${searchQuery}"`}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredRecords.map((row) => {
                const isAbsent = row.marksObtained === null;
                const initials = getInitials(row.name);
                const badge = getGradeBadgeProps(row.grade, isAbsent);

                return (
                  <TableRow
                    key={row.studentId}
                    sx={{
                      transition: 'all 0.15s ease',
                      borderLeft: `4px solid ${badge.color}`,
                      bgcolor: isAbsent
                        ? isDark ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.04)'
                        : isDark ? 'rgba(255, 255, 255, 0.01)' : 'transparent',
                      '&:hover': {
                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                      },
                    }}
                  >
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
                        {row.rollNumber}
                      </Typography>
                    </TableCell>

                    {/* Student Name & Avatar */}
                    <TableCell sx={{ py: 1.25 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            bgcolor: `${badge.color}20`,
                            color: badge.color,
                            border: `1px solid ${badge.color}40`,
                          }}
                        >
                          {initials}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem', color: 'text.primary' }}>
                            {row.name}
                          </Typography>
                          {row.email && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              {row.email}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Absent Checkbox */}
                    <TableCell align="center" sx={{ py: 1.25 }}>
                      <Checkbox
                        checked={isAbsent}
                        onChange={(e) => handleAbsentChange(row.studentId, e.target.checked)}
                        disabled={disabled}
                        color="error"
                        size="small"
                      />
                    </TableCell>

                    {/* Score Input */}
                    <TableCell align="center" sx={{ py: 1.25 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <TextField
                          type="number"
                          value={isAbsent ? '' : (row.marksObtained ?? '')}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleScoreChange(row.studentId, val === '' ? '' : Math.max(0, Math.min(row.maxMarks, Number(val))));
                          }}
                          disabled={disabled || isAbsent}
                          placeholder="0"
                          size="small"
                          inputProps={{ min: 0, max: row.maxMarks, style: { textAlign: 'center', fontWeight: 700 } }}
                          sx={{
                            width: 75,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '8px',
                            },
                          }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                          / {row.maxMarks}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Letter Grade Pill */}
                    <TableCell align="center" sx={{ py: 1.25 }}>
                      <Chip
                        label={badge.label}
                        size="small"
                        sx={{
                          fontWeight: 800,
                          fontSize: '0.72rem',
                          height: 24,
                          minWidth: 36,
                          bgcolor: badge.bgcolor,
                          color: badge.color,
                          border: `1px solid ${badge.color}40`,
                        }}
                      />
                    </TableCell>

                    {/* Remarks Input / Button */}
                    <TableCell sx={{ py: 1.25 }}>
                      {isAbsent ? (
                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          Marked Absent
                        </Typography>
                      ) : row.remarks ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem', wordBreak: 'break-word', maxWidth: 160 }}>
                            {row.remarks}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenFeedback(row.studentId, row.name, row.remarks)}
                            disabled={disabled}
                            sx={{ color: theme.palette.primary.main, p: 0.5 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<AddCommentIcon sx={{ fontSize: '0.85rem !important' }} />}
                          onClick={() => handleOpenFeedback(row.studentId, row.name, row.remarks)}
                          disabled={disabled}
                          sx={{
                            textTransform: 'none',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            py: 0.25,
                            px: 1,
                          }}
                        >
                          Feedback
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Feedback Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '14px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Feedback for {selectedStudentName}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Provide custom observations, improvement notes, or comments on this student&apos;s score.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            label="Remarks / Feedback"
            value={tempFeedback}
            onChange={(e) => setTempFeedback(e.target.value)}
            placeholder="Enter feedback..."
            InputProps={{ sx: { borderRadius: '10px' } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            onClick={handleRemarksSubmit}
            variant="contained"
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', px: 3 }}
          >
            Save Feedback
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MarksEntryTable;

