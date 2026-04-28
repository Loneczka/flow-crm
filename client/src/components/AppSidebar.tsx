import { Link, useLocation } from 'wouter';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Kanban, 
  Calendar, 
  Users, 
  Upload, 
  Settings,
  LogOut,
  Tag,
  UserPlus,
  BarChart3,
  RefreshCw,
  FileText
} from 'lucide-react';
import { type User, type UserRole } from '@/lib/types';

interface AppSidebarProps {
  user: User | null;
  onLogout: () => void;
  onSwitchRole?: (targetRole: UserRole) => void;
  isSwitchingRole?: boolean;
}

const salesNavItems = [
  { title: 'Panel glowny', href: '/', icon: LayoutDashboard },
  { title: 'Pipeline', href: '/pipeline', icon: Kanban },
  { title: 'Kalendarz', href: '/calendar', icon: Calendar },
  { title: 'Statystyki', href: '/statistics', icon: BarChart3 },
  { title: 'Generator', href: '/generator', icon: FileText },
];

const adminNavItems = [
  { title: 'Panel glowny', href: '/', icon: LayoutDashboard },
  { title: 'Pipeline', href: '/pipeline', icon: Kanban },
  { title: 'Kalendarz', href: '/calendar', icon: Calendar },
  { title: 'Statystyki', href: '/statistics', icon: BarChart3 },
  { title: 'Generator', href: '/generator', icon: FileText },
  { title: 'Zespol', href: '/team', icon: Users },
  { title: 'Uzytkownicy', href: '/users', icon: Users },
  { title: 'Przypisanie', href: '/quick-assign', icon: UserPlus },
  { title: 'Import', href: '/import', icon: Upload },
  { title: 'Zrodla', href: '/sources', icon: Tag },
];

export function AppSidebar({ user, onLogout, onSwitchRole, isSwitchingRole }: AppSidebarProps) {
  const [location] = useLocation();
  const activeRole = user?.activeRole || user?.role || 'SALES';
  const isAdmin = activeRole === 'ADMIN';
  const navItems = isAdmin ? adminNavItems : salesNavItems;
  const initials = user?.name?.split(' ').map(n => n[0]).join('') || 'U';
  const canSwitch = user?.canSwitchToAdmin === true;

  return (
    <Sidebar data-testid="app-sidebar">
      <SidebarHeader className="h-16 flex items-center justify-center border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Kanban className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg">Flow</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Nawigacja</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.href}
                  >
                    <Link href={item.href} data-testid={`nav-link-${item.title.toLowerCase()}`}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || 'Gosc'}</p>
              <Badge variant="secondary" className="text-xs mt-0.5">
                {activeRole === 'ADMIN' ? 'Administrator' : 'Handlowiec'}
              </Badge>
            </div>
          </div>
          {canSwitch && onSwitchRole && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mb-2 gap-2"
              onClick={() => onSwitchRole(activeRole === 'ADMIN' ? 'SALES' : 'ADMIN')}
              disabled={isSwitchingRole}
              data-testid="button-switch-role"
            >
              <RefreshCw className={`w-4 h-4 ${isSwitchingRole ? 'animate-spin' : ''}`} />
              {activeRole === 'ADMIN' ? 'Widok handlowca' : 'Widok administratora'}
            </Button>
          )}
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/settings" data-testid="nav-link-settings">
                  <Settings className="w-4 h-4" />
                  <span>Ustawienia</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={onLogout} data-testid="button-logout">
                <LogOut className="w-4 h-4" />
                <span>Wyloguj</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
