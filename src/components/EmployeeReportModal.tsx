import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BarChart3, ShoppingCart, Package, DollarSign, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { DepotEmployee } from '@/hooks/useDepotEmployees';

interface EmployeeReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: DepotEmployee | null;
}

interface EmployeeStats {
  totalSales: number;
  totalSalesValue: number;
  totalPurchases: number;
  totalPurchasesValue: number;
  totalTransactions: number;
  recentActions: { action_type: string; count: number }[];
}

export function EmployeeReportModal({ isOpen, onClose, employee }: EmployeeReportModalProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!user?.id || !employee?.employee_user_id) return;
    setLoading(true);
    try {
      // Fetch action logs summary
      const { data: logs } = await supabase
        .from('employee_action_logs')
        .select('action_type, action_detail, metadata')
        .eq('owner_user_id', user.id)
        .eq('employee_user_id', employee.employee_user_id);

      const actionLogs = logs || [];

      // Count by type
      const typeCounts: Record<string, number> = {};
      let totalSalesValue = 0;
      let totalPurchasesValue = 0;

      actionLogs.forEach(log => {
        typeCounts[log.action_type] = (typeCounts[log.action_type] || 0) + 1;
        const meta = log.metadata as Record<string, any> | null;
        if (log.action_type === 'sale_create' && meta?.total) {
          totalSalesValue += Number(meta.total) || 0;
        }
        if (log.action_type === 'purchase_create' && meta?.total) {
          totalPurchasesValue += Number(meta.total) || 0;
        }
      });

      const recentActions = Object.entries(typeCounts)
        .map(([action_type, count]) => ({ action_type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      setStats({
        totalSales: typeCounts['sale_create'] || 0,
        totalSalesValue,
        totalPurchases: typeCounts['purchase_create'] || 0,
        totalPurchasesValue,
        totalTransactions: actionLogs.length,
        recentActions,
      });
    } catch (err) {
      console.error('Erro ao buscar relatório:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, employee]);

  useEffect(() => {
    if (isOpen && employee) fetchStats();
  }, [isOpen, employee, fetchStats]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const ACTION_LABELS: Record<string, string> = {
    'sale_create': 'Vendas',
    'purchase_create': 'Compras',
    'order_create': 'Pedidos criados',
    'order_complete': 'Pedidos finalizados',
    'cash_open': 'Aberturas de caixa',
    'cash_close': 'Fechamentos de caixa',
    'login': 'Logins',
    'material_edit': 'Edições de material',
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Relatório - {employee?.name}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : stats ? (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-100">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Vendas</p>
                      <p className="text-lg font-bold">{stats.totalSales}</p>
                      <p className="text-xs text-emerald-600">{formatCurrency(stats.totalSalesValue)}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <TrendingDown className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Compras</p>
                      <p className="text-lg font-bold">{stats.totalPurchases}</p>
                      <p className="text-xs text-blue-600">{formatCurrency(stats.totalPurchasesValue)}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="col-span-2">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100">
                      <DollarSign className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total de Ações Registradas</p>
                      <p className="text-lg font-bold">{stats.totalTransactions}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Employee Info */}
              {employee && (
                <Card>
                  <CardContent className="p-4 space-y-2 text-sm">
                    <h4 className="font-medium">Informações do Funcionário</h4>
                    <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                      <span>Cargo:</span>
                      <Badge variant="outline" className="w-fit">{employee.role}</Badge>
                      {employee.salary != null && (
                        <>
                          <span>Salário:</span>
                          <span className="font-medium text-foreground">{formatCurrency(employee.salary)}</span>
                        </>
                      )}
                      {employee.work_start_time && employee.work_end_time && (
                        <>
                          <span>Expediente:</span>
                          <span>{employee.work_start_time} - {employee.work_end_time}</span>
                        </>
                      )}
                      {employee.discount_percentage != null && (
                        <>
                          <span>Desconto Máx.:</span>
                          <span>{employee.discount_percentage}%</span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Breakdown */}
              {stats.recentActions.length > 0 && (
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <h4 className="font-medium text-sm">Resumo por Tipo de Ação</h4>
                    <div className="space-y-1.5">
                      {stats.recentActions.map(({ action_type, count }) => (
                        <div key={action_type} className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">
                            {ACTION_LABELS[action_type] || action_type}
                          </span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhum dado disponível.
          </div>
        )}

        <div className="flex justify-end pt-2 border-t">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
