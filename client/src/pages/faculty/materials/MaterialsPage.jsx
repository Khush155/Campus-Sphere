import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
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
  Divider,
  CircularProgress,
  Tabs,
  Tab,
  useTheme,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Launch as LaunchIcon,
  PictureAsPdf as PdfIcon,
  Slideshow as PptIcon,
  YouTube as VideoIcon,
  Link as LinkIcon,
  Note as NoteIcon,
  Search as SearchIcon,
  MenuBookOutlined,
  FolderOutlined,
  VisibilityOutlined,
  RefreshOutlined,
  CloudUploadOutlined,
} from '@mui/icons-material';

// Backend hooks
import {
  useFacultyDashboardQuery,
  useMaterialsQuery,
  useUploadMaterialMutation,
  useDeleteMaterialMutation,
} from '../../../queries/facultyQueries';
import { useToast } from '../../../contexts/ToastContext';
import ConfirmDeleteModal from '../../../components/common/ConfirmDeleteModal';
import EmptyState from '../../../components/common/EmptyState';

const UNIT_OPTIONS = [
  'General Reference',
  'Unit 1: Introduction & Fundamentals',
  'Unit 2: Core Architecture & Design',
  'Unit 3: Advanced Methods & Algorithms',
  'Unit 4: System Integration & Testing',
  'Unit 5: Case Studies & Emerging Trends',
];

