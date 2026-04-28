import { Switch, Route } from 'wouter';
import { queryClient, getQueryFn, apiRequest } from './lib/queryClient';
import { QueryClientProvider, useQuery, useMutation } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { NotificationBell } from '@/components/NotificationBell';
import { ThemeToggle } from '@/components/ThemeToggle';
import Dashboard from '@/pages/Dashboard';
import Pipeline from '@/pages/Pipeline';
import CalendarPage from '@/pages/CalendarPage';
import Team from '@/pages/Team';
import Users from '@/pages/Users';
import Import from '@/pages/Import';
import Sources from '@/pages/Sources';
import QuickAssign from '@/pages/QuickAssign';
import Statistics from '@/pages/Statistics';
import Settings from '@/pages/Settings';
import Login from '@/pages/Login';
import NotFound from '@/pages/not-found';
import OfferGenerator from '@/pages/OfferGenerator';
import { type User, type UserRole } from '@/lib/types';
import { useLogout } from '@/hooks/useAuth';
import { useNotifications, useMarkNotificationRead } from '@/hooks/useNotifications';

function AuthenticatedApp({ user }: { user: User }) {
  const logoutMutation = useLogout();
  const { data: notifications = [] } = useNotifications();
  const markReadMutation = useMarkNotificationRead();

  const switchRoleMutation = useMutation({
    mutationFn: async (targetRole: UserRole) => {
      const response = await apiRequest('POST', '/api/user/switch-role', { targetRole });
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem('auth_token', data.token);
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
    },
  });

  const handleMarkAsRead = (id: string) => {
    markReadMutation.mutate(id);
  };

  const handleDismiss = (id: string) => {
    markReadMutation.mutate(id);
  };

  const handleMarkAllRead = () => {
    notifications.filter(n => !n.isRead).forEach(n => {
      markReadMutation.mutate(n.id);
    });
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleSwitchRole = (targetRole: UserRole) => {
    switchRoleMutation.mutate(targetRole);
  };

  const sidebarStyle = {
    '--sidebar-width': '16rem',
    '--sidebar-width-icon': '3rem',
  };

  const activeRole = user.activeRole || user.role;

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar 
          user={user} 
          onLogout={handleLogout} 
          onSwitchRole={handleSwitchRole}
          isSwitchingRole={switchRoleMutation.isPending}
        />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="h-16 flex items-center justify-between gap-4 px-4 border-b shrink-0">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell
                notifications={notifications}
                onMarkAsRead={handleMarkAsRead}
                onDismiss={handleDismiss}
                onMarkAllRead={handleMarkAllRead}
              />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Switch>
              <Route path="/">
                <Dashboard currentUser={user} />
              </Route>
              <Route path="/pipeline">
                <Pipeline currentUser={user} />
              </Route>
              <Route path="/calendar">
                <CalendarPage currentUser={user} />
              </Route>
              <Route path="/statistics">
                <Statistics currentUser={user} />
              </Route>
              {activeRole === 'ADMIN' && (
                <>
                  <Route path="/team">
                    <Team />
                  </Route>
                  <Route path="/users">
                    <Users currentUser={user} />
                  </Route>
                  <Route path="/import">
                    <Import />
                  </Route>
                  <Route path="/sources">
                    <Sources />
                  </Route>
                  <Route path="/quick-assign">
                    <QuickAssign currentUser={user} />
                  </Route>
                </>
              )}
              <Route path="/settings">
                <Settings currentUser={user} />
              </Route>
              <Route path="/generator">
                <OfferGenerator />
              </Route>
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ['/api/user'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    retry: false,
    staleTime: Infinity,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <>
      <Toaster />
      {user ? (
        <AuthenticatedApp user={user} />
      ) : (
        <Login />
      )}
    </>
  );
}

function AppWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <App />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default AppWrapper;
