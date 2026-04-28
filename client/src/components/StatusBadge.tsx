import { type LeadStatus, STATUS_COLORS } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: LeadStatus;
  showDot?: boolean;
}

export function StatusBadge({ status, showDot = true }: StatusBadgeProps) {
  const colors = STATUS_COLORS[status] || { bg: 'bg-slate-100 dark:bg-slate-800/50', text: 'text-slate-600 dark:text-slate-300', dot: 'bg-slate-400' };
  const displayText = status ? status.replace('_', ' ') : 'Nieznany';

  return (
    <Badge 
      variant="secondary" 
      className={`${colors.bg} ${colors.text} font-medium text-xs px-2.5 py-0.5`}
      data-testid={`badge-status-${status}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} mr-1.5`} />
      )}
      {displayText}
    </Badge>
  );
}
