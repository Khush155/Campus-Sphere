// client/src/pages/faculty/materials/MaterialsPage.jsx
//
// Page component for managing Faculty Course Materials with backend integration.

import React, { useState } from 'react';
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
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Import backend hooks
import {
  useFacultyDashboardQuery,
  useMaterialsQuery,
  useUploadMaterialMutation,
  useDeleteMaterialMutation,
} from '../../../queries/facultyQueries';

export const MaterialsPage = () => {
  const navigate = useNavigate();

  // State Management
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');

  // Dialog & Toast States
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    type: 'PDF',
    subjectId: '',
    sectionId: '',
    url: '',
    description: '',
  });

  // 1. Fetch dashboard stats for assigned subjects list
  const { data: dashboardData, isLoading: isDashboardLoading } = useFacultyDashboardQuery();

  const assignedSubjects = dashboardData?.assignedSubjects || [];

  // Helper to determine sections based on subject code
  const getSectionsForSubject = (subjectId) => {
    const subject = assignedSubjects.find((s) => s.id === subjectId);
    if (!subject) return [];
    const code = subject.code || '';
    if (code.startsWith('CS')) {
      return [
        { id: 'CSE-A', name: 'CSE-A' },
        { id: 'CSE-B', name: 'CSE-B' },
      ];
    }
    if (code.startsWith('EC')) {
      return [{ id: 'ECE-A', name: 'ECE-A' }];
    }
    return [{ id: 'CSE-A', name: 'CSE-A' }];
  };

  const sectionsForSubject = getSectionsForSubject(selectedSubjectId);

  // 2. Fetch materials from backend filtered by active selections
  const { data: materialsList = [], isLoading: isMaterialsLoading } = useMaterialsQuery({
    subjectId: selectedSubjectId || undefined,
    group: selectedSectionId || undefined,
  });

  const uploadMaterialMutation = useUploadMaterialMutation();
  const deleteMaterialMutation = useDeleteMaterialMutation();

  const handleSubjectChange = (subjectId) => {
    setSelectedSubjectId(subjectId);
    const sections = getSectionsForSubject(subjectId);
    if (sections.length > 0) {
      setSelectedSectionId(sections[0].id);
    } else {
      setSelectedSectionId('');
    }
  };

  const handleSectionChange = (sectionId) => {
    setSelectedSectionId(sectionId);
  };

  // Action handlers
  const handleUploadOpen = () => {
    setNewMaterial({
      title: '',
      type: 'PDF',
      subjectId: selectedSubjectId || (assignedSubjects[0]?.id || ''),
      sectionId: selectedSectionId || (getSectionsForSubject(assignedSubjects[0]?.id || '')[0]?.id || ''),
      url: '',
      description: '',
    });
    setIsUploadOpen(true);
  };

  const handleUploadClose = () => {
    setIsUploadOpen(false);
  };

  const handleSaveMaterial = () => {
    if (!newMaterial.title || !newMaterial.subjectId || !newMaterial.sectionId) {
      alert('Please fill out all required fields.');
      return;
    }

    const payload = {
      title: newMaterial.title,
      type: newMaterial.type,
      subjectId: newMaterial.subjectId,
      semester: 3, // Default for seeded students
      group: newMaterial.sectionId,
      url: newMaterial.type === 'NOTE' ? 'N/A' : newMaterial.url || 'https://campus.edu/files/resource',
      description: newMaterial.description,
      fileSize: newMaterial.type === 'NOTE' ? '0 KB' : '1.5 MB',
    };

    uploadMaterialMutation.mutate(payload, {
      onSuccess: () => {
        setIsUploadOpen(false);
        setToastMsg('Material uploaded successfully!');
        setIsToastOpen(true);
      },
      onError: (err) => {
        alert(`Upload failed: ${err.response?.data?.message || err.message}`);
      },
    });
  };

  const handleDeleteMaterial = (id) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      deleteMaterialMutation.mutate(id, {
        onSuccess: () => {
          setToastMsg('Material deleted successfully.');
          setIsToastOpen(true);
        },
        onError: (err) => {
          alert(`Delete failed: ${err.response?.data?.message || err.message}`);
        },
      });
    }
  };

  // Render Format Icon Helper
  const getIconForType = (type) => {
    switch (type) {
      case 'PDF':
        return <PdfIcon color="error" sx={{ fontSize: 32 }} />;
      case 'PPT':
        return <PptIcon color="primary" sx={{ fontSize: 32 }} />;
      case 'YOUTUBE':
        return <VideoIcon color="error" sx={{ fontSize: 32 }} />;
      case 'NOTE':
        return <NoteIcon color="warning" sx={{ fontSize: 32 }} />;
      default:
        return <LinkIcon color="action" sx={{ fontSize: 32 }} />;
    }
  };

  if (isDashboardLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Map backend subjects to filter components expectations
  const filterSubjects = assignedSubjects.map((sub) => ({
    id: sub.id,
    name: sub.name,
    code: sub.code,
  }));

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* ── Page Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
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
              Course Materials
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Upload and manage course PDFs, lecture slides, YouTube guides, and reference documents
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
            bgcolor: '#4f46e5',
            '&:hover': { bgcolor: '#4338ca' },
            borderRadius: 2,
            px: 3.5,
          }}
        >
          Upload Material
        </Button>
      </Box>

      {/* ── Filters Row ── */}
      <Paper sx={{ p: 3, mb: 3 }} elevation={0} variant="outlined">
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Select Subject</Typography>
              <TextField
                select
                fullWidth
                value={selectedSubjectId}
                onChange={(e) => handleSubjectChange(e.target.value)}
                displayEmpty
              >
                <MenuItem value="">All Subjects</MenuItem>
                {filterSubjects.map((sub) => (
                  <MenuItem key={sub.id} value={sub.id}>
                    {sub.code} - {sub.name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Select Section</Typography>
              <TextField
                select
                fullWidth
                disabled={!selectedSubjectId}
                value={selectedSectionId}
                onChange={(e) => handleSectionChange(e.target.value)}
                displayEmpty
              >
                <MenuItem value="">All Sections</MenuItem>
                {sectionsForSubject.map((sec) => (
                  <MenuItem key={sec.id} value={sec.id}>
                    {sec.name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* ── Materials Grid ── */}
      {isMaterialsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : materialsList.length > 0 ? (
        <Grid container spacing={3}>
          {materialsList.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item._id}>
              <Card
                variant="outlined"
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: 3,
                  position: 'relative',
                  '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.05)' },
                }}
              >
                <CardContent sx={{ pb: 1 }}>
                  {/* Category icon and title */}
                  <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-start' }}>
                    {getIconForType(item.type)}
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.3 }}>
                        {item.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Uploaded on: {new Date(item.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Description or download metadata */}
                  {item.type === 'NOTE' ? (
                    <Typography variant="body2" color="text.secondary" sx={{ minHeight: 40, lineHeight: 1.4 }}>
                      {item.description}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ minHeight: 40 }}>
                      File Size: {item.fileSize || 'N/A'}
                    </Typography>
                  )}

                  {/* Subject and Section Chips */}
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Chip label={item.subjectId?.code || 'SUB'} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                    <Chip label={item.group} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                  </Box>
                </CardContent>
                <Divider />
                <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1.5 }}>
                  {/* Visit/Download Action */}
                  {item.type === 'NOTE' ? (
                    <Box />
                  ) : (
                    <Button
                      size="small"
                      startIcon={item.type === 'YOUTUBE' || item.type === 'LINK' ? <LaunchIcon /> : <DownloadIcon />}
                      href={item.url}
                      target="_blank"
                      sx={{ textTransform: 'none', fontWeight: 700 }}
                    >
                      {item.type === 'YOUTUBE' ? 'Watch' : item.type === 'LINK' ? 'Open Link' : 'Download'}
                    </Button>
                  )}

                  {/* Delete Button */}
                  <IconButton onClick={() => handleDeleteMaterial(item._id)} size="small" color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
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
            borderRadius: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FileIcon sx={{ fontSize: 50, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            No Materials Found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No lecture notes or course resources match the selected filters.
          </Typography>
        </Paper>
      )}

      {/* ── Upload Dialog Modal ── */}
      <Dialog open={isUploadOpen} onClose={handleUploadClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Upload Course Resource</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Title */}
            <Grid item xs={12}>
              <TextField
                label="Resource Title"
                fullWidth
                required
                value={newMaterial.title}
                onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
              />
            </Grid>

            {/* Type */}
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Material Type"
                fullWidth
                value={newMaterial.type}
                onChange={(e) => setNewMaterial({ ...newMaterial, type: e.target.value })}
              >
                <MenuItem value="PDF">PDF Document</MenuItem>
                <MenuItem value="PPT">Lecture Slides (PPT)</MenuItem>
                <MenuItem value="YOUTUBE">YouTube Video Link</MenuItem>
                <MenuItem value="LINK">External Website Link</MenuItem>
                <MenuItem value="NOTE">Written Notes / Instructions</MenuItem>
              </TextField>
            </Grid>

            {/* Subject */}
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Subject"
                fullWidth
                required
                value={newMaterial.subjectId}
                onChange={(e) => {
                  const subId = e.target.value;
                  const sections = getSectionsForSubject(subId);
                  setNewMaterial({
                    ...newMaterial,
                    subjectId: subId,
                    sectionId: sections[0]?.id || '',
                  });
                }}
              >
                {assignedSubjects.map((sub) => (
                  <MenuItem key={sub.id} value={sub.id}>
                    {sub.code} - {sub.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Section */}
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Section"
                fullWidth
                required
                disabled={!newMaterial.subjectId}
                value={newMaterial.sectionId}
                onChange={(e) => setNewMaterial({ ...newMaterial, sectionId: e.target.value })}
              >
                {getSectionsForSubject(newMaterial.subjectId).map((sec) => (
                  <MenuItem key={sec.id} value={sec.id}>
                    {sec.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* URL or Description depending on type */}
            {newMaterial.type === 'NOTE' ? (
              <Grid item xs={12}>
                <TextField
                  label="Reference Notes Details"
                  fullWidth
                  multiline
                  rows={4}
                  value={newMaterial.description}
                  onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                  placeholder="Enter custom instructions or lecture descriptions here..."
                />
              </Grid>
            ) : (
              <Grid item xs={12}>
                <TextField
                  label="Resource Link / URL"
                  fullWidth
                  required
                  value={newMaterial.url}
                  onChange={(e) => setNewMaterial({ ...newMaterial, url: e.target.value })}
                  placeholder={
                    newMaterial.type === 'YOUTUBE'
                      ? 'https://www.youtube.com/watch?v=...'
                      : 'https://campus.edu/files/resource.pdf'
                  }
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleUploadClose} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSaveMaterial}
            variant="contained"
            disabled={uploadMaterialMutation.isPending}
            sx={{ bgcolor: '#4f46e5' }}
          >
            {uploadMaterialMutation.isPending ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Alert Toast ── */}
      <Snackbar open={isToastOpen} autoHideDuration={3000} onClose={() => setIsToastOpen(false)}>
        <Alert severity="success" variant="filled">
          {toastMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MaterialsPage;
