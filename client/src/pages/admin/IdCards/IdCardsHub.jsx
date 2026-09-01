import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Chip,
  Button,
  TextField,
  MenuItem,
  Avatar,
  CircularProgress,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  BadgeOutlined,
  SearchOutlined,
  PrintOutlined,
} from '@mui/icons-material';
import { useUsersQuery } from '../../../queries/userQueries';
import { useDepartmentsQuery } from '../../../queries/collegeQueries';
import { useCollegeProfileQuery } from '../../../queries/collegeProfileQueries';
import { useToast } from '../../../contexts/ToastContext';
import EmptyState from '../../../components/common/EmptyState';
import CollegiateIdCard from '../../../components/common/CollegiateIdCard';

export const IdCardsHub = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { showToast } = useToast();

  // Filter States
  const [roleFilter, setRoleFilter] = useState('STUDENT');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // Selected student for single live preview
  const [selectedUser, setSelectedUser] = useState(null);

  // Queries
  const { data: usersData, isLoading: loadingUsers } = useUsersQuery({
    role: roleFilter || undefined,
    limit: 1000,
  });
  const { data: depts } = useDepartmentsQuery();
  const { data: profile } = useCollegeProfileQuery();

  const usersList = usersData?.data || [];

  // Filtered list
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      search === '' ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.rollNumber && u.rollNumber.toLowerCase().includes(search.toLowerCase()));

    const matchesDept =
      deptFilter === '' || String(u.departmentId?._id || u.departmentId) === String(deptFilter);

    return matchesSearch && matchesDept;
  });

  // Active user preview fallback to first filtered user
  const activeUser = selectedUser || filteredUsers[0] || null;

  // Print bulk trigger
  const handlePrintBatch = () => {
    if (filteredUsers.length === 0) {
      showToast('No user records match the active filter criteria for printing ID cards.', {
        severity: 'error',
      });
      return;
    }
    showToast(`Generating printable ID cards batch for ${filteredUsers.length} user(s)...`);
    window.print();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* ── 1. Hero Identity Header Card (Glassmorphic Luxury Bar) ────────── */}
      <Card
        sx={{
          p: 3.5,
          borderRadius: '22px',
          border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
          background: isDark
            ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.12) 0%, rgba(184, 134, 62, 0.06) 100%)'
            : 'linear-gradient(135deg, rgba(79, 70, 229, 0.06) 0%, rgba(184, 134, 62, 0.04) 100%)',
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
              icon={<BadgeOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
              label="CAMPUS IDENTITY & ID CARD GENERATOR"
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
              label={`${filteredUsers.length} Users Selected`}
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
            Student &amp; Staff ID Card Studio
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              maxWidth: 680,
            }}
          >
            Generate digital identity passes and print official physical ID cards with institution crest seals and roll number barcodes.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<PrintOutlined />}
          onClick={handlePrintBatch}
          sx={{
            background: theme.palette.primary.gradient || theme.palette.primary.main,
            color: '#ffffff',
            fontWeight: 800,
            px: 2.75,
            height: '42px',
            borderRadius: '10px',
            textTransform: 'none',
            boxShadow: `0 4px 18px ${theme.palette.primary.main}40`,
          }}
        >
          Print ID Cards Batch ({filteredUsers.length})
        </Button>
      </Card>

      {/* ── 2. Split Screen Layout (Filters + Live Preview + List Table) ──── */}
      <Grid container spacing={3.5} alignItems="stretch">
        {/* Left Column: Filter Controls & Directory Table */}
        <Grid item xs={12} lg={7} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Card
            sx={{
              p: 3.5,
              borderRadius: '18px',
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: 'none',
              bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Grid container spacing={2} sx={{ mb: 2.5 }} alignItems="center">
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Role Category"
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setSelectedUser(null);
                  }}
                >
                  <MenuItem value="STUDENT">Students Only</MenuItem>
                  <MenuItem value="FACULTY">Faculty Members</MenuItem>
                  <MenuItem value="HOD">Department HODs</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Department"
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  SelectProps={{ displayEmpty: true }}
                  InputLabelProps={{ shrink: true }}
                >
                  <MenuItem value="">All Departments</MenuItem>
                  {depts?.map((d) => (
                    <MenuItem key={d._id} value={d._id}>
                      {d.name} ({d.code})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search name, roll no..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchOutlined sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} />,
                  }}
                />
              </Grid>
            </Grid>

            {loadingUsers ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, py: 8 }}>
                <CircularProgress size={32} />
              </Box>
            ) : filteredUsers.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, py: 4 }}>
                <EmptyState
                  type="users"
                  title="No Identity Records Found"
                  description="No users match the active role or department filter criteria."
                  actionText="Reset Filters"
                  onAction={() => {
                    setSearch('');
                    setDeptFilter('');
                  }}
                />
              </Box>
            ) : (
              <TableContainer
                sx={{
                  flex: '1 1 0',
                  minHeight: 0,
                  overflowY: 'auto',
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: '12px',
                  bgcolor: theme.palette.background.paper,
                  '&::-webkit-scrollbar': { width: '6px' },
                  '&::-webkit-scrollbar-thumb': {
                    bgcolor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
                    borderRadius: '3px',
                  },
                }}
              >
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, bgcolor: isDark ? '#1e293b' : '#f1f5f9', zIndex: 2 }}>IDENTITY RECORD</TableCell>
                      <TableCell sx={{ fontWeight: 800, bgcolor: isDark ? '#1e293b' : '#f1f5f9', zIndex: 2 }}>ROLL NO / EMAIL</TableCell>
                      <TableCell sx={{ fontWeight: 800, bgcolor: isDark ? '#1e293b' : '#f1f5f9', zIndex: 2 }}>DEPT / COURSE</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, bgcolor: isDark ? '#1e293b' : '#f1f5f9', zIndex: 2 }}>PREVIEW</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers.map((u) => {
                      const activeId = activeUser?._id ? String(activeUser._id) : (activeUser?.id ? String(activeUser.id) : null);
                      const uId = u._id ? String(u._id) : (u.id ? String(u.id) : null);
                      const isSelected = Boolean(activeId && uId && activeId === uId);

                      return (
                        <TableRow
                          key={uId || u.email}
                          hover
                          selected={isSelected}
                          onClick={() => setSelectedUser(u)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell sx={{ fontWeight: 600 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar sx={{ width: 30, height: 30, bgcolor: `${theme.palette.primary.main}18`, color: theme.palette.primary.main, fontSize: '0.78rem', fontWeight: 700 }}>
                                {u.name?.charAt(0) || 'U'}
                              </Avatar>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                {u.name}
                              </Typography>
                            </Box>
                          </TableCell>

                          <TableCell sx={{ fontFamily: theme.typography.mono?.fontFamily || 'monospace', fontSize: '0.78rem', color: 'text.secondary' }}>
                            {u.rollNumber ? (
                              <Chip
                                label={u.rollNumber}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ fontSize: '0.65rem', fontWeight: 700, height: 20 }}
                              />
                            ) : (
                              u.email
                            )}
                          </TableCell>

                          <TableCell sx={{ fontSize: '0.78rem' }}>
                            {u.department || u.branch || 'Global'}
                          </TableCell>

                          <TableCell align="right">
                            <Button
                              size="small"
                              variant={isSelected ? 'contained' : 'text'}
                              sx={{ fontSize: '0.7rem', fontWeight: 700, borderRadius: '6px' }}
                            >
                              {isSelected ? 'Viewing' : 'Select'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Left Card Bottom Action / Status Strip */}
            <Box
              sx={{
                pt: 2,
                mt: 1.5,
                borderTop: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: theme.typography.mono?.fontFamily || 'monospace', fontWeight: 600 }}>
                Showing {filteredUsers.length} identity records • Click row to preview
              </Typography>
              {activeUser && (
                <Chip
                  label={`Viewing: ${activeUser.name}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 700, fontSize: '0.68rem', borderRadius: '6px' }}
                />
              )}
            </Box>
          </Card>
        </Grid>

        {/* Right Column: Physical ID Card Live Crest Preview */}
        <Grid item xs={12} lg={5} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Card
            sx={{
              p: 3.5,
              borderRadius: '18px',
              border: `2px double ${theme.palette.brass?.[500] || '#b8863e'}60`,
              bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
              boxShadow: 'none',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 800, color: theme.palette.brass?.[500] || '#b8863e', fontFamily: theme.typography.mono.fontFamily, letterSpacing: '0.08em', mb: 2, display: 'block' }}>
                PHYSICAL ID CARD LIVE WATERMARK PREVIEW
              </Typography>

              {activeUser ? (
                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', py: 1 }}>
                  <CollegiateIdCard
                    id="printable-id-card-preview"
                    name={activeUser.name}
                    rollNumber={activeUser.rollNumber}
                    role={activeUser.role || 'STUDENT'}
                    department={activeUser.department || activeUser.departmentId?.name || 'General Department'}
                    course={activeUser.course || activeUser.courseId?.code || 'B.Tech'}
                    branch={activeUser.branch || activeUser.branchId?.code || 'General'}
                    semester={activeUser.semester || 1}
                    email={activeUser.email}
                    collegeName={profile?.name || 'CAMPUS SPHERE UNIVERSITY'}
                    collegeLogo={profile?.logoUrl}
                    photoUrl={activeUser.profilePicUrl}
                  />
                </Box>
              ) : (
                <EmptyState
                  type="reports"
                  title="No User Selected"
                  description="Select a user from the directory to preview their physical ID Card pass."
                />
              )}
            </Box>

            <Box sx={{ mt: 3 }}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<PrintOutlined />}
                onClick={() => window.print()}
                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}
              >
                Print Single Card Preview
              </Button>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default IdCardsHub;
