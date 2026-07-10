// client/src/pages/faculty/marks/MarksPage.jsx
//
// Container component orchestrating the Faculty Marks module.
// Owns selections, calculations, action states, and CRUD mock updates.

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Snackbar,
  Alert,
  IconButton,
  Chip,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Send as SubmitIcon,
  CheckCircle as ApproveIcon,
  Publish as PublishIcon,
  Archive as ArchiveIcon,
  LockReset as UnpublishIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Child presenter components
import MarksFilters from './components/MarksFilters';
import MarksEntryTable from './components/MarksEntryTable';
import MarksSummaryCard from './components/MarksSummaryCard';

// Data sources
import { mockAssessments, mockGradebooks } from './mockData';
import { mockAttendanceSubjects, mockStudentsList } from '../attendance/mockData';
import StatusChip from '../components/StatusChip';

// Subject → Section mapping (consistent with Attendance/Exams)
const SUBJECT_SECTIONS = {
  sub1: [{ id: 'sec1a', name: 'CSE-A', strength: 20 }],
  sub2: [
    { id: 'sec2a', name: 'CSE-A', strength: 20 },
    { id: 'sec2b', name: 'CSE-B', strength: 18 },
  ],
  sub3: [{ id: 'sec3a', name: 'CSE-A', strength: 20 }],
};

