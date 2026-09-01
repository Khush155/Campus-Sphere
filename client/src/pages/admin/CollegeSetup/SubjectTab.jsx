import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Box,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Drawer,
  TextField,
  Typography,
  CircularProgress,
  MenuItem,
  useTheme,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  Tooltip,
} from '@mui/material';
import {
  EditOutlined,
  DeleteOutline,
  FilterListOutlined,
  CloudUploadOutlined,
  FileDownloadOutlined,
} from '@mui/icons-material';
import {
  useSubjectsQuery,
  useSubjectsPaginatedQuery,
  useBranchesQuery,
  useDepartmentsQuery,
  useCreateSubjectMutation,
  useUpdateSubjectMutation,
  useDeleteSubjectMutation,
} from '../../../queries/collegeQueries';
import ConfirmDeleteModal from '../../../components/common/ConfirmDeleteModal';
import EmptyState from '../../../components/common/EmptyState';
import { useToast } from '../../../contexts/ToastContext';
import { computeSubjectCode } from '../../../utils/subjectCode';

// Schema for Subject Validation
const subjectFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').max(100, 'Name cannot exceed 100 characters').trim(),
  sequenceNo: z
    .number({ required_error: 'Sequence number is required' })
    .min(1, 'Sequence number must be at least 1')
    .max(99, 'Sequence number cannot exceed 99'),
  credits: z
    .number({ required_error: 'Credits count is required' })
    .min(1, 'Credits must be at least 1')
    .max(10, 'Credits cannot exceed 10'),
  type: z.enum(['THEORY', 'PRACTICAL', 'SESSIONAL'], {
    errorMap: () => ({ message: 'Type must be THEORY, PRACTICAL, or SESSIONAL' }),
  }),
  branchId: z
    .string({ required_error: 'Parent branch is required' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid branch ID format'),
  departmentId: z
    .string({ required_error: 'Hosting department is required' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID format'),
  semester: z
    .number({ required_error: 'Semester mapping is required' })
    .min(1, 'Semester must be at least 1'),
});

const NormalTablePagination = ({ page, totalPages, onPageChange, totalItems, itemsPerPage = 15 }) => {
  const theme = useTheme();

  if (totalPages <= 1) return null;

  const startItem = page * itemsPerPage + 1;
  const endItem = Math.min(totalItems, (page + 1) * itemsPerPage);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: 'center',
        justify: 'space-between',
        gap: 2,
        px: 3,
        py: 2,
        borderTop: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.custom?.surface?.sunken || 'rgba(28, 46, 69, 0.02)',
        borderRadius: '0 0 12px 12px',
      }}
    >
      <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 500, fontSize: '0.82rem' }}>
        Showing <strong>{startItem}–{endItem}</strong> of <strong>{totalItems}</strong> subjects
      </Typography>

      <Pagination
        count={totalPages}
        page={page + 1}
        onChange={(_e, newPage) => onPageChange(newPage - 1)}
        color="primary"
        shape="rounded"
        size="medium"
        showFirstButton
        showLastButton
        sx={{
          ml: { xs: 0, sm: 'auto' },
          '& .MuiPaginationItem-root': {
            fontFamily: theme.typography.body2.fontFamily,
            fontWeight: 600,
            fontSize: '0.82rem',
            borderRadius: '8px',
          },
          '& .MuiPaginationItem-page.Mui-selected': {
            background: theme.palette.primary.gradient || theme.palette.primary.main,
            color: '#ffffff',
            fontWeight: 700,
            boxShadow: `0 2px 8px ${theme.palette.primary.main}40`,
          },
        }}
      />
    </Box>
  );
};

