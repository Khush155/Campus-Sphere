// client/src/pages/faculty/attendance/components/DateSelector.jsx

import React, { useMemo } from 'react';
import {
  TextField,
  InputAdornment,
} from '@mui/material';
import { CalendarToday as CalendarIcon } from '@mui/icons-material';

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

  const isToday = selectedDate === todayStr;

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
      inputProps={{
        max: todayStr,
        min: minDateStr,
      }}
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
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: '10px',
        },
      }}
    />
  );
};

export default DateSelector;

