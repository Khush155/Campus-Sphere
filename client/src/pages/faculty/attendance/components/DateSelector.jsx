// client/src/pages/faculty/attendance/components/DateSelector.jsx
//
// Date picker for selecting which day to mark attendance for.
// This is Step 3 of the attendance flow:
//   Subject → Section → Date → Students → Mark → Submit
//
// Constraints:
//   - Future dates are disabled (cannot mark attendance for tomorrow)
//   - Past dates allowed within a configurable window (default: 7 days)
//   - Defaults to today (set by parent, not this component)
//
// This is a CONTROLLED component:
//   - Parent owns selectedDate and passes it down.
//   - When the user picks a date, onDateChange fires.
//   - The parent uses the date to determine fresh vs. edit mode.
//
// Props:
//   selectedDate    — string in 'YYYY-MM-DD' format (ISO date)
//   onDateChange    — callback: (date: string) => void
//   disabled        — optional boolean, disabled until section is selected
//   maxPastDays     — optional number, how many days back are allowed
//                     (default: 7, set to 0 for today-only)
//
// Future: No API integration needed — this is a pure input component.
// The DATE it produces is used by the parent to fetch records via
// GET /api/v1/attendance?subjectId=xxx&date=YYYY-MM-DD

import React, { useMemo } from 'react';
import {
  TextField,
  InputAdornment,
} from '@mui/material';
import { CalendarToday as CalendarIcon } from '@mui/icons-material';

/**
 * Formats a Date object to 'YYYY-MM-DD' string (local timezone).
 * Uses local date parts instead of toISOString() to avoid
 * UTC timezone shifts (e.g., midnight IST → previous day UTC).
 */
const formatDateToISO = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const DateSelector = ({
  selectedDate,
  onDateChange,
  disabled = false,
  maxPastDays = 7,
}) => {
  // Compute date boundaries once per render.
  // These don't change during a single session.
  const { todayStr, minDateStr } = useMemo(() => {
    const today = new Date();
    const minDate = new Date();
    minDate.setDate(today.getDate() - maxPastDays);

    return {
      todayStr: formatDateToISO(today),
      minDateStr: formatDateToISO(minDate),
    };
  }, [maxPastDays]);

  const handleChange = (event) => {
    onDateChange(event.target.value);
  };

  // Determine if selected date is today (for helper text)
  const isToday = selectedDate === todayStr;

  // Build contextual helper text
  const getHelperText = () => {
    if (!selectedDate) {
      return 'Select the attendance date';
    }
    if (isToday) {
      return 'Marking attendance for today';
    }
    return 'Editing past attendance';
  };

  return (
    <TextField
      type="date"
      fullWidth
      label="Attendance Date"
      value={selectedDate}
      onChange={handleChange}
      disabled={disabled}
      helperText={getHelperText()}
      // Native date input constraints
      inputProps={{
        max: todayStr,
        min: minDateStr,
      }}
      // Keep label above the field (required for type="date")
      InputLabelProps={{
        shrink: true,
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <CalendarIcon
              fontSize="small"
              sx={{
                color: isToday
                  ? 'primary.main'
                  : selectedDate
                    ? '#f59e0b'
                    : 'text.secondary',
              }}
            />
          </InputAdornment>
        ),
      }}
    />
  );
};

export default DateSelector;
