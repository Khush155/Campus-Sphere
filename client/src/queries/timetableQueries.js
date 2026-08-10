import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export const useTimetableQuery = (filters = {}) => {
  return useQuery({
    queryKey: ['timetable', filters],
    queryFn: async () => {
      // Clean undefined or empty filters
      const cleanFilters = Object.fromEntries(
        Object.entries(filters || {}).filter(([_, v]) => v !== undefined && v !== '')
      );
      
      const apiFilters = { ...cleanFilters };
      if (apiFilters.course) {
        apiFilters.courseId = apiFilters.course;
        delete apiFilters.course;
      }
      if (apiFilters.branch) {
        apiFilters.branchId = apiFilters.branch;
        delete apiFilters.branch;
      }
      
      const response = await api.get('/timetable', { params: apiFilters });
      return response.data?.data || [];
    },
    // Only run the query if we have no filters (fetch all/my timetable) or minimum required filters or user is Faculty/Student
    enabled:
      !filters ||
      Object.keys(filters).length === 0 ||
      Boolean(filters.isFaculty) ||
      Boolean(filters.isStudent) ||
      (Boolean(filters.course) && Boolean(filters.branch) && Boolean(filters.semester)),
  });
};

export const useCreateSlotMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (slotData) => {
      const response = await api.post('/timetable', slotData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable'] });
    },
  });
};

export const useDeleteSlotMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (slotId) => {
      const response = await api.delete(`/timetable/${slotId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable'] });
    },
  });
};

export const useAutoGenerateTimetableMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (batchData) => {
      const response = await api.post('/timetable/auto-generate', batchData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable'] });
    },
  });
};
