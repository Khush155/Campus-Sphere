import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

/**
 * Fetch faculty assignments for a specific branch and optional filters
 */
export const useFacultyAssignments = (branchId, filters = {}) => {
  return useQuery({
    queryKey: ['facultyAssignments', branchId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({ branchId });
      if (filters.academicYear) params.append('academicYear', filters.academicYear);
      if (filters.semester) params.append('semester', filters.semester);

      const response = await api.get(`/faculty-assignments?${params.toString()}`);
      return response.data.data;
    },
    enabled: !!branchId, // Only fetch if a branch is selected
  });
};

/**
 * Fetch assignments for the logged-in faculty member
 */
export const useMyAssignments = () => {
  return useQuery({
    queryKey: ['myFacultyAssignments'],
    queryFn: async () => {
      const response = await api.get('/faculty-assignments/my');
      return response.data.data;
    },
  });
};

/**
 * Assign a faculty to a subject
 */
export const useAssignFaculty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const response = await api.post('/faculty-assignments', payload);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['facultyAssignments', variables.branchId]);
    },
  });
};

/**
 * Revoke a faculty assignment
 */
export const useRevokeAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignmentId) => {
      const response = await api.patch(`/faculty-assignments/${assignmentId}/revoke`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['facultyAssignments']);
    },
  });
};
