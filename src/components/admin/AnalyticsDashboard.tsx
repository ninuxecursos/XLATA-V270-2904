import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  UserPlus,
  CreditCard,
  DollarSign,
  Activity,
  Eye,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Percent,
  Clock,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

interface DailyMetric {
  date: string;
  users: number;
  subscriptions: number;
  revenue: number;
  logins: number;
  transactions: number;
}

interface ConversionMetric {
  name: string;
  value: number;
  color: string;
}

export const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Metrics State
  const [totalUsers, setTotalUsers] = useState(0);
  const [newUsers, setNewUsers] = useState(0);
  const [activeSubscriptions, setActiveSubscriptions] = useState(0);
  const [trialUsers, setTrialUsers] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [conversionRate, setConversionRate] = useState(0);
  const [avgSessionTime, setAvgSessionTime] = useState(0);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [usersByPlan, setUsersByPlan] = useState<ConversionMetric[]>([]);
  const [revenueByMethod, setRevenueByMethod] = useState<ConversionMetric[]>([]);
  const [retentionRate, setRetentionRate] = useState(0);

  const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 90;

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const startDate = subDays(new Date(), periodDays);
      const endDate = new Date();

      // Fetch total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      setTotalUsers(usersCount || 0);

      // Fetch new users in period
      const { count: newUsersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());
      setNewUsers(newUsersCount || 0);

      // Fetch subscriptions
      const { data: subscriptions } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('is_active', true);
      
      const activeSubs = subscriptions?.filter(s => s.plan_type !== 'trial') || [];
      const trials = subscriptions?.filter(s => s.plan_type === 'trial') || [];
      setActiveSubscriptions(activeSubs.length);
      setTrialUsers(trials.length);

      // Calculate conversion rate (trials that became paid)
      if (usersCount && usersCount > 0) {
        setConversionRate(Math.round((activeSubs.length / usersCount) * 100));
      }

      // Fetch real revenue from payment_ledger
      const { data: payments } = await supabase
        .from('payment_ledger')
        .select('amount, created_at, status')
        .eq('status', 'approved');

      let total = 0;
      let monthly = 0;
      const monthStart = startOfMonth(new Date());

      payments?.forEach(p => {
        total += p.amount || 0;
        const createdAt = new Date(p.created_at);
        if (createdAt >= monthStart) {
          monthly += p.amount || 0;
        }
      });

      setTotalRevenue(total);
      setMonthlyRevenue(monthly);

      // Build daily metrics
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      const metrics: DailyMetric[] = [];

      // Fetch profiles for user growth
      const { data: profiles } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      // Fetch subscriptions for subscription growth
      const { data: subsData } = await supabase
        .from('user_subscriptions')
        .select('activated_at, plan_type')
        .gte('activated_at', startDate.toISOString())
        .order('activated_at', { ascending: true });

      // Fetch access logs for logins
      const { data: accessLogs } = await supabase
        .from('admin_access_logs')
        .select('created_at, action')
        .eq('action', 'login')
        .eq('success', true)
        .gte('created_at', startDate.toISOString());

      // Fetch orders for transactions
      const { data: orders } = await supabase
        .from('orders')
        .select('created_at, total')
        .gte('created_at', startDate.toISOString());

      for (const day of days) {
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);
        const dateStr = format(day, 'dd/MM', { locale: ptBR });

        const usersOnDay = profiles?.filter(p => {
          const created = new Date(p.created_at);
          return created >= dayStart && created <= dayEnd;
        }).length || 0;

        const subsOnDay = subsData?.filter(s => {
          if (!s.activated_at) return false;
          const activated = new Date(s.activated_at);
          return activated >= dayStart && activated <= dayEnd;
        }).length || 0;

        const loginsOnDay = accessLogs?.filter(l => {
          const created = new Date(l.created_at);
          return created >= dayStart && created <= dayEnd;
        }).length || 0;

        const ordersOnDay = orders?.filter(o => {
          const created = new Date(o.created_at);
          return created >= dayStart && created <= dayEnd;
        }) || [];

        const revenueOnDay = ordersOnDay.reduce((sum, o) => sum + (o.total || 0), 0);

        metrics.push({
          date: dateStr,
          users: usersOnDay,
          subscriptions: subsOnDay,
          revenue: revenueOnDay,
          logins: loginsOnDay,
          transactions: ordersOnDay.length
        });
      }

      setDailyMetrics(metrics);

      // Users by plan
      const planCounts: Record<string, number> = {};
      subscriptions?.forEach(s => {
        const plan = s.plan_type || 'unknown';
        planCounts[plan] = (planCounts[plan] || 0) + 1;
      });

      const planColors: Record<string, string> = {
        'trial': '#3B82F6',
        'mensal': '#10B981',
        'trimestral': '#8B5CF6',
        'semestral': '#F59E0B',
        'anual': '#EF4444',
        'unknown': '#6B7280'
      };

      setUsersByPlan(Object.entries(planCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: planColors[name] || '#6B7280'
      })));

      // Revenue by payment method (real data from user_subscriptions)
      const { data: subsByMethod } = await supabase
        .from('user_subscriptions')
        .select('payment_method, plan_type')
        .eq('is_active', true)
        .not('plan_type', 'eq', 'trial');

      const methodCounts: Record<string, number> = {};
      subsByMethod?.forEach(s => {
        const method = s.payment_method || 'Não informado';
        const normalizedMethod = method.toLowerCase().includes('pix') ? 'PIX' 
          : method.toLowerCase().includes('card') || method.toLowerCase().includes('cartao') || method.toLowerCase().includes('cartão') ? 'Cartão'
          : method.toLowerCase().includes('boleto') ? 'Boleto'
          : method;
        methodCounts[normalizedMethod] = (methodCounts[normalizedMethod] || 0) + 1;
      });

      const methodColors: Record<string, string> = {
        'PIX': '#10B981',
        'Cartão': '#3B82F6',
        'Boleto': '#F59E0B',
        'Não informado': '#6B7280'
      };

      const totalMethodEntries = Object.values(methodCounts).reduce((a, b) => a + b, 0) || 1;
      setRevenueByMethod(Object.entries(methodCounts).map(([name, count]) => ({
        name,
        value: Math.round((count / totalMethodEntries) * 100),
        color: methodColors[name] || '#6B7280'
      })));

      // Average session time (real data from user_presence)
      const { data: presenceData } = await supabase
        .from('user_presence')
        .select('last_seen_at, created_at')
        .gte('last_seen_at', startDate.toISOString());

      if (presenceData && presenceData.length > 0) {
        const totalMinutes = presenceData.reduce((sum, p) => {
          const start = new Date(p.created_at).getTime();
          const end = new Date(p.last_seen_at).getTime();
          return sum + Math.max(0, (end - start) / 60000);
        }, 0);
        setAvgSessionTime(Math.round(totalMinutes / presenceData.length));
      } else {
        setAvgSessionTime(0);
      }

      // Retention rate (users active in period vs total)
      const { count: activeUsersInPeriod } = await supabase
        .from('user_presence')
        .select('user_id', { count: 'exact', head: true })
        .gte('last_seen_at', startDate.toISOString());

      if (usersCount && usersCount > 0 && activeUsersInPeriod) {
        setRetentionRate(Math.min(100, Math.round((activeUsersInPeriod / usersCount) * 100)));
      } else {
        setRetentionRate(0);
      }

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  // Calculated metrics
  const userGrowth = useMemo(() => {
    if (totalUsers === 0) return 0;
    return Math.round((newUsers / totalUsers) * 100);
  }, [totalUsers, newUsers]);

  const totalLogins = useMemo(() => {
    return dailyMetrics.reduce((sum, d) => sum + d.logins, 0);
  }, [dailyMetrics]);

  const totalTransactions = useMemo(() => {
    return dailyMetrics.reduce((sum, d) => sum + d.transactions, 0);
  }, [dailyMetrics]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    color = 'blue',
    prefix = '',
    suffix = ''
  }: {
    title: string;
    value: number | string;
    change?: number;
    icon: React.ElementType;
    color?: string;
    prefix?: string;
    suffix?: string;
  }) => {
    const colorClasses: Record<string, string> = {
      blue: 'text-blue-400 bg-blue-600/20',
      green: 'text-green-400 bg-green-600/20',
      purple: 'text-purple-400 bg-purple-600/20',
      yellow: 'text-yellow-400 bg-yellow-600/20',
      red: 'text-red-400 bg-red-600/20'
    };

    return (
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold text-foreground">
                {prefix}{typeof value === 'number' ? value.toLocaleString('pt-BR') : value}{suffix}
              </p>
              {change !== undefined && (
                <div className={`flex items-center text-xs ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  <span>{Math.abs(change)}% vs período anterior</span>
                </div>
              )}
            </div>
            <div className={`p-3 rounded-full ${colorClasses[color]}`}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-400" />
            Analytics Dashboard
          </h2>
          <p className="text-muted-foreground">Métricas de uso, crescimento e conversão</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={(v: '7d' | '30d' | '90d') => setPeriod(v)}>
            <SelectTrigger className="w-40 bg-muted border-border">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchAnalytics} variant="outline" className="border-border">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-card border-border">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Activity className="h-4 w-4 mr-2" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Users className="h-4 w-4 mr-2" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="revenue" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <DollarSign className="h-4 w-4 mr-2" />
            Receita
          </TabsTrigger>
          <TabsTrigger value="engagement" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Zap className="h-4 w-4 mr-2" />
            Engajamento
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total de Usuários"
              value={totalUsers}
              change={userGrowth}
              icon={Users}
              color="blue"
            />
            <StatCard
              title="Assinaturas Ativas"
              value={activeSubscriptions}
              icon={CreditCard}
              color="green"
            />
            <StatCard
              title="Receita Total"
              value={formatCurrency(totalRevenue)}
              icon={DollarSign}
              color="green"
            />
            <StatCard
              title="Taxa de Conversão"
              value={conversionRate}
              suffix="%"
              icon={Target}
              color="purple"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Growth Chart */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                  Crescimento de Usuários
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={dailyMetrics}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Area type="monotone" dataKey="users" stroke="#3B82F6" fill="url(#colorUsers)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Subscriptions Chart */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-400" />
                  Novas Assinaturas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dailyMetrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Bar dataKey="subscriptions" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Pie Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Users by Plan */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Usuários por Plano</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <ResponsiveContainer width="50%" height={200}>
                    <PieChart>
                      <Pie
                        data={usersByPlan}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {usersByPlan.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {usersByPlan.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-muted-foreground text-sm">{item.name}</span>
                        </div>
                        <span className="text-foreground font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Revenue by Method */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Receita por Método</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <ResponsiveContainer width="50%" height={200}>
                    <PieChart>
                      <Pie
                        data={revenueByMethod}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {revenueByMethod.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {revenueByMethod.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-muted-foreground text-sm">{item.name}</span>
                        </div>
                        <span className="text-foreground font-medium">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total de Usuários" value={totalUsers} icon={Users} color="blue" />
            <StatCard title="Novos no Período" value={newUsers} change={userGrowth} icon={UserPlus} color="green" />
            <StatCard title="Em Trial" value={trialUsers} icon={Clock} color="yellow" />
            <StatCard title="Assinantes" value={activeSubscriptions} icon={CreditCard} color="purple" />
          </div>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Crescimento Diário de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={dailyMetrics}>
                  <defs>
                    <linearGradient id="colorUsersArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area type="monotone" dataKey="users" stroke="#3B82F6" fill="url(#colorUsersArea)" name="Novos Usuários" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Receita Total" value={formatCurrency(totalRevenue)} icon={DollarSign} color="green" />
            <StatCard title="Receita Mensal" value={formatCurrency(monthlyRevenue)} icon={TrendingUp} color="blue" />
            <StatCard title="Ticket Médio" value={formatCurrency(activeSubscriptions > 0 ? totalRevenue / activeSubscriptions : 0)} icon={CreditCard} color="purple" />
            <StatCard title="Conversão" value={conversionRate} suffix="%" icon={Percent} color="yellow" />
          </div>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Receita por Transações (PDV)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={dailyMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => [formatCurrency(value), 'Receita']}
                  />
                  <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} name="Receita" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Logins no Período" value={totalLogins} icon={Eye} color="blue" />
            <StatCard title="Transações" value={totalTransactions} icon={Activity} color="green" />
            <StatCard title="Tempo Médio (min)" value={avgSessionTime} icon={Clock} color="purple" />
            <StatCard title="Taxa de Retenção" value={retentionRate} suffix="%" icon={Target} color="yellow" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Logins Diários</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyMetrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Line type="monotone" dataKey="logins" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6' }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Transações Diárias</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyMetrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Bar dataKey="transactions" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
