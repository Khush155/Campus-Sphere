/* eslint-disable */
import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Paper,
  Snackbar,
  Alert,
  Divider,
  CircularProgress,
  Tabs,
  Tab,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Launch as LaunchIcon,
  PictureAsPdf as PdfIcon,
  Slideshow as PptIcon,
  YouTube as VideoIcon,
  InsertDriveFile as FileIcon,
  Link as LinkIcon,
  Note as NoteIcon,
  Search as SearchIcon,
  FolderZip as FolderIcon,
  MenuBook as BookIcon,
  VisibilityOutlined as EyeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Backend hooks
import {
  useFacultyDashboardQuery,
  useMaterialsQuery,
  useUploadMaterialMutation,
  useDeleteMaterialMutation,
} from '../../../queries/facultyQueries';

const UNIT_OPTIONS = [
  'General Reference',
  'Unit 1: Introduction & Fundamentals',
  'Unit 2: Core Architecture & Design',
  'Unit 3: Advanced Methods & Algorithms',
  'Unit 4: System Integration & Testing',
  'Unit 5: Case Studies & Emerging Trends',
];

export const MaterialsPage = () => {
  const navigate = useNavigate();

  // Filter States
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('ALL');
  const [activeTypeTab, setActiveTypeTab] = useState('ALL');
  const [selectedUnit, setSelectedUnit] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog & Detail Modal States
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [viewingMaterial, setViewingMaterial] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Toast State
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const showToast = (message, severity = 'success') => setToast({ open: true, message, severity });

  // Upload Form State
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    type: 'PDF',
    subjectId: '',
    sectionId: 'ALL',
    unit: 'Unit 1: Introduction & Fundamentals',
    url: '',
    description: '',
    fileSize: '2.5 MB',
  });

  // 1. Fetch faculty assigned subjects
  const { data: dashboardData, isLoading: isDashboardLoading } = useFacultyDashboardQuery();
  const assignedSubjects = useMemo(() => dashboardData?.assignedSubjects || [], [dashboardData]);

  // Auto-select first subject
  React.useEffect(() => {
    if (assignedSubjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(assignedSubjects[0].id);
    }
  }, [assignedSubjects, selectedSubjectId]);

  const currentSubject = useMemo(() => {
    return assignedSubjects.find((s) => String(s.id) === String(selectedSubjectId)) || null;
  }, [assignedSubjects, selectedSubjectId]);

  // Section options
  const sectionsOptions = useMemo(() => [
    { id: 'ALL', name: 'All Sections (Whole Batch)' },
    { id: 'A', name: 'Group / Section A' },
    { id: 'B', name: 'Group / Section B' },
  ], []);

  // 2. Fetch study materials from backend
  const { data: rawMaterials = [], isLoading: isMaterialsLoading } = useMaterialsQuery({
    subjectId: selectedSubjectId || undefined,
    group: selectedSectionId !== 'ALL' ? selectedSectionId : undefined,
  });

  const uploadMaterialMutation = useUploadMaterialMutation();
  const deleteMaterialMutation = useDeleteMaterialMutation();

  // Filter materials in memory (by type, unit, and search term)
  const filteredMaterials = useMemo(() => {
    if (!Array.isArray(rawMaterials)) return [];
    return rawMaterials.filter((item) => {
      if (activeTypeTab !== 'ALL' && item.type !== activeTypeTab) return false;
      if (selectedUnit !== 'ALL' && (item.unit || 'General Reference') !== selectedUnit) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (item.title || '').toLowerCase().includes(q);
        const matchDesc = (item.description || '').toLowerCase().includes(q);
        const matchUnit = (item.unit || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchUnit) return false;
      }
      return true;
    });
  }, [rawMaterials, activeTypeTab, selectedUnit, searchQuery]);

  // Stats calculation
  const stats = useMemo(() => {
    const list = Array.isArray(rawMaterials) ? rawMaterials : [];
    return {
      total: list.length,
      pdfs: list.filter((m) => m.type === 'PDF' || m.type === 'PPT').length,
      videos: list.filter((m) => m.type === 'YOUTUBE' || m.type === 'LINK').length,
      notes: list.filter((m) => m.type === 'NOTE').length,
    };
  }, [rawMaterials]);

  const handleUploadOpen = () => {
    setNewMaterial({
      title: '',
      type: 'PDF',
      subjectId: selectedSubjectId || (assignedSubjects[0]?.id || ''),
      sectionId: selectedSectionId || 'ALL',
      unit: 'Unit 1: Introduction & Fundamentals',
      url: '',
      description: '',
      fileSize: '2.5 MB',
    });
    setIsUploadOpen(true);
  };

  const handleSaveMaterial = () => {
    if (!newMaterial.title || !newMaterial.subjectId) {
      showToast('Please enter title and select a subject.', 'error');
      return;
    }

    if (newMaterial.type !== 'NOTE' && !newMaterial.url) {
      showToast('Please enter resource link or file URL.', 'error');
      return;
    }

    const payload = {
      title: newMaterial.title.trim(),
      type: newMaterial.type,
      subjectId: newMaterial.subjectId,
      semester: currentSubject?.semester || 1,
      group: newMaterial.sectionId || 'ALL',
      unit: newMaterial.unit || 'General Reference',
      url: newMaterial.type === 'NOTE' ? 'N/A' : (newMaterial.url.trim() || 'https://campus.edu/files/resource'),
      description: newMaterial.description.trim(),
      fileSize: newMaterial.type === 'NOTE' ? '0 KB' : (newMaterial.fileSize || '2.5 MB'),
    };

    uploadMaterialMutation.mutate(payload, {
      onSuccess: () => {
        setIsUploadOpen(false);
        showToast('Study material uploaded successfully!', 'success');
      },
      onError: (err) => {
        showToast(`Upload failed: ${err.response?.data?.message || err.message}`, 'error');
      },
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteId) return;
    deleteMaterialMutation.mutate(deleteId, {
      onSuccess: () => {
        setDeleteId(null);
        showToast('Material deleted successfully.', 'success');
      },
      onError: (err) => {
        setDeleteId(null);
        showToast(`Delete failed: ${err.response?.data?.message || err.message}`, 'error');
      },
    });
  };

  // Render Format Icon Helper
  const getIconForType = (type) => {
    switch (type) {
      case 'PDF':
        return <PdfIcon sx={{ fontSize: 32, color: '#ef4444' }} />;
      case 'PPT':
        return <PptIcon sx={{ fontSize: 32, color: '#3b82f6' }} />;
      case 'YOUTUBE':
        return <VideoIcon sx={{ fontSize: 32, color: '#dc2626' }} />;
      case 'NOTE':
        return <NoteIcon sx={{ fontSize: 32, color: '#f59e0b' }} />;
      default:
        return <LinkIcon sx={{ fontSize: 32, color: '#6366f1' }} />;
    }
  };

  if (isDashboardLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 1, sm: 3 } }}>
      {/* ── Page Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton
            onClick={() => navigate('/faculty')}
            size="small"
            sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}
          >
            <BackIcon fontSize="small" />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
              Study & Course Materials
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Upload and manage course PDFs, lecture slides, video tutorials, unit notes, and reference guides
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleUploadOpen}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 2.5,
            px: 3,
            py: 1,
            bgcolor: '#4f46e5',
            '&:hover': { bgcolor: '#4338ca' },
          }}
        >
          Upload Material
        </Button>
      </Box>

      {/* ── Summary KPI Cards ── */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5' }}>
              <BookIcon fontSize="large" />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800}>{stats.total}</Typography>
              <Typography variant="caption" color="text.secondary">Total Resources Shared</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <PdfIcon fontSize="large" />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800}>{stats.pdfs}</Typography>
              <Typography variant="caption" color="text.secondary">PDFs & Presentation Decks</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <VideoIcon fontSize="large" />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800}>{stats.videos}</Typography>
              <Typography variant="caption" color="text.secondary">Videos & External Links</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <NoteIcon fontSize="large" />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800}>{stats.notes}</Typography>
              <Typography variant="caption" color="text.secondary">Class Notes & Guides</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* ── Filters & Search Row ── */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }} elevation={0} variant="outlined">
        <Grid container spacing={2.5} alignItems="center">
          {/* Subject Dropdown */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Subject"
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                setSelectedSectionId('ALL');
              }}
              InputLabelProps={{ shrink: true }}
            >
              {assignedSubjects.map((sub) => (
                <MenuItem key={sub.id} value={sub.id}>
                  {sub.code} - {sub.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Section Selector */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Section / Batch"
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              InputLabelProps={{ shrink: true }}
            >
              {sectionsOptions.map((sec) => (
                <MenuItem key={sec.id} value={sec.id}>
                  {sec.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Unit / Module Selector */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Unit / Syllabus Module"
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="ALL">All Syllabus Units</MenuItem>
              {UNIT_OPTIONS.map((unit) => (
                <MenuItem key={unit} value={unit}>
                  {unit}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Search Box */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by title or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Type Tabs Filter */}
        <Tabs
          value={activeTypeTab}
          onChange={(e, val) => setActiveTypeTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ minHeight: 38, '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, minHeight: 38 } }}
        >
          <Tab label="All Material Types" value="ALL" />
          <Tab label="PDF Documents" value="PDF" />
          <Tab label="Lecture Slides (PPT)" value="PPT" />
          <Tab label="YouTube Video Tutorials" value="YOUTUBE" />
          <Tab label="External Links" value="LINK" />
          <Tab label="Written Notes" value="NOTE" />
        </Tabs>
      </Paper>

      {/* ── Materials Grid Workspace ── */}
      {isMaterialsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filteredMaterials.length > 0 ? (
        <Grid container spacing={3}>
          {filteredMaterials.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item._id}>
              <Card
                variant="outlined"
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: 3.5,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 12px 28px rgba(0,0,0,0.08)',
                    borderColor: 'primary.main',
                  },
                }}
              >
                <CardContent sx={{ p: 2.5, pb: 1 }}>
                  {/* Top Bar: Format icon + Unit chip */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'action.hover' }}>
                      {getIconForType(item.type)}
                    </Box>
                    <Chip
                      label={item.unit || 'General'}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                    />
                  </Box>

                  {/* Material Title */}
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 800,
                      lineHeight: 1.3,
                      mb: 1,
                      cursor: 'pointer',
                      '&:hover': { color: 'primary.main' },
                    }}
                    onClick={() => setViewingMaterial(item)}
                  >
                    {item.title}
                  </Typography>

                  {/* Description preview */}
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      minHeight: 40,
                      mb: 2,
                      fontSize: '0.85rem',
                      lineHeight: 1.4,
                    }}
                  >
                    {item.description || 'No additional description provided.'}
                  </Typography>

                  {/* Metadata Chips: Subject, Section & File Size */}
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Chip label={item.subjectId?.code || 'SUB'} size="small" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                    <Chip label={`Sec: ${item.group || 'ALL'}`} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                    {item.type !== 'NOTE' && (
                      <Chip label={item.fileSize || '1.5 MB'} size="small" variant="outlined" sx={{ fontWeight: 500, fontSize: '0.7rem' }} />
                    )}
                  </Box>
                </CardContent>

                <Divider sx={{ my: 1 }} />

                <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1.5 }}>
                  {/* Action Link Button */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="View Material Details">
                      <IconButton size="small" color="primary" onClick={() => setViewingMaterial(item)}>
                        <EyeIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {item.type !== 'NOTE' && item.url && item.url !== 'N/A' && (
                      <Button
                        size="small"
                        startIcon={item.type === 'YOUTUBE' || item.type === 'LINK' ? <LaunchIcon fontSize="small" /> : <DownloadIcon fontSize="small" />}
                        href={item.url}
                        target="_blank"
                        sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.8rem' }}
                      >
                        {item.type === 'YOUTUBE' ? 'Watch Video' : item.type === 'LINK' ? 'Open Link' : 'Download'}
                      </Button>
                    )}
                  </Box>

                  {/* Delete Option */}
                  <Tooltip title="Delete Resource">
                    <IconButton onClick={() => setDeleteId(item._id)} size="small" color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        /* Empty State */
        <Paper
          variant="outlined"
          sx={{
            p: 8,
            textAlign: 'center',
            borderRadius: 3.5,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FileIcon sx={{ fontSize: 56, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            No Materials Found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 450, mb: 3 }}>
            No study materials match your current subject, section, or unit filters. Click below to add a new course resource.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleUploadOpen}
            sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', bgcolor: '#4f46e5' }}
          >
            Upload Material Now
          </Button>
        </Paper>
      )}

      {/* ── View Detail Dialog Modal ── */}
      <Dialog open={Boolean(viewingMaterial)} onClose={() => setViewingMaterial(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        {viewingMaterial && (
          <>
            <DialogTitle sx={{ fontWeight: 800, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={800}>{viewingMaterial.title}</Typography>
              <Chip label={viewingMaterial.type} color="primary" size="small" sx={{ fontWeight: 700 }} />
            </DialogTitle>
            <DialogContent dividers sx={{ p: 3 }}>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, mb: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">Syllabus Unit:</Typography>
                  <Typography variant="caption" fontWeight={700}>{viewingMaterial.unit || 'General Reference'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">Subject Code:</Typography>
                  <Typography variant="caption" fontWeight={700}>{viewingMaterial.subjectId?.code || 'N/A'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">Target Section:</Typography>
                  <Typography variant="caption" fontWeight={700}>{viewingMaterial.group || 'All Sections'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">Uploaded By:</Typography>
                  <Typography variant="caption" fontWeight={700}>{viewingMaterial.uploadedBy?.name || 'Faculty Member'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">Upload Date:</Typography>
                  <Typography variant="caption" fontWeight={700}>
                    {new Date(viewingMaterial.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </Typography>
                </Box>
              </Box>

              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Description & Instructions:</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'text.primary' }}>
                {viewingMaterial.description || 'No additional notes or instructions provided.'}
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2.5 }}>
              <Button onClick={() => setViewingMaterial(null)}>Close</Button>
              {viewingMaterial.type !== 'NOTE' && viewingMaterial.url && viewingMaterial.url !== 'N/A' && (
                <Button
                  variant="contained"
                  href={viewingMaterial.url}
                  target="_blank"
                  startIcon={viewingMaterial.type === 'YOUTUBE' ? <LaunchIcon /> : <DownloadIcon />}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                >
                  {viewingMaterial.type === 'YOUTUBE' ? 'Open YouTube Video' : 'Download Resource'}
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ── Upload Dialog Modal ── */}
      <Dialog open={isUploadOpen} onClose={() => setIsUploadOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Upload Course Resource</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <TextField
                label="Resource Title"
                fullWidth
                required
                placeholder="E.g., Unit 1 Lecture Slides - Data Structures"
                value={newMaterial.title}
                onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Material Format / Type"
                fullWidth
                value={newMaterial.type}
                onChange={(e) => setNewMaterial({ ...newMaterial, type: e.target.value })}
              >
                <MenuItem value="PDF">PDF Document</MenuItem>
                <MenuItem value="PPT">Lecture Slides (PPT)</MenuItem>
                <MenuItem value="YOUTUBE">YouTube Video Tutorial</MenuItem>
                <MenuItem value="LINK">External Link / Website</MenuItem>
                <MenuItem value="NOTE">Written Notes / Instructions</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Syllabus Unit / Module"
                fullWidth
                value={newMaterial.unit}
                onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
              >
                {UNIT_OPTIONS.map((unit) => (
                  <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Target Subject"
                fullWidth
                required
                value={newMaterial.subjectId}
                onChange={(e) => setNewMaterial({ ...newMaterial, subjectId: e.target.value })}
              >
                {assignedSubjects.map((sub) => (
                  <MenuItem key={sub.id} value={sub.id}>
                    {sub.code} - {sub.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Target Section / Group"
                fullWidth
                value={newMaterial.sectionId}
                onChange={(e) => setNewMaterial({ ...newMaterial, sectionId: e.target.value })}
              >
                {sectionsOptions.map((sec) => (
                  <MenuItem key={sec.id} value={sec.id}>{sec.name}</MenuItem>
                ))}
              </TextField>
            </Grid>

            {newMaterial.type !== 'NOTE' && (
              <Grid item xs={12}>
                <TextField
                  label="Resource Link / URL"
                  fullWidth
                  required
                  value={newMaterial.url}
                  onChange={(e) => setNewMaterial({ ...newMaterial, url: e.target.value })}
                  placeholder={newMaterial.type === 'YOUTUBE' ? 'https://www.youtube.com/watch?v=...' : 'https://drive.google.com/file/...'}
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <TextField
                label="Description & Instructions"
                fullWidth
                multiline
                rows={3}
                value={newMaterial.description}
                onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                placeholder="Enter lecture overview or guidelines for students..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setIsUploadOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveMaterial}
            variant="contained"
            disabled={uploadMaterialMutation.isPending}
            sx={{ borderRadius: 2, fontWeight: 700, bgcolor: '#4f46e5' }}
          >
            {uploadMaterialMutation.isPending ? 'Uploading...' : 'Upload Resource'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Study Material</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            Are you sure you want to delete this study resource? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleConfirmDelete} disabled={deleteMaterialMutation.isPending} sx={{ borderRadius: 2 }}>
            {deleteMaterialMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Alert Toast ── */}
      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast({ ...toast, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={toast.severity} variant="filled" sx={{ borderRadius: 2 }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MaterialsPage;
