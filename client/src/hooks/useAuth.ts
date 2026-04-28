import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { type User } from '@/lib/types';

export function useUser() {
  return useQuery<User | null>({
    queryKey: ['/api/user'],
    retry: false,
    staleTime: Infinity,
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await apiRequest('POST', '/api/login', data);
      const result = await res.json();
      localStorage.setItem("auth_token", result.token);
      return result.user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['/api/user'], user);
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async (data: { email: string; password: string; name: string }) => {
      const res = await apiRequest('POST', '/api/register', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      localStorage.removeItem("auth_token");
      await apiRequest('POST', '/api/logout');
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/user'], null);
      queryClient.invalidateQueries();
    },
  });
}
