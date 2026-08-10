/* eslint-disable */
import React from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const WorkloadChart = ({ data }) => {
  const theme = useTheme();

  if (!data || data.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: `1px solid ${theme.palette.divider}`, borderTop: `4px solid ${theme.palette.primary.main}`, boxShadow: 'none' }}>
        <Typography color="text.secondary">No faculty workload data available.</Typography>
      </Paper>
    );
  }

  // Normalize data keys
  const formattedData = data.map((d) => ({
    name: d.subject || d.name || 'Subject',
    hours: d.hours !== undefined ? d.hours : d.subjectCount || 0,
  }));

  const maxHours = Math.max(...formattedData.map((d) => d.hours), 1);

  const getColor = (hours) => {
    if (hours === 0) return theme.palette.action.disabledBackground;
    if (hours > 15) return theme.palette.warning.main;
    return theme.palette.primary.main;
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, borderTop: `4px solid ${theme.palette.primary.main}`, boxShadow: 'none', height: 380, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.ink?.[900] || '#1a1a1a' }}>
          Curriculum Subject Workload Distribution
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
          Teaching Hours / Week
        </Typography>
      </Box>
      
      <Box sx={{ flex: 1, minHeight: 280, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={formattedData}
            margin={{ top: 10, right: 20, left: -20, bottom: 50 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 11, fill: theme.palette.text.secondary, fontWeight: 600 }} 
              axisLine={false} 
              tickLine={false}
              angle={-25}
              textAnchor="end"
              interval={0}
            />
            <YAxis 
              allowDecimals={false} 
              tick={{ fontSize: 11, fill: theme.palette.text.secondary, fontWeight: 600 }} 
              axisLine={false} 
              tickLine={false} 
            />
            <Tooltip 
              cursor={{ fill: theme.palette.action.hover }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <Paper sx={{ p: 1.5, borderRadius: 2, border: `1px solid ${theme.palette.divider}`, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', color: theme.palette.primary.main }}>
                        {item.name}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
                        {item.hours} Weekly Hours
                      </Typography>
                    </Paper>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
              {formattedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.hours)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default WorkloadChart;
