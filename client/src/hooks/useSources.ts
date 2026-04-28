import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface Source {
  id: string;
  name: string;
  createdAt: Date;
}

export function useSources() {
  return useQuery<Source[]>({
    queryKey: ['/api/sources'],
  });
}

export function useCreateSource() {
  return useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest('POST', '/api/admin/sources', { name });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sources'] });
    },
  });
}

export function useDeleteSource() {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/admin/sources/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sources'] });
    },
  });
}
