import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Trophy, TrendingUp, Briefcase } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface TeamMemberStats {
  id: string;
  name: string;
  email: string;
  totalLeads: number;
  successLeads: number;
  failedLeads: number;
  inProgressLeads: number;
  successRate: number;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function Team() {
  const { data: teamStats, isLoading, isError, error } = useQuery<TeamMemberStats[]>({
    queryKey: ['/api/team-stats'],
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-6" data-testid="team-page-loading">
        <Skeleton className="h-8 w-64" data-testid="skeleton-title" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24" data-testid="skeleton-card-1" />
          <Skeleton className="h-24" data-testid="skeleton-card-2" />
          <Skeleton className="h-24" data-testid="skeleton-card-3" />
        </div>
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-80" data-testid="skeleton-chart-1" />
          <Skeleton className="h-80" data-testid="skeleton-chart-2" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8" data-testid="team-page-error">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium mb-2" data-testid="text-error-title">Nie mozna zaladowac statystyk zespolu</p>
              <p className="text-sm" data-testid="text-error-message">
                {(error as any)?.message || 'Wystapil blad podczas ladowania danych. Sprawdz czy masz uprawnienia administratora.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = teamStats || [];
  const totalMembers = stats.length;
  const totalLeads = stats.reduce((sum, s) => sum + s.totalLeads, 0);
  const avgSuccessRate = totalMembers > 0 
    ? Math.round(stats.reduce((sum, s) => sum + s.successRate, 0) / totalMembers) 
    : 0;

  const rankedStats = [...stats].sort((a, b) => b.successLeads - a.successLeads);

  const workloadData = stats.map(s => ({
    name: s.name.split(' ')[0],
    value: s.totalLeads,
    fullName: s.name,
  }));

  const performanceData = stats.map(s => ({
    name: s.name.split(' ')[0],
    sukces: s.successLeads,
    wToku: s.inProgressLeads,
    porazka: s.failedLeads,
    fullName: s.name,
  }));

  return (
    <div className="p-8 space-y-6" data-testid="team-page">
      <div>
        <h1 className="text-2xl font-semibold">Zespol</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Statystyki i wyniki Twojego zespolu sprzedazowego
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-total-members">{totalMembers}</p>
                <p className="text-sm text-muted-foreground">Czlonkow zespolu</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-total-leads">{totalLeads}</p>
                <p className="text-sm text-muted-foreground">Laczna liczba leadow</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-avg-success-rate">{avgSuccessRate}%</p>
                <p className="text-sm text-muted-foreground">Sredni wskaznik sukcesu</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
              Wyniki zespolu
            </CardTitle>
          </CardHeader>
          <CardContent>
            {performanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                  <YAxis className="text-xs fill-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                    labelFormatter={(label, payload) => {
                      const item = payload?.[0]?.payload;
                      return item?.fullName || label;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="sukces" name="Sukces" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="wToku" name="W toku" fill="hsl(221 83% 53%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="porazka" name="Porazka" fill="hsl(0 84% 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Brak danych do wyswietlenia
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-muted-foreground" />
              Obciazenie pracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            {workloadData.length > 0 && workloadData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={workloadData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {workloadData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                    formatter={(value, name, props) => [value, props.payload.fullName]}
                  />
                  <Legend 
                    formatter={(value, entry) => (entry.payload as any)?.fullName || value}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Brak danych do wyswietlenia
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Ranking sprzedawcow
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rankedStats.length > 0 ? (
            <div className="divide-y">
              {rankedStats.map((member, index) => {
                const initials = member.name.split(' ').map(n => n[0]).join('');
                const medal = index === 0 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
                              index === 1 ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' :
                              index === 2 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : '';
                
                return (
                  <div 
                    key={member.id} 
                    className="flex items-center gap-4 py-4" 
                    data-testid={`ranking-row-${member.id}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${medal || 'bg-muted text-muted-foreground'}`}>
                      {index + 1}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium" data-testid={`text-member-name-${member.id}`}>{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600 dark:text-green-400" data-testid={`text-success-count-${member.id}`}>
                        {member.successLeads} sukcesow
                      </p>
                      <p className="text-sm text-muted-foreground">{member.totalLeads} leadow</p>
                    </div>
                    <Badge variant={member.successRate >= 50 ? 'default' : 'secondary'}>
                      {member.successRate}%
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Brak czlonkow zespolu do wyswietlenia
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
