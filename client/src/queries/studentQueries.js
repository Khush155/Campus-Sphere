import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

/**
 * Fetch attendance summary for a specific student
 */
export const useStudentAttendanceQuery = (studentId) => {
  return useQuery({
    queryKey: ['student-attendance', studentId],
    queryFn: async () => {
      if (!studentId) return { summary: [], records: [] };
      const response = await api.get(`/attendance/student/${studentId}`);
      return response.data?.data || { summary: [], records: [] };
    },
    enabled: Boolean(studentId),
  });
};

/**
 * Fetch assignments relevant for student's branch/semester
 */
export const useStudentAssignmentsQuery = (params = {}) => {
  return useQuery({
    queryKey: ['student-assignments', params],
    queryFn: async () => {
      const response = await api.get('/faculty-assignments', { params });
      return response.data?.data || [];
    },
  });
};

/**
 * Mutation for student to submit an assignment
 */
export const useSubmitAssignmentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ assignmentId, submissionUrl, notes }) => {
      const response = await api.post(`/faculty-assignments/${assignmentId}/submit`, {
        submissionUrl,
        notes,
      });
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-assignments'] });
    },
  });
};
