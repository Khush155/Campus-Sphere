import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export const useTimetableQuery = (filters) => {
  return useQuery({
    queryKey: ['timetable', filters],
    queryFn: async () => {
      // Clean undefined or empty filters
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== undefined && v !== '')
      );
      
      const response = await api.get('/timetable', { params: cleanFilters });
      return response.data.data;
    },
    // Only run the query if we have the minimum required filters or user is Faculty
    enabled: filters.isFaculty || (!!filters.course && !!filters.branch && !!filters.semester),
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
