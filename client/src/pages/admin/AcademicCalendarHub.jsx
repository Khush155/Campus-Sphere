import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, CircularProgress } from '@mui/material';
import { DeleteOutline, EventAvailable, Add } from '@mui/icons-material';
import { useCalendarEventsQuery, useCreateEventMutation, useDeleteEventMutation } from '../../queries/calendarQueries';
import EmptyState from '../../components/common/EmptyState';

const AcademicCalendarHub = () => {
  const { data: events, isLoading } = useCalendarEventsQuery();
  const createMutation = useCreateEventMutation();
  const deleteMutation = useDeleteEventMutation();

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'HOLIDAY',
    startDate: '',
    endDate: '',
    description: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString()
      });
      setOpen(false);
      setFormData({ title: '', type: 'HOLIDAY', startDate: '', endDate: '', description: '' });
    } catch (err) {
      alert('Failed to create event');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      HOLIDAY: 'success',
      EXAM: 'error',
      EVENT: 'primary',
      BREAK: 'warning'
    };
    return colors[type] || 'default';
  };

  if (isLoading) return <Box textAlign="center" py={5}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Academic Calendar Hub</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
          Add Event
        </Button>
      </Box>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell>Event Title</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events?.map((evt) => (
                <TableRow key={evt._id}>
                  <TableCell fontWeight="500">{evt.title}</TableCell>
                  <TableCell>
                    <Chip label={evt.type} color={getTypeColor(evt.type)} size="small" />
                  </TableCell>
                  <TableCell>
                    {new Date(evt.startDate).toLocaleDateString()} - {new Date(evt.endDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{evt.description || '-'}</TableCell>
                  <TableCell align="right">
                    <IconButton color="error" onClick={() => handleDelete(evt._id)} disabled={deleteMutation.isPending}>
                      <DeleteOutline />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {(!events || events.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                    <EmptyState message="No academic events found." icon={<EventAvailable sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />} />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Academic Event</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth label="Event Title" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <TextField select fullWidth label="Event Type" required value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                  <MenuItem value="HOLIDAY">Public Holiday</MenuItem>
                  <MenuItem value="EXAM">Exam / Test</MenuItem>
                  <MenuItem value="BREAK">Term Break</MenuItem>
                  <MenuItem value="EVENT">Institutional Event</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth type="date" label="Start Date" required InputLabelProps={{ shrink: true }} value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth type="date" label="End Date" required InputLabelProps={{ shrink: true }} value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth multiline rows={3} label="Description (Optional)" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending}>Create Event</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default AcademicCalendarHub;
