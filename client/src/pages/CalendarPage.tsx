import { useState } from 'react';
import { CalendarView } from '@/components/CalendarView';
import { LeadDetailModal } from '@/components/LeadDetailModal';
import { TimePickerModal } from '@/components/TimePickerModal';
import { AddLeadModal } from '@/components/AddLeadModal';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type Lead, type User } from '@/lib/types';
import { useLeads, useLeadHistory, useUpdateLead, useDeleteLead, useCreateLead } from '@/hooks/useLeads';
import { useUsers } from '@/hooks/useUsers';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, Plus } from 'lucide-react';

interface CalendarPageProps {
  currentUser: User;
}

export default function CalendarPage({ currentUser }: CalendarPageProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [pendingDateChange, setPendingDateChange] = useState<{ lead: Lead; date: Date } | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const { toast } = useToast();

  const { data: leads = [], isLoading: leadsLoading } = useLeads();
  const { data: users = [], isLoading: usersLoading } = useUsers();
  const { data: history = [] } = useLeadHistory(selectedLead?.id || null);
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const createLead = useCreateLead();

  const isAdmin = (currentUser.activeRole || currentUser.role) === 'ADMIN';
  
  const baseVisibleLeads = isAdmin 
    ? leads 
    : leads.filter(l => l.assignedToId === currentUser.id || l.createdById === currentUser.id);

  const visibleLeads = isAdmin && selectedUserId !== 'all'
    ? baseVisibleLeads.filter(l => l.assignedToId === selectedUserId)
    : baseVisibleLeads;

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setDetailModalOpen(true);
  };

  const handleDateChange = (lead: Lead, newDate: Date) => {
    setPendingDateChange({ lead, date: newDate });
    setTimePickerOpen(true);
  };

  const handleTimeConfirm = async (dateWithTime: Date) => {
    if (pendingDateChange) {
      try {
        await updateLead.mutateAsync({
          id: pendingDateChange.lead.id,
          contactDate: dateWithTime,
        });
        toast({
          title: 'Sukces',
          description: 'Data kontaktu zostala zaktualizowana',
        });
      } catch (error) {
        toast({
          title: 'Blad',
          description: 'Nie udalo sie zaktualizowac daty',
          variant: 'destructive',
        });
      }
      setPendingDateChange(null);
    }
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
      setDetailModalOpen(false);
    } catch (error) {
      toast({
        title: 'Blad',
        description: 'Nie udalo sie zaktualizowac leada',
        variant: 'destructive',
      });
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

  const handleCreateLead = async (data: any) => {
    try {
      await createLead.mutateAsync(data);
      toast({
        title: 'Sukces',
        description: 'Lead zostal dodany',
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

  if (leadsLoading || usersLoading) {
    return (
      <div className="h-full flex items-center justify-center" data-testid="calendar-loading">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" data-testid="calendar-page">
      <div className="px-8 py-6 border-b shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Kalendarz</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Przegladaj i zmieniaj daty kontaktow z leadami
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-48" data-testid="select-user-filter-calendar">
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
            <Button onClick={() => setAddModalOpen(true)} data-testid="button-add-lead-calendar">
              <Plus className="w-4 h-4 mr-2" />
              Dodaj lead
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-8 py-6">
        <CalendarView
          leads={visibleLeads}
          onLeadClick={handleLeadClick}
          onDateChange={handleDateChange}
        />
      </div>

      <LeadDetailModal
        lead={selectedLead}
        history={history}
        users={users}
        currentUser={currentUser}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onSave={handleSaveLead}
        onDelete={handleDeleteLead}
        isSaving={updateLead.isPending}
        isDeleting={deleteLead.isPending}
      />

      <TimePickerModal
        open={timePickerOpen}
        onOpenChange={setTimePickerOpen}
        date={pendingDateChange?.date || new Date()}
        leadName={pendingDateChange ? `${pendingDateChange.lead.firstName} ${pendingDateChange.lead.lastName}` : ''}
        onConfirm={handleTimeConfirm}
      />

      <AddLeadModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        users={users}
        onSubmit={handleCreateLead}
        isSubmitting={createLead.isPending}
      />
    </div>
  );
}
