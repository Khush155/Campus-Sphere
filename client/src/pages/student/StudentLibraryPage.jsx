import React, { useState, useMemo } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  TextField,
  MenuItem,
  InputAdornment,
  Avatar,
  Skeleton,
  useTheme,
} from '@mui/material';
import {
  LocalLibraryOutlined as LibraryIcon,
  SearchOutlined as SearchIcon,
  PictureAsPdfOutlined as PdfIcon,
  SlideshowOutlined as PptIcon,
  YouTube as YoutubeIcon,
  LinkOutlined as LinkIcon,
  NotesOutlined as NoteIcon,
  DownloadOutlined as DownloadIcon,
  PersonOutlined as PersonIcon,
} from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext';
import { useMyProfileQuery } from '../../queries/userProfileQueries';
import { useSubjectsQuery } from '../../queries/collegeQueries';
import { useStudentMaterialsQuery } from '../../queries/studentQueries';

const getTypeConfig = (type) => {
  switch (type) {
    case 'PDF':
      return { label: 'PDF DOCUMENT', color: 'error', icon: <PdfIcon fontSize="small" /> };
    case 'PPT':
      return { label: 'PRESENTATION', color: 'warning', icon: <PptIcon fontSize="small" /> };
    case 'YOUTUBE':
      return { label: 'VIDEO LECTURE', color: 'error', icon: <YoutubeIcon fontSize="small" /> };
    case 'LINK':
      return { label: 'WEB RESOURCE', color: 'info', icon: <LinkIcon fontSize="small" /> };
    case 'NOTE':
      return { label: 'REVISION NOTE', color: 'success', icon: <NoteIcon fontSize="small" /> };
    default:
      return { label: type || 'RESOURCE', color: 'default', icon: <LibraryIcon fontSize="small" /> };
  }
};

export const StudentLibraryPage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { user } = useAuth();
  const { data: profile } = useMyProfileQuery();

  const currentUser = profile?.user || user;
  const studentMeta = profile?.profileMeta || {};

  const branchObj = currentUser?.branchId;
  const branchId = typeof branchObj === 'object' ? branchObj?._id : branchObj;
  const semester = currentUser?.semester || studentMeta?.semester;

  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch enrolled subjects for subject filter dropdown
  const { data: subjects = [] } = useSubjectsQuery({
    branchId: branchId || undefined,
    semester: semester || undefined,
  });

  // Fetch study materials from backend
  const { data: rawMaterials = [], isLoading } = useStudentMaterialsQuery({
    subjectId: selectedSubject || undefined,
    group: currentUser?.group || undefined,
  });

  // Filter materials on client side by type and search query
  const filteredMaterials = useMemo(() => {
    let items = Array.isArray(rawMaterials) ? rawMaterials : [];

    if (selectedType) {
      items = items.filter((m) => m.type === selectedType);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (m) =>
          m.title?.toLowerCase().includes(q) ||
          m.description?.toLowerCase().includes(q) ||
          m.unit?.toLowerCase().includes(q) ||
          m.subjectId?.name?.toLowerCase().includes(q) ||
          m.subjectId?.code?.toLowerCase().includes(q)
      );
    }

    return items;
  }, [rawMaterials, selectedType, searchQuery]);

  const handleOpenResource = (url) => {
    if (!url) return;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3.5 }}>
      {/* Page Header */}
      <Box sx={{ mb: 3.5 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', mb: 0.5 }}>
          Digital Library & Learning Resources
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Official course materials, lecture presentations, e-notes, and video references uploaded by faculty for{' '}
          <strong>{studentMeta?.course || 'B.Tech'}</strong> (Sem {semester || 6}).
        </Typography>
      </Box>

      {/* Filter Controls Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: '20px',
          border: `1px solid ${theme.palette.divider}`,
          mb: 3.5,
          bgcolor: isDark ? 'background.paper' : '#ffffff',
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by title, unit, or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              select
              size="small"
              label="Subject Filter"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            >
              <MenuItem value="">All Enrolled Subjects</MenuItem>
              {Array.isArray(subjects) &&
                subjects.map((sub) => (
                  <MenuItem key={sub._id} value={sub._id}>
                    {sub.code ? `${sub.code} - ${sub.name}` : sub.name}
                  </MenuItem>
                ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              select
              size="small"
              label="Resource Type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            >
              <MenuItem value="">All File Types</MenuItem>
              <MenuItem value="PDF">PDF Documents</MenuItem>
              <MenuItem value="PPT">PPT Presentations</MenuItem>
              <MenuItem value="YOUTUBE">Video Lectures</MenuItem>
              <MenuItem value="LINK">Web Resources</MenuItem>
              <MenuItem value="NOTE">Revision Notes</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Materials Grid View */}
      {isLoading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item}>
              <Skeleton variant="rounded" height={220} sx={{ borderRadius: '24px' }} />
            </Grid>
          ))}
        </Grid>
      ) : filteredMaterials.length === 0 ? (
        <Paper elevation={0} sx={{ p: 6, borderRadius: '24px', textAlign: 'center', border: `1px solid ${theme.palette.divider}` }}>
          <LibraryIcon sx={{ fontSize: 56, color: 'text.secondary', opacity: 0.4, mb: 1.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
            No Learning Resources Found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
            {selectedSubject || selectedType || searchQuery
              ? 'No course materials match your active search or dropdown filter.'
              : 'Faculty members have not uploaded any study materials for your enrolled subjects yet.'}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredMaterials.map((item) => {
            const typeConfig = getTypeConfig(item.type);
            const subjectName = item.subjectId?.name || 'General Subject';
            const subjectCode = item.subjectId?.code || '';
            const uploaderName = item.uploadedBy?.name || 'Faculty Instructor';

            return (
              <Grid item xs={12} sm={6} md={4} key={item._id}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: '24px',
                    border: `1px solid ${theme.palette.divider}`,
                    bgcolor: isDark ? 'background.paper' : '#ffffff',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Chip
                        icon={typeConfig.icon}
                        label={typeConfig.label}
                        color={typeConfig.color}
                        size="small"
                        sx={{ fontWeight: 800, fontSize: '0.7rem' }}
                      />
                      <Chip
                        label={item.unit || 'Reference'}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                      />
                    </Box>

                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5, lineHeight: 1.3 }}>
                      {item.title}
                    </Typography>

                    <Typography variant="caption" color="primary" sx={{ fontWeight: 800, display: 'block', mb: 1 }}>
                      {subjectCode ? `${subjectCode} • ${subjectName}` : subjectName}
                    </Typography>

                    {item.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.85rem', mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {item.description}
                      </Typography>
                    )}
                  </Box>

                  <Box>
                    <Box sx={{ pt: 2, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main }}>
                          <PersonIcon fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', fontSize: '0.65rem' }}>
                            UPLOADED BY
                          </Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.78rem' }}>
                            {uploaderName}
                          </Typography>
                        </Box>
                      </Box>

                      {item.fileSize && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                          {item.fileSize}
                        </Typography>
                      )}
                    </Box>

                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleOpenResource(item.url)}
                      disabled={!item.url}
                      sx={{
                        borderRadius: '12px',
                        fontWeight: 800,
                        textTransform: 'none',
                        py: 1,
                      }}
                    >
                      Access Resource
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
};

export default StudentLibraryPage;