export const MaterialsPage = () => {
  const theme = useTheme();
  const { showToast } = useToast();

  // Filter States
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('ALL');
  const [activeTypeTab, setActiveTypeTab] = useState('ALL');
  const [selectedUnit, setSelectedUnit] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog & Detail Modal States
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [viewingMaterial, setViewingMaterial] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

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
  const { data: rawMaterials = [], isLoading: isMaterialsLoading, refetch } = useMaterialsQuery({
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
    setSelectedFile(null);
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
      showToast('Please enter title and select a subject.', { severity: 'error' });
      return;
    }

    if (!selectedFile && newMaterial.type !== 'NOTE' && !newMaterial.url) {
      showToast('Please select a local document file or enter a resource URL.', { severity: 'error' });
      return;
    }

    let payload;
    if (selectedFile) {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', newMaterial.title.trim());
      formData.append('type', newMaterial.type);
      formData.append('subjectId', newMaterial.subjectId);
      formData.append('semester', currentSubject?.semester || 1);
      formData.append('group', newMaterial.sectionId || 'ALL');
      formData.append('unit', newMaterial.unit || 'General Reference');
      formData.append('url', newMaterial.url.trim() || 'N/A');
      formData.append('description', newMaterial.description.trim());
      formData.append('fileSize', newMaterial.fileSize || '2.5 MB');
      payload = formData;
    } else {
      payload = {
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
    }

    uploadMaterialMutation.mutate(payload, {
      onSuccess: () => {
        setIsUploadOpen(false);
        setSelectedFile(null);
        showToast('Study material uploaded successfully!');
      },
      onError: (err) => {
        showToast(`Upload failed: ${err.response?.data?.message || err.message}`, { severity: 'error' });
      },
    });
  };

  const handleDeleteConfirm = () => {
    if (!deleteTargetId) return;
    deleteMaterialMutation.mutate(deleteTargetId, {
      onSuccess: () => {
        setDeleteTargetId(null);
        showToast('Material deleted successfully!');
      },
      onError: (err) => {
        setDeleteTargetId(null);
        showToast(`Delete failed: ${err.response?.data?.message || err.message}`, { severity: 'error' });
      },
    });
  };

  // Render Format Icon Helper
  const getIconForType = (type) => {
    switch (type) {
      case 'PDF':
        return <PdfIcon sx={{ fontSize: 28, color: '#ef4444' }} />;
      case 'PPT':
        return <PptIcon sx={{ fontSize: 28, color: '#3b82f6' }} />;
      case 'YOUTUBE':
        return <VideoIcon sx={{ fontSize: 28, color: '#dc2626' }} />;
      case 'NOTE':
        return <NoteIcon sx={{ fontSize: 28, color: '#f59e0b' }} />;
      default:
        return <LinkIcon sx={{ fontSize: 28, color: '#6366f1' }} />;
    }
  };

  if (isDashboardLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={36} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* ── 1. Hero Identity Banner ────────────────────────────────────────── */}
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
                icon={<FolderOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="FACULTY STUDY & COURSE MATERIALS VAULT"
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
              Study & Course Materials Vault
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              Upload lecture slides, course syllabus PDFs, unit notes, lab manuals, and video tutorial links for your assigned department subjects.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshOutlined />}
              onClick={() => refetch()}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
            >
              Refresh Vault
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleUploadOpen}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 700,
                background: theme.palette.primary.gradient || theme.palette.primary.main,
                color: '#ffffff',
              }}
            >
              Upload New Material
            </Button>
          </Box>
        </Box>
      </Card>

      {/* ── 2. KPI Summary Grid (Faculty Roster Card Style) ───────────────── */}
      <Grid container spacing={2.5}>
        {/* 1. Total Resources Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '14px',
              border: `1px solid ${theme.palette.divider}`,
              borderTop: `4px solid ${theme.palette.primary.main}`,
              boxShadow: 'none',
              bgcolor: theme.palette.background.paper,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
                  TOTAL RESOURCES
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: theme.palette.ink ? theme.palette.ink[900] : 'text.primary',
                    mt: 1,
                    fontFamily: theme.typography.mono?.fontFamily || 'monospace',
                  }}
                >
                  {stats.total}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main }}>
                <MenuBookOutlined />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        {/* 2. PDFs & Decks Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '14px',
              border: `1px solid ${theme.palette.divider}`,
              borderTop: `4px solid ${theme.palette.signal?.error || '#ef4444'}`,
              boxShadow: 'none',
              bgcolor: theme.palette.background.paper,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.signal?.error || '#ef4444' }}
                >
                  PDFs &amp; DECKS
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: theme.palette.signal?.error || '#ef4444',
                    mt: 1,
                    fontFamily: theme.typography.mono?.fontFamily || 'monospace',
                  }}
                >
                  {stats.pdfs}
                </Typography>
              </Box>
              <Avatar
                sx={{
                  bgcolor: `${theme.palette.signal?.error || '#ef4444'}15`,
                  color: theme.palette.signal?.error || '#ef4444',
                }}
              >
                <PdfIcon />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        {/* 3. Video & Links Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '14px',
              border: `1px solid ${theme.palette.divider}`,
              borderTop: `4px solid ${theme.palette.info?.main || '#3b82f6'}`,
              boxShadow: 'none',
              bgcolor: theme.palette.background.paper,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.info?.main || '#3b82f6' }}
                >
                  VIDEO &amp; LINKS
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: theme.palette.info?.main || '#3b82f6',
                    mt: 1,
                    fontFamily: theme.typography.mono?.fontFamily || 'monospace',
                  }}
                >
                  {stats.videos}
                </Typography>
              </Box>
              <Avatar
                sx={{
                  bgcolor: `${theme.palette.info?.main || '#3b82f6'}15`,
                  color: theme.palette.info?.main || '#3b82f6',
                }}
              >
                <VideoIcon />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        {/* 4. Unit Reading Notes Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '14px',
              border: `1px solid ${theme.palette.divider}`,
              borderTop: `4px solid ${theme.palette.warning?.main || '#f59e0b'}`,
              boxShadow: 'none',
              bgcolor: theme.palette.background.paper,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.warning?.main || '#f59e0b' }}
                >
                  UNIT NOTES
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: theme.palette.warning?.main || '#f59e0b',
                    mt: 1,
                    fontFamily: theme.typography.mono?.fontFamily || 'monospace',
                  }}
                >
                  {stats.notes}
                </Typography>
              </Box>
              <Avatar
                sx={{
                  bgcolor: `${theme.palette.warning?.main || '#f59e0b'}15`,
                  color: theme.palette.warning?.main || '#f59e0b',
                }}
              >
                <NoteIcon />
              </Avatar>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* ── 3. Filters Bar & Format Tabs ─────────────────────────────────── */}
      <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Grid container spacing={2} sx={{ mb: 2.5 }} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Select Subject"
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                setSelectedSectionId('ALL');
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            >
              {assignedSubjects.map((sub) => (
                <MenuItem key={sub.id} value={sub.id}>
                  {sub.name}{sub.code ? ` (${sub.code})` : ''}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Section / Group"
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            >
              {sectionsOptions.map((sec) => (
                <MenuItem key={sec.id} value={sec.id}>{sec.name}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Syllabus Unit Filter"
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            >
              <MenuItem value="ALL">All Syllabus Units</MenuItem>
              {UNIT_OPTIONS.map((u) => (
                <MenuItem key={u} value={u}>{u}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={2}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 0.5, fontSize: 18 }} />,
              }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ mb: 2 }} />

        {/* Format Type Tabs */}
        <Tabs
          value={activeTypeTab}
          onChange={(_, val) => setActiveTypeTab(val)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab value="ALL" label="All Formats" />
          <Tab value="PDF" label="PDF Documents" />
          <Tab value="PPT" label="Lecture Decks" />
          <Tab value="YOUTUBE" label="Video Tutorials" />
          <Tab value="NOTE" label="Unit Notes" />
          <Tab value="LINK" label="External Links" />
        </Tabs>
      </Card>

      {/* ── 4. Main Resource Cards Grid ──────────────────────────────────── */}
      {isMaterialsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={32} />
        </Box>
      ) : filteredMaterials.length === 0 ? (
        <Card sx={{ p: 4, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
          <EmptyState
            type="reports"
            title="No Study Materials Uploaded"
            description="No lecture notes, PDFs, or videos match your search filters for this subject."
          />
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {filteredMaterials.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item._id || item.id}>
              <Card
                sx={{
                  p: 2.5,
                  borderRadius: '16px',
                  border: `1px solid ${theme.palette.divider}`,
                  boxShadow: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                  height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {getIconForType(item.type)}
                      <Box>
                        <Chip
                          label={item.type || 'DOCUMENT'}
                          size="small"
                          color={item.type === 'PDF' ? 'error' : item.type === 'YOUTUBE' ? 'error' : 'primary'}
                          sx={{ fontWeight: 800, fontSize: '0.62rem', height: 18 }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
                          {item.fileSize || '2.5 MB'}
                        </Typography>
                      </Box>
                    </Box>

                    <IconButton size="small" color="error" onClick={() => setDeleteTargetId(item._id || item.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: theme.palette.ink[900], lineHeight: 1.3 }}>
                    {item.title}
                  </Typography>

                  <Chip label={item.unit || 'General Reference'} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.65rem', alignSelf: 'flex-start' }} />

                  {item.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.description}
                    </Typography>
                  )}
                </Box>

                <Box sx={{ mt: 2, pt: 1.5, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Section: <strong>{item.group || 'All'}</strong>
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<VisibilityOutlined />}
                      onClick={() => setViewingMaterial(item)}
                      sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem' }}
                    >
                      View
                    </Button>
                    {item.url && item.url !== 'N/A' && (
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={item.type === 'PDF' || item.type === 'PPT' ? <DownloadIcon /> : <LaunchIcon />}
                        href={item.url}
                        target="_blank"
                        sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 700, fontSize: '0.72rem' }}
                      >
                        {item.type === 'PDF' || item.type === 'PPT' ? 'Download' : 'Open Link'}
                      </Button>
                    )}
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── 5. Upload New Material Modal ──────────────────────────────────── */}
      <Dialog open={isUploadOpen} onClose={() => setIsUploadOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Upload New Study Material</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* File Picker Component */}
          <Box
            sx={{
              border: `2px dashed ${theme.palette.primary.main}40`,
              p: 2.5,
              borderRadius: '12px',
              textAlign: 'center',
              bgcolor: `${theme.palette.primary.main}05`,
            }}
          >
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadOutlined />}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
            >
              Choose Document File (PDF, PPT, DOC, Video)
              <input
                type="file"
                hidden
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    setSelectedFile(file);
                    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
                    const ext = file.name.split('.').pop()?.toUpperCase() || '';
                    let formatType = 'PDF';
                    if (['PPT', 'PPTX'].includes(ext)) formatType = 'PPT';
                    if (['MP4', 'MKV', 'WEBM'].includes(ext)) formatType = 'YOUTUBE';
                    if (['TXT', 'MD', 'DOC', 'DOCX'].includes(ext)) formatType = 'NOTE';

                    setNewMaterial((prev) => ({
                      ...prev,
                      title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
                      type: formatType,
                      fileSize: sizeMB > 0.1 ? `${sizeMB} MB` : `${Math.round(file.size / 1024)} KB`,
                    }));
                  }
                }}
              />
            </Button>
            {selectedFile ? (
              <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.signal.success, mt: 1 }}>
                📁 Selected File: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
              </Typography>
            ) : (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Or paste an external Google Drive / Web URL below
              </Typography>
            )}
          </Box>

          <TextField
            label="Material Title"
            value={newMaterial.title}
            onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
            required
            fullWidth
          />

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                select
                label="Format Type"
                value={newMaterial.type}
                onChange={(e) => setNewMaterial({ ...newMaterial, type: e.target.value })}
                fullWidth
              >
                <MenuItem value="PDF">PDF Document</MenuItem>
                <MenuItem value="PPT">Presentation Deck (PPTX)</MenuItem>
                <MenuItem value="YOUTUBE">YouTube Video Lesson</MenuItem>
                <MenuItem value="NOTE">Unit Reading Note</MenuItem>
                <MenuItem value="LINK">External Web Link</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                select
                label="Target Group/Section"
                value={newMaterial.sectionId}
                onChange={(e) => setNewMaterial({ ...newMaterial, sectionId: e.target.value })}
                fullWidth
              >
                {sectionsOptions.map((s) => (
                  <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <TextField
            select
            label="Syllabus Unit"
            value={newMaterial.unit}
            onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
            fullWidth
          >
            {UNIT_OPTIONS.map((u) => (
              <MenuItem key={u} value={u}>{u}</MenuItem>
            ))}
          </TextField>

          {!selectedFile && newMaterial.type !== 'NOTE' && (
            <TextField
              label="Resource Link / File URL"
              placeholder="https://drive.google.com/file/d/..."
              value={newMaterial.url}
              onChange={(e) => setNewMaterial({ ...newMaterial, url: e.target.value })}
              fullWidth
            />
          )}

          <TextField
            label="Description & Instructions"
            value={newMaterial.description}
            onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
            fullWidth
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsUploadOpen(false)} variant="outlined" sx={{ borderRadius: '8px' }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSaveMaterial} disabled={uploadMaterialMutation.isPending} sx={{ borderRadius: '8px', fontWeight: 700 }}>
            {uploadMaterialMutation.isPending ? 'Uploading...' : 'Publish Material'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── 6. Resource View Modal ────────────────────────────────────────── */}
      <Dialog open={Boolean(viewingMaterial)} onClose={() => setViewingMaterial(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        {viewingMaterial && (
          <>
            <DialogTitle sx={{ fontWeight: 800 }}>{viewingMaterial.title}</DialogTitle>
            <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip label={viewingMaterial.type} color="primary" size="small" sx={{ fontWeight: 800 }} />
                <Chip label={viewingMaterial.unit || 'General Reference'} variant="outlined" size="small" sx={{ fontWeight: 700 }} />
              </Box>

              <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                {viewingMaterial.description || 'No additional description provided.'}
              </Typography>

              {viewingMaterial.url && viewingMaterial.url !== 'N/A' && (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: '8px', bgcolor: 'rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ wordBreak: 'break-all', maxWidth: '70%' }}>
                    {viewingMaterial.url}
                  </Typography>
                  <Button variant="contained" size="small" href={viewingMaterial.url} target="_blank" startIcon={<LaunchIcon />}>
                    Open Resource
                  </Button>
                </Paper>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setViewingMaterial(null)} variant="contained" sx={{ borderRadius: '8px', fontWeight: 700 }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ── 7. Confirm Delete Modal ───────────────────────────────────────── */}
      <ConfirmDeleteModal
        open={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Study Material?"
        description="Are you sure you want to delete this study resource? Students will no longer be able to access or download it."
        isLoading={deleteMaterialMutation.isPending}
      />
    </Box>
  );
};

export default MaterialsPage;
