// client/src/pages/faculty/materials/MaterialsPage.jsx
//
// Page component for managing Faculty Course Materials.
// Supports listing, filtering, mocking uploads, and deletion of notes, PDFs, PPTs, and links.

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

// Reused components & mock lists from other modules
import SubjectSelector from '../attendance/components/SubjectSelector';
import SectionSelector from '../attendance/components/SectionSelector';
import { mockAttendanceSubjects } from '../attendance/mockData';
import { mockMaterialsList } from './mockMaterials';

const SUBJECT_SECTIONS = {
  sub1: [{ id: 'sec1a', name: 'CSE-A' }],
  sub2: [
    { id: 'sec2a', name: 'CSE-A' },
    { id: 'sec2b', name: 'CSE-B' },
  ],
  sub3: [{ id: 'sec3a', name: 'CSE-A' }],
};

export const MaterialsPage = () => {
  const navigate = useNavigate();

  // State Management
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [materials, setMaterials] = useState(mockMaterialsList);

  // Dialog States
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

  // Filters Cascade
  const sectionsForSubject = SUBJECT_SECTIONS[selectedSubjectId] || [];

  const handleSubjectChange = (subjectId) => {
    setSelectedSubjectId(subjectId);
    const sections = SUBJECT_SECTIONS[subjectId] || [];
    if (sections.length === 1) {
      setSelectedSectionId(sections[0].id);
    } else {
      setSelectedSectionId('');
    }
  };

  // Filtered Materials
  const filteredMaterials = materials.filter((item) => {
    const subMatch = !selectedSubjectId || item.subjectId === selectedSubjectId;
    const secMatch = !selectedSectionId || item.sectionId === selectedSectionId;
    return subMatch && secMatch;
  });

  // Action handlers
  const handleUploadOpen = () => {
    setNewMaterial({
      title: '',
      type: 'PDF',
      subjectId: selectedSubjectId,
      sectionId: selectedSectionId,
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

    const subObj = mockAttendanceSubjects.find(s => s.id === newMaterial.subjectId);
    const secObj = (SUBJECT_SECTIONS[newMaterial.subjectId] || []).find(s => s.id === newMaterial.sectionId);

    const created = {
      id: `mat${Date.now()}`,
      title: newMaterial.title,
      subjectId: newMaterial.subjectId,
      subjectCode: subObj?.code || 'N/A',
      sectionId: newMaterial.sectionId,
      sectionName: secObj?.name || 'N/A',
      type: newMaterial.type,
      url: newMaterial.type === 'NOTE' ? '' : newMaterial.url || 'https://campus.edu/files/resource',
      fileSize: newMaterial.type === 'NOTE' ? '' : '1.5 MB',
      description: newMaterial.description,
      uploadedAt: new Date().toISOString().split('T')[0],
    };

    setMaterials([created, ...materials]);
    setIsUploadOpen(false);
    setToastMsg('Material uploaded successfully!');
    setIsToastOpen(true);
  };

  const handleDeleteMaterial = (id) => {
    setMaterials(materials.filter((m) => m.id !== id));
    setToastMsg('Material deleted successfully.');
    setIsToastOpen(true);
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
            <SubjectSelector
              subjects={mockAttendanceSubjects}
              selectedSubjectId={selectedSubjectId}
              onSubjectChange={handleSubjectChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <SectionSelector
              sections={sectionsForSubject}
              selectedSectionId={selectedSectionId}
              onSectionChange={handleSectionChange}
              disabled={!selectedSubjectId}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* ── Materials Grid ── */}
      {filteredMaterials.length > 0 ? (
        <Grid container spacing={3}>
          {filteredMaterials.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
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
                        Uploaded on: {item.uploadedAt}
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
                    <Chip label={item.subjectCode} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                    <Chip label={item.sectionName} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
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
                  <IconButton onClick={() => handleDeleteMaterial(item.id)} size="small" color="error">
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
                  setNewMaterial({
                    ...newMaterial,
                    subjectId: subId,
                    sectionId: (SUBJECT_SECTIONS[subId] || [])[0]?.id || '',
                  });
                }}
              >
                {mockAttendanceSubjects.map((sub) => (
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
                {(SUBJECT_SECTIONS[newMaterial.subjectId] || []).map((sec) => (
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
          <Button onClick={handleSaveMaterial} variant="contained" sx={{ bgcolor: '#4f46e5' }}>
            Upload
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
