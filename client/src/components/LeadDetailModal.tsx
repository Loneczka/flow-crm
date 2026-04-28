import { useState } from 'react';
import { useLocation } from 'wouter';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StatusBadge } from './StatusBadge';
import { Phone, Mail, Building, Calendar, User, Clock, Edit2, Save, X, Loader2, ChevronDown, ChevronUp, FileText, Trash2 } from 'lucide-react';
import { type Lead, type LeadHistoryItem, type LeadStatus, type User as UserType } from '@/lib/types';
import { format, parseISO, isValid } from 'date-fns';

function formatContactDateForInput(contactDate: Date | string | null | undefined): string {
  if (!contactDate) return '';
  try {
    const date = typeof contactDate === 'string' ? parseISO(contactDate) : new Date(contactDate);
    if (!isValid(date)) return '';
    return format(date, "yyyy-MM-dd'T'HH:mm");
  } catch {
    return '';
  }
}

interface LeadDetailModalProps {
  lead: Lead | null;
  history: LeadHistoryItem[];
  users: UserType[];
  currentUser: UserType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (lead: Lead) => Promise<void>;
  onDelete?: (leadId: string) => Promise<void>;
  isSaving?: boolean;
  isDeleting?: boolean;
}

const STATUSES: LeadStatus[] = ['Nowy', 'W_toku', 'Wstrzymany', 'Wniosek', 'Sukces', 'Porazka'];

export function LeadDetailModal({ 
  lead, 
  history, 
  users,
  currentUser,
  open, 
  onOpenChange, 
  onSave,
  onDelete,
  isSaving = false,
  isDeleting = false,
}: LeadDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedLead, setEditedLead] = useState<Lead | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [, setLocation] = useLocation();

  if (!lead) return null;

  const isAdmin = currentUser.role === 'ADMIN';

  const currentLead = isEditing && editedLead ? editedLead : lead;
  const initials = `${currentLead.firstName[0]}${currentLead.lastName[0]}`.toUpperCase();

  const handleEdit = () => {
    setEditedLead({ ...lead });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedLead(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (editedLead) {
      try {
        await onSave(editedLead);
        setIsEditing(false);
        setEditedLead(null);
      } catch {
        // Error handled by parent, keep editing state
      }
    }
  };

  const updateField = <K extends keyof Lead>(field: K, value: Lead[K]) => {
    if (editedLead) {
      setEditedLead({ ...editedLead, [field]: value });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="text-lg font-medium bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-xl font-semibold">
                  {currentLead.firstName} {currentLead.lastName}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={currentLead.status} />
                  <span className="text-sm text-muted-foreground">{currentLead.source}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button variant="ghost" size="sm" onClick={handleCancel} data-testid="button-cancel-edit">
                    <X className="w-4 h-4 mr-1" /> Anuluj
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={isSaving} data-testid="button-save-lead">
                    {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                    Zapisz
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="default" size="sm" onClick={() => { onOpenChange(false); setLocation('/generator'); }} data-testid="button-generate-offer">
                    <FileText className="w-4 h-4 mr-1" /> Ofertuj
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleEdit} data-testid="button-edit-lead">
                    <Edit2 className="w-4 h-4 mr-1" /> Edytuj
                  </Button>
                  {isAdmin && onDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" data-testid="button-delete-lead">
                          <Trash2 className="w-4 h-4 mr-1" /> Usun
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Czy na pewno chcesz usunac tego leada?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Ta akcja jest nieodwracalna. Lead "{lead.firstName} {lead.lastName}" zostanie trwale usuniety z systemu.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-testid="button-cancel-delete">Anuluj</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(lead.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                            data-testid="button-confirm-delete"
                          >
                            {isDeleting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                            Usun
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Dane kontaktowe
            </h3>
            
            <div className="space-y-4">
              {isEditing ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Imie</Label>
                      <Input
                        id="firstName"
                        value={editedLead?.firstName || ''}
                        onChange={(e) => updateField('firstName', e.target.value)}
                        data-testid="input-first-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nazwisko</Label>
                      <Input
                        id="lastName"
                        value={editedLead?.lastName || ''}
                        onChange={(e) => updateField('lastName', e.target.value)}
                        data-testid="input-last-name"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editedLead?.email || ''}
                      onChange={(e) => updateField('email', e.target.value)}
                      data-testid="input-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      value={editedLead?.phone || ''}
                      onChange={(e) => updateField('phone', e.target.value)}
                      data-testid="input-phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="source">Zrodlo</Label>
                    <Input
                      id="source"
                      value={editedLead?.source || ''}
                      onChange={(e) => updateField('source', e.target.value)}
                      data-testid="input-source"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={editedLead?.status}
                      onValueChange={(value) => updateField('status', value as LeadStatus)}
                    >
                      <SelectTrigger data-testid="select-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assignedTo">Przypisany do</Label>
                    <Select
                      value={editedLead?.assignedToId || ''}
                      onValueChange={(value) => updateField('assignedToId', value)}
                    >
                      <SelectTrigger data-testid="select-assigned-to">
                        <SelectValue placeholder="Wybierz uzytkownika" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactDate">Data kontaktu</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="contactDate"
                        type="datetime-local"
                        value={formatContactDateForInput(editedLead?.contactDate)}
                        onChange={(e) => {
                          const value = e.target.value;
                          updateField('contactDate', value ? new Date(value) : null);
                        }}
                        className="flex-1"
                        data-testid="input-contact-date"
                      />
                      {editedLead?.contactDate && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => updateField('contactDate', null)}
                          data-testid="button-clear-contact-date"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ustaw date i godzine kontaktu - lead pojawi sie w kalendarzu
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notatki</Label>
                    <Textarea
                      id="notes"
                      value={editedLead?.notes || ''}
                      onChange={(e) => updateField('notes', e.target.value)}
                      rows={4}
                      data-testid="textarea-notes"
                    />
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                    <a href={`mailto:${currentLead.email}`} className="text-primary hover:underline">
                      {currentLead.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="font-mono">{currentLead.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Building className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>{currentLead.source}</span>
                  </div>
                  {currentLead.contactDate && (
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="font-mono">
                        {format(currentLead.contactDate, 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>
                  )}
                  {currentLead.assignedTo && (
                    <div className="flex items-center gap-3 text-sm">
                      <User className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span>Przypisany do: {currentLead.assignedTo.name}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {!isEditing && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notatki
              </h3>
              {currentLead.notes ? (
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <p className="text-sm whitespace-pre-wrap">{currentLead.notes}</p>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-muted/30 text-center">
                  <p className="text-sm text-muted-foreground">Brak notatek</p>
                </div>
              )}
            </div>
          )}

          <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-between"
                data-testid="button-toggle-history"
              >
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Historia aktywnosci ({history.length})
                </span>
                {historyOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              {history.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground">
                  <p className="text-sm">Brak aktywnosci</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />
                  <div className="space-y-3">
                    {history.map((item, index) => (
                      <div 
                        key={item.id} 
                        className={`relative pl-8 ${index % 2 === 0 ? 'bg-muted/30' : ''} py-3 pr-3 rounded-r-lg`}
                      >
                        <div className="absolute left-1.5 top-4 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">{item.userName}</p>
                            <p className="text-sm text-muted-foreground">{item.action}</p>
                          </div>
                          <span className="text-xs text-muted-foreground font-mono shrink-0">
                            {format(item.timestamp, 'MMM d, HH:mm')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </DialogContent>
    </Dialog>
  );
}
