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
 * Fetch detailed date-wise attendance register / logs for student
 */
export const useStudentAttendanceLogsQuery = (params = {}) => {
  return useQuery({
    queryKey: ['student-attendance-logs', params],
    queryFn: async () => {
      const response = await api.get('/attendance', { params: { limit: 200, ...params } });
      return response.data?.data || [];
    },
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
    mutationFn: async ({ assignmentId, submissionUrl, notes, file }) => {
      let response;
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        if (submissionUrl) formData.append('submissionUrl', submissionUrl);
        if (notes) formData.append('notes', notes);
        response = await api.post(`/faculty-assignments/${assignmentId}/submit`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        response = await api.post(`/faculty-assignments/${assignmentId}/submit`, {
          submissionUrl,
          notes,
        });
      }
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-assignments'] });
    },
  });
};

/**
 * Fetch GPA and grade breakdown for a specific student
 */
export const useStudentGpaQuery = (studentId) => {
  return useQuery({
    queryKey: ['student-gpa', studentId],
    queryFn: async () => {
      if (!studentId) return null;
      const response = await api.get(`/exams/gpa/${studentId}`);
      return response.data?.data || null;
    },
    enabled: Boolean(studentId),
  });
};

/**
 * Fetch examination schedule and published datesheets for student
 */
export const useStudentExaminationsQuery = (params = {}) => {
  return useQuery({
    queryKey: ['student-examinations', params],
    queryFn: async () => {
      const response = await api.get('/examinations', { params });
      const data = response.data?.data;
      return Array.isArray(data) ? data : (data?.records || data?.data || []);
    },
  });
};

/**
 * Fetch course study materials for student
 */
export const useStudentMaterialsQuery = (filters = {}) => {
  return useQuery({
    queryKey: ['student-materials', filters],
    queryFn: async () => {
      const response = await api.get('/materials', { params: filters });
      return response.data?.data || [];
    },
  });
};

/**
 * Fetch document requests for student
 */
export const useStudentDocumentsQuery = () => {
  return useQuery({
    queryKey: ['student-documents'],
    queryFn: async () => {
      const response = await api.get('/documents');
      return response.data?.data || [];
    },
  });
};

/**
 * Submit a new document request
 */
export const useRequestDocumentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/documents', data);
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-documents'] });
    },
  });
};

/**
 * Fetch complaints submitted by student
 */
export const useStudentComplaintsQuery = () => {
  return useQuery({
    queryKey: ['student-complaints'],
    queryFn: async () => {
      const response = await api.get('/complaints');
      return response.data?.data || [];
    },
  });
};

/**
 * Lodge a new complaint
 */
export const useCreateComplaintMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/complaints', data);
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-complaints'] });
    },
  });
};


/**
 * Fetch placement drives
 */
export const usePlacementDrivesQuery = (params = {}) => {
  return useQuery({
    queryKey: ['placement-drives', params],
    queryFn: async () => {
      const response = await api.get('/placements/drives', { params });
      return response.data?.data || [];
    },
  });
};

/**
 * Fetch student placement applications
 */
export const useStudentPlacementApplicationsQuery = () => {
  return useQuery({
    queryKey: ['student-placement-applications'],
    queryFn: async () => {
      const response = await api.get('/placements/applications');
      return response.data?.data || [];
    },
  });
};

/**
 * Student applies for placement drive
 */
export const useApplyPlacementDriveMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (driveId) => {
      const response = await api.post(`/placements/drives/${driveId}/apply`);
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['placement-drives'] });
      queryClient.invalidateQueries({ queryKey: ['student-placement-applications'] });
    },
  });
};

/**
 * Fetch official fee receipts for student
 */
export const useStudentFeeReceiptsQuery = () => {
  return useQuery({
    queryKey: ['student-fee-receipts'],
    queryFn: async () => {
      const response = await api.get('/fees/receipts');
      return response.data?.data || [];
    },
  });
};

/**
 * Fetch a single fee receipt by ID
 */
export const useStudentFeeReceiptQuery = (receiptId) => {
  return useQuery({
    queryKey: ['student-fee-receipt', receiptId],
    queryFn: async () => {
      if (!receiptId) return null;
      const response = await api.get(`/fees/receipts/${receiptId}`);
      return response.data?.data || null;
    },
    enabled: Boolean(receiptId),
  });
};

/**
 * Fetch student's course faculty allocations and feedback submission status
 */
export const useStudentFeedbackStatusQuery = (params = {}) => {
  return useQuery({
    queryKey: ['student-feedback-status', params],
    queryFn: async () => {
      const response = await api.get('/feedback/student-status', { params });
      return response.data?.data || { allocations: [], stats: {} };
    },
  });
};

/**
 * Fetch feedback submitted by student
 */
export const useStudentFeedbackQuery = () => {
  return useQuery({
    queryKey: ['student-feedback'],
    queryFn: async () => {
      const response = await api.get('/feedback');
      return response.data?.data || [];
    },
  });
};

/**
 * Mutation for student to submit faculty course feedback
 */
export const useSubmitFacultyFeedbackMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const response = await api.post('/feedback', payload);
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-feedback-status'] });
      queryClient.invalidateQueries({ queryKey: ['student-feedback'] });
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      queryClient.invalidateQueries({ queryKey: ['feedback-analytics'] });
    },
  });
};

/**
 * Submit faculty / course feedback
 */
export const useSubmitFeedbackMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/feedback', data);
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-feedback'] });
      queryClient.invalidateQueries({ queryKey: ['student-feedback-status'] });
    },
  });
};

/**
 * Simulate student online fee payment
 */
export const usePayStudentFeeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/fees/pay');
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-fee-receipts'] });
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
    },
  });
};

/**
 * Update student profile (phone, address, emergency contact, profilePicUrl)
 */
export const useUpdateStudentProfileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.put('/users/me', data);
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
    },
  });
};