export const MarksPage = () => {
  const navigate = useNavigate();

  // ══════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ══════════════════════════════════════════════════════════
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [assessmentType, setAssessmentType] = useState('');
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');

  // Active Gradebook State
  const [status, setStatus] = useState('DRAFT');
  const [isPublished, setIsPublished] = useState(false);
  const [records, setRecords] = useState([]);

  // Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  // ══════════════════════════════════════════════════════════
  // DERIVED DATA & CALCULATIONS
  // ══════════════════════════════════════════════════════════
  
  // Available sections for the selected subject
  const sectionsForSubject = SUBJECT_SECTIONS[selectedSubjectId] || [];

  // Available assessments matching subject, section, and type
  const availableAssessments = useMemo(() => {
    if (!selectedSubjectId || !selectedSectionId || !assessmentType) return [];
    return mockAssessments.filter(
      (asg) =>
        asg.subjectId === selectedSubjectId &&
        asg.sectionId === selectedSectionId &&
        asg.assessmentType === assessmentType
    );
  }, [selectedSubjectId, selectedSectionId, assessmentType]);

  const activeAssessment = useMemo(() => {
    return mockAssessments.find((asg) => asg.id === selectedAssessmentId);
  }, [selectedAssessmentId]);

  // ══════════════════════════════════════════════════════════
  // LOAD GRADEBOOK RECORDS
  // ══════════════════════════════════════════════════════════
  useEffect(() => {
    if (!selectedAssessmentId) {
      setRecords([]);
      setStatus('DRAFT');
      setIsPublished(false);
      setIsEditing(false);
      return;
    }

    const existingGradebook = mockGradebooks[selectedAssessmentId];

    if (existingGradebook) {
      // Load copy of existing records
      setRecords(JSON.parse(JSON.stringify(existingGradebook.records)));
      setStatus(existingGradebook.status);
      setIsPublished(existingGradebook.isPublished);
    } else {
      // Initialize a fresh gradebook for the section list
      const maxMarksValue = activeAssessment?.maxMarks || 100;
      const initialRecords = mockStudentsList.map((stud) => ({
        studentId: stud.id,
        rollNumber: stud.rollNumber,
        name: stud.name,
        email: stud.email,
        marksObtained: 0, // default to 0
        maxMarks: maxMarksValue,
        grade: 'F', // default grade
        remarks: '',
      }));
      setRecords(initialRecords);
      setStatus('DRAFT');
      setIsPublished(false);
    }
    setIsEditing(false);
  }, [selectedAssessmentId, activeAssessment]);

  // ══════════════════════════════════════════════════════════
  // AUTOMATIC LETTER GRADE CALCULATION
  // ══════════════════════════════════════════════════════════
  const calculateGrade = (score, max) => {
    if (score === null || score === undefined || isNaN(score)) return 'F';
    const ratio = score / max;
    if (ratio >= 0.9) return 'O';
    if (ratio >= 0.8) return 'A+';
    if (ratio >= 0.7) return 'A';
    if (ratio >= 0.6) return 'B+';
    if (ratio >= 0.5) return 'B';
    if (ratio >= 0.4) return 'C';
    return 'F';
  };

  // ══════════════════════════════════════════════════════════
  // HANDLERS FOR PRESENTATION TABLE
  // ══════════════════════════════════════════════════════════
  
  const showToast = (message, severity = 'success') => {
    setToast({ open: true, message, severity });
  };

  const handleSubjectChange = (subjectId) => {
    setSelectedSubjectId(subjectId);
    setSelectedSectionId('');
    setAssessmentType('');
    setSelectedAssessmentId('');
  };

  const handleSectionChange = (sectionId) => {
    setSelectedSectionId(sectionId);
    setAssessmentType('');
    setSelectedAssessmentId('');
  };

  const handleAssessmentTypeChange = (type) => {
    setAssessmentType(type);
    setSelectedAssessmentId('');
  };

  const handleAssessmentChange = (id) => {
    setSelectedAssessmentId(id);
  };

  // Edit cell scores
  const handleMarksChange = (studentId, val) => {
    setRecords((prev) =>
      prev.map((rec) => {
        if (rec.studentId !== studentId) return rec;
        
        let score = val;
        if (val !== '') {
          // Clamp score between 0 and student's maxMarks
          score = Math.max(0, Math.min(rec.maxMarks, Number(val)));
        }

        return {
          ...rec,
          marksObtained: score,
          grade: calculateGrade(score, rec.maxMarks),
        };
      })
    );
  };

  // Edit cell remarks
  const handleRemarksChange = (studentId, text) => {
    setRecords((prev) =>
      prev.map((rec) =>
        rec.studentId === studentId ? { ...rec, remarks: text } : rec
      )
    );
  };

  // Toggle Absent state
  const handleAbsentToggle = (studentId, isChecked) => {
    setRecords((prev) =>
      prev.map((rec) => {
        if (rec.studentId !== studentId) return rec;
        return {
          ...rec,
          marksObtained: isChecked ? null : 0, // Null represents absent
          grade: isChecked ? 'F' : 'F',
          remarks: isChecked ? 'Absent' : '',
        };
      })
    );
  };

  // ── Administrative Status Transitions ──

  // Save Draft (Local Cache Commit)
  const handleSaveDraft = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      // Validate inputs
      const invalid = records.some(r => r.marksObtained !== null && r.marksObtained === '');
      if (invalid) {
        showToast('Please specify valid score inputs for all active students.', 'error');
        setIsSubmitting(false);
        return;
      }

      // Update mock database reference
      mockGradebooks[selectedAssessmentId] = {
        assessmentId: selectedAssessmentId,
        subjectId: selectedSubjectId,
        sectionId: selectedSectionId,
        maxMarks: activeAssessment.maxMarks,
        status, // keep current status
        isPublished,
        records: JSON.parse(JSON.stringify(records)),
      };

      setIsEditing(false);
      setIsSubmitting(false);
      showToast('Draft grades saved successfully!');
    }, 600);
  };

  // Submit to HOD
  const handleSubmitForReview = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setStatus('SUBMITTED');
      // Save changes with new status
      mockGradebooks[selectedAssessmentId] = {
        assessmentId: selectedAssessmentId,
        subjectId: selectedSubjectId,
        sectionId: selectedSectionId,
        maxMarks: activeAssessment.maxMarks,
        status: 'SUBMITTED',
        isPublished: false,
        records: JSON.parse(JSON.stringify(records)),
      };
      setIsSubmitting(false);
      showToast('Gradebook submitted to HOD for approval.');
    }, 600);
  };

  // HOD Approve
  const handleApprove = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setStatus('APPROVED');
      mockGradebooks[selectedAssessmentId].status = 'APPROVED';
      setIsSubmitting(false);
      showToast('Grades approved! Ready to publish.');
    }, 600);
  };

  // Publish to Portal
  const handlePublishResults = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setStatus('PUBLISHED');
      setIsPublished(true);
      mockGradebooks[selectedAssessmentId].status = 'PUBLISHED';
      mockGradebooks[selectedAssessmentId].isPublished = true;
      setIsSubmitting(false);
      showToast('Grades published! Students can now view their scores.');
    }, 600);
  };

  // Recall / Unpublish Grades
  const handleUnpublish = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setStatus('APPROVED');
      setIsPublished(false);
      mockGradebooks[selectedAssessmentId].status = 'APPROVED';
      mockGradebooks[selectedAssessmentId].isPublished = false;
      setIsSubmitting(false);
      showToast('Grades recalled. Status reverted to Approved.', 'warning');
    }, 600);
  };

  // Archive Gradebook
  const handleArchive = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setStatus('ARCHIVED');
      mockGradebooks[selectedAssessmentId].status = 'ARCHIVED';
      setIsSubmitting(false);
      showToast('Grades locked as archived records.');
    }, 600);
  };

  const handleExport = (type) => {
    if (!records || records.length === 0) return;
    const filename = `marks_${selectedSubjectId || 'subject'}_${selectedAssessmentId || 'assessment'}.${type === 'csv' ? 'csv' : 'txt'}`;
    const element = document.createElement('a');
    let content = '';

    if (type === 'csv') {
      content = 'Roll Number,Student Name,Marks Obtained,Remarks\n';
      records.forEach((rec) => {
        content += `${rec.rollNumber},${rec.studentName},${rec.isAbsent ? 'ABSENT' : rec.marks},${rec.remarks || ''}\n`;
      });
      element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(content));
    } else {
      content = `--- Gradebook Report ---\nSubject ID: ${selectedSubjectId}\nAssessment ID: ${selectedAssessmentId}\n\n`;
      records.forEach((rec) => {
        content += `${rec.rollNumber} - ${rec.studentName}: ${rec.isAbsent ? 'ABSENT' : rec.marks} marks (${rec.remarks || 'No remarks'})\n`;
      });
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    }

    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* ── Page Header ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          mb: 4,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton
            onClick={() => navigate('/faculty')}
            size="small"
            sx={{
              bgcolor: 'action.hover',
              '&:hover': { bgcolor: 'action.selected' },
            }}
          >
            <BackIcon fontSize="small" />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
              Student Gradebook
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Input student scores, compute grades, submit sheets for approval, and publish final marks
            </Typography>
          </Box>
        </Box>

        {/* Dynamic Action Controls */}
        {selectedAssessmentId && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            {/* Status display */}
            <StatusChip label={status} color={
              status === 'PUBLISHED' ? '#10b981' :
              status === 'APPROVED' ? '#a855f7' :
              status === 'SUBMITTED' ? '#3b82f6' :
              status === 'ARCHIVED' ? '#9ca3af' : '#6b7280'
            } />

            {/* Results visibility chip */}
            {isPublished && (
              <Chip
                label="Student Portal: Visible"
                size="small"
                color="success"
                variant="outlined"
                sx={{ fontWeight: 700, fontSize: '0.7rem' }}
              />
            )}

            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={() => handleExport('csv')}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Export CSV
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={() => handleExport('pdf')}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Export PDF
            </Button>

            {/* Actions Grid */}
            {!isEditing ? (
              <>
                {/* Edit Button (Allowed unless archived) */}
                {status !== 'ARCHIVED' && status !== 'PUBLISHED' && (
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => setIsEditing(true)}
                    size="small"
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  >
                    Edit Grades
                  </Button>
                )}

                {/* Submit button (Draft -> Submitted) */}
                {status === 'DRAFT' && (
                  <Button
                    variant="contained"
                    startIcon={<SubmitIcon />}
                    onClick={handleSubmitForReview}
                    size="small"
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      bgcolor: '#3b82f6',
                      '&:hover': { bgcolor: '#2563eb' },
                    }}
                  >
                    Submit to HOD
                  </Button>
                )}

                {/* HOD Review (Submitted -> Approved) */}
                {status === 'SUBMITTED' && (
                  <Button
                    variant="contained"
                    startIcon={<ApproveIcon />}
                    onClick={handleApprove}
                    size="small"
                    color="secondary"
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  >
                    Approve Sheet
                  </Button>
                )}

                {/* Publish button (Approved -> Published) */}
                {status === 'APPROVED' && (
                  <Button
                    variant="contained"
                    startIcon={<PublishIcon />}
                    onClick={handlePublishResults}
                    size="small"
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      bgcolor: '#10b981',
                      '&:hover': { bgcolor: '#059669' },
                    }}
                  >
                    Publish Results
                  </Button>
                )}

                {/* Unpublish button (Published -> Approved) */}
                {status === 'PUBLISHED' && (
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<UnpublishIcon />}
                    onClick={handleUnpublish}
                    size="small"
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  >
                    Recall Grades
                  </Button>
                )}

                {/* Archive button */}
                {status === 'PUBLISHED' && (
                  <Button
                    variant="contained"
                    color="inherit"
                    startIcon={<ArchiveIcon />}
                    onClick={handleArchive}
                    size="small"
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  >
                    Archive
                  </Button>
                )}
              </>
            ) : (
              /* Editing mode buttons */
              <>
                <Button
                  variant="outlined"
                  onClick={() => {
                    // Reset to saved copy
                    const saved = mockGradebooks[selectedAssessmentId];
                    if (saved) {
                      setRecords(JSON.parse(JSON.stringify(saved.records)));
                    } else {
                      setRecords([]);
                    }
                    setIsEditing(false);
                  }}
                  size="small"
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                  size="small"
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    bgcolor: '#4f46e5',
                    '&:hover': { bgcolor: '#4338ca' },
                  }}
                >
                  {isSubmitting ? 'Saving...' : 'Save Draft'}
                </Button>
              </>
            )}
          </Box>
        )}
      </Box>

      {/* ── Filters Bar ── */}
      <MarksFilters
        subjects={mockAttendanceSubjects}
        selectedSubjectId={selectedSubjectId}
        onSubjectChange={handleSubjectChange}
        sections={sectionsForSubject}
        selectedSectionId={selectedSectionId}
        onSectionChange={handleSectionChange}
        assessmentType={assessmentType}
        onAssessmentTypeChange={handleAssessmentTypeChange}
        assessments={availableAssessments}
        selectedAssessmentId={selectedAssessmentId}
        onAssessmentChange={handleAssessmentChange}
      />

      {/* ── Summary Stats & Graded Lists ── */}
      {selectedAssessmentId ? (
        <>
          <MarksSummaryCard records={records} />
          <MarksEntryTable
            records={records}
            isEditing={isEditing}
            onMarksChange={handleMarksChange}
            onRemarksChange={handleRemarksChange}
            onAbsentToggle={handleAbsentToggle}
          />
        </>
      ) : (
        /* Unselected Prompt */
        <Paper
          variant="outlined"
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 3,
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="body1" color="text.secondary">
            Select a subject, section, assessment type, and specific assessment to load the grading worksheet.
          </Typography>
        </Paper>
      )}

      {/* ── Feedback Toast ── */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ fontWeight: 600 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MarksPage;
