import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

// ==========================================
// DEPARTMENTS
// ==========================================

export const useDepartmentsQuery = () => {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await api.get('/college/departments', { params: { limit: 100 } });
      return response.data.data;
    },
  });
};

export const useCreateDeptMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/college/departments', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['departments']);
    },
  });
};

export const useUpdateDeptMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/college/departments/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['departments']);
    },
  });
};

export const useDeleteDeptMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/college/departments/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['departments']);
    },
  });
};

// ==========================================
// COURSES
// ==========================================

export const useCoursesQuery = () => {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const response = await api.get('/college/courses', { params: { limit: 100 } });
      return response.data.data;
    },
  });
};

export const useCreateCourseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/college/courses', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['courses']);
    },
  });
};

export const useUpdateCourseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/college/courses/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['courses']);
    },
  });
};

export const useDeleteCourseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/college/courses/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['courses']);
    },
  });
};

// ==========================================
// BRANCHES
// ==========================================

export const useBranchesQuery = () => {
  return useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const response = await api.get('/college/branches', { params: { limit: 100 } });
      return response.data.data;
    },
  });
};

export const useCreateBranchMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/college/branches', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['branches']);
    },
  });
};

export const useUpdateBranchMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/college/branches/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['branches']);
    },
  });
};

export const useDeleteBranchMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/college/branches/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['branches']);
    },
  });
};

// ==========================================
// SUBJECTS
// ==========================================

export const useSubjectsQuery = (filters) => {
  return useQuery({
    queryKey: ['subjects', filters],
    queryFn: async () => {
      const response = await api.get('/college/subjects', { params: filters });
      return response.data.data;
    },
    keepPreviousData: true,
  });
};

export const useCreateSubjectMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/college/subjects', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['subjects']);
    },
  });
};

export const useUpdateSubjectMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/college/subjects/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['subjects']);
    },
  });
};

export const useDeleteSubjectMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/college/subjects/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['subjects']);
    },
  });
};
