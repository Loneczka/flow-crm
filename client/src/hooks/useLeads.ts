import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { type Lead, type LeadStatus, type LeadHistoryItem } from '@/lib/types';

interface LeadFromApi {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: LeadStatus;
  source: string;
  notes: string;
  contactDate: string | null;
  assignedToId: string | null;
  createdById: string;
  createdAt: string;
}

function transformLead(lead: LeadFromApi): Lead {
  return {
    ...lead,
    contactDate: lead.contactDate ? new Date(lead.contactDate) : null,
  };
}

export function useLeads() {
  return useQuery<LeadFromApi[], Error, Lead[]>({
    queryKey: ['/api/leads'],
    select: (data) => data.map(transformLead),
  });
}

export function useLead(id: string | null) {
  return useQuery<LeadFromApi, Error, Lead>({
    queryKey: ['/api/leads', id],
    enabled: !!id,
    select: (data) => transformLead(data),
  });
}

export function useLeadHistory(leadId: string | null) {
  return useQuery<LeadHistoryItem[]>({
    queryKey: ['/api/leads', leadId, 'history'],
    enabled: !!leadId,
    select: (data: any[]) => (data || []).map(item => ({
      ...item,
      userName: item.userName || 'Nieznany uzytkownik',
      action: item.action || 'Nieznana akcja',
      timestamp: new Date(item.timestamp),
    })),
  });
}

export function useCreateLead() {
  return useMutation({
    mutationFn: async (data: Partial<Lead>) => {
      const res = await apiRequest('POST', '/api/leads', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
    },
  });
}

export function useUpdateLead() {
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<Lead>) => {
      const res = await apiRequest('PATCH', `/api/leads/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
    },
  });
}

export function useDeleteLead() {
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/leads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
    },
  });
}
