import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, Server, Database, Shield, Percent, Settings, BarChart3, 
  DollarSign, Users, Clock, Eye, RefreshCw, CreditCard, ArrowUpRight, ArrowDownRight, CalendarDays
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { createLogger } from '@/utils/logger';

const logger = createLogger('[Dashboard]');

interface DashboardSummaryProps {
  systemStatus: {
    serverStatus: 'online' | 'offline';
    backupStatus: 'active' | 'inactive';
    databaseStatus: 'connected' | 'disconnected';
    conversionRate: string;
    lastUpdate: string;
    systemVersion: string;
    monthlyActiveUsers: number;
    totalTransactions: number;
  };
}

interface PeriodStats {
  sales: number;
  salesCount: number;
  purchases: number;
  purchasesCount: number;
  subscriptions: number;
  subscriptionsCount: number;
  profit: number;
  accesses: number;
  newUsers: number;
}

type PeriodFilter = '1h' | '3h' | '6h' | '12h' | 'today' | '7d' | '30d' | 'custom';

const DashboardSummary: React.FC<DashboardSummaryProps> = ({ systemStatus }) => {
  const isMobile = useIsMobile();
  const [period, setPeriod] = useState<PeriodFilter>('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [stats, setStats] = useState<PeriodStats>({
    sales: 0,
    salesCount: 0,
    purchases: 0,
    purchasesCount: 0,
    subscriptions: 0,
    subscriptionsCount: 0,
    profit: 0,
    accesses: 0,
    newUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const getDateRange = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (period) {
      case '1h':
        start = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '3h':
        start = new Date(now.getTime() - 3 * 60 * 60 * 1000);
        break;
      case '6h':
        start = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        break;
      case '12h':
        start = new Date(now.getTime() - 12 * 60 * 60 * 1000);
        break;
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        break;
      case '7d':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        start = customStartDate ? new Date(customStartDate) : new Date(now.getTime() - 24 * 60 * 60 * 1000);
        end = customEndDate ? new Date(customEndDate) : now;
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    }

    return { start, end };
  }, [period, customStartDate, customEndDate]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { start, end } = getDateRange;
      const startISO = start.toISOString();
      const endISO = end.toISOString();

      // Buscar pagamentos de assinaturas aprovados no período
      const { data: approvedPayments, error: paymentsError } = await supabase
        .from('mercado_pago_payments')
        .select('id, transaction_amount, created_at, status, payer_email')
        .eq('status', 'approved')
        .gte('created_at', startISO)
        .lte('created_at', endISO);

      if (paymentsError) logger.warn('Erro ao buscar pagamentos:', paymentsError);

      // Buscar acessos (admin_access_logs de login) no período
      const { data: accessLogs, error: accessError } = await supabase
        .from('admin_access_logs')
        .select('id')
        .eq('action', 'login')
        .eq('success', true)
        .gte('created_at', startISO)
        .lte('created_at', endISO);

      if (accessError) logger.warn('Erro ao buscar acessos:', accessError);

      // Buscar novos usuários no período
      const { data: newUsersData, error: usersError } = await supabase
        .from('profiles')
        .select('id')
        .gte('created_at', startISO)
        .lte('created_at', endISO);

      if (usersError) logger.warn('Erro ao buscar novos usuários:', usersError);

      // Calcular receita de assinaturas
      const subscriptionsTotal = approvedPayments?.reduce((sum, payment) => 
        sum + (payment.transaction_amount || 0), 0) || 0;
      const subscriptionsCount = approvedPayments?.length || 0;

      setStats({
        sales: 0,
        salesCount: 0,
        purchases: 0,
        purchasesCount: 0,
        subscriptions: subscriptionsTotal,
        subscriptionsCount,
        profit: subscriptionsTotal,
        accesses: accessLogs?.length || 0,
        newUsers: newUsersData?.length || 0,
      });

      setLastRefresh(new Date());
    } catch (error) {
      logger.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [period, customStartDate, customEndDate]);

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [period]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const getPeriodLabel = (p: PeriodFilter) => {
    const labels: Record<PeriodFilter, string> = {
      '1h': 'Última hora',
      '3h': 'Últimas 3h',
      '6h': 'Últimas 6h',
      '12h': 'Últimas 12h',
      'today': 'Hoje',
      '7d': '7 dias',
      '30d': '30 dias',
      'custom': 'Personalizado'
    };
    return labels[p];
  };

  const StatCard = ({ 
    icon: Icon, 
    label, 
    value, 
    subValue, 
    subLabel,
    trend,
    color = 'emerald'
  }: { 
    icon: React.ElementType;
    label: string;
    value: string | number;
    subValue?: string | number;
    subLabel?: string;
    trend?: 'up' | 'down' | 'neutral';
    color?: 'emerald' | 'blue' | 'amber' | 'red' | 'purple';
  }) => {
    const colorClasses = {
      emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      red: 'text-red-400 bg-red-500/10 border-red-500/20',
      purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    };

    return (
      <div className={cn(
        "p-4 rounded-xl border",
        colorClasses[color]
      )}>
        <div className="flex items-center justify-between mb-2">
          <Icon className={cn("h-5 w-5", `text-${color}-400`)} />
          {trend && (
            <div className={cn(
              "flex items-center text-xs",
              trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400'
            )}>
              {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : 
               trend === 'down' ? <ArrowDownRight className="h-3 w-3" /> : null}
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
          <p className={cn("text-xl font-bold", `text-${color}-400`)}>{value}</p>
          {subValue !== undefined && (
            <p className="text-xs text-gray-500">
              {subLabel && <span className="mr-1">{subLabel}:</span>}
              {subValue}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Resumo do Sistema
          </CardTitle>
          
          {/* Period Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-gray-800/50 rounded-lg p-1">
              {(['1h', '3h', '6h', 'today', '7d'] as PeriodFilter[]).map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant={period === p ? 'default' : 'ghost'}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "h-7 px-2 text-xs",
                    period === p ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
                  )}
                >
                  {getPeriodLabel(p)}
                </Button>
              ))}
            </div>
            
            <Select value={period === 'custom' || ['12h', '30d'].includes(period) ? period : ''} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
              <SelectTrigger className="w-[130px] h-7 text-xs bg-gray-800/50 border-gray-700">
                <SelectValue placeholder="Mais opções" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12h">Últimas 12h</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="custom">Data personalizada</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={fetchStats}
              disabled={loading}
              className="h-7 px-2"
            >
              <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Custom Date Range */}
        {period === 'custom' && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400">De:</label>
              <input
                type="datetime-local"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400">Até:</label>
              <input
                type="datetime-local"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
              />
            </div>
          </div>
        )}
        
        {/* Last Update */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
          <Clock className="h-3 w-3" />
          <span>Última atualização: {lastRefresh.toLocaleTimeString('pt-BR')}</span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Main Admin Stats - Only subscription, revenue and access data */}
        <div className={cn(
          "grid gap-4",
          isMobile ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4"
        )}>
          <StatCard
            icon={CreditCard}
            label="Assinaturas Pagas"
            value={stats.subscriptionsCount}
            subValue={formatCurrency(stats.subscriptions)}
            subLabel="Receita"
            color="emerald"
            trend={stats.subscriptionsCount > 0 ? 'up' : 'neutral'}
          />
          
          <StatCard
            icon={DollarSign}
            label="Receita do Período"
            value={formatCurrency(stats.subscriptions)}
            subValue={stats.subscriptionsCount > 0 ? `${(stats.subscriptions / stats.subscriptionsCount).toFixed(2)}` : '0'}
            subLabel="Valor médio"
            color="amber"
            trend={stats.subscriptions > 0 ? 'up' : 'neutral'}
          />
          
          <StatCard
            icon={Eye}
            label="Acessos"
            value={stats.accesses}
            subValue={stats.newUsers}
            subLabel="Novos usuários"
            color="blue"
            trend={stats.accesses > 0 ? 'up' : 'neutral'}
          />
          
          <StatCard
            icon={Users}
            label="Novos Usuários"
            value={stats.newUsers}
            subValue={`${getPeriodLabel(period)}`}
            subLabel="Período"
            color="purple"
            trend={stats.newUsers > 0 ? 'up' : 'neutral'}
          />
        </div>

        {/* System Status Grid */}
        <div className={cn(
          "grid gap-6",
          isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3"
        )}>
          {/* Status do Sistema */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground border-b border-border pb-2 flex items-center gap-2">
              <Server className="h-4 w-4" />
              Status do Sistema
            </h4>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between py-1.5 px-3 bg-gray-800/30 rounded-lg">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Server className="h-3 w-3" />
                  Servidor
                </span>
                <Badge className="bg-emerald-600 text-white text-xs">Online</Badge>
              </div>
              
              <div className="flex items-center justify-between py-1.5 px-3 bg-gray-800/30 rounded-lg">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Database className="h-3 w-3" />
                  Database
                </span>
                <Badge className="bg-emerald-600 text-white text-xs">Conectado</Badge>
              </div>
              
              <div className="flex items-center justify-between py-1.5 px-3 bg-gray-800/30 rounded-lg">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Shield className="h-3 w-3" />
                  Segurança
                </span>
                <Badge className="bg-emerald-600 text-white text-xs">RBAC Ativo</Badge>
              </div>
            </div>
          </div>
          
          {/* Métricas */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground border-b border-border pb-2 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Métricas
            </h4>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between py-1.5 px-3 bg-gray-800/30 rounded-lg">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Percent className="h-3 w-3" />
                  Conversão
                </span>
                <span className="text-sm text-foreground font-medium">{systemStatus.conversionRate}</span>
              </div>
              
              <div className="flex items-center justify-between py-1.5 px-3 bg-gray-800/30 rounded-lg">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="h-3 w-3" />
                  Transações (Total)
                </span>
                <span className="text-sm text-foreground font-medium">{systemStatus.totalTransactions.toLocaleString()}</span>
              </div>
              
              <div className="flex items-center justify-between py-1.5 px-3 bg-gray-800/30 rounded-lg">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Users className="h-3 w-3" />
                  Ativos/Mês
                </span>
                <span className="text-sm text-foreground font-medium">{systemStatus.monthlyActiveUsers}</span>
              </div>
            </div>
          </div>
          
          {/* Sistema */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground border-b border-border pb-2 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Sistema
            </h4>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between py-1.5 px-3 bg-gray-800/30 rounded-lg">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Settings className="h-3 w-3" />
                  Versão
                </span>
                <span className="text-sm text-primary font-mono">{systemStatus.systemVersion}</span>
              </div>
              
              <div className="flex items-center justify-between py-1.5 px-3 bg-gray-800/30 rounded-lg">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Database className="h-3 w-3" />
                  Backup
                </span>
                <Badge className="bg-emerald-600 text-white text-xs">Ativo</Badge>
              </div>
              
              <div className="flex items-center justify-between py-1.5 px-3 bg-gray-800/30 rounded-lg">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <CalendarDays className="h-3 w-3" />
                  Última Atualização
                </span>
                <span className="text-xs text-foreground">{systemStatus.lastUpdate}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardSummary;
