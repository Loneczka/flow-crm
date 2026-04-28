export type LeadStatus = 'Nowy' | 'W_toku' | 'Wstrzymany' | 'Wniosek' | 'Sukces' | 'Porazka';

export type UserRole = 'ADMIN' | 'SALES';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  activeRole?: UserRole;
  canSwitchToAdmin?: boolean;
  notificationsEnabled?: boolean;
}

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: LeadStatus;
  source: string;
  notes: string;
  contactDate: Date | null;
  assignedToId: string | null;
  assignedTo?: User;
  createdById: string;
  createdAt?: Date;
}

export interface LeadHistoryItem {
  id: string;
  leadId: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: Date;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export const STATUS_COLORS: Record<LeadStatus, { bg: string; text: string; dot: string }> = {
  Nowy: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  W_toku: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  Wstrzymany: { bg: 'bg-slate-100 dark:bg-slate-800/50', text: 'text-slate-600 dark:text-slate-300', dot: 'bg-slate-400' },
  Wniosek: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
  Sukces: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', dot: 'bg-green-500' },
  Porazka: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
};

export const STATUS_LABELS: Record<LeadStatus, string> = {
  Nowy: 'Nowy',
  W_toku: 'W toku',
  Wstrzymany: 'Wstrzymany',
  Wniosek: 'Wniosek',
  Sukces: 'Sukces',
  Porazka: 'Porazka',
};
