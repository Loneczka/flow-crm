import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { type User } from '@/lib/types';
import { Settings as SettingsIcon, Lock, Bell } from 'lucide-react';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Wymagane'),
  newPassword: z.string().min(6, 'Minimum 6 znakow'),
  confirmPassword: z.string().min(1, 'Wymagane'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Hasla musza byc takie same',
  path: ['confirmPassword'],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

interface SettingsProps {
  currentUser: User;
}

export default function Settings({ currentUser }: SettingsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [notificationsEnabled, setNotificationsEnabled] = useState(currentUser.notificationsEnabled ?? true);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await apiRequest('POST', '/api/user/change-password', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Haslo zmienione',
        description: 'Twoje haslo zostalo pomyslnie zmienione.',
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Blad',
        description: error.message || 'Nie udalo sie zmienic hasla.',
        variant: 'destructive',
      });
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: { notificationsEnabled: boolean }) => {
      const res = await apiRequest('PATCH', '/api/user/preferences', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: 'Zapisano',
        description: 'Preferencje zostaly zaktualizowane.',
      });
    },
    onError: () => {
      toast({
        title: 'Blad',
        description: 'Nie udalo sie zapisac preferencji.',
        variant: 'destructive',
      });
    },
  });

  const onSubmitPassword = (data: PasswordFormValues) => {
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  const handleNotificationToggle = (checked: boolean) => {
    setNotificationsEnabled(checked);
    updatePreferencesMutation.mutate({ notificationsEnabled: checked });
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-semibold" data-testid="text-settings-title">Ustawienia</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Zmiana hasla</CardTitle>
          </div>
          <CardDescription>Zmien swoje haslo dostepu do systemu</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitPassword)} className="space-y-4">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Obecne haslo</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Wpisz obecne haslo"
                        data-testid="input-current-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nowe haslo</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Wpisz nowe haslo"
                        data-testid="input-new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Potwierdz nowe haslo</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Potwierdz nowe haslo"
                        data-testid="input-confirm-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={changePasswordMutation.isPending}
                data-testid="button-change-password"
              >
                {changePasswordMutation.isPending ? 'Zapisywanie...' : 'Zmien haslo'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Powiadomienia</CardTitle>
          </div>
          <CardDescription>Zarzadzaj swoimi preferencjami powiadomien</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications" className="text-base">
                Powiadomienia o przypisanych leadach
              </Label>
              <p className="text-sm text-muted-foreground">
                Otrzymuj powiadomienia gdy zostanie Ci przypisany nowy lead
              </p>
            </div>
            <Switch
              id="notifications"
              checked={notificationsEnabled}
              onCheckedChange={handleNotificationToggle}
              disabled={updatePreferencesMutation.isPending}
              data-testid="switch-notifications"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
