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
  Divider,
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
  QrCode2Outlined,
  SchoolOutlined,
} from '@mui/icons-material';
import { useUsersQuery } from '../../../queries/userQueries';
import { useDepartmentsQuery } from '../../../queries/collegeQueries';
import { useCollegeProfileQuery } from '../../../queries/collegeProfileQueries';
import { useToast } from '../../../contexts/ToastContext';
import EmptyState from '../../../components/common/EmptyState';

export const IdCardsHub = () => {
  const theme = useTheme();
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
    limit: 100,
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
      {/* ── 1. Hero Identity Header Card ───────────────────────────────────── */}
      <Card
        sx={{
          p: 3.5,
          borderRadius: '16px',
          border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}0D 0%, ${theme.palette.brass?.[500] || '#b8863e'}0A 100%)`,
          boxShadow: 'none',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Chip
                icon={<BadgeOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="CAMPUS IDENTITY & ID CARD GENERATOR"
                size="small"
                sx={{
                  bgcolor: `${theme.palette.primary.main}15`,
                  color: theme.palette.primary.main,
                  fontWeight: 800,
                  fontFamily: theme.typography.mono.fontFamily,
                  letterSpacing: '0.05em',
                  fontSize: '0.7rem',
                }}
              />
            </Box>
            <Typography variant="h4" sx={{ fontFamily: theme.typography.h1.fontFamily, fontWeight: 800, color: theme.palette.ink[900] }}>
              Student & Staff ID Card Studio
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
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
              fontWeight: 700,
              borderRadius: '8px',
              px: 3,
              py: 1,
            }}
          >
            Print ID Cards Batch ({filteredUsers.length})
          </Button>
        </Box>
      </Card>

      {/* ── 2. Split Screen Layout (Filters + Live Preview + List Table) ──── */}
      <Grid container spacing={3.5} alignItems="stretch">
        {/* Left Column: Filter Controls & Directory Table */}
        <Grid item xs={12} lg={7} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
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
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={32} />
              </Box>
            ) : filteredUsers.length === 0 ? (
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
            ) : (
              <TableContainer sx={{ maxHeight: 420 }}>
                <Table size="small" stickyHeader>
                  <TableHead sx={{ bgcolor: theme.custom?.surface?.sunken || 'rgba(0,0,0,0.02)' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>IDENTITY RECORD</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>ROLL NO / EMAIL</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>DEPT / COURSE</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>PREVIEW</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers.map((u) => {
                      const isSelected = activeUser && (activeUser.id === u.id || activeUser._id === u._id);

                      return (
                        <TableRow
                          key={u.id || u._id}
                          hover
                          selected={isSelected}
                          onClick={() => setSelectedUser(u)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell sx={{ fontWeight: 600 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar sx={{ width: 28, height: 28, bgcolor: `${theme.palette.primary.main}18`, color: theme.palette.primary.main, fontSize: '0.75rem', fontWeight: 700 }}>
                                {u.name?.charAt(0) || 'U'}
                              </Avatar>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.ink[900] }}>
                                {u.name}
                              </Typography>
                            </Box>
                          </TableCell>

                          <TableCell sx={{ fontFamily: theme.typography.mono.fontFamily, fontSize: '0.78rem', color: 'text.secondary' }}>
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
          </Card>
        </Grid>

        {/* Right Column: Physical ID Card Live Crest Preview */}
        <Grid item xs={12} lg={5} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Card
            sx={{
              p: 3.5,
              borderRadius: '16px',
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
                <Box
                  id="printable-id-card-preview"
                  sx={{
                    width: '100%',
                    maxWidth: 320,
                    mx: 'auto',
                    borderRadius: '16px',
                    border: `1px solid ${theme.palette.divider}`,
                    background: `linear-gradient(180deg, ${theme.palette.primary.main}12 0%, ${theme.palette.background.paper} 40%)`,
                    p: 3,
                    textAlign: 'center',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Top Branding Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1.5 }}>
                    <SchoolOutlined sx={{ fontSize: 24, color: theme.palette.primary.main }} />
                    <Typography variant="subtitle2" sx={{ fontFamily: theme.typography.h1.fontFamily, fontWeight: 800, color: theme.palette.ink[900], fontSize: '0.9rem', letterSpacing: '0.02em' }}>
                      {profile?.name || 'CAMPUS SPHERE ACADEMY'}
                    </Typography>
                  </Box>

                  <Chip
                    label={activeUser.role || 'STUDENT'}
                    size="small"
                    sx={{
                      bgcolor: theme.palette.primary.main,
                      color: '#ffffff',
                      fontWeight: 800,
                      fontFamily: theme.typography.mono.fontFamily,
                      fontSize: '0.62rem',
                      height: 18,
                      mb: 2,
                    }}
                  />

                  {/* Student Photo Placeholder */}
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      bgcolor: `${theme.palette.primary.main}18`,
                      color: theme.palette.primary.main,
                      mx: 'auto',
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `3px solid ${theme.palette.background.paper}`,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  >
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>
                      {activeUser.name?.charAt(0) || 'U'}
                    </Typography>
                  </Box>

                  {/* Name & Roll Number */}
                  <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.ink[900], fontSize: '1.05rem', mb: 0.5 }}>
                    {activeUser.name}
                  </Typography>

                  {activeUser.rollNumber && (
                    <Chip
                      label={`ROLL NO: ${activeUser.rollNumber}`}
                      size="small"
                      sx={{
                        fontWeight: 800,
                        fontFamily: theme.typography.mono.fontFamily,
                        fontSize: '0.72rem',
                        bgcolor: `${theme.palette.brass?.[500] || '#b8863e'}18`,
                        color: theme.palette.brass?.[500] || '#b8863e',
                        mb: 1.5,
                      }}
                    />
                  )}

                  <Divider sx={{ my: 1.5 }} />

                  {/* Details Grid */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, textAlign: 'left', px: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Department:
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.ink[900] }}>
                        {activeUser.department || 'General'}
                      </Typography>
                    </Box>

                    {activeUser.role === 'STUDENT' && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Branch:
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.ink[900] }}>
                          {activeUser.branch || 'General'}
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Roll Number:
                      </Typography>
                      <Typography variant="caption" sx={{ fontFamily: theme.typography.mono.fontFamily, fontSize: '0.75rem', fontWeight: 800, color: theme.palette.primary.main }}>
                        {activeUser.rollNumber || 'UNASSIGNED'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* QR Code Barcode Mockup Footer */}
                  <Box sx={{ mt: 2.5, pt: 1.5, borderTop: `1px dashed ${theme.palette.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <QrCode2Outlined sx={{ fontSize: 28, color: theme.palette.text.secondary }} />
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography variant="caption" sx={{ display: 'block', fontFamily: theme.typography.mono.fontFamily, fontSize: '0.6rem', color: theme.palette.text.disabled }}>
                        OFFICIAL CAMPUS SPHERE PASS
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', fontFamily: theme.typography.mono.fontFamily, fontSize: '0.58rem', fontWeight: 700, color: theme.palette.ink[900] }}>
                        VERIFIED INSTITUTIONAL RECORD
                      </Typography>
                    </Box>
                  </Box>
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
