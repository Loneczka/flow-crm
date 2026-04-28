import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { type Notification } from '@/lib/types';

export function useNotifications() {
  return useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    select: (data: any[]) => data.map(item => ({
      ...item,
      createdAt: new Date(item.createdAt),
    })),
  });
}

export function useMarkNotificationRead() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('PATCH', `/api/notifications/${id}`, { isRead: true });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });
}
