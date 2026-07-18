import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export const useStudentDashboardQuery = () => {
  return useQuery({
    queryKey: ['studentDashboardSummary'],
    queryFn: async () => {
      const response = await api.get('/student/dashboard/summary');
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useStudentAcademicsQuery = () => {
  return useQuery({
    queryKey: ['studentAcademics'],
    queryFn: async () => {
      const response = await api.get('/student/academics');
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useStudentTimetableQuery = () => {
  return useQuery({
    queryKey: ['studentTimetable'],
    queryFn: async () => {
      const response = await api.get('/student/timetable');
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useStudentUpcomingExamsQuery = () => {
  return useQuery({
    queryKey: ['studentUpcomingExams'],
    queryFn: async () => {
      const response = await api.get('/student/examinations');
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useStudentExamResultsQuery = () => {
  return useQuery({
    queryKey: ['studentExamResults'],
    queryFn: async () => {
      const response = await api.get('/student/examinations/results');
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};
