import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Chip,
  Button,
  CircularProgress,
  useTheme,
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

  // We only fetch timetable if course, branch, semester, and group are selected
  const isBatchSelected = !!(filters.course && filters.branch && filters.semester && filters.group);

  const { data: slots = [], isLoading, refetch } = useTimetableQuery(filters);

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
                icon={<DateRangeOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="WEEKLY TIMETABLE GENERATOR & MATRIX DESK"
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
              Weekly Timetable Generator & Matrix
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              Select a student batch, auto-generate AI-assisted conflict-free weekly schedules, and assign lecture halls & labs.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshOutlined />}
              onClick={() => refetch()}
              disabled={!isBatchSelected}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
            >
              Refresh
            </Button>
            {isBatchSelected && (
              <Button
                variant="outlined"
                startIcon={<PrintOutlined />}
                onClick={() => window.print()}
                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
              >
                Print Schedule
              </Button>
            )}
          </Box>
        </Box>
      </Card>

      {/* ── 2. Batch Selector Card ────────────────────────────────────────── */}
      <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: theme.palette.ink[900], mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SchoolOutlined sx={{ color: theme.palette.primary.main }} />
          Select Student Batch & Semester
        </Typography>

        <RosterFilters filters={filters} onFilterChange={setFilters} role="STUDENT" />
      </Card>

      {/* ── 4. Main Matrix View ────────────────────────────────────────────── */}
      {!isBatchSelected ? (
        <Card sx={{ p: 6, textAlign: 'center', borderRadius: '16px', border: `2px dashed ${theme.palette.divider}`, boxShadow: 'none', bgcolor: 'transparent' }}>
          <DateRangeOutlined sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.ink[900], mb: 0.5 }}>
            No Batch Selected
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please select a Course, Branch, and Semester above to view or generate the weekly timetable schedule matrix.
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
