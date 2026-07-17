// client/src/pages/faculty/attendance/components/StudentAttendanceTable.jsx
//
// Interactive student list where faculty marks attendance.
// This is the CORE component of the Attendance Module — all other
// components exist to configure what this table displays.
//
// Flow: Subject → Section → Date → THIS TABLE → Summary → Submit
//
// This is a CONTROLLED component:
//   - Parent owns attendanceRecords (a map of studentId → status).
//   - When faculty toggles a student's status, onStatusChange fires.
//   - The parent updates the map, which re-renders this table AND
//     the AttendanceSummaryCard sibling.
//
// Props:
//   students          — array of student objects:
//                        [{ id, name, rollNumber, email }]
//   attendanceRecords — status map:
//                        { [studentId]: 'PRESENT' | 'ABSENT' | 'LATE' }
//   onStatusChange    — per-student callback:
//                        (studentId: string, status: string) => void
//   onMarkAll         — bulk callback:
//                        (status: string) => void
//   disabled          — optional boolean, disables all toggles during submission
//
// Future: students from GET /api/v1/students?sectionId=xxx
//         attendanceRecords from GET /api/v1/attendance?subjectId=xxx&date=xxx

import React from 'react';
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
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  HowToReg as HeaderIcon,
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  MedicalServices as MedicalIcon,
  Badge as DutyIcon,
} from '@mui/icons-material';

import { ATTENDANCE_STATUS } from '../attendanceConstants';

/**
 * Maps status values to MUI icons for the Mark All buttons.
 */
const STATUS_ICONS = {
  PRESENT: <PresentIcon sx={{ fontSize: 16 }} />,
  ABSENT: <AbsentIcon sx={{ fontSize: 16 }} />,
  MEDICAL_LEAVE: <MedicalIcon sx={{ fontSize: 16 }} />,
  DUTY_LEAVE: <DutyIcon sx={{ fontSize: 16 }} />,
};

export const StudentAttendanceTable = ({
  students,
  attendanceRecords,
  onStatusChange,
  onMarkAll,
  disabled = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      {/* ── Section Header ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1.5,
          mb: 2.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HeaderIcon color="primary" />
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: 'text.primary' }}
          >
            Student Attendance
          </Typography>
          <Chip
            label={`${students.length} students`}
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: '0.7rem',
              height: 22,
              bgcolor: 'rgba(79, 70, 229, 0.08)',
              color: 'primary.main',
            }}
          />
        </Box>

        {/* ── Mark All Toolbar ── */}
        <ButtonGroup
          size="small"
          variant="outlined"
          disabled={disabled || students.length === 0}
        >
          {ATTENDANCE_STATUS.map((status) => (
            <Button
              key={status.value}
              onClick={() => onMarkAll(status.value)}
              startIcon={STATUS_ICONS[status.value]}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.75rem',
                borderColor: `${status.color}50`,
                color: status.color,
                '&:hover': {
                  borderColor: status.color,
                  bgcolor: `${status.color}10`,
                },
              }}
            >
              All {status.label}
            </Button>
          ))}
        </ButtonGroup>
      </Box>

      <Divider sx={{ mb: 0 }} />

      {/* ── Empty State ── */}
      {students.length === 0 ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ py: 4, textAlign: 'center' }}
        >
          No students loaded. Select a subject, section, and date above.
        </Typography>
      ) : (
        /* ── Student Table ── */
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                    width: 50,
                  }}
                >
                  #
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                    width: 140,
                  }}
                >
                  Roll Number
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                  }}
                >
                  Student Name
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 700,
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                    width: 160,
                  }}
                >
                  Status
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {students.map((student, index) => {
                const currentStatus =
                  attendanceRecords[student.id] || 'PRESENT';

                return (
                  <TableRow
                    key={student.id}
                    sx={{
                      '&:last-child td': { borderBottom: 0 },
                      // Subtle row tint based on current status
                      bgcolor:
                        currentStatus === 'ABSENT'
                          ? isDark
                            ? 'rgba(239, 68, 68, 0.04)'
                            : 'rgba(239, 68, 68, 0.02)'
                          : currentStatus === 'MEDICAL_LEAVE'
                            ? isDark
                              ? 'rgba(59, 130, 246, 0.04)'
                              : 'rgba(59, 130, 246, 0.02)'
                            : currentStatus === 'DUTY_LEAVE'
                              ? isDark
                                ? 'rgba(249, 115, 22, 0.04)'
                                : 'rgba(249, 115, 22, 0.02)'
                              : 'transparent',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    {/* Serial number */}
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          color: 'text.secondary',
                          fontSize: '0.8rem',
                        }}
                      >
                        {index + 1}
                      </Typography>
                    </TableCell>

                    {/* Roll number */}
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          fontFamily: 'monospace',
                          fontSize: '0.8rem',
                          color: 'text.primary',
                        }}
                      >
                        {student.rollNumber}
                      </Typography>
                    </TableCell>

                    {/* Student name */}
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          color: 'text.primary',
                        }}
                      >
                        {student.name}
                      </Typography>
                    </TableCell>

                    {/* Status toggle */}
                    <TableCell align="right">
                      <ToggleButtonGroup
                        exclusive
                        value={currentStatus}
                        onChange={(_event, newStatus) => {
                          // Prevent deselection — every student must have a status.
                          // ToggleButtonGroup passes null when re-clicking the
                          // active button. We simply discard it.
                          if (newStatus !== null) {
                            onStatusChange(student.id, newStatus);
                          }
                        }}
                        disabled={disabled}
                        size="small"
                        sx={{ height: 30 }}
                      >
                        {ATTENDANCE_STATUS.map((status) => {
                          const isActive = currentStatus === status.value;
                          return (
                            <ToggleButton
                              key={status.value}
                              value={status.value}
                              aria-label={status.label}
                              sx={{
                                px: 1.25,
                                py: 0.25,
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                minWidth: 36,
                                textTransform: 'none',
                                border: '1px solid',
                                borderColor: isActive
                                  ? `${status.color} !important`
                                  : 'divider',
                                bgcolor: isActive
                                  ? `${status.color} !important`
                                  : 'transparent',
                                color: isActive
                                  ? '#fff !important'
                                  : status.color,
                                '&:hover': {
                                  bgcolor: isActive
                                    ? status.color
                                    : `${status.color}15`,
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
