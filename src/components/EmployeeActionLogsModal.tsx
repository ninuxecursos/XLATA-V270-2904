import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Search, Loader2, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ActionLog {
  id: string;
  employee_user_id: string;
  employee_name: string;
  action_type: string;
  action_detail: string | null;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

interface EmployeeActionLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId?: string | null;
  employeeName?: string;
}

const ACTION_TYPE_LABELS: Record<string, string> = {
  'pdv_open': 'Abriu o PDV',
  'pdv_close': 'Fechou o PDV',
  'order_create': 'Criou pedido',
  'order_complete': 'Finalizou pedido',
  'order_cancel': 'Cancelou pedido',
  'sale_create': 'Registrou venda',
  'purchase_create': 'Registrou compra',
  'cash_open': 'Abriu caixa',
  'cash_close': 'Fechou caixa',
  'cash_add': 'Adicionou ao caixa',
  'cash_remove': 'Retirou do caixa',
  'material_edit': 'Editou material',
  'client_edit': 'Editou cliente',
  'expense_create': 'Registrou despesa',
  'login': 'Login',
  'logout': 'Logout',
};

const ACTION_TYPE_COLORS: Record<string, string> = {
  'sale_create': 'bg-emerald-100 text-emerald-800',
  'purchase_create': 'bg-blue-100 text-blue-800',
  'order_complete': 'bg-emerald-100 text-emerald-800',
  'order_cancel': 'bg-red-100 text-red-800',
  'cash_open': 'bg-amber-100 text-amber-800',
  'cash_close': 'bg-amber-100 text-amber-800',
  'login': 'bg-indigo-100 text-indigo-800',
  'logout': 'bg-gray-100 text-gray-800',
};

export function EmployeeActionLogsModal({ isOpen, onClose, employeeId, employeeName }: EmployeeActionLogsModalProps) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const fetchLogs = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      let query = supabase
        .from('employee_action_logs')
        .select('*')
        .eq('owner_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200);

      if (employeeId) {
        query = query.eq('employee_user_id', employeeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLogs((data as ActionLog[]) || []);
    } catch (err) {
      console.error('Erro ao buscar logs:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, employeeId]);

  useEffect(() => {
    if (isOpen) fetchLogs();
  }, [isOpen, fetchLogs]);

  const filteredLogs = logs.filter(log => {
    if (filterType !== 'all' && log.action_type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.employee_name.toLowerCase().includes(q) ||
        (log.action_detail && log.action_detail.toLowerCase().includes(q)) ||
        log.action_type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const uniqueActionTypes = [...new Set(logs.map(l => l.action_type))];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {employeeName ? `Logs - ${employeeName}` : 'Histórico de Ações'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar nos logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Filtrar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {uniqueActionTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {ACTION_TYPE_LABELS[type] || type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="h-[50vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhum registro encontrado.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  {!employeeId && <TableHead>Funcionário</TableHead>}
                  <TableHead>Ação</TableHead>
                  <TableHead>Detalhe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                    </TableCell>
                    {!employeeId && (
                      <TableCell className="text-sm font-medium">{log.employee_name}</TableCell>
                    )}
                    <TableCell>
                      <Badge className={`text-xs ${ACTION_TYPE_COLORS[log.action_type] || 'bg-muted text-muted-foreground'}`} variant="secondary">
                        {ACTION_TYPE_LABELS[log.action_type] || log.action_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {log.action_detail || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>

        <div className="flex justify-between items-center pt-2 border-t">
          <span className="text-xs text-muted-foreground">
            {filteredLogs.length} registro(s)
          </span>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
