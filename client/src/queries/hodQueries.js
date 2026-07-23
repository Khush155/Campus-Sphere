import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

// ─── Attendance ───────────────────────────────────────────────────────────────
export const useAttendanceQuery = (params = {}) => useQuery({
  queryKey: ['attendance', params],
  queryFn: async () => {
    const response = await api.get('/attendance', { params });
    return response.data.data || [];
  }
});

export const useAttendanceSummaryQuery = (subjectId) => useQuery({
  queryKey: ['attendance-summary', subjectId],
  queryFn: async () => {
    const params = subjectId ? { subjectId } : {};
    const response = await api.get('/attendance/summary', { params });
    return response.data.data || { summary: [], stats: {} };
  },
  enabled: true,
});

export const useCreateAttendanceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => (await api.post('/attendance', data)).data.data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance'] }),
  });
};

export const useBulkMarkAttendanceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => (await api.post('/attendance/bulk', data)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance'] }),
  });
};

export const useApproveMedicalLeaveMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.patch(`/attendance/${id}/approve-medical`)).data.data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance'] }),
  });
};

// ─── Examinations ─────────────────────────────────────────────────────────────
export const useExaminationsQuery = (params = {}) => useQuery({
  queryKey: ['examinations', params],
  queryFn: async () => {
    const response = await api.get('/examinations', { params });
    return response.data.data || [];
  }
});

export const useExamStatsQuery = (examId) => useQuery({
  queryKey: ['exam-stats', examId],
  queryFn: async () => (await api.get(`/examinations/${examId}/stats`)).data.data,
  enabled: !!examId,
});

export const useCreateExaminationsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => (await api.post('/examinations', data)).data.data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['examinations'] }),
  });
};

export const useBatchPublishResultsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ examId, results }) =>
      (await api.post(`/examinations/${examId}/results/batch`, { results })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['examinations'] }),
  });
};

// ─── Projects ─────────────────────────────────────────────────────────────────
export const useProjectsQuery = () => useQuery({
  queryKey: ['projects'],
  queryFn: async () => (await api.get('/projects')).data.data || [],
});

export const useCreateProjectsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => (await api.post('/projects', data)).data.data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });
};

export const useUpdateProjectStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }) =>
      (await api.patch(`/projects/${id}/status`, { status })).data.data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });
};

// ─── Placements ───────────────────────────────────────────────────────────────
export const usePlacementsQuery = () => useQuery({
  queryKey: ['placements'],
  queryFn: async () => (await api.get('/placements/drives')).data.data || [],
});

export const useCreatePlacementsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => (await api.post('/placements/drives', data)).data.data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['placements'] }),
  });
};

export const usePlacementApplicationsQuery = (params = {}) => useQuery({
  queryKey: ['placement-applications', params],
  queryFn: async () => (await api.get('/placements/applications', { params })).data.data || [],
});

export const useIssueNocMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (appId) => (await api.patch(`/placements/applications/${appId}/noc`)).data.data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['placement-applications'] }),
  });
};

export const useUpdateApplicationRoundMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ appId, ...roundData }) =>
      (await api.patch(`/placements/applications/${appId}/round`, roundData)).data.data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['placements'] }),
  });
};

export const useFinalizeApplicationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ appId, finalStatus, offerPackageLPA }) =>
      (await api.patch(`/placements/applications/${appId}/finalize`, { finalStatus, offerPackageLPA })).data.data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['placements'] }),
  });
};

// ─── Leave ────────────────────────────────────────────────────────────────────
export const useLeaveQuery = (params = {}) => useQuery({
  queryKey: ['leaves', params],
  queryFn: async () => (await api.get('/leaves', { params })).data.data || [],
});

export const useCreateLeaveMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => (await api.post('/leaves', data)).data.data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leaves'] }),
  });
};

export const useUpdateLeaveStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, remarks, isMedicalOverride }) =>
      (await api.patch(`/leaves/${id}/status`, { status, remarks, isMedicalOverride })).data.data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leaves'] }),
  });
};

// ─── Notices ──────────────────────────────────────────────────────────────────
export const useNoticesQuery = () => useQuery({
  queryKey: ['notices'],
  queryFn: async () => (await api.get('/notices')).data.data || [],
});

export const useCreateNoticesMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => (await api.post('/notices', data)).data.data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notices'] }),
  });
};

export const useDeleteNoticeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/notices/${id}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notices'] }),
  });
};

// ─── Complaints ───────────────────────────────────────────────────────────────
export const useComplaintsQuery = () => useQuery({
  queryKey: ['complaints'],
  queryFn: async () => (await api.get('/complaints')).data.data || [],
});

export const useCreateComplaintsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => (await api.post('/complaints', data)).data.data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['complaints'] }),
  });
};

export const useUpdateComplaintStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, resolutionRemarks, note }) =>
      (await api.patch(`/complaints/${id}/status`, { status, resolutionRemarks, note })).data.data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['complaints'] }),
  });
};

// ─── Documents ────────────────────────────────────────────────────────────────
export const useDocumentsQuery = () => useQuery({
  queryKey: ['documents'],
  queryFn: async () => (await api.get('/documents')).data.data || [],
});

export const useCreateDocumentsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => (await api.post('/documents', data)).data.data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  });
};

export const useUpdateDocumentStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, rejectionReason, processingNotes, documentRef }) =>
      (await api.patch(`/documents/${id}/status`, { status, rejectionReason, processingNotes, documentRef })).data.data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  });
};

// ─── Meetings ─────────────────────────────────────────────────────────────────
export const useMeetingsQuery = () => useQuery({
  queryKey: ['meetings'],
  queryFn: async () => (await api.get('/meetings')).data.data || [],
});

export const useCreateMeetingsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => (await api.post('/meetings', data)).data.data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meetings'] }),
  });
};

export const useAddMeetingActionItemMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, description, assignedTo, dueDate }) =>
      (await api.post(`/meetings/${id}/action-items`, { description, assignedTo, dueDate })).data.data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meetings'] }),
  });
};

export const useUpdateMeetingStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, postponedTo, postponedReason }) =>
      (await api.patch(`/meetings/${id}/status`, { status, postponedTo, postponedReason })).data.data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meetings'] }),
  });
};

export const useUpdateRSVPMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, rsvpStatus }) =>
      (await api.patch(`/meetings/${id}/rsvp`, { rsvpStatus })).data.data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meetings'] }),
  });
};

// ─── Feedback ─────────────────────────────────────────────────────────────────
export const useFeedbackQuery = () => useQuery({
  queryKey: ['feedback'],
  queryFn: async () => (await api.get('/feedback')).data.data || [],
});

export const useCreateFeedbackMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => (await api.post('/feedback', data)).data.data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feedback'] }),
  });
};
