import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

// --- Dashboard & Analytics Hooks ---

export const useFacultyDashboardQuery = () => {
  return useQuery({
    queryKey: ['faculty-dashboard'],
    queryFn: async () => {
      const response = await api.get('/faculty/dashboard/stats');
      return response.data.data;
    },
    refetchInterval: 30000, // Refresh dashboard every 30 seconds
  });
};

export const useFacultyAnalyticsQuery = () => {
  return useQuery({
    queryKey: ['faculty-analytics'],
    queryFn: async () => {
      const response = await api.get('/faculty/analytics/dashboard');
      return response.data.data;
    },
  });
};

// --- Course Materials Hooks ---

export const useMaterialsQuery = (filters = {}) => {
  return useQuery({
    queryKey: ['materials', filters],
    queryFn: async () => {
      const response = await api.get('/materials', { params: filters });
      return response.data.data;
    },
  });
};

export const useUploadMaterialMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (materialData) => {
      const response = await api.post('/materials', materialData);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  });
};

export const useDeleteMaterialMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (materialId) => {
      const response = await api.delete(`/materials/${materialId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  });
};

// --- Notifications Hooks ---

export const useNotificationsQuery = (filters = {}) => {
  return useQuery({
    queryKey: ['notifications', filters],
    queryFn: async () => {
      const response = await api.get('/notifications', { params: filters });
      return response.data.data;
    },
    refetchInterval: 30000, // check for new notifications periodically
  });
};

export const useMarkNotificationReadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId) => {
      const response = await api.patch(`/notifications/${notificationId}/read`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useMarkAllNotificationsReadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await api.patch('/notifications/read-all');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

// --- Attendance Hooks ---

export const useAttendanceQuery = (filters = {}, enabled = false) => {
  return useQuery({
    queryKey: ['attendance', filters],
    queryFn: async () => {
      const response = await api.get('/attendance', { params: filters });
      return response.data.data;
    },
    enabled: enabled && !!filters.subjectId && !!filters.date && !!filters.group,
  });
};

export const useSubmitAttendanceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (attendanceData) => {
      const response = await api.post('/attendance', attendanceData);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['attendance', {
          subjectId: variables.subjectId,
          date: variables.date,
          group: variables.group || variables.sectionId,
        }],
      });
    },
  });
};

// --- Exams & Results Mutations ---

export const useExamsQuery = (filters = {}) => {
  return useQuery({
    queryKey: ['exams', filters],
    queryFn: async () => {
      const response = await api.get('/exams', { params: filters });
      return response.data.data;
    },
  });
};

export const useScheduleExamMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (examData) => {
      const response = await api.post('/exams', examData);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });
};

export const useSubmitExamResultMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (resultData) => {
      const response = await api.post('/exams/results', resultData);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exam-results', variables.examId] });
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });
};

export const useExamResultsQuery = (examId) => {
  return useQuery({
    queryKey: ['exam-results', examId],
    queryFn: async () => {
      if (!examId) return [];
      const response = await api.get(`/exams/${examId}/results`);
      return response.data.data;
    },
    enabled: !!examId,
  });
};

// --- Faculty Homework Assignments Hooks ---

export const useFacultyAssignmentsQuery = (filters = {}) => {
  return useQuery({
    queryKey: ['faculty-assignments', filters],
    queryFn: async () => {
      const response = await api.get('/faculty-assignments', { params: filters });
      return response.data.data;
    },
  });
};

export const useCreateFacultyAssignmentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (assignmentData) => {
      const response = await api.post('/faculty-assignments', assignmentData);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty-assignments'] });
    },
  });
};

export const useDeleteFacultyAssignmentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (assignmentId) => {
      const response = await api.delete(`/faculty-assignments/${assignmentId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty-assignments'] });
    },
  });
};

export const useUpdateFacultyAssignmentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/faculty-assignments/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty-assignments'] });
    },
  });
};

export const useUpdateFacultyAssignmentStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }) => {
      const response = await api.patch(`/faculty-assignments/${id}/status`, { status });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty-assignments'] });
    },
  });
};
