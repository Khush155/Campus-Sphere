/* eslint-disable */
import React, { useState, useMemo } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  useTheme,
  MenuItem,
  CircularProgress,
  Chip,
  Paper,
  Divider,
  Grid,
  Avatar,
} from '@mui/material';
import { CloseOutlined, SchoolOutlined, MenuBookOutlined, FilterListOutlined, ClearOutlined } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import GroupSelect from '../../../components/common/GroupSelect';
import { useSubjectsQuery, useCoursesQuery, useBranchesQuery } from '../../../queries/collegeQueries';
import { useAuth } from '../../../contexts/AuthContext';
import { useUsersQuery } from '../../../queries/userQueries';
import { computeSubjectCode } from '../../../utils/subjectCode';

const assignSchema = z.object({
  subjectId: z.string().min(1, 'Subject is required'),
  facultyId: z.string().min(1, 'Faculty is required'),
  group: z.string().max(20, 'Group too long').optional(),
});

const AssignFacultyDrawer = ({ open, onClose, onSubmit, isSubmitting }) => {
  const theme = useTheme();
  const { user } = useAuth();

  // Drawer-level filters to help HOD quickly locate the right subject
  const [courseFilter, setCourseFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');

  const { control, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm({
    resolver: zodResolver(assignSchema),
    defaultValues: {
      subjectId: '',
      facultyId: '',
      group: '',
    },
  });

  const selectedSubjectId = watch('subjectId');

  const handleClose = () => {
    reset();
    setCourseFilter('');
    setBranchFilter('');
    setSemesterFilter('');
    onClose();
  };

  const submitHandler = async (data) => {
    await onSubmit(data);
    handleClose();
  };

  // Extract clean department ID safely
  const cleanDeptId = typeof user?.departmentId === 'object'
    ? user?.departmentId?._id
    : (user?.departmentId || user?.department?._id || user?.department);

  // Queries
  const { data: rawSubjects, isLoading: loadingSubjects } = useSubjectsQuery(
    cleanDeptId ? { departmentId: cleanDeptId, limit: 200 } : { limit: 200 }
  );

  const { data: coursesData } = useCoursesQuery();
  const { data: branchesData } = useBranchesQuery();
  const { data: facultyRes, isLoading: loadingFaculty } = useUsersQuery(
    cleanDeptId ? { role: 'FACULTY', departmentId: cleanDeptId, limit: 100 } : { role: 'FACULTY', limit: 100 }
  );
  const facultyMembers = Array.isArray(facultyRes) ? facultyRes : (facultyRes?.data || []);

  // Filtered subjects inside drawer based on selected Course, Branch, Semester
  const filteredSubjects = useMemo(() => {
    if (!rawSubjects) return [];
    return rawSubjects.filter((s) => {
      const cId = s.branchId?.courseId?._id || s.branchId?.courseId?.id || s.branchId?.courseId;
      const bId = s.branchId?._id || s.branchId?.id;

      const matchesCourse = !courseFilter || String(cId) === String(courseFilter);
      const matchesBranch = !branchFilter || String(bId) === String(branchFilter);
      const matchesSem = !semesterFilter || String(s.semester) === String(semesterFilter);

      return matchesCourse && matchesBranch && matchesSem;
    });
  }, [rawSubjects, courseFilter, branchFilter, semesterFilter]);

  // Find currently selected subject details
  const selectedSubjectObj = useMemo(() => {
    if (!selectedSubjectId || !rawSubjects) return null;
    return rawSubjects.find((s) => (s._id || s.id) === selectedSubjectId);
  }, [selectedSubjectId, rawSubjects]);

  // Available Courses & Branches for drawer filter dropdowns
  const availableCourses = useMemo(() => {
    if (coursesData && Array.isArray(coursesData)) return coursesData;
    if (!rawSubjects) return [];
    const courseMap = new Map();
    rawSubjects.forEach((s) => {
      const c = s.branchId?.courseId;
      if (c && (c._id || c.id)) courseMap.set(String(c._id || c.id), c);
    });
    return Array.from(courseMap.values());
  }, [coursesData, rawSubjects]);

  const availableBranches = useMemo(() => {
    // 1. Try from branchesData
    const allBranches = Array.isArray(branchesData) ? branchesData : (branchesData?.data || []);
    if (allBranches.length > 0) {
      if (!courseFilter) return allBranches;
      return allBranches.filter((b) => {
        const cId = b.courseId?._id || b.courseId?.id || b.courseId;
        return String(cId) === String(courseFilter);
      });
    }

    // 2. Fallback to rawSubjects
    if (!rawSubjects) return [];
    const branchMap = new Map();
    rawSubjects.forEach((s) => {
      const b = s.branchId;
      if (b && (b._id || b.id)) {
        const cId = b.courseId?._id || b.courseId?.id || b.courseId;
        if (!courseFilter || String(cId) === String(courseFilter)) {
          branchMap.set(String(b._id || b.id), b);
        }
      }
    });
    return Array.from(branchMap.values());
  }, [branchesData, rawSubjects, courseFilter]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 480 },
          maxWidth: '100vw',
          p: 0,
          bgcolor: 'background.default',
          overflowX: 'hidden',
          boxSizing: 'border-box',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          p: 2.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.paper',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          <Avatar sx={{ bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main, width: 36, height: 36, flexShrink: 0 }}>
            <SchoolOutlined fontSize="small" />
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem', truncate: true }}>
              Assign Faculty to Subject
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', truncate: true }}>
              Select cohort, subject, and professor
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={handleClose} size="small" sx={{ flexShrink: 0 }}><CloseOutlined /></IconButton>
      </Box>

      <Box
        component="form"
        onSubmit={handleSubmit(submitHandler)}
        sx={{
          p: 2.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {loadingSubjects || loadingFaculty ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <>
            {/* Step 1: Narrow down Subject Search by Program Filters */}
            <Paper sx={{ p: 2, borderRadius: '12px', bgcolor: `${theme.palette.primary.main}04`, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', width: '100%', boxSizing: 'border-box' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: theme.palette.primary.main, display: 'flex', alignItems: 'center', gap: 0.8, mb: 1.5 }}>
                <FilterListOutlined sx={{ fontSize: 15 }} /> NARROW DOWN SUBJECTS BY COHORT (OPTIONAL)
              </Typography>

              <Grid container spacing={1.5}>
                {/* Course Filter */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Course"
                    value={courseFilter}
                    onChange={(e) => {
                      setCourseFilter(e.target.value);
                      setBranchFilter('');
                      setValue('subjectId', '');
                    }}
                    SelectProps={{
                      MenuProps: { PaperProps: { sx: { maxWidth: 360, maxHeight: 300 } } },
                    }}
                    sx={{ bgcolor: 'background.paper', width: '100%' }}
                  >
                    <MenuItem value="">All Courses</MenuItem>
                    {availableCourses.map((c) => (
                      <MenuItem key={c._id || c.id} value={c._id || c.id} sx={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {c.name} ({c.code})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Branch Filter */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Branch"
                    value={branchFilter}
                    onChange={(e) => {
                      setBranchFilter(e.target.value);
                      setValue('subjectId', '');
                    }}
                    SelectProps={{
                      MenuProps: { PaperProps: { sx: { maxWidth: 360, maxHeight: 300 } } },
                    }}
                    sx={{ bgcolor: 'background.paper', width: '100%' }}
                  >
                    <MenuItem value="">All Branches</MenuItem>
                    {availableBranches.map((b) => (
                      <MenuItem key={b._id || b.id} value={b._id || b.id} sx={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {b.name} ({b.code})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Semester Filter */}
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Semester"
                    value={semesterFilter}
                    onChange={(e) => {
                      setSemesterFilter(e.target.value);
                      setValue('subjectId', '');
                    }}
                    sx={{ bgcolor: 'background.paper', width: '100%' }}
                  >
                    <MenuItem value="">All Semesters (1 - 8)</MenuItem>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <MenuItem key={sem} value={sem}>
                        Semester {sem}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>

              {(courseFilter || branchFilter || semesterFilter) && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Showing <strong>{filteredSubjects.length}</strong> matching subjects
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => {
                      setCourseFilter('');
                      setBranchFilter('');
                      setSemesterFilter('');
                    }}
                    startIcon={<ClearOutlined fontSize="small" />}
                    sx={{ fontSize: '0.7rem', py: 0, textTransform: 'none' }}
                  >
                    Reset Filters
                  </Button>
                </Box>
              )}
            </Paper>

            {/* Step 2: Subject Selection Dropdown */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                1. Select Curriculum Subject *
              </Typography>
              <Controller
                name="subjectId"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    size="small"
                    error={!!errors.subjectId}
                    helperText={errors.subjectId?.message || (filteredSubjects.length === 0 ? 'No subjects found matching filters above.' : '')}
                    SelectProps={{
                      MenuProps: { PaperProps: { sx: { maxWidth: 430, maxHeight: 360 } } },
                    }}
                    sx={{ bgcolor: 'background.paper', width: '100%' }}
                  >
                    {filteredSubjects.map((s) => {
                      const id = s._id || s.id;
                      const courseCode = s.branchId?.courseId?.code || 'PROGRAM';
                      const branchCode = s.branchId?.code || 'BRANCH';
                      const codeStr = computeSubjectCode(s, s.branchId);

                      return (
                        <MenuItem key={id} value={id} sx={{ py: 1.2 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3, width: '100%' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.ink?.[900] }}>
                                {s.name}
                              </Typography>
                              <Chip
                                label={codeStr}
                                size="small"
                                color="primary"
                                sx={{ fontWeight: 800, fontSize: '0.62rem', height: 18 }}
                              />
                            </Box>

                            <Typography variant="caption" color="text.secondary">
                              [{courseCode} - {branchCode}] • Sem {s.semester} • {s.credits} Credits ({s.type || 'THEORY'})
                            </Typography>
                          </Box>
                        </MenuItem>
                      );
                    })}
                  </TextField>
                )}
              />
            </Box>

            {/* Selected Subject Context Summary Box */}
            {selectedSubjectObj && (
              <Paper
                sx={{
                  p: 2,
                  borderRadius: '10px',
                  bgcolor: `${theme.palette.primary.main}08`,
                  border: `1px solid ${theme.palette.primary.main}25`,
                  boxShadow: 'none',
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: theme.palette.ink?.[900] }}>
                  {selectedSubjectObj.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                  <Chip label={selectedSubjectObj.branchId?.courseId?.name || 'Course'} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.65rem', height: 20 }} />
                  <Chip label={selectedSubjectObj.branchId?.name || 'Branch'} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.65rem', height: 20 }} />
                  <Chip label={`Semester ${selectedSubjectObj.semester}`} size="small" sx={{ fontWeight: 700, fontSize: '0.65rem', height: 20 }} />
                </Box>
              </Paper>
            )}

            {/* Step 3: Faculty Member Dropdown */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                2. Select Department Professor *
              </Typography>
              <Controller
                name="facultyId"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    size="small"
                    error={!!errors.facultyId}
                    helperText={errors.facultyId?.message}
                    sx={{ bgcolor: 'background.paper' }}
                  >
                    {facultyMembers.map((f, i) => {
                      const id = f._id || f.id || i;
                      return (
                        <MenuItem key={id} value={id} sx={{ py: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar
                              sx={{
                                width: 28,
                                height: 28,
                                bgcolor: `${theme.palette.primary.main}18`,
                                color: theme.palette.primary.main,
                                fontWeight: 700,
                                fontSize: '0.75rem',
                              }}
                            >
                              {f.name?.charAt(0) || 'P'}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                {f.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {f.email}
                              </Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                      );
                    })}
                  </TextField>
                )}
              />
            </Box>

            {/* Step 4: Optional Group / Section Select */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
                3. Target Group / Section (Optional)
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Select a group (e.g. Group A, Group B) for lab/tutorial splitting, or leave as All Groups.
              </Typography>
              <Controller
                name="group"
                control={control}
                render={({ field }) => (
                  <GroupSelect
                    value={field.value || ''}
                    onChange={field.onChange}
                    allowFullBatch={true}
                    fullBatchLabel="All Groups / Entire Cohort Batch"
                    error={!!errors.group}
                    helperText={errors.group?.message}
                    sx={{ bgcolor: 'background.paper', width: '100%' }}
                  />
                )}
              />
            </Box>
          </>
        )}

        <Box sx={{ mt: 'auto', display: 'flex', gap: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button fullWidth variant="outlined" onClick={handleClose} sx={{ fontWeight: 600, borderRadius: '8px' }}>
            Cancel
          </Button>
          <Button fullWidth variant="contained" type="submit" disabled={isSubmitting || loadingSubjects || loadingFaculty} sx={{ fontWeight: 700, borderRadius: '8px' }}>
            {isSubmitting ? 'Saving...' : 'Save Allocation'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default AssignFacultyDrawer;
