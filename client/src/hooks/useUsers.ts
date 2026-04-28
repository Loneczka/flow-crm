import { useQuery, useMutation } from '@tanstack/react-query';
import { type User } from '@/lib/types';
import { apiRequest, queryClient } from '@/lib/queryClient';

export function useUsers() {
  return useQuery<User[]>({
    queryKey: ['/api/users'],
  });
}

export function useCreateUser() {
  return useMutation({
    mutationFn: async (data: { name: string; email: string; password: string; role: 'ADMIN' | 'SALES' }) => {
      const response = await apiRequest('POST', '/api/admin/users', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
  });
}

export function useDeleteUser() {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/admin/users/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
  });
}
