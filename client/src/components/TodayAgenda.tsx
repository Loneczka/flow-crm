import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StatusBadge } from './StatusBadge';
import { Clock, Phone, ChevronRight } from 'lucide-react';
import { type Lead } from '@/lib/types';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

interface TodayAgendaProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
}

export function TodayAgenda({ leads, onLeadClick }: TodayAgendaProps) {
  const sortedLeads = [...leads].sort((a, b) => {
    if (!a.contactDate || !b.contactDate) return 0;
    return a.contactDate.getTime() - b.contactDate.getTime();
  });

  return (
    <Card data-testid="card-today-agenda">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Today's Agenda
          <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
            {leads.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {leads.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No contacts scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedLeads.map((lead) => {
              const initials = `${lead.firstName[0]}${lead.lastName[0]}`.toUpperCase();
              return (
                <div
                  key={lead.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover-elevate active-elevate-2 cursor-pointer group"
                  onClick={() => onLeadClick(lead)}
                  data-testid={`agenda-item-${lead.id}`}
                >
                  <div className="w-16 shrink-0">
                    <span className="font-mono text-sm font-medium">
                      {lead.contactDate ? format(lead.contactDate, 'HH:mm') : '--:--'}
                    </span>
                  </div>
                  <div className="w-0.5 h-8 bg-border rounded-full" />
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {lead.firstName} {lead.lastName}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      <span className="font-mono">{lead.phone}</span>
                    </div>
                  </div>
                  <StatusBadge status={lead.status} showDot={false} />
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
