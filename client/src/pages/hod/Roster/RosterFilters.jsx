/* eslint-disable */
import React, { useMemo } from 'react';
import { Box, TextField, MenuItem, useTheme } from '@mui/material';
import { useCoursesQuery, useBranchesQuery } from '../../../queries/collegeQueries';

const RosterFilters = ({ filters, onFilterChange, role }) => {
  const theme = useTheme();
  
  const { data: coursesData } = useCoursesQuery();
  const { data: branchesData } = useBranchesQuery();

  const courses = coursesData || [];
  const allBranches = branchesData || [];

  // If a course is selected, only show its branches
  const availableBranches = useMemo(() => {
    if (!filters.course) return allBranches;
    return allBranches.filter(b => b.courseId?._id === filters.course || b.courseId === filters.course);
  }, [allBranches, filters.course]);

  // Determine available semesters based on the selected course's duration
  const availableSemesters = useMemo(() => {
    if (!filters.course) return [];
    const course = courses.find(c => c._id === filters.course);
    if (!course) return [];
    
    // Assuming 2 semesters per year
    const maxSemesters = (course.durationYears || 4) * 2;
    return Array.from({ length: maxSemesters }, (_, i) => i + 1);
  }, [courses, filters.course]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    const newFilters = { ...filters, [field]: value };
    
    // Cascading resets
    if (field === 'course') {
      newFilters.branch = '';
      newFilters.semester = '';
    } else if (field === 'branch') {
      newFilters.semester = '';
    }
    
    onFilterChange(newFilters);
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
      <TextField
        select
        label="Course"
        value={filters.course || ''}
        onChange={handleChange('course')}
        size="small"
        sx={{ minWidth: 150 }}
      >
        <MenuItem value=""><em>All Courses</em></MenuItem>
        {courses.map((course) => (
          <MenuItem key={course._id} value={course._id}>
            {course.name} ({course.code})
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label="Branch"
        value={filters.branch || ''}
        onChange={handleChange('branch')}
        size="small"
        sx={{ minWidth: 150 }}
        disabled={!filters.course && availableBranches.length === 0}
      >
        <MenuItem value=""><em>All Branches</em></MenuItem>
        {availableBranches.map((branch) => (
          <MenuItem key={branch._id} value={branch._id}>
            {branch.name}
          </MenuItem>
        ))}
      </TextField>

      {/* Semester filter is most relevant for Students */}
      {role === 'STUDENT' && (
        <>
          <TextField
            select
            label="Semester"
            value={filters.semester || ''}
            onChange={handleChange('semester')}
            size="small"
            sx={{ minWidth: 120 }}
            disabled={!filters.course}
          >
            <MenuItem value=""><em>All Sems</em></MenuItem>
            {availableSemesters.map((sem) => (
              <MenuItem key={sem} value={sem}>
                Semester {sem}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Group"
            placeholder="e.g. G1, A"
            value={filters.group || ''}
            onChange={handleChange('group')}
            size="small"
            sx={{ minWidth: 100, width: 120 }}
            disabled={!filters.semester}
          />
        </>
      )}
    </Box>
  );
};

export default RosterFilters;
