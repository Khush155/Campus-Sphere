import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

/**
 * Fetches aggregate KPI counts for the dashboard header cards.
 * Returns { totalStudents, totalFaculty, totalHods, totalDepartments, totalCourses }.
 * All values are 0 on a fresh install — never an error.
 */
export const useDashboardStatsQuery = () =>
  useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const res = await api.get('/admin/dashboard/stats');
      return res.data.data;
    },
    // Zero counts are valid — don't retry aggressively
    retry: 1,
  });

/**
 * Fetches server-side student distribution across departments.
 * Returns [] when no students exist — this is valid and expected.
 */
export const useDepartmentDistributionQuery = () =>
  useQuery({
    queryKey: ['dashboard', 'department-distribution'],
    queryFn: async () => {
      const res = await api.get('/admin/dashboard/department-distribution');
      return res.data.data; // Array<{ departmentName, count }>
    },
    retry: 1,
  });

/**
 * Fetches institutional configuration insights / alerts.
 * Returns [] when everything is healthy — this is a positive, expected state.
 */
export const useDashboardInsightsQuery = () =>
  useQuery({
    queryKey: ['dashboard', 'insights'],
    queryFn: async () => {
      const res = await api.get('/admin/insights');
      return res.data.data;
    },
    refetchInterval: 60000, // Re-check insights every minute
    retry: 1,
  });
