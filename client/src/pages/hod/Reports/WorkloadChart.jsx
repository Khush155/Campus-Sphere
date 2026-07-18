import React from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const WorkloadChart = ({ data }) => {
  const theme = useTheme();

  if (!data || data.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Typography color="text.secondary">No faculty workload data available.</Typography>
      </Paper>
    );
  }

  // Determine threshold logic based on subject count.
  // Example: 0 = gray, 1-3 = primary, 4+ = warning/error
  const getColor = (count) => {
    if (count === 0) return theme.palette.action.disabledBackground;
    if (count > 3) return theme.palette.error.main; // Heavy workload
    return theme.palette.primary.main;
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', height: 400 }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: theme.palette.text.primary }}>
        Faculty Workload Distribution
      </Typography>
      
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: -20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12, fill: theme.palette.text.secondary }} 
            axisLine={false} 
            tickLine={false}
            angle={-45}
            textAnchor="end"
            interval={0}
          />
          <YAxis 
            allowDecimals={false} 
            tick={{ fontSize: 12, fill: theme.palette.text.secondary }} 
            axisLine={false} 
            tickLine={false} 
          />
          <Tooltip 
            cursor={{ fill: theme.palette.action.hover }}
            contentStyle={{ borderRadius: 8, border: `1px solid ${theme.palette.divider}`, boxShadow: theme.shadows[3] }}
          />
          <Bar dataKey="subjectCount" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.subjectCount)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default WorkloadChart;
