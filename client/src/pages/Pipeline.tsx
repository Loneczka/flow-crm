import { useState } from 'react';
import { KanbanBoard } from '@/components/KanbanBoard';
import { LeadDetailModal } from '@/components/LeadDetailModal';
import { AddLeadModal } from '@/components/AddLeadModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Loader2, Users } from 'lucide-react';
import { type Lead, type LeadStatus, type User } from '@/lib/types';
import { useLeads, useLeadHistory, useCreateLead, useUpdateLead, useDeleteLead } from '@/hooks/useLeads';
import { useUsers } from '@/hooks/useUsers';
import { useToast } from '@/hooks/use-toast';

interface PipelineProps {
  currentUser: User;
}

export default function Pipeline({ currentUser }: PipelineProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const { toast } = useToast();

  const { data: leads = [], isLoading: leadsLoading, error: leadsError } = useLeads();
  const { data: users = [], isLoading: usersLoading, error: usersError } = useUsers();
  const { data: history = [] } = useLeadHistory(selectedLead?.id || null);
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();

  const getAssignedUser = (lead: Lead): User | undefined => {
    if (lead.assignedTo) return lead.assignedTo;
    if (lead.assignedToId) return users.find(u => u.id === lead.assignedToId);
    return undefined;
  };

  const leadsWithAssignedTo = leads.map(lead => ({
    ...lead,
    assignedTo: getAssignedUser(lead),
  }));

  const isAdmin = (currentUser.activeRole || currentUser.role) === 'ADMIN';
  
  const visibleLeads = isAdmin 
    ? leadsWithAssignedTo 
    : leadsWithAssignedTo.filter(l => l.assignedToId === currentUser.id || l.createdById === currentUser.id);

  const userFilteredLeads = isAdmin && selectedUserId !== 'all'
    ? visibleLeads.filter(l => l.assignedToId === selectedUserId)
    : visibleLeads;

  const filteredLeads = searchQuery
    ? userFilteredLeads.filter(l => 
        `${l.firstName} ${l.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.phone.includes(searchQuery)
      )
    : userFilteredLeads;

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    try {
      await updateLead.mutateAsync({ id: leadId, status: newStatus });
    } catch (error) {
      toast({
        title: 'Blad',
        description: 'Nie udalo sie zmienic statusu',
        variant: 'destructive',
      });
    }
  };

  const handleLeadClick = (lead: Lead) => {
    const leadWithUser = {
      ...lead,
      assignedTo: getAssignedUser(lead),
    };
    setSelectedLead(leadWithUser);
    setDetailModalOpen(true);
  };

  const handleSaveLead = async (updatedLead: Lead) => {
    try {
      await updateLead.mutateAsync({
        id: updatedLead.id,
        firstName: updatedLead.firstName,
        lastName: updatedLead.lastName,
        email: updatedLead.email,
        phone: updatedLead.phone,
        status: updatedLead.status,
        source: updatedLead.source,
        notes: updatedLead.notes,
        contactDate: updatedLead.contactDate,
        assignedToId: updatedLead.assignedToId,
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

  const handleAddLead = async (data: any) => {
    try {
      await createLead.mutateAsync({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        status: data.status as LeadStatus,
        source: data.source,
        notes: data.notes || '',
        assignedToId: data.assignedToId || null,
      });
      toast({
        title: 'Sukces',
        description: 'Nowy lead zostal dodany',
      });
    } catch (error) {
      toast({
        title: 'Blad',
        description: 'Nie udalo sie dodac leada',
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
      setDetailModalOpen(false);
      setSelectedLead(null);
    } catch (error) {
      toast({
        title: 'Blad',
        description: 'Nie udalo sie usunac leada',
        variant: 'destructive',
      });
    }
  };

  if (leadsLoading || usersLoading) {
    return (
      <div className="flex items-center justify-center h-full" data-testid="pipeline-loading">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (leadsError || usersError) {
    return (
      <div className="flex items-center justify-center h-full" data-testid="pipeline-error">
        <div className="text-center">
          <p className="text-destructive font-medium">Blad ladowania danych</p>
          <p className="text-sm text-muted-foreground mt-1">Sprobuj odswiezyc strone</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" data-testid="pipeline-page">
      <div className="px-8 py-6 border-b shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Pipeline</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Przeciagnij i upusc leady, aby zaktualizowac ich status
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-48" data-testid="select-user-filter">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Filtruj po uzytkowniku" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszyscy uzytkownicy</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Szukaj leadow..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
                data-testid="input-search-leads"
              />
            </div>
            <Button onClick={() => setAddModalOpen(true)} data-testid="button-add-lead">
              <Plus className="w-4 h-4 mr-2" />
              Dodaj lead
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-8 py-6">
        <KanbanBoard
          leads={filteredLeads}
          onLeadClick={handleLeadClick}
          onStatusChange={handleStatusChange}
        />
      </div>

      <LeadDetailModal
        lead={selectedLead}
        history={history}
        users={users}
        currentUser={currentUser as User}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onSave={handleSaveLead}
        onDelete={handleDeleteLead}
        isSaving={updateLead.isPending}
        isDeleting={deleteLead.isPending}
      />

      <AddLeadModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        users={users}
        onSubmit={handleAddLead}
        isSubmitting={createLead.isPending}
      />
    </div>
  );
}
