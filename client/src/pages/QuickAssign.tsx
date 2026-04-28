import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { type Lead, type User } from '@/lib/types';
import { UserPlus, Users, Mail, Phone, Loader2, CheckCircle, Trash2 } from 'lucide-react';
import { useDeleteLead } from '@/hooks/useLeads';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface QuickAssignProps {
  currentUser: User;
}

export default function QuickAssign({ currentUser }: QuickAssignProps) {
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [bulkAssignee, setBulkAssignee] = useState<string>('');
  const [isBulkAssigning, setIsBulkAssigning] = useState(false);
  const { toast } = useToast();

  if ((currentUser.activeRole || currentUser.role) !== 'ADMIN') {
    return (
      <div className="p-8 text-center" data-testid="access-denied">
        <p className="text-lg font-medium">Brak dostepu</p>
        <p className="text-sm text-muted-foreground mt-1">
          Ta strona jest dostepna tylko dla administratorow
        </p>
      </div>
    );
  }

  const { data: leads = [], isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ['/api/leads'],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const salesReps = users.filter(u => u.role === 'SALES');
  const unassignedLeads = leads.filter(l => !l.assignedToId);

  const assignMutation = useMutation({
    mutationFn: async ({ leadId, assigneeId }: { leadId: string; assigneeId: string }) => {
      const response = await apiRequest('PATCH', `/api/leads/${leadId}`, {
        assignedToId: assigneeId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
    },
  });

  const deleteLead = useDeleteLead();

  const handleDeleteLead = async (leadId: string) => {
    try {
      await deleteLead.mutateAsync(leadId);
      selectedLeads.delete(leadId);
      setSelectedLeads(new Set(selectedLeads));
      toast({
        title: 'Sukces',
        description: 'Lead zostal usuniety',
      });
    } catch (error) {
      toast({
        title: 'Blad',
        description: 'Nie udalo sie usunac leada',
        variant: 'destructive',
      });
    }
  };

  const handleSingleAssign = async (leadId: string, assigneeId: string) => {
    try {
      await assignMutation.mutateAsync({ leadId, assigneeId });
      toast({
        title: 'Sukces',
        description: 'Lead zostal przypisany',
      });
    } catch (error) {
      toast({
        title: 'Blad',
        description: 'Nie udalo sie przypisac leada',
        variant: 'destructive',
      });
    }
  };

  const handleBulkAssign = async () => {
    if (!bulkAssignee || selectedLeads.size === 0) return;

    setIsBulkAssigning(true);
    const leadIds = Array.from(selectedLeads);

    const results = await Promise.allSettled(
      leadIds.map(async (leadId) => {
        const response = await apiRequest('PATCH', `/api/leads/${leadId}`, {
          assignedToId: bulkAssignee,
        });
        return response.json();
      })
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failCount = results.filter(r => r.status === 'rejected').length;

    queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
    setSelectedLeads(new Set());
    setBulkAssignee('');
    setIsBulkAssigning(false);

    toast({
      title: 'Zakonczone',
      description: `Przypisano ${successCount} leadow${failCount > 0 ? `, ${failCount} nie udalo sie` : ''}`,
    });
  };

  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(leadId)) {
        newSet.delete(leadId);
      } else {
        newSet.add(leadId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedLeads.size === unassignedLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(unassignedLeads.map(l => l.id)));
    }
  };

  if (leadsLoading || usersLoading) {
    return (
      <div className="p-8 space-y-6" data-testid="quick-assign-loading">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6" data-testid="quick-assign-page">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Szybkie przypisanie</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Przypisz nieprzypisane leady do handlowcow
          </p>
        </div>
        <Badge variant="secondary" className="text-base px-3 py-1">
          {unassignedLeads.length} nieprzypisanych
        </Badge>
      </div>

      {selectedLeads.size > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-sm font-medium">
                Zaznaczono: {selectedLeads.size} leadow
              </span>
              <Select value={bulkAssignee} onValueChange={setBulkAssignee}>
                <SelectTrigger className="w-[200px]" data-testid="select-bulk-assignee">
                  <SelectValue placeholder="Wybierz handlowca" />
                </SelectTrigger>
                <SelectContent>
                  {salesReps.map(rep => (
                    <SelectItem key={rep.id} value={rep.id}>
                      {rep.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleBulkAssign}
                disabled={!bulkAssignee || isBulkAssigning}
                data-testid="button-bulk-assign"
              >
                {isBulkAssigning ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                Przypisz wszystkie
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-muted-foreground" />
              Nieprzypisane leady
            </CardTitle>
            {unassignedLeads.length > 0 && (
              <Button variant="outline" size="sm" onClick={toggleSelectAll} data-testid="button-select-all">
                {selectedLeads.size === unassignedLeads.length ? 'Odznacz wszystko' : 'Zaznacz wszystko'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {unassignedLeads.length === 0 ? (
            <div className="py-12 text-center" data-testid="empty-state">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <p className="text-lg font-medium">Wszystkie leady sa przypisane</p>
              <p className="text-sm text-muted-foreground mt-1">
                Nie ma nieprzypisanych leadow do wyswietlenia
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {unassignedLeads.map(lead => (
                <div
                  key={lead.id}
                  className="flex items-center gap-4 p-4 rounded-lg border hover-elevate"
                  data-testid={`lead-row-${lead.id}`}
                >
                  <Checkbox
                    checked={selectedLeads.has(lead.id)}
                    onCheckedChange={() => toggleLeadSelection(lead.id)}
                    data-testid={`checkbox-lead-${lead.id}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {lead.firstName} {lead.lastName}
                    </p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3 shrink-0" />
                        {lead.email}
                      </span>
                      {lead.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 shrink-0" />
                          {lead.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary">{lead.source || 'Brak zrodla'}</Badge>
                  <Select
                    onValueChange={(value) => handleSingleAssign(lead.id, value)}
                  >
                    <SelectTrigger className="w-[180px]" data-testid={`select-assign-${lead.id}`}>
                      <SelectValue placeholder="Przypisz do..." />
                    </SelectTrigger>
                    <SelectContent>
                      {salesReps.map(rep => (
                        <SelectItem key={rep.id} value={rep.id}>
                          {rep.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        data-testid={`button-delete-${lead.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Usunac lead?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Czy na pewno chcesz usunac lead {lead.firstName} {lead.lastName}? 
                          Ta operacja jest nieodwracalna.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Anuluj</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteLead(lead.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Usun
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
