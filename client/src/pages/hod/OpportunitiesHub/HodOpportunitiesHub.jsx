import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Grid,
  Button,
  CircularProgress,
  Tabs,
  Tab,
  useTheme,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  OpenInNew,
  WorkOutlined,
  IntegrationInstructionsOutlined,
  BusinessCenterOutlined,
  SearchOutlined,
  AddOutlined,
  RefreshOutlined,
  EmojiEventsOutlined,
} from '@mui/icons-material';
import { useOpportunitiesQuery } from '../../../queries/opportunityQueries';
import EmptyState from '../../../components/common/EmptyState';
import { useToast } from '../../../contexts/ToastContext';

const OPPORTUNITY_TYPES = [
  { value: 'HACKATHON', label: 'Hackathon & Tech Competition' },
  { value: 'INTERNSHIP', label: 'Industrial Internship' },
  { value: 'PLACEMENT', label: 'Job Placement Drive' },
];

export const HodOpportunitiesHub = () => {
  const theme = useTheme();
  const { showToast } = useToast();

  const { data: rawOpportunities, isLoading, isError, refetch } = useOpportunitiesQuery();
  const [tabIndex, setTabIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Local Custom Opportunities State
  const [customOpps, setCustomOpps] = useState([]);
  const [openPostModal, setOpenPostModal] = useState(false);
  const [postForm, setPostForm] = useState({
    title: '',
    organization: '',
    type: 'INTERNSHIP',
    location: 'Remote / Hybrid',
    deadline: '',
    url: '',
    featured: false,
  });

  const allOpportunities = useMemo(() => {
    const apiData = Array.isArray(rawOpportunities) ? rawOpportunities : [];
    return [...customOpps, ...apiData];
  }, [rawOpportunities, customOpps]);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const getFilteredOpportunities = () => {
    let filtered = allOpportunities;

    if (tabIndex === 1) filtered = filtered.filter((o) => o.type === 'HACKATHON');
    if (tabIndex === 2) filtered = filtered.filter((o) => o.type === 'INTERNSHIP');
    if (tabIndex === 3) filtered = filtered.filter((o) => o.type === 'PLACEMENT');

    if (searchQuery.trim() !== '') {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          (o.title?.toLowerCase() || '').includes(lowerQuery) ||
          (o.organization?.toLowerCase() || '').includes(lowerQuery) ||
          (o.location?.toLowerCase() || '').includes(lowerQuery) ||
          (o.source?.toLowerCase() || '').includes(lowerQuery)
      );
    }

    return filtered;
  };

  const filteredData = getFilteredOpportunities();

  const stats = useMemo(() => {
    const total = allOpportunities.length;
    const hackathons = allOpportunities.filter((o) => o.type === 'HACKATHON').length;
    const internships = allOpportunities.filter((o) => o.type === 'INTERNSHIP').length;
    const placements = allOpportunities.filter((o) => o.type === 'PLACEMENT').length;
    return { total, hackathons, internships, placements };
  }, [allOpportunities]);

  const handlePostSubmit = (e) => {
    e.preventDefault();
    if (!postForm.title || !postForm.organization || !postForm.url) {
      showToast('Please fill in required title, organization, and application link.', { severity: 'error' });
      return;
    }

    const newOpp = {
      id: `custom-${Date.now()}`,
      title: postForm.title,
      organization: postForm.organization,
      type: postForm.type,
      location: postForm.location || 'Remote',
      deadline: postForm.deadline || new Date(Date.now() + 14 * 86400000).toISOString(),
      url: postForm.url,
      featured: postForm.featured,
      source: 'Department Faculty Desk',
    };

    setCustomOpps([newOpp, ...customOpps]);
    showToast(`Posted opportunity "${newOpp.title}" for department students!`);
    setOpenPostModal(false);
    setPostForm({
      title: '',
      organization: '',
      type: 'INTERNSHIP',
      location: 'Remote / Hybrid',
      deadline: '',
      url: '',
      featured: false,
    });
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'HACKATHON':
        return 'secondary';
      case 'INTERNSHIP':
        return 'info';
      case 'PLACEMENT':
        return 'success';
      default:
        return 'default';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'HACKATHON':
        return <IntegrationInstructionsOutlined sx={{ fontSize: '0.85rem !important' }} />;
      case 'INTERNSHIP':
        return <WorkOutlined sx={{ fontSize: '0.85rem !important' }} />;
      case 'PLACEMENT':
        return <BusinessCenterOutlined sx={{ fontSize: '0.85rem !important' }} />;
      default:
        return null;
    }
  };

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
                icon={<EmojiEventsOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="GLOBAL STUDENT OPPORTUNITIES & INTERNSHIP DISCOVERY HUB"
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
              Global Opportunities & Internships
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              Discover national hackathons, industrial internship postings, tech competitions, and career drives aggregated for department students.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshOutlined />}
              onClick={() => refetch()}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
            >
              Refresh Feed
            </Button>
            <Button
              variant="contained"
              startIcon={<AddOutlined />}
              onClick={() => setOpenPostModal(true)}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 700,
                background: theme.palette.primary.gradient || theme.palette.primary.main,
                color: '#ffffff',
              }}
            >
              Post Custom Opportunity
            </Button>
          </Box>
        </Box>
      </Card>

      {/* ── 2. KPI Summary Grid ────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
              TOTAL OPPORTUNITIES
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.ink[900], mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {isLoading ? <CircularProgress size={24} /> : stats.total}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Aggregated tech listings
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.secondary?.main || '#ab47bc' }}>
              FEATURED HACKATHONS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.secondary?.main || '#ab47bc', mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {isLoading ? <CircularProgress size={24} /> : stats.hackathons}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              National hackathons & sprints
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.info?.main || '#0288d1' }}>
              ACTIVE INTERNSHIPS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.info?.main || '#0288d1', mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {isLoading ? <CircularProgress size={24} /> : stats.internships}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Industry tech internships
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.signal.success }}>
              JOB PLACEMENTS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.signal.success, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {isLoading ? <CircularProgress size={24} /> : stats.placements}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Graduate career drives
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* ── 3. Filters & Opportunity Grid ─────────────────────────────────── */}
      <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { md: 'center' }, mb: 3, gap: 2 }}>
          <Tabs value={tabIndex} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider', flexGrow: 1 }}>
            <Tab label={`All Listings (${stats.total})`} sx={{ fontWeight: 700, textTransform: 'none' }} />
            <Tab label={`Hackathons (${stats.hackathons})`} sx={{ fontWeight: 700, textTransform: 'none' }} />
            <Tab label={`Internships (${stats.internships})`} sx={{ fontWeight: 700, textTransform: 'none' }} />
            <Tab label={`Job Placements (${stats.placements})`} sx={{ fontWeight: 700, textTransform: 'none' }} />
          </Tabs>

          <TextField
            placeholder="Search by title, company, or location..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ minWidth: { xs: '100%', md: '320px' } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : isError ? (
          <EmptyState
            type="reports"
            title="Failed to Load External Opportunities"
            description="Could not connect to external opportunity aggregators. Please retry."
            actionText="Try Again"
            onAction={() => refetch()}
          />
        ) : filteredData.length === 0 ? (
          <EmptyState
            type="reports"
            title="No Opportunities Found"
            description="No active listings match the selected category or search query."
          />
        ) : (
          <Grid container spacing={3}>
            {filteredData.map((opp) => (
              <Grid item xs={12} sm={6} md={4} key={opp.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between',
                    border: `1px solid ${opp.featured ? theme.palette.warning.main : theme.palette.divider}`,
                    borderRadius: '16px',
                    boxShadow: 'none',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 10px 28px rgba(0,0,0,0.07)',
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          icon={getTypeIcon(opp.type)}
                          label={opp.type}
                          color={getTypeColor(opp.type)}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 800, fontSize: '0.68rem' }}
                        />
                        {opp.featured && (
                          <Chip label="PREMIUM EVENT" color="warning" size="small" sx={{ fontWeight: 800, fontSize: '0.65rem' }} />
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                        {opp.source || 'Aggregated'}
                      </Typography>
                    </Box>

                    <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.ink[900], mb: 0.5, lineHeight: 1.3 }}>
                      {opp.title}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ color: theme.palette.primary.main, fontWeight: 700, mb: 1.5 }}>
                      {opp.organization}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      <strong>Location:</strong> {opp.location}
                    </Typography>
                    <Typography variant="body2" color="error.main" sx={{ fontWeight: 700 }}>
                      <strong>Deadline:</strong> {new Date(opp.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Typography>
                  </CardContent>

                  <Box sx={{ p: 3, pt: 0 }}>
                    <Button
                      variant="contained"
                      fullWidth
                      endIcon={<OpenInNew />}
                      href={opp.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        borderRadius: '8px',
                        fontWeight: 700,
                        textTransform: 'none',
                        background: theme.palette.primary.gradient || theme.palette.primary.main,
                        color: '#ffffff',
                      }}
                    >
                      View & Apply Link
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Card>

      {/* ── 4. Post Custom Opportunity Modal ────────────────────────────────── */}
      <Dialog open={openPostModal} onClose={() => setOpenPostModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Post Custom Opportunity for Department</DialogTitle>
        <form onSubmit={handlePostSubmit}>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Opportunity Title"
              value={postForm.title}
              onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
              required
              fullWidth
              placeholder="e.g. Smart India Hackathon 2026 Department Trials"
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Company / Host Organization"
                  value={postForm.organization}
                  onChange={(e) => setPostForm({ ...postForm, organization: e.target.value })}
                  required
                  fullWidth
                  placeholder="e.g. Microsoft / Ministry of Education"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField select label="Opportunity Type" value={postForm.type} onChange={(e) => setPostForm({ ...postForm, type: e.target.value })} required fullWidth>
                  {OPPORTUNITY_TYPES.map((t) => (
                    <MenuItem key={t.value} value={t.value}>
                      {t.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="Location" value={postForm.location} onChange={(e) => setPostForm({ ...postForm, location: e.target.value })} fullWidth placeholder="e.g. Bengaluru / Remote" />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  type="date"
                  label="Application Deadline"
                  value={postForm.deadline}
                  onChange={(e) => setPostForm({ ...postForm, deadline: e.target.value })}
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <TextField
              label="Application Link URL"
              value={postForm.url}
              onChange={(e) => setPostForm({ ...postForm, url: e.target.value })}
              required
              fullWidth
              placeholder="https://sih.gov.in or https://careers.company.com/apply"
            />

            <FormControlLabel
              control={<Switch checked={postForm.featured} onChange={(e) => setPostForm({ ...postForm, featured: e.target.checked })} />}
              label="Mark as Premium / Featured Event"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpenPostModal(false)} variant="outlined" sx={{ borderRadius: '8px' }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" sx={{ borderRadius: '8px', fontWeight: 700 }}>
              Publish Opportunity
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default HodOpportunitiesHub;
