import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

const ASSIGNMENT_KEYS = {
  all: ['assignments'],
  list: (filters) => [...ASSIGNMENT_KEYS.all, 'list', filters],
};

const fetchAssignments = async (filters) => {
  const { data } = await api.get('/assignments', { params: filters });
  return data;
};

export const useAssignmentsQuery = (filters = {}) => {
  return useQuery({
    queryKey: ASSIGNMENT_KEYS.list(filters),
    queryFn: () => fetchAssignments(filters),
    keepPreviousData: true,
  });
};

export const useCreateAssignmentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignmentData) => {
      const { data } = await api.post('/assignments', assignmentData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSIGNMENT_KEYS.all });
    },
  });
};

export const useRevokeAssignmentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assignmentId, revokedReason }) => {
      const { data } = await api.post(`/assignments/${assignmentId}/revoke`, { revokedReason });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSIGNMENT_KEYS.all });
    },
  });
};
