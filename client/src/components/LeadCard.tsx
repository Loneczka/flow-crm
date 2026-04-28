import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StatusBadge } from './StatusBadge';
import { Phone, Mail, Calendar, GripVertical } from 'lucide-react';
import { type Lead } from '@/lib/types';
import { format } from 'date-fns';

interface LeadCardProps {
  lead: Lead;
  onClick?: () => void;
  isDragging?: boolean;
}

export function LeadCard({ lead, onClick, isDragging }: LeadCardProps) {
  const initials = `${lead.firstName[0]}${lead.lastName[0]}`.toUpperCase();
  
  return (
    <Card 
      className={`p-4 cursor-pointer hover-elevate active-elevate-2 group ${isDragging ? 'opacity-60 rotate-2' : ''}`}
      onClick={onClick}
      data-testid={`lead-card-${lead.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="invisible group-hover:visible cursor-grab">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate">
              {lead.firstName} {lead.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate">{lead.source}</p>
          </div>
        </div>
        {lead.assignedTo && (
          <Avatar className="h-6 w-6 shrink-0">
            <AvatarFallback className="text-xs bg-muted">
              {lead.assignedTo.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
      
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Phone className="w-3 h-3 shrink-0" />
          <span className="truncate font-mono">{lead.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Mail className="w-3 h-3 shrink-0" />
          <span className="truncate">{lead.email}</span>
        </div>
      </div>
      
      <div className="mt-3 flex items-center justify-between gap-2">
        <StatusBadge status={lead.status} />
        {lead.contactDate && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span className="font-mono">{format(lead.contactDate, 'MMM d, HH:mm')}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
