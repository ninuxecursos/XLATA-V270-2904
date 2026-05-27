import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown, Users, Clock, DollarSign, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDepotEmployees } from '@/hooks/useDepotEmployees';

interface EmployeeSummary {
  employee_user_id: string;
  employee_name: string;
  total_actions: number;
  sales_count: number;
  purchases_count: number;
  sales_value: number;
  purchases_value: number;
  last_action_at: string | null;
}

export function EmployeeDashboard() {
  const { user } = useAuth();
  const { employees } = useDepotEmployees();
  const [summaries, setSummaries] = useState<EmployeeSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSummaries = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data: logs } = await supabase
        .from('employee_action_logs')
        .select('employee_user_id, employee_name, action_type, metadata, created_at')
        .eq('owner_user_id', user.id);

      const actionLogs = logs || [];

      // Group by employee
      const grouped: Record<string, EmployeeSummary> = {};
      actionLogs.forEach((log: any) => {
        const id = log.employee_user_id;
        if (!grouped[id]) {
          grouped[id] = {
            employee_user_id: id,
            employee_name: log.employee_name,
            total_actions: 0,
            sales_count: 0,
            purchases_count: 0,
            sales_value: 0,
            purchases_value: 0,
            last_action_at: null,
          };
        }
        const s = grouped[id];
        s.total_actions++;

        if (log.action_type === 'sale_create') {
          s.sales_count++;
          s.sales_value += Number((log.metadata as any)?.total) || 0;
        }
        if (log.action_type === 'purchase_create') {
          s.purchases_count++;
          s.purchases_value += Number((log.metadata as any)?.total) || 0;
        }

        if (!s.last_action_at || log.created_at > s.last_action_at) {
          s.last_action_at = log.created_at;
        }
      });

      // Include employees with no logs
      employees.forEach(emp => {
        if (emp.employee_user_id && !grouped[emp.employee_user_id]) {
          grouped[emp.employee_user_id] = {
            employee_user_id: emp.employee_user_id,
            employee_name: emp.name,
            total_actions: 0,
            sales_count: 0,
            purchases_count: 0,
            sales_value: 0,
            purchases_value: 0,
            last_action_at: null,
          };
        }
      });

      setSummaries(Object.values(grouped).sort((a, b) => b.total_actions - a.total_actions));
    } catch (err) {
      console.error('Erro ao buscar métricas:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, employees]);

  useEffect(() => {
    fetchSummaries();
  }, [fetchSummaries]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const totalSales = summaries.reduce((acc, s) => acc + s.sales_value, 0);
  const totalPurchases = summaries.reduce((acc, s) => acc + s.purchases_value, 0);
  const totalActions = summaries.reduce((acc, s) => acc + s.total_actions, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Users className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Funcionários</p>
              <p className="text-xl font-bold">{summaries.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Activity className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Ações</p>
              <p className="text-xl font-bold">{totalActions}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Vendas Total</p>
              <p className="text-lg font-bold">{formatCurrency(totalSales)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <TrendingDown className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Compras Total</p>
              <p className="text-lg font-bold">{formatCurrency(totalPurchases)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Cards */}
      {summaries.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Nenhum dado de funcionário disponível ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summaries.map((summary) => {
            const emp = employees.find(e => e.employee_user_id === summary.employee_user_id);
            return (
              <Card key={summary.employee_user_id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>{summary.employee_name}</span>
                    {emp && (
                      <Badge variant="outline" className="text-xs">{emp.role}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-muted/50 rounded p-2">
                      <p className="text-lg font-bold">{summary.sales_count}</p>
                      <p className="text-[10px] text-muted-foreground">Vendas</p>
                    </div>
                    <div className="bg-muted/50 rounded p-2">
                      <p className="text-lg font-bold">{summary.purchases_count}</p>
                      <p className="text-[10px] text-muted-foreground">Compras</p>
                    </div>
                    <div className="bg-muted/50 rounded p-2">
                      <p className="text-lg font-bold">{summary.total_actions}</p>
                      <p className="text-[10px] text-muted-foreground">Ações</p>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-emerald-600" />
                      {formatCurrency(summary.sales_value)}
                    </span>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <TrendingDown className="h-3 w-3 text-blue-600" />
                      {formatCurrency(summary.purchases_value)}
                    </span>
                  </div>
                  {emp && (
                    <div className="flex gap-3 text-xs text-muted-foreground border-t pt-2">
                      {emp.salary != null && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {formatCurrency(emp.salary)}
                        </span>
                      )}
                      {emp.work_start_time && emp.work_end_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {emp.work_start_time}-{emp.work_end_time}
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
