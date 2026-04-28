import { useState } from 'react';
import { useUsers, useCreateUser, useDeleteUser } from '@/hooks/useUsers';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Plus, Trash2, UserPlus } from 'lucide-react';
import { type User } from '@/lib/types';

interface UsersProps {
  currentUser: User;
}

export default function Users({ currentUser }: UsersProps) {
  const { data: users = [], isLoading } = useUsers();
  const createUserMutation = useCreateUser();
  const deleteUserMutation = useDeleteUser();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'SALES' as 'ADMIN' | 'SALES',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUserMutation.mutateAsync(formData);
      toast({
        title: 'Sukces',
        description: 'Uzytkownik zostal utworzony',
      });
      setDialogOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'SALES' });
    } catch (error: any) {
      toast({
        title: 'Blad',
        description: error?.message || 'Nie udalo sie utworzyc uzytkownika',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      await deleteUserMutation.mutateAsync(userId);
      toast({
        title: 'Sukces',
        description: 'Uzytkownik zostal usuniety',
      });
    } catch (error: any) {
      toast({
        title: 'Blad',
        description: error?.message || 'Nie udalo sie usunac uzytkownika',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Uzytkownicy</h1>
          <p className="text-muted-foreground">Zarzadzaj uzytkownikami systemu</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-user">
              <UserPlus className="w-4 h-4 mr-2" />
              Dodaj uzytkownika
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nowy uzytkownik</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Imie i nazwisko</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Jan Kowalski"
                  required
                  data-testid="input-user-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jan@example.com"
                  required
                  data-testid="input-user-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Haslo</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimum 6 znakow"
                  minLength={6}
                  required
                  data-testid="input-user-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Rola</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: 'ADMIN' | 'SALES') => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger data-testid="select-user-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SALES">Handlowiec</SelectItem>
                    <SelectItem value="ADMIN">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Anuluj
                </Button>
                <Button type="submit" disabled={createUserMutation.isPending} data-testid="button-submit-user">
                  {createUserMutation.isPending ? 'Tworzenie...' : 'Utworz'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Imie i nazwisko</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rola</TableHead>
                <TableHead className="w-[100px]">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                  <TableCell className="font-medium" data-testid={`text-user-name-${user.id}`}>
                    {user.name}
                  </TableCell>
                  <TableCell data-testid={`text-user-email-${user.id}`}>
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                      {user.role === 'ADMIN' ? 'Administrator' : 'Handlowiec'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.id !== currentUser.id && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            data-testid={`button-delete-user-${user.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Usunac uzytkownika?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Czy na pewno chcesz usunac uzytkownika {user.name}? Ta operacja jest nieodwracalna.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Anuluj</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(user.id)}
                              data-testid={`button-confirm-delete-${user.id}`}
                            >
                              Usun
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Brak uzytkownikow
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
