import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLeads } from '@/hooks/useLeads';
import { useUsers } from '@/hooks/useUsers';
import { type User, type LeadStatus, STATUS_LABELS } from '@/lib/types';
import { Loader2, BarChart3, Filter, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { pl } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
  Cell,
} from 'recharts';

interface StatisticsProps {
  currentUser: User;
}

const FUNNEL_STATUSES: LeadStatus[] = ['Nowy', 'W_toku', 'Wniosek', 'Sukces'];
const FUNNEL_COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#22c55e'];

export default function Statistics({ currentUser }: StatisticsProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => startOfMonth(new Date()));
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  
  const { data: leads = [], isLoading: leadsLoading } = useLeads();
  const { data: users = [], isLoading: usersLoading } = useUsers();
  
  const isAdmin = (currentUser.activeRole || currentUser.role) === 'ADMIN';

  const filteredLeads = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    
    return leads.filter(lead => {
      const leadDate = lead.contactDate 
        ? new Date(lead.contactDate) 
        : (lead.createdAt ? new Date(lead.createdAt) : null);
      
      if (!leadDate) return false;
      if (leadDate < monthStart || leadDate > monthEnd) return false;
      
      if (isAdmin && selectedUserId !== 'all') {
        if (lead.assignedToId !== selectedUserId) return false;
      }
      
      if (!isAdmin) {
        if (lead.assignedToId !== currentUser.id && lead.createdById !== currentUser.id) return false;
      }
      
      return true;
    });
  }, [leads, selectedMonth, selectedUserId, isAdmin, currentUser.id]);

  const funnelData = useMemo(() => {
    return FUNNEL_STATUSES.map((status, index) => {
      const count = filteredLeads.filter(l => l.status === status).length;
      return {
        name: STATUS_LABELS[status],
        value: count,
        fill: FUNNEL_COLORS[index],
      };
    });
  }, [filteredLeads]);

  const sourceData = useMemo(() => {
    const sourceMap = new Map<string, Record<LeadStatus, number>>();
    
    filteredLeads.forEach(lead => {
      const source = lead.source || 'Nieznane';
      if (!sourceMap.has(source)) {
        sourceMap.set(source, {
          Nowy: 0,
          W_toku: 0,
          Wstrzymany: 0,
          Wniosek: 0,
          Sukces: 0,
          Porazka: 0,
        });
      }
      const counts = sourceMap.get(source)!;
      counts[lead.status]++;
    });

    return Array.from(sourceMap.entries())
      .map(([source, counts]) => ({
        source,
        ...counts,
        total: Object.values(counts).reduce((a, b) => a + b, 0),
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredLeads]);

  const handlePrevMonth = () => {
    setSelectedMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(prev => addMonths(prev, 1));
  };

  if (leadsLoading || usersLoading) {
    return (
      <div className="h-full flex items-center justify-center" data-testid="statistics-loading">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6" data-testid="statistics-page">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Statystyki</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Analiza lejka sprzedazowego i jakosci zrodel
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handlePrevMonth}
              data-testid="button-prev-month"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium px-3 min-w-32 text-center capitalize">
              {format(selectedMonth, 'LLLL yyyy', { locale: pl })}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleNextMonth}
              data-testid="button-next-month"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          {isAdmin && (
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="w-48" data-testid="select-user-filter-stats">
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
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{filteredLeads.length}</p>
              <p className="text-sm text-muted-foreground mt-1">Wszystkie leady</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {filteredLeads.filter(l => l.status === 'Sukces').length}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Sukcesy</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-600">
                {filteredLeads.filter(l => ['W_toku', 'Wniosek'].includes(l.status)).length}
              </p>
              <p className="text-sm text-muted-foreground mt-1">W trakcie</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">
                {filteredLeads.filter(l => l.status === 'Porazka').length}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Porazki</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              Lejek sprzedazowy
            </CardTitle>
          </CardHeader>
          <CardContent>
            {funnelData.every(d => d.value === 0) ? (
              <div className="h-80 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Brak danych dla wybranego okresu</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <FunnelChart>
                  <Tooltip 
                    formatter={(value: number) => [value, 'Leady']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Funnel
                    dataKey="value"
                    data={funnelData}
                    isAnimationActive
                  >
                    <LabelList 
                      position="right" 
                      fill="hsl(var(--foreground))" 
                      stroke="none" 
                      dataKey="name" 
                      fontSize={12}
                    />
                    <LabelList 
                      position="center" 
                      fill="#fff" 
                      stroke="none" 
                      dataKey="value" 
                      fontSize={14}
                      fontWeight="bold"
                    />
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Jakosc zrodel
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sourceData.length === 0 ? (
              <div className="h-80 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Brak danych dla wybranego okresu</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart 
                  data={sourceData} 
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis 
                    dataKey="source" 
                    type="category" 
                    width={75}
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="Nowy" stackId="a" fill="#3b82f6" name="Nowy" />
                  <Bar dataKey="W_toku" stackId="a" fill="#f59e0b" name="W toku" />
                  <Bar dataKey="Wniosek" stackId="a" fill="#8b5cf6" name="Wniosek" />
                  <Bar dataKey="Sukces" stackId="a" fill="#22c55e" name="Sukces" />
                  <Bar dataKey="Porazka" stackId="a" fill="#ef4444" name="Porazka" />
                  <Bar dataKey="Wstrzymany" stackId="a" fill="#94a3b8" name="Wstrzymany" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Szczegoly zrodel</CardTitle>
        </CardHeader>
        <CardContent>
          {sourceData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Brak danych dla wybranego okresu
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Zrodlo</th>
                    <th className="text-center py-3 px-4 font-medium">Nowy</th>
                    <th className="text-center py-3 px-4 font-medium">W toku</th>
                    <th className="text-center py-3 px-4 font-medium">Wniosek</th>
                    <th className="text-center py-3 px-4 font-medium">Sukces</th>
                    <th className="text-center py-3 px-4 font-medium">Porazka</th>
                    <th className="text-center py-3 px-4 font-medium">Razem</th>
                    <th className="text-center py-3 px-4 font-medium">Konwersja</th>
                  </tr>
                </thead>
                <tbody>
                  {sourceData.map((row) => {
                    const conversion = row.total > 0 ? Math.round((row.Sukces / row.total) * 100) : 0;
                    return (
                      <tr key={row.source} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">{row.source}</td>
                        <td className="text-center py-3 px-4 text-blue-600">{row.Nowy}</td>
                        <td className="text-center py-3 px-4 text-amber-600">{row.W_toku}</td>
                        <td className="text-center py-3 px-4 text-purple-600">{row.Wniosek}</td>
                        <td className="text-center py-3 px-4 text-green-600">{row.Sukces}</td>
                        <td className="text-center py-3 px-4 text-red-600">{row.Porazka}</td>
                        <td className="text-center py-3 px-4 font-semibold">{row.total}</td>
                        <td className="text-center py-3 px-4">
                          <span className={conversion >= 50 ? 'text-green-600 font-semibold' : conversion >= 25 ? 'text-amber-600' : 'text-muted-foreground'}>
                            {conversion}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
