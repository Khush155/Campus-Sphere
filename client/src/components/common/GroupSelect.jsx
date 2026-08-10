import React, { useState } from 'react';
import {
  TextField,
  MenuItem,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  useTheme,
  Box,
  Chip,
  RadioGroup,
  FormControlLabel,
  Radio,
  Tooltip,
  Paper,
  IconButton,
  Alert,
} from '@mui/material';
import {
  AddCircleOutlineOutlined as AddIcon,
  GroupsOutlined as GroupIcon,
  WbSunnyOutlined as MorningIcon,
  NightsStayOutlined as EveningIcon,
  SettingsOutlined as ManageIcon,
  SaveOutlined as SaveIcon,
  DeleteOutline as DeleteIcon,
} from '@mui/icons-material';

const DEFAULT_GROUPS_LIST = [
  { name: 'G1', shift: 'MORNING' },
  { name: 'G2', shift: 'MORNING' },
  { name: 'G3', shift: 'MORNING' },
  { name: 'G4', shift: 'MORNING' },
  { name: 'G5', shift: 'EVENING' },
  { name: 'G6', shift: 'EVENING' },
];

export const GroupSelect = ({
  value = '',
  onChange,
  label = 'Group',
  allowFullBatch = false,
  fullBatchLabel = 'All Groups',
  disabled = false,
  size = 'small',
  sx = {},
  error = false,
  helperText = '',
}) => {
  const theme = useTheme();

  // Load groups from localStorage or default
  const [groups, setGroups] = useState(() => {
    try {
      const saved = localStorage.getItem('campussphere_groups_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 6 && parsed.some(g => g.name === 'G1')) {
          return parsed;
        }
      }
    } catch (e) {
      // fallback
    }
    try {
      localStorage.setItem('campussphere_groups_v3', JSON.stringify(DEFAULT_GROUPS_LIST));
    } catch (e) {
      // Ignore localStorage write quota errors
    }
    return DEFAULT_GROUPS_LIST;
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [draftGroups, setDraftGroups] = useState([]);
  const [manageError, setManageError] = useState('');

  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupShift, setNewGroupShift] = useState('MORNING');
  const [inputError, setInputError] = useState('');

  const saveGroupsToStorage = (updatedList) => {
    setGroups(updatedList);
    try {
      localStorage.setItem('campussphere_groups_v2', JSON.stringify(updatedList));
    } catch (e) {
      // Ignored
    }
  };

  const handleSelectChange = (e) => {
    const val = e.target.value;
    if (val === '__CREATE_NEW_GROUP__') {
      setIsCreateModalOpen(true);
    } else if (val === '__MANAGE_GROUPS__') {
      setDraftGroups(JSON.parse(JSON.stringify(groups)));
      setManageError('');
      setIsManageModalOpen(true);
    } else {
      const foundGroup = groups.find((g) => g.name === val);
      onChange(val, foundGroup);
    }
  };

  const handleCreateGroup = () => {
    const trimmed = newGroupName.trim().toUpperCase();
    if (!trimmed) {
      setInputError('Group name cannot be empty');
      return;
    }

    if (groups.some((g) => g.name === trimmed)) {
      setInputError('This group already exists in the list');
      return;
    }

    const newGroup = { name: trimmed, shift: newGroupShift };
    const updated = [...groups, newGroup];
    saveGroupsToStorage(updated);

    onChange(trimmed, newGroup);
    setNewGroupName('');
    setNewGroupShift('MORNING');
    setInputError('');
    setIsCreateModalOpen(false);
  };

  // Update group name in draft state
  const handleDraftNameChange = (index, newName) => {
    setDraftGroups((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], name: newName.toUpperCase() };
      return next;
    });
    setManageError('');
  };

  // Toggle group shift in draft state
  const handleToggleDraftShift = (index) => {
    setDraftGroups((prev) => {
      const next = [...prev];
      const currentShift = next[index].shift;
      next[index] = { ...next[index], shift: currentShift === 'MORNING' ? 'EVENING' : 'MORNING' };
      return next;
    });
  };

  // Delete a group in draft state
  const handleDeleteDraftGroup = (index) => {
    setDraftGroups((prev) => prev.filter((_, i) => i !== index));
    setManageError('');
  };

  // Save changes from manage modal
  const handleSaveManageChanges = () => {
    setManageError('');

    // Validation
    const names = draftGroups.map((g) => g.name.trim());
    if (names.some((n) => !n)) {
      setManageError('Group names cannot be empty.');
      return;
    }

    const uniqueNames = new Set(names);
    if (uniqueNames.size !== names.length) {
      setManageError('Duplicate group names detected. Each group must have a unique name.');
      return;
    }

    const cleanDraft = draftGroups.map((g) => ({
      name: g.name.trim().toUpperCase(),
      shift: g.shift,
    }));

    saveGroupsToStorage(cleanDraft);

    // If currently selected group was updated/renamed, sync selection
    if (value) {
      const updatedGroup = cleanDraft.find((g) => g.name === value);
      if (updatedGroup) {
        onChange(updatedGroup.name, updatedGroup);
      } else if (cleanDraft.length > 0) {
        onChange(cleanDraft[0].name, cleanDraft[0]);
      } else {
        onChange('', null);
      }
    }

    setIsManageModalOpen(false);
  };

  return (
    <>
      <TextField
        select
        label={label}
        value={value || ''}
        onChange={handleSelectChange}
        disabled={disabled}
        size={size}
        error={error}
        helperText={helperText}
        sx={sx}
      >
        <MenuItem value="">
          <em>{allowFullBatch ? fullBatchLabel : 'Select Group...'}</em>
        </MenuItem>

        {groups.map((grp) => (
          <MenuItem
            key={grp.name}
            value={grp.name}
            sx={{ py: 1 }}
          >
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              Group {grp.name} <span style={{ opacity: 0.7, fontWeight: 500, marginLeft: 4 }}>({grp.shift === 'MORNING' ? 'Morning Shift' : 'Evening Shift'})</span>
            </Typography>
          </MenuItem>
        ))}

        <Divider />

        <MenuItem
          value="__CREATE_NEW_GROUP__"
          sx={{
            color: theme.palette.primary.main,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            py: 1,
            bgcolor: `${theme.palette.primary.main}08`,
            '&:hover': {
              bgcolor: `${theme.palette.primary.main}15`,
            },
          }}
        >
          <AddIcon fontSize="small" />
          Create New Group...
        </MenuItem>

        <MenuItem
          value="__MANAGE_GROUPS__"
          sx={{
            color: 'text.secondary',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            py: 0.75,
            fontSize: '0.78rem',
          }}
        >
          <ManageIcon fontSize="small" />
          Edit & Manage Groups...
        </MenuItem>
      </TextField>

      {/* ── 1. Create New Group Modal ─────────────────────────────────────── */}
      <Dialog
        open={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setNewGroupName('');
          setInputError('');
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <GroupIcon color="primary" />
          Create New Student Group
        </DialogTitle>

        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 2.5 }}>
          <Typography variant="body2" color="text.secondary">
            Specify group name and designate whether classes take place during <strong>Morning</strong> or <strong>Evening Shift</strong>.
          </Typography>

          <TextField
            autoFocus
            label="Group Name"
            value={newGroupName}
            onChange={(e) => {
              setNewGroupName(e.target.value);
              setInputError('');
            }}
            placeholder="e.g. G3, E1"
            fullWidth
            error={!!inputError}
            helperText={inputError}
          />

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
              Academic Shift Scope
            </Typography>
            <RadioGroup
              value={newGroupShift}
              onChange={(e) => setNewGroupShift(e.target.value)}
              sx={{ gap: 1 }}
            >
              <Paper
                variant="outlined"
                onClick={() => setNewGroupShift('MORNING')}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  borderColor: newGroupShift === 'MORNING' ? theme.palette.primary.main : theme.palette.divider,
                  bgcolor: newGroupShift === 'MORNING' ? `${theme.palette.primary.main}0D` : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <FormControlLabel
                  value="MORNING"
                  control={<Radio size="small" />}
                  label={
                    <Box sx={{ ml: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                        ☀️ Morning Shift
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        09:00 AM – 04:00 PM (60 Mins/class • Lunch 1-2 PM)
                      </Typography>
                    </Box>
                  }
                />
              </Paper>

              <Paper
                variant="outlined"
                onClick={() => setNewGroupShift('EVENING')}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  borderColor: newGroupShift === 'EVENING' ? theme.palette.secondary.main : theme.palette.divider,
                  bgcolor: newGroupShift === 'EVENING' ? `${theme.palette.secondary.main}0D` : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <FormControlLabel
                  value="EVENING"
                  control={<Radio size="small" />}
                  label={
                    <Box sx={{ ml: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                        🌙 Evening Shift
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        04:10 PM – 09:30 PM (50 Mins/class • Recess 7:30-7:50 PM)
                      </Typography>
                    </Box>
                  }
                />
              </Paper>
            </RadioGroup>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setIsCreateModalOpen(false);
              setNewGroupName('');
              setInputError('');
            }}
            color="inherit"
          >
            Cancel
          </Button>

          <Button onClick={handleCreateGroup} variant="contained" sx={{ borderRadius: 2, fontWeight: 700 }}>
            Create & Select Group
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── 2. Manage & Edit Groups Modal ──────────────────────────────────── */}
      <Dialog
        open={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ManageIcon color="primary" />
          Edit & Manage Groups
        </DialogTitle>

        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2.5 }}>
          {manageError && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {manageError}
            </Alert>
          )}

          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            Edit group names, click shift chips to toggle Morning/Evening shift, or remove groups. Changes apply only after clicking <strong>Save Changes</strong>.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {draftGroups.map((grp, index) => (
              <Paper
                key={index}
                variant="outlined"
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <TextField
                  size="small"
                  label="Group Name"
                  value={grp.name}
                  onChange={(e) => handleDraftNameChange(index, e.target.value)}
                  sx={{ width: 140 }}
                />

                <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                  <Tooltip title="Click to toggle Shift (Morning / Evening)">
                    <Chip
                      clickable
                      onClick={() => handleToggleDraftShift(index)}
                      icon={grp.shift === 'MORNING' ? <MorningIcon fontSize="small" /> : <EveningIcon fontSize="small" />}
                      label={grp.shift === 'MORNING' ? '☀️ Morning (9 AM - 4 PM)' : '🌙 Evening (4:10 - 9:30 PM)'}
                      size="small"
                      color={grp.shift === 'MORNING' ? 'primary' : 'secondary'}
                      variant="outlined"
                      sx={{ fontWeight: 800, fontSize: '0.7rem' }}
                    />
                  </Tooltip>
                </Box>

                <Tooltip title="Delete Group">
                  <IconButton size="small" onClick={() => handleDeleteDraftGroup(index)} sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Paper>
            ))}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsManageModalOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSaveManageChanges}
            variant="contained"
            startIcon={<SaveIcon fontSize="small" />}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default GroupSelect;