export const SubjectTab = ({ setOnAddClick }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { showToast } = useToast();

  // Toggles
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Bulk CSV Import State
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [isImporting, setIsImporting] = useState(false);

  // Table Filters & Pagination State
  const [filterBranch, setFilterBranch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [page, setPage] = useState(0);          // 0-indexed
  const rowsPerPage = 15;                       // Fixed 15 subjects per page

  // Server-side paginated query
  const { data: subjectsPage, isLoading: loadingSubjects } = useSubjectsPaginatedQuery({
    branchId: filterBranch || undefined,
    departmentId: filterDept || undefined,
    semester: filterSemester || undefined,
    page: page + 1,          // API is 1-indexed
    limit: rowsPerPage,
  });

  const subjectsTotalCount = subjectsPage?.meta?.total ?? 0;

  // Client-side sort within the current page:
  // course name → branch name → semester → sequenceNo
  const subjects = useMemo(() => {
    const raw = subjectsPage?.data ?? [];
    return [...raw].sort((a, b) => {
      const aCourse = a.branchId?.courseId?.name || '';
      const bCourse = b.branchId?.courseId?.name || '';
      if (aCourse !== bCourse) return aCourse.localeCompare(bCourse);
      const aBranch = a.branchId?.name || '';
      const bBranch = b.branchId?.name || '';
      if (aBranch !== bBranch) return aBranch.localeCompare(bBranch);
      const semDiff = (a.semester || 0) - (b.semester || 0);
      if (semDiff !== 0) return semDiff;
      return (a.sequenceNo || 0) - (b.sequenceNo || 0);
    });
  }, [subjectsPage]);

  // Need full list for sequence-number auto-suggestion (small cost, stays flat)
  const { data: allSubjectsFlat } = useSubjectsQuery({ limit: 2000 });

  const { data: branches } = useBranchesQuery();
  const { data: depts } = useDepartmentsQuery();

  // Mutations
  const createSubject = useCreateSubjectMutation();
  const updateSubject = useUpdateSubjectMutation();
  const deleteSubject = useDeleteSubjectMutation();

  const isSaving = createSubject.isPending || updateSubject.isPending;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(subjectFormSchema),
    defaultValues: {
      name: '',
      sequenceNo: 1,
      credits: 4,
      type: 'THEORY',
      branchId: '',
      departmentId: '',
      semester: 1,
    },
  });

  const watchBranchId = watch('branchId');
  const watchSemester = watch('semester');
  const [maxSemesters, setMaxSemesters] = useState(8);

  // Auto-suggest next sequence number when branch or semester changes
  useEffect(() => {
    if (watchBranchId && watchSemester && !editId) {
      const semSubjects = allSubjectsFlat?.filter(
        (s) => String(s.branchId?._id || s.branchId) === String(watchBranchId) && Number(s.semester) === Number(watchSemester)
      );
      const maxExisting = semSubjects?.reduce((max, s) => Math.max(max, s.sequenceNo || 0), 0) || 0;
      setValue('sequenceNo', maxExisting + 1);
    }
  }, [watchBranchId, watchSemester, allSubjectsFlat, editId, setValue]);

  // Dynamic bounds for semester dropdown based on parent course duration
  useEffect(() => {
    if (watchBranchId && branches) {
      const selectedBranch = branches.find((b) => String(b._id) === String(watchBranchId));
      if (selectedBranch && selectedBranch.courseId) {
        const semsCount = selectedBranch.courseId.semesters || (selectedBranch.courseId.durationYears * 2);
        setMaxSemesters(semsCount);
        const currentSem = watch('semester');
        if (currentSem > semsCount) {
          setValue('semester', 1);
        }
      }
    }
  }, [watchBranchId, branches, setValue, watch]);

  // Default Hosting Department from selected Branch's home department
  useEffect(() => {
    if (watchBranchId && branches && !editId) {
      const selectedBranch = branches.find((b) => String(b._id) === String(watchBranchId));
      const homeDeptId = selectedBranch?.hostingDepartmentId?._id || selectedBranch?.hostingDepartmentId;
      if (homeDeptId) {
        setValue('departmentId', String(homeDeptId));
      } else {
        setValue('departmentId', '');
      }
    }
  }, [watchBranchId, branches, editId, setValue]);

  // Register the create trigger with setup hub parent container
  useEffect(() => {
    if (setOnAddClick) {
      setOnAddClick(() => handleOpenCreate);
    }
    return () => {
      if (setOnAddClick) {
        setOnAddClick(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setOnAddClick]);

  const handleOpenCreate = () => {
    setEditId(null);
    reset({
      name: '',
      sequenceNo: 1,
      credits: 4,
      type: 'THEORY',
      branchId: '',
      departmentId: '',
      semester: 1,
    });
    setDrawerOpen(true);
  };

  const handleOpenEdit = (subject) => {
    setEditId(subject._id);
    reset({
      name: subject.name,
      sequenceNo: subject.sequenceNo || 1,
      credits: subject.credits || 4,
      type: subject.type || 'THEORY',
      branchId: typeof subject.branchId === 'object' ? subject.branchId._id : subject.branchId || '',
      departmentId: typeof subject.departmentId === 'object' ? subject.departmentId._id : subject.departmentId || '',
      semester: subject.semester || 1,
    });
    setDrawerOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      if (editId) {
        await updateSubject.mutateAsync({ id: editId, data });
        showToast('Subject updated successfully.');
      } else {
        await createSubject.mutateAsync(data);
        showToast('Subject created successfully.');
      }
      setDrawerOpen(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save subject.', { severity: 'error' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteId) {
      try {
        await deleteSubject.mutateAsync(deleteId);
        showToast('Subject deleted successfully.');
        setDeleteId(null);
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to delete subject.', { severity: 'error' });
      }
    }
  };

  // ── CSV Import Handlers ──────────────────────────────────────────────────
  const downloadCsvTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      "Name,Code,Credits,Type,BranchCode,DepartmentCode,Semester\n" +
      "Operating Systems,CS401,4,CORE,CSE,CSE,4\n" +
      "Data Structures,CS201,4,CORE,CSE,CSE,2\n" +
      "Web Development,CS302,3,ELECTIVE,CSE,CSE,3";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "subjects_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        showToast('CSV file is empty or missing data rows.', { severity: 'error' });
        return;
      }

      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim());
        if (parts.length < 7) continue;

        const [name, code, creditsStr, type, branchCode, deptCode, semStr] = parts;
        const credits = parseInt(creditsStr, 10) || 4;
        const semester = parseInt(semStr, 10) || 1;

        const matchedBranch = branches?.find(b => b.code.toUpperCase() === branchCode.toUpperCase());
        const matchedDept = depts?.find(d => d.code.toUpperCase() === deptCode.toUpperCase());

        let error = null;
        if (!name || !code) error = 'Missing Name or Code';
        else if (!matchedBranch) error = `Branch code '${branchCode}' not found`;
        else if (!matchedDept) error = `Department code '${deptCode}' not found`;

        rows.push({
          name,
          code: code.toUpperCase(),
          credits,
          type: type.toUpperCase() === 'ELECTIVE' ? 'ELECTIVE' : 'CORE',
          branchId: matchedBranch?._id,
          branchCode,
          departmentId: matchedDept?._id,
          deptCode,
          semester,
          error,
        });
      }
      setParsedRows(rows);
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter(r => !r.error);
    if (validRows.length === 0) {
      showToast('No valid rows to import.', { severity: 'error' });
      return;
    }

    setIsImporting(true);
    let successCount = 0;
    let failCount = 0;

    for (const row of validRows) {
      try {
        await createSubject.mutateAsync({
          name: row.name,
          code: row.code,
          credits: row.credits,
          type: row.type,
          branchId: row.branchId,
          departmentId: row.departmentId,
          semester: row.semester,
        });
        successCount++;
      } catch (err) {
        failCount++;
      }
    }

    setIsImporting(false);
    setCsvDialogOpen(false);
    setCsvFile(null);
    setParsedRows([]);

    if (successCount > 0) {
      showToast(`Successfully imported ${successCount} subject(s)! ${failCount > 0 ? `(${failCount} failed)` : ''}`);
    } else {
      showToast('Failed to import subjects. Check codes and try again.', { severity: 'error' });
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Filter Toolbar Card */}
      <Card
        sx={{
          p: 2.5,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: 'none',
          borderRadius: '12px',
          bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={filterBranch || filterDept || filterSemester ? 3.5 : 4}>
            <TextField
              select
              fullWidth
              size="small"
              value={filterBranch}
              onChange={(e) => { setFilterBranch(e.target.value); setPage(0); }}
              label="Filter by Branch"
            >
              <MenuItem value="">All Branches</MenuItem>
              {branches?.map((b) => (
                <MenuItem key={b._id} value={b._id}>
                  {b.name} ({b.code})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={filterBranch || filterDept || filterSemester ? 3.5 : 4}>
            <TextField
              select
              fullWidth
              size="small"
              value={filterDept}
              onChange={(e) => { setFilterDept(e.target.value); setPage(0); }}
              label="Filter by Department"
            >
              <MenuItem value="">All Departments</MenuItem>
              {depts?.map((d) => (
                <MenuItem key={d._id} value={d._id}>
                  {d.name} ({d.code})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={4} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              value={filterSemester}
              onChange={(e) => { setFilterSemester(e.target.value); setPage(0); }}
              label="Filter by Semester"
            >
              <MenuItem value="">All Semesters</MenuItem>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <MenuItem key={s} value={s}>
                  Semester {s}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={8} md={filterBranch || filterDept || filterSemester ? 3 : 2}>
            <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
              {(filterBranch || filterDept || filterSemester) && (
                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  startIcon={<FilterListOutlined />}
                  onClick={() => {
                    setFilterBranch('');
                    setFilterDept('');
                    setFilterSemester('');
                    setPage(0);
                  }}
                  sx={{ textTransform: 'none', fontWeight: 600, height: '40px', flex: 1 }}
                >
                  Reset
                </Button>
              )}

              <Button
                fullWidth
                size="small"
                variant="outlined"
                startIcon={<CloudUploadOutlined />}
                onClick={() => setCsvDialogOpen(true)}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  height: '40px',
                  borderColor: theme.palette.primary.main,
                  color: theme.palette.primary.main,
                  flex: 1,
                  whiteSpace: 'nowrap',
                }}
              >
                Bulk CSV Import
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Card>

      {/* List Table Container */}
      {loadingSubjects ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={32} sx={{ color: theme.palette.primary.main }} />
        </Box>
      ) : !subjects || subjects.length === 0 ? (
        <EmptyState
          type="subjects"
          title="No Subjects Configured"
          description="Create curriculum subjects mapped to degree branches and semester modules."
          actionText="Add Subject"
          onAction={handleOpenCreate}
        />
      ) : (
        <TableContainer component={Card} sx={{ border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: '12px' }}>
          <Table aria-label="subjects directory table">
            <TableHead sx={{ bgcolor: theme.custom?.surface?.sunken || 'rgba(28, 46, 69, 0.02)' }}>
              <TableRow>
                <TableCell sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  CODE
                </TableCell>
                <TableCell sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  NAME
                </TableCell>
                <TableCell sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  CREDITS
                </TableCell>
                <TableCell sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  TYPE
                </TableCell>
                <TableCell sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  BRANCH & SEMESTER
                </TableCell>
                <TableCell align="right" sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  ACTIONS
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subjects.map((sub, index) => {
                const branchObj = typeof sub.branchId === 'object' ? sub.branchId : branches?.find((b) => String(b._id) === String(sub.branchId));
                const computedCode = computeSubjectCode(sub, branchObj, null);
                const branchCode = branchObj?.code || '—';
                return (
                  <TableRow
                    key={sub._id}
                    className="staggered-row"
                    style={{ animationDelay: `${index * 20}ms` }}
                    sx={{
                      '&:hover': {
                        bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(79, 70, 229, 0.03)',
                      },
                    }}
                  >
                    <TableCell>
                      <Chip
                        label={computedCode}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{
                          fontFamily: theme.typography.mono?.fontFamily || 'monospace',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          borderRadius: '6px',
                          bgcolor: `${theme.palette.primary.main}0D`,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.9rem' }}>
                        {sub.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${sub.credits} Credits`}
                        size="small"
                        sx={{
                          fontFamily: theme.typography.mono?.fontFamily || 'monospace',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          borderRadius: '6px',
                          bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={sub.type}
                        size="small"
                        sx={{
                          fontFamily: theme.typography.mono?.fontFamily || 'monospace',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          bgcolor: sub.type === 'THEORY' ? `${theme.palette.primary.main}15` : sub.type === 'PRACTICAL' ? `${theme.palette.secondary?.main || '#9c27b0'}15` : `${theme.palette.brass?.[500] || '#b8863e'}15`,
                          color: sub.type === 'THEORY' ? theme.palette.primary.main : sub.type === 'PRACTICAL' ? theme.palette.secondary?.main || '#9c27b0' : theme.palette.brass?.[500] || '#b8863e',
                          borderRadius: '8px',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.82rem' }}>
                        {branchCode} · Sem {sub.semester}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.75 }}>
                        <Tooltip title="Edit Subject" arrow>
                          <IconButton
                            aria-label="edit subject"
                            size="small"
                            onClick={() => handleOpenEdit(sub)}
                            sx={{
                              color: 'text.secondary',
                              borderRadius: '8px',
                              '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' },
                            }}
                          >
                            <EditOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Subject" arrow>
                          <IconButton
                            aria-label="delete subject"
                            size="small"
                            onClick={() => setDeleteId(sub._id)}
                            sx={{
                              color: theme.palette.signal?.error || '#ef4444',
                              borderRadius: '8px',
                              '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' },
                            }}
                          >
                            <DeleteOutline fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <NormalTablePagination
            page={page}
            totalPages={Math.ceil(subjectsTotalCount / rowsPerPage)}
            onPageChange={(newPage) => setPage(newPage)}
            totalItems={subjectsTotalCount}
            itemsPerPage={rowsPerPage}
          />
        </TableContainer>
      )}

      {/* Slide-over Drawer for Add/Edit Subject */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 460 }, p: 4, bgcolor: theme.palette.background.paper } }}
      >
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 4, height: '100%', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="h5" sx={{ fontFamily: theme.typography.h1.fontFamily, fontWeight: 700, color: theme.palette.ink[900], mb: 0.5 }}>
                {editId ? 'Modify Subject' : 'Create Subject'}
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                {editId ? 'Update details of the subject record.' : 'Setup a new curriculum subject node.'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.25 }}>
              <Box>
                <Typography component="label" htmlFor="sub-name-input" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 0.75 }}>
                  Subject Name
                </Typography>
                <TextField
                  id="sub-name-input"
                  fullWidth
                  placeholder="e.g. Deep Learning"
                  {...register('name')}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  size="small"
                />
              </Box>


              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography component="label" htmlFor="sub-seq-input" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 0.75 }}>
                    Sequence Number
                  </Typography>
                  <TextField
                    id="sub-seq-input"
                    type="number"
                    fullWidth
                    placeholder="e.g. 1, 2, 3..."
                    {...register('sequenceNo', { valueAsNumber: true })}
                    error={!!errors.sequenceNo}
                    helperText={errors.sequenceNo?.message || 'Auto-suggested position'}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography component="label" htmlFor="sub-credits-input" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 0.75 }}>
                    Credits
                  </Typography>
                  <TextField
                    id="sub-credits-input"
                    type="number"
                    fullWidth
                    {...register('credits', { valueAsNumber: true })}
                    error={!!errors.credits}
                    helperText={errors.credits?.message}
                    size="small"
                  />
                </Grid>
              </Grid>

              <Box>
                <Typography component="label" htmlFor="sub-type-input" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 0.75 }}>
                  Course Type
                </Typography>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="sub-type-input"
                      select
                      fullWidth
                      error={!!errors.type}
                      helperText={errors.type?.message}
                      size="small"
                    >
                      <MenuItem value="THEORY">THEORY</MenuItem>
                      <MenuItem value="PRACTICAL">PRACTICAL</MenuItem>
                      <MenuItem value="SESSIONAL">SESSIONAL</MenuItem>
                    </TextField>
                  )}
                />
              </Box>

              <Box>
                <Typography component="label" htmlFor="sub-dept-input" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 0.75 }}>
                  Hosting Department
                </Typography>
                <Controller
                  name="departmentId"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="sub-dept-input"
                      select
                      fullWidth
                      error={!!errors.departmentId}
                      helperText={errors.departmentId?.message}
                      size="small"
                    >
                      <MenuItem value="">Select Hosting Department...</MenuItem>
                      {depts?.map((d) => (
                        <MenuItem key={d._id} value={d._id}>
                          {d.name} ({d.code})
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography component="label" htmlFor="sub-branch-input" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 0.75 }}>
                    Parent Branch
                  </Typography>
                  <Controller
                    name="branchId"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        id="sub-branch-input"
                        select
                        fullWidth
                        error={!!errors.branchId}
                        helperText={errors.branchId?.message}
                        size="small"
                      >
                        <MenuItem value="">Select Branch...</MenuItem>
                        {branches?.map((b) => (
                          <MenuItem key={b._id} value={b._id}>
                            {b.name} ({b.code})
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography component="label" htmlFor="sub-sem-input" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 0.75 }}>
                    Semester
                  </Typography>
                  <Controller
                    name="semester"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        id="sub-sem-input"
                        select
                        fullWidth
                        disabled={!watchBranchId}
                        error={!!errors.semester}
                        helperText={errors.semester?.message}
                        size="small"
                      >
                        {!watchBranchId ? (
                          <MenuItem value={1}>Select Branch First</MenuItem>
                        ) : (
                          Array.from({ length: maxSemesters }, (_, i) => i + 1).map((s) => (
                            <MenuItem key={s} value={s}>
                              Semester {s}
                            </MenuItem>
                          ))
                        )}
                      </TextField>
                    )}
                  />
                </Grid>
              </Grid>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, pt: 2 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => setDrawerOpen(false)}
              sx={{ color: theme.palette.text.secondary, borderColor: theme.palette.divider, fontWeight: 600 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isSaving}
              sx={{
                background: theme.palette.primary.gradient || theme.palette.primary.main,
                color: '#ffffff',
                fontWeight: 700,
                boxShadow: `0 4px 14px ${theme.palette.primary.main}35`,
              }}
            >
              {isSaving ? 'Saving...' : editId ? 'Update Subject' : 'Create Subject'}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Bulk CSV Import Dialog Modal */}
      <Dialog
        open={csvDialogOpen}
        onClose={() => !isImporting && setCsvDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontFamily: theme.typography.h1.fontFamily, fontWeight: 700, pb: 1 }}>
          Bulk CSV Import — Curriculum Subjects
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Upload a `.csv` file matching the template schema to populate subjects in bulk.
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<FileDownloadOutlined />}
              onClick={downloadCsvTemplate}
              sx={{ textTransform: 'none', fontWeight: 600, flexShrink: 0 }}
            >
              Download CSV Sample
            </Button>
          </Box>

          <Box
            sx={{
              p: 3,
              border: `2px dashed ${theme.palette.divider}`,
              borderRadius: '12px',
              textAlign: 'center',
              bgcolor: theme.custom?.surface?.sunken || 'rgba(0,0,0,0.02)',
              cursor: 'pointer',
              '&:hover': {
                borderColor: theme.palette.primary.main,
              },
            }}
            component="label"
          >
            <input type="file" accept=".csv" hidden onChange={handleFileChange} />
            <CloudUploadOutlined sx={{ fontSize: 36, color: theme.palette.primary.main, mb: 1 }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.ink[900] }}>
              {csvFile ? csvFile.name : 'Click to select or drag CSV file here'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Columns: Name, Code, Credits, Type, BranchCode, DepartmentCode, Semester
            </Typography>
          </Box>

          {parsedRows.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Parsed CSV Preview ({parsedRows.length} items)
              </Typography>
              <TableContainer component={Card} sx={{ maxHeight: 240, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>CODE</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>NAME</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>TYPE</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>BRANCH</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>DEPT</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>STATUS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {parsedRows.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell sx={{ fontFamily: theme.typography.mono.fontFamily }}>{row.code}</TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.type}</TableCell>
                        <TableCell>{row.branchCode}</TableCell>
                        <TableCell>{row.deptCode}</TableCell>
                        <TableCell>
                          {row.error ? (
                            <Chip label={row.error} size="small" color="error" variant="outlined" />
                          ) : (
                            <Chip label="Ready" size="small" color="success" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={() => setCsvDialogOpen(false)} disabled={isImporting} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleExecuteImport}
            variant="contained"
            disabled={isImporting || parsedRows.filter(r => !r.error).length === 0}
            sx={{
              background: theme.palette.primary.gradient || theme.palette.primary.main,
              color: '#ffffff',
              fontWeight: 700,
            }}
          >
            {isImporting ? 'Importing...' : `Import ${parsedRows.filter(r => !r.error).length} Subjects`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Modal */}
      <ConfirmDeleteModal
        open={Boolean(deleteId)}
        title="Delete Subject"
        actionText="Delete Subject"
        description="Are you sure you want to delete this curriculum subject? This action cannot be undone."
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteSubject.isPending}
      />
    </Box>
  );
};

export default SubjectTab;
