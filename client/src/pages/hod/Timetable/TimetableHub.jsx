import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Chip,
  Button,
  CircularProgress,
  useTheme,
  Grid,
} from '@mui/material';
import {
  DateRangeOutlined,
  PrintOutlined,
  RefreshOutlined,
  SchoolOutlined,
} from '@mui/icons-material';
import RosterFilters from '../Roster/RosterFilters';
import TimetableGrid from './TimetableGrid';
import AddSlotModal from './AddSlotModal';
import { useTimetableQuery } from '../../../queries/timetableQueries';

export const TimetableHub = () => {
  const theme = useTheme();

  const [filters, setFilters] = useState({
    course: '',
    branch: '',
    semester: '',
    group: '',
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [slotPresets, setSlotPresets] = useState(null);

  // Flexible batch selection requirement: Course, Branch, and Semester
  const isBatchSelected = Boolean(filters.course && filters.branch && filters.semester);

  const { data: slots = [], isLoading, refetch } = useTimetableQuery(filters);

  // Metrics
  const totalSlots = slots.length;
  const theorySlots = slots.filter((s) => s.type === 'THEORY' || !s.type).length;
  const labSlots = slots.filter((s) => s.type === 'PRACTICAL' || s.type === 'LAB').length;
  const uniqueRooms = new Set(slots.map((s) => s.roomNumber).filter(Boolean)).size;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* ── 1. Hero Identity Banner ────────────────────────────────────────── */}
      <Card
        sx={{
          p: { xs: 2.5, md: 3.5 },
          borderRadius: '16px',
          border: `1px solid ${theme.palette.divider}`,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}12 0%, ${theme.palette.primary.main}04 100%)`,
          boxShadow: 'none',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Chip
                icon={<DateRangeOutlined sx={{ fontSize: '0.85rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="WEEKLY TIMETABLE & LECTURE MATRIX STUDIO"
                size="small"
                sx={{
                  bgcolor: `${theme.palette.primary.main}18`,
                  color: theme.palette.primary.main,
                  fontWeight: 800,
                  fontSize: '0.68rem',
                  letterSpacing: '0.04em',
                }}
              />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.ink?.[900], letterSpacing: '-0.02em' }}>
              Weekly Timetable Matrix
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5, maxWidth: 680 }}>
              Select a student batch cohort, view scheduled weekly sessions, resolve faculty & room conflicts, and print schedule matrices.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshOutlined />}
              onClick={() => refetch()}
              disabled={!isBatchSelected}
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, px: 2 }}
            >
              Refresh Matrix
            </Button>
            {isBatchSelected && (
              <Button
                variant="contained"
                startIcon={<PrintOutlined />}
                onClick={() => window.print()}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, px: 2.5 }}
              >
                Print Schedule
              </Button>
            )}
          </Box>
        </Box>
      </Card>

      {/* ── 2. KPI Summary Grid ────────────────────────────────────────────── */}
      {isBatchSelected && (
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2.5, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, borderTop: `4px solid ${theme.palette.primary.main}`, boxShadow: 'none' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
                SCHEDULED SESSIONS
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.ink?.[900], mt: 0.5 }}>
                {isLoading ? <CircularProgress size={22} /> : totalSlots}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
                Weekly class slots
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2.5, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, borderTop: `4px solid ${theme.palette.primary.main}`, boxShadow: 'none' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
                THEORY LECTURES
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.primary.main, mt: 0.5 }}>
                {isLoading ? <CircularProgress size={22} /> : theorySlots}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
                Classroom sessions
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2.5, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, borderTop: `4px solid ${theme.palette.secondary?.main || '#9c27b0'}`, boxShadow: 'none' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
                PRACTICAL / LABS
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.secondary?.main || '#9c27b0', mt: 0.5 }}>
                {isLoading ? <CircularProgress size={22} /> : labSlots}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
                Laboratory sessions
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2.5, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, borderTop: `4px solid ${theme.palette.info.main}`, boxShadow: 'none' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
                ROOM ALLOCATIONS
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.info.main, mt: 0.5 }}>
                {isLoading ? <CircularProgress size={22} /> : uniqueRooms}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
                Distinct rooms assigned
              </Typography>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ── 3. Batch Selector Card ────────────────────────────────────────── */}
      <Card sx={{ p: { xs: 2, md: 2.5 }, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: theme.palette.ink?.[900], mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SchoolOutlined sx={{ color: theme.palette.primary.main }} />
          Select Student Cohort Batch
        </Typography>

        <RosterFilters filters={filters} onFilterChange={setFilters} role="STUDENT" />
      </Card>

      {/* ── 4. Main Matrix View ────────────────────────────────────────────── */}
      {!isBatchSelected ? (
        <Card sx={{ p: 6, textAlign: 'center', borderRadius: '16px', border: `2px dashed ${theme.palette.divider}`, boxShadow: 'none', bgcolor: 'transparent' }}>
          <DateRangeOutlined sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.ink?.[900], mb: 0.5 }}>
            No Cohort Batch Selected
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please select a Course Program, Branch Specialization, and Semester above to render the weekly timetable matrix.
          </Typography>
        </Card>
      ) : isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={36} />
        </Box>
      ) : (
        <TimetableGrid
          slots={slots || []}
          filters={filters}
          onRefresh={refetch}
          onCellClick={(presets) => {
            setSlotPresets(presets);
            setIsAddModalOpen(true);
          }}
        />
      )}

      {/* Add Slot Modal */}
      {isAddModalOpen && (
        <AddSlotModal
          open={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setSlotPresets(null);
            refetch();
          }}
          filters={filters}
          existingSlots={slots || []}
          presets={slotPresets}
        />
      )}
    </Box>
  );
};

export default TimetableHub;

