import React from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, Paper, 
  List, ListItem, ListItemText, Chip, 
  Divider, Button, useTheme, alpha, CircularProgress
} from '@mui/material';
import { 
  School, ReceiptLong, Campaign,
  Assignment, Article, Notifications, MenuBook,
  FactCheck, StarBorder
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useStudentLedgerQuery } from '../../queries/feeQueries';
import { useStudentDashboardQuery } from '../../queries/studentQueries';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

const StatCard = ({ title, value, icon, color, subtitle, onClick, loading }) => (
  <Card 
    sx={{ 
      height: '100%', 
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.2s ease-in-out', 
      '&:hover': onClick ? { transform: 'translateY(-4px)', boxShadow: 4 } : {} 
    }} 
    onClick={onClick}
    elevation={0}
  >
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box sx={{ bgcolor: alpha(color, 0.15), color: color, p: 1.5, borderRadius: 3, display: 'flex' }}>
          {icon}
        </Box>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
        {title}
      </Typography>
      {loading ? (
        <CircularProgress size={24} sx={{ mt: 1 }} />
      ) : (
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: subtitle ? 1 : 0 }}>
          {value}
        </Typography>
      )}
      {subtitle && !loading && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 500 }}>
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const { data: ledgerData, isLoading: isLedgerLoading } = useStudentLedgerQuery(user?.id);
  const { data: dashData, isLoading: isDashLoading, error } = useStudentDashboardQuery();

  if (isDashLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">Failed to load dashboard data. Please try again later.</Typography>
      </Box>
    );
  }

  const attendanceColor = dashData?.attendance?.percentage >= 75 ? '#10b981' : '#ef4444';
  const attendanceStatus = dashData?.attendance?.percentage >= 75 ? 'Safe' : 'Critical';

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
            Welcome back, {user?.name?.split(' ')[0] || 'Student'} 👋
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Semester {user?.semester || 'N/A'} • Roll: {user?.customId || 'N/A'}
          </Typography>
        </Box>
        <Button variant="contained" color="primary" onClick={() => navigate('/student/profile')} sx={{ borderRadius: 2, fontWeight: 700 }}>
          View Full Profile
        </Button>
      </Box>

      {/* Summary Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Attendance" 
            value={`${dashData?.attendance?.percentage || 0}%`} 
            icon={<FactCheck sx={{ fontSize: 32 }} />} 
            color={attendanceColor}
            subtitle={`Target: 75% | ${attendanceStatus}`} 
            onClick={() => navigate('/student/attendance')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Current SGPA" 
            value={dashData?.currentSgpa || 'N/A'} 
            icon={<StarBorder sx={{ fontSize: 32 }} />} 
            color="#8b5cf6" 
            subtitle="Overall GPA"
            onClick={() => navigate('/student/academics')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Pending Assignments" 
            value={dashData?.pendingAssignments || 0} 
            icon={<Assignment sx={{ fontSize: 32 }} />} 
            color="#f59e0b" 
            subtitle={dashData?.pendingAssignments > 0 ? "Action Required" : "All clear"}
            onClick={() => navigate('/student/assignments')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Fee Due" 
            value={isLedgerLoading ? '...' : `₹${ledgerData?.summary?.totalBalance?.toLocaleString() || 0}`} 
            icon={<ReceiptLong sx={{ fontSize: 32 }} />} 
            color={ledgerData?.summary?.totalBalance > 0 ? '#ef4444' : '#10b981'} 
            subtitle={ledgerData?.summary?.totalBalance > 0 ? "Action Required" : "All clear"}
            onClick={() => navigate('/fees')}
            loading={isLedgerLoading}
          />
        </Grid>
        
        {/* Additional Stats Row */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Upcoming Exams" value={dashData?.upcomingExams || 0} icon={<Article sx={{ fontSize: 32 }} />} color="#3b82f6" onClick={() => navigate('/student/examinations')} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Subjects" value={dashData?.totalSubjects || 0} icon={<MenuBook sx={{ fontSize: 32 }} />} color="#0ea5e9" onClick={() => navigate('/student/academics')} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Credits Completed" value={dashData?.creditsCompleted || 0} icon={<School sx={{ fontSize: 32 }} />} color="#ec4899" onClick={() => navigate('/student/academics')} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Notifications" value={dashData?.notificationsCount || 0} icon={<Notifications sx={{ fontSize: 32 }} />} color="#64748b" onClick={() => navigate('/student/notifications')} />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, borderRadius: 3, height: 350 }} elevation={0}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Monthly Attendance Trend</Typography>
            {dashData?.attendance?.monthlyTrend?.length > 0 ? (
              <ResponsiveContainer width="100%" height="85%">
                <AreaChart data={dashData.attendance.monthlyTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} domain={[0, 100]} />
                  <RechartsTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="attendance" stroke={theme.palette.primary.main} fillOpacity={1} fill="url(#colorAttendance)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: '85%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">No attendance data available yet.</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, borderRadius: 3, height: 350 }} elevation={0}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Subject-wise Attendance</Typography>
            {dashData?.attendance?.subjectWise?.length > 0 ? (
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={dashData.attendance.subjectWise} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="subject" type="category" axisLine={false} tickLine={false} width={80} />
                  <RechartsTooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="percentage" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
               <Box sx={{ height: '85%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">No subject data available.</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Bottom Section (Lists) */}
      <Grid container spacing={3}>
        {/* Today's Classes */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%', borderRadius: 3 }} elevation={0}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Today's Classes
              </Typography>
              <Button size="small" onClick={() => navigate('/student/timetable')}>View Timetable</Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {dashData?.todayClasses?.length > 0 ? (
              <List disablePadding>
                {dashData.todayClasses.map((cls, idx) => (
                  <ListItem key={cls.id} disableGutters sx={{ py: 1.5, borderBottom: idx !== dashData.todayClasses.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                    <Box sx={{ minWidth: 100, mr: 2 }}>
                      <Typography variant="body2" fontWeight="700" color="primary.main">{cls.time.split(' - ')[0]}</Typography>
                      <Typography variant="caption" color="text.secondary">{cls.time.split(' - ')[1]}</Typography>
                    </Box>
                    <ListItemText 
                      primary={cls.subject} 
                      secondary={`${cls.type || 'Lecture'} • ${cls.room}`}
                      primaryTypographyProps={{ fontWeight: 600, color: 'text.primary' }}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">No classes scheduled for today.</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Notices */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%', borderRadius: 3 }} elevation={0}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Campaign color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Latest Notices
                </Typography>
              </Box>
              <Button size="small" onClick={() => navigate('/notices')}>View All</Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {dashData?.recentNotices?.length > 0 ? (
              <List disablePadding>
                {dashData.recentNotices.map((notice) => (
                  <ListItem
                    key={notice.id}
                    disableGutters
                    secondaryAction={
                      <Chip label={notice.category} size="small" sx={{ fontSize: '0.7rem', fontWeight: 600, bgcolor: notice.priority === 'high' ? alpha('#ef4444', 0.1) : alpha(theme.palette.primary.main, 0.1), color: notice.priority === 'high' ? 'error.main' : 'primary.main' }} />
                    }
                    sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 'none' } }}
                  >
                    <ListItemText
                      primary={notice.title}
                      secondary={new Date(notice.date).toLocaleDateString()}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 600, color: 'text.primary', sx: { mb: 0.5, pr: 8 } }}
                      secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">No recent notices.</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StudentDashboard;
