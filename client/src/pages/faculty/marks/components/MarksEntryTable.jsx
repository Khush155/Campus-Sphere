// client/src/pages/faculty/marks/components/MarksEntryTable.jsx
//
// Presentational component rendering student grade sheets in a structured table.
// Supports inline numeric score entries, text remarks, and absent toggle checks.

import React from 'react';
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
  FormControlLabel,
  Chip,
  Box,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

export const MarksEntryTable = ({
  records = [],
  isEditing = false,
  onMarksChange,
  onRemarksChange,
  onAbsentToggle,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (records.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }} elevation={0}>
        <Typography variant="body1" color="text.secondary">
          No students loaded. Ensure your section has enrolled students.
        </Typography>
      </Paper>
    );
  }

  // Define color mapping for grades
  const getGradeColor = (grade) => {
    switch (grade) {
      case 'O':
      case 'A+':
      case 'A':
        return 'success';
      case 'B+':
      case 'B':
        return 'primary';
      case 'C':
      case 'D':
        return 'warning';
      case 'F':
      default:
        return 'error';
    }
  };

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      variant="outlined"
      sx={{
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden',
        bgcolor: isDark ? 'background.paper' : '#ffffff',
      }}
    >
      <Table sx={{ minWidth: 650 }}>
        {/* Table Head */}
        <TableHead
          sx={{
            bgcolor: isDark ? 'action.hover' : 'rgba(79, 70, 229, 0.04)',
            borderBottom: `2px solid ${theme.palette.divider}`,
          }}
        >
          <TableRow>
            <TableCell sx={{ fontWeight: 800, width: '15%' }}>Roll Number</TableCell>
            <TableCell sx={{ fontWeight: 800, width: '25%' }}>Student Name</TableCell>
            <TableCell align="center" sx={{ fontWeight: 800, width: '15%' }}>Absent</TableCell>
            <TableCell align="center" sx={{ fontWeight: 800, width: '15%' }}>Marks Obtained</TableCell>
            <TableCell align="center" sx={{ fontWeight: 800, width: '10%' }}>Grade</TableCell>
            <TableCell sx={{ fontWeight: 800, width: '20%' }}>Remarks / Feedback</TableCell>
          </TableRow>
        </TableHead>

        {/* Table Body */}
        <TableBody>
          {records.map((row) => {
            const isAbsent = row.marksObtained === null;

            return (
              <TableRow
                key={row.studentId}
                hover
                sx={{
                  bgcolor: isAbsent ? (isDark ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.02)') : 'inherit',
                  transition: 'background-color 0.2s ease',
                }}
              >
                {/* Roll Number */}
                <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                  {row.rollNumber}
                </TableCell>

                {/* Student Name */}
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    {row.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {row.email}
                  </Typography>
                </TableCell>

                {/* Absent Checkbox */}
                <TableCell align="center">
                  <Checkbox
                    checked={isAbsent}
                    onChange={(e) => onAbsentToggle(row.studentId, e.target.checked)}
                    disabled={!isEditing}
                    color="error"
                    size="small"
                  />
                </TableCell>

                {/* Marks Obtained Input */}
                <TableCell align="center">
                  {isEditing ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      <TextField
                        type="number"
                        value={isAbsent ? '' : row.marksObtained ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          onMarksChange(row.studentId, val === '' ? '' : Number(val));
                        }}
                        disabled={isAbsent}
                        placeholder="0"
                        size="small"
                        InputProps={{
                          inputProps: { min: 0, max: row.maxMarks },
                        }}
                        sx={{
                          width: 80,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 1.5,
                            fontWeight: 700,
                            textAlign: 'center',
                          },
                        }}
                        error={!isAbsent && (row.marksObtained < 0 || row.marksObtained > row.maxMarks)}
                      />
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        / {row.maxMarks}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ fontWeight: 800, color: isAbsent ? 'error.main' : 'text.primary' }}>
                      {isAbsent ? 'ABSENT' : `${row.marksObtained} / ${row.maxMarks}`}
                    </Typography>
                  )}
                </TableCell>

                {/* Grade display */}
                <TableCell align="center">
                  {isAbsent ? (
                    <Chip label="F" size="small" color="error" variant="outlined" sx={{ fontWeight: 800 }} />
                  ) : row.grade ? (
                    <Chip
                      label={row.grade}
                      size="small"
                      color={getGradeColor(row.grade)}
                      sx={{ fontWeight: 800, minWidth: 32 }}
                    />
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      -
                    </Typography>
                  )}
                </TableCell>

                {/* Remarks Input */}
                <TableCell>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      value={row.remarks || ''}
                      onChange={(e) => onRemarksChange(row.studentId, e.target.value)}
                      disabled={isAbsent}
                      placeholder={isAbsent ? 'Absent' : 'Add feedback...'}
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1.5,
                          fontSize: '0.82rem',
                        },
                      }}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: isAbsent ? 'italic' : 'normal' }}>
                      {isAbsent ? 'Absent' : row.remarks || '-'}
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default MarksEntryTable;
