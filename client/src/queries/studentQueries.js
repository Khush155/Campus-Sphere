import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

/**
 * Hook to fetch paginated, filtered student list.
 * Wraps the existing /users endpoint with role=STUDENT forced.
 */
export const useStudentsQuery = (filters = {}) => {
  return useQuery({
    queryKey: ['students', filters],
    queryFn: async () => {
      const response = await api.get('/users', {
        params: { ...filters, role: 'STUDENT' },
      });
      return response.data; // { success, data: Array, meta: Object }
    },
    keepPreviousData: true,
  });
};

/**
 * Hook to submit a CSV file for bulk user import.
 * Sends multipart/form-data with the file under the "file" field.
 */
export const useBulkImportMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, dryRun = false }) => {
      const formData = new FormData();
      formData.append('file', file);
      const url = dryRun ? '/users/bulk-import?dryRun=true' : '/users/bulk-import';
      const response = await api.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data;
    },
    onSuccess: (_data, variables) => {
      if (!variables.dryRun) {
        queryClient.invalidateQueries(['users']);
        queryClient.invalidateQueries(['students']);
      }
    },
  });
};

/**
 * Hook to submit a JSON array of users for bulk import (post dry-run).
 */
export const useBulkImportJsonMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (jsonRows) => {
      const response = await api.post('/users/bulk-import-json', jsonRows);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      queryClient.invalidateQueries(['students']);
    },
  });
};

/**
 * Utility function to trigger a CSV export download for students.
 */
export const downloadExport = async (filters) => {
  const response = await api.get('/users/export', {
    params: { ...filters, role: 'STUDENT' },
    responseType: 'blob',
  });

  const blob = new Blob([response.data], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `students_export_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
