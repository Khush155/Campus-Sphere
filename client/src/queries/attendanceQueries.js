import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

// Faculty Queries
export const useAssignedSubjectsQuery = () => {
  return useQuery({
    queryKey: ['assignedSubjects'],
    queryFn: async () => {
      const { data } = await api.get('/attendance/faculty/subjects');
      return data.data;
    },
  });
};

export const useEnrolledStudentsQuery = (subjectId) => {
  return useQuery({
    queryKey: ['enrolledStudents', subjectId],
    queryFn: async () => {
      if (!subjectId) return [];
      const { data } = await api.get(`/attendance/faculty/students/${subjectId}`);
      return data.data;
    },
    enabled: !!subjectId,
  });
};

export const useMarkAttendanceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (attendanceData) => {
      const { data } = await api.post('/attendance', attendanceData);
      return data.data;
    },
  });
};

// Student Queries
export const useStudentAttendanceSummaryQuery = () => {
  return useQuery({
    queryKey: ['studentAttendanceSummary'],
    queryFn: async () => {
      const { data } = await api.get('/attendance/student/summary');
      return data.data;
    },
  });
};

export const usePredictHolidayImpactMutation = () => {
  return useMutation({
    mutationFn: async (holidayData) => {
      const { data } = await api.post('/attendance/student/planner', holidayData);
      return data.data;
    },
  });
};
