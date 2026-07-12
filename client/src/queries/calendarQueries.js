import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export const useCalendarEventsQuery = (filters = {}) => {
  return useQuery({
    queryKey: ['calendarEvents', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.branchId) params.append('branchId', filters.branchId);
      if (filters.semester) params.append('semester', filters.semester);
      if (filters.type) params.append('type', filters.type);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      const { data } = await api.get(`/calendar?${params.toString()}`);
      return data.data;
    },
  });
};

export const useCreateEventMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (eventData) => {
      const { data } = await api.post('/calendar', eventData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['calendarEvents']);
    },
  });
};

export const useDeleteEventMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (eventId) => {
      const { data } = await api.delete(`/calendar/${eventId}`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['calendarEvents']);
    },
  });
};
