import { useState } from 'react';
import { TodayAgenda } from '@/components/TodayAgenda';
import { StatCard } from '@/components/StatCard';
import { LeadDetailModal } from '@/components/LeadDetailModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, Target, Award, BarChart3, Loader2 } from 'lucide-react';
import { type Lead, type User } from '@/lib/types';
import { useLeads, useLeadHistory, useUpdateLead, useDeleteLead } from '@/hooks/useLeads';
import { useUsers } from '@/hooks/useUsers';
import { useToast } from '@/hooks/use-toast';

interface DashboardProps {
  currentUser: User;
}

export default function Dashboard({ currentUser }: DashboardProps) {
  const isAdmin = (currentUser.activeRole || currentUser.role) === 'ADMIN';
  const [selectedRep, setSelectedRep] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { toast } = useToast();

  const { data: leads = [], isLoading: leadsLoading, error: leadsError } = useLeads();
  const { data: users = [], isLoading: usersLoading, error: usersError } = useUsers();
  const { data: history = [] } = useLeadHistory(selectedLead?.id || null);
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();

  const salesReps = users.filter(u => u.role === 'SALES');

  const getAssignedUser = (lead: Lead): User | undefined => {
    if (lead.assignedTo) return lead.assignedTo;
    if (lead.assignedToId) return users.find(u => u.id === lead.assignedToId);
    return undefined;
  };

  const leadsWithAssignedTo = leads.map(lead => ({
    ...lead,
    assignedTo: getAssignedUser(lead),
  }));
  
  const filteredLeads = isAdmin && selectedRep !== 'all' 
    ? leadsWithAssignedTo.filter(l => l.assignedToId === selectedRep)
    : leadsWithAssignedTo;

  const todayLeads = filteredLeads.filter(l => {
    if (!l.contactDate) return false;
    const leadDate = new Date(l.contactDate);
    const now = new Date();
    return leadDate.toDateString() === now.toDateString();
  });

  const handleLeadClick = (lead: Lead) => {
    const leadWithUser = {
      ...lead,
      assignedTo: getAssignedUser(lead),
    };
    setSelectedLead(leadWithUser);
    setModalOpen(true);
  };

  const handleSaveLead = async (lead: Lead) => {
    try {
      await updateLead.mutateAsync({
        id: lead.id,
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        status: lead.status,
        source: lead.source,
        notes: lead.notes,
        contactDate: lead.contactDate,
        assignedToId: lead.assignedToId,
      });
      toast({
        title: 'Sukces',
        description: 'Lead zostal zaktualizowany',
      });
    } catch (error) {
      toast({
        title: 'Blad',
        description: 'Nie udalo sie zaktualizowac leada',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      await deleteLead.mutateAsync(leadId);
      toast({
        title: 'Sukces',
        description: 'Lead zostal usuniety',
      });
      setModalOpen(false);
      setSelectedLead(null);
    } catch (error) {
      toast({
        title: 'Blad',
        description: 'Nie udalo sie usunac leada',
        variant: 'destructive',
      });
    }
  };

  const totalLeads = filteredLeads.length;
  const wonLeads = filteredLeads.filter(l => l.status === 'Sukces').length;
  const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;
  const activeDeals = filteredLeads.filter(l => ['W_toku', 'Wniosek'].includes(l.status)).length;

  if (leadsLoading || usersLoading) {
    return (
      <div className="flex items-center justify-center h-full" data-testid="dashboard-loading">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (leadsError || usersError) {
    return (
      <div className="flex items-center justify-center h-full" data-testid="dashboard-error">
        <div className="text-center">
          <p className="text-destructive font-medium">Blad ladowania danych</p>
          <p className="text-sm text-muted-foreground mt-1">Sprobuj odswiezyc strone</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6" data-testid="dashboard-page">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Panel glowny</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAdmin ? 'Przeglad calej aktywnosci sprzedazy' : 'Twoj przeglad sprzedazy'}
          </p>
        </div>
        
        {isAdmin && (
          <Select value={selectedRep} onValueChange={setSelectedRep}>
            <SelectTrigger className="w-[200px]" data-testid="select-filter-rep">
              <SelectValue placeholder="Filtruj po handlowcu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszyscy handlowcy</SelectItem>
              {salesReps.map((rep) => (
                <SelectItem key={rep.id} value={rep.id}>
                  {rep.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {!isAdmin && (
        <TodayAgenda leads={todayLeads} onLeadClick={handleLeadClick} />
      )}

      <div className="grid grid-cols-4 gap-4">
        <StatCard 
          title="Wszystkie leady" 
          value={totalLeads} 
          icon={Users}
        />
        <StatCard 
          title="Wskaznik konwersji" 
          value={`${conversionRate}%`} 
          icon={TrendingUp}
        />
        <StatCard 
          title="Aktywne transakcje" 
          value={activeDeals} 
          icon={Target}
        />
        <StatCard 
          title="Wygrane" 
          value={wonLeads} 
          icon={Award}
        />
      </div>

      {isAdmin && (
        <div className="grid grid-cols-3 gap-6">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Wyniki zespolu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {salesReps.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Brak handlowcow w zespole
                  </p>
                ) : (
                  salesReps.map((rep) => {
                    const repLeads = leadsWithAssignedTo.filter(l => l.assignedToId === rep.id);
                    const repWon = repLeads.filter(l => l.status === 'Sukces').length;
                    const repRate = repLeads.length > 0 ? Math.round((repWon / repLeads.length) * 100) : 0;
                    
                    return (
                      <div key={rep.id} className="flex items-center gap-4 p-3 rounded-lg hover-elevate" data-testid={`team-member-${rep.id}`}>
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {rep.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{rep.name}</p>
                          <p className="text-xs text-muted-foreground">{repLeads.length} przypisanych leadow</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{repRate}%</p>
                          <p className="text-xs text-muted-foreground">konwersja</p>
                        </div>
                        <Badge variant={repWon > 0 ? 'default' : 'secondary'}>
                          {repWon} wygranych
                        </Badge>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Dzisiejsza agenda</CardTitle>
            </CardHeader>
            <CardContent>
              {todayLeads.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Brak zaplanowanych kontaktow na dzis
                </p>
              ) : (
                <div className="space-y-3">
                  {todayLeads.slice(0, 5).map((lead) => (
                    <div 
                      key={lead.id} 
                      className="flex items-center gap-3 p-2 rounded-lg hover-elevate cursor-pointer"
                      onClick={() => handleLeadClick(lead)}
                      data-testid={`admin-agenda-item-${lead.id}`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {lead.firstName[0]}{lead.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{lead.firstName} {lead.lastName}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {lead.contactDate ? new Date(lead.contactDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <LeadDetailModal
        lead={selectedLead}
        history={history}
        users={users}
        currentUser={currentUser}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={handleSaveLead}
        onDelete={handleDeleteLead}
        isSaving={updateLead.isPending}
        isDeleting={deleteLead.isPending}
      />
    </div>
  );
}
