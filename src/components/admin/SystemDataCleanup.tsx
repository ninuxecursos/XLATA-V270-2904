import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Trash2, FileText, Clock, ShieldOff, Bell, RefreshCw, Loader2, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const BATCH_SIZE = 5000;

interface CleanupSection {
  id: 'logs' | 'sessions' | 'ratelimits' | 'notifications';
  label: string;
  icon: React.ElementType;
  description: string;
  color: string;
  tables: string[];
}

const SECTIONS: CleanupSection[] = [
  {
    id: 'logs',
    label: 'Logs Antigos',
    icon: FileText,
    description: 'Logs de auditoria, acesso admin e ações de funcionários antigos.',
    color: 'text-blue-500',
    tables: ['audit_log', 'admin_access_logs', 'admin_audit_logs', 'employee_action_logs'],
  },
  {
    id: 'sessions',
    label: 'Sessões Expiradas',
    icon: Clock,
    description: 'Sessões inativas e presença antiga.',
    color: 'text-amber-500',
    tables: ['active_sessions', 'pdv_sessions', 'unidade_sessions', 'user_presence'],
  },
  {
    id: 'ratelimits',
    label: 'Rate Limits Expirados',
    icon: ShieldOff,
    description: 'Tentativas de rate limit expiradas.',
    color: 'text-purple-500',
    tables: ['rate_limit_attempts'],
  },
  {
    id: 'notifications',
    label: 'Notificações Lidas/Expiradas',
    icon: Bell,
    description: 'Notificações expiradas e mensagens realtime.',
    color: 'text-green-500',
    tables: [
      'admin_messages',
      'admin_message_recipients',
      'global_notifications',
      'global_notification_recipients',
      'admin_realtime_messages',
      'user_direct_messages',
    ],
  },
];

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

type ConfirmTarget =
  | { kind: 'section'; section: CleanupSection }
  | { kind: 'table'; section: CleanupSection; table: string }
  | { kind: 'all' };

export function SystemDataCleanup() {
  const { toast } = useToast();
  const [tableCounts, setTableCounts] = useState<Record<string, number>>({});
  const [tableSizes, setTableSizes] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);
  const [typedPhrase, setTypedPhrase] = useState('');
  const [retentionDays, setRetentionDays] = useState('30');

  const fetchCounts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_system_cleanup_metrics', {
        p_retention_days: parseInt(retentionDays, 10),
      });
      if (error) throw error;

      const metrics = (data || {}) as {
        counts?: Record<string, number>;
        table_counts?: Record<string, number>;
        table_sizes?: Record<string, number>;
      };

      const tCounts: Record<string, number> = {};
      Object.entries(metrics.table_counts || {}).forEach(([k, v]) => {
        tCounts[k] = Number(v ?? 0);
      });
      setTableCounts(tCounts);

      const tSizes: Record<string, number> = {};
      Object.entries(metrics.table_sizes || {}).forEach(([k, v]) => {
        tSizes[k] = Number(v ?? 0);
      });
      setTableSizes(tSizes);
    } catch (err: any) {
      console.error('Error fetching cleanup metrics:', err);
      toast({
        title: 'Erro ao carregar limpeza',
        description: err?.message || 'Não foi possível carregar os dados reais de limpeza.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [retentionDays, toast]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  const sectionCount = (s: CleanupSection) =>
    s.tables.reduce((acc, t) => acc + (tableCounts[t] ?? 0), 0);
  const sectionSize = (s: CleanupSection) =>
    s.tables.reduce((acc, t) => acc + (tableSizes[t] ?? 0), 0);

  const totalRecords = SECTIONS.reduce((acc, s) => acc + sectionCount(s), 0);
  const totalSize = SECTIONS.reduce((acc, s) => acc + sectionSize(s), 0);

  async function runDelete(target: ConfirmTarget) {
    const key =
      target.kind === 'all'
        ? 'all'
        : target.kind === 'section'
          ? target.section.id
          : `${target.section.id}::${target.table}`;
    setBusyKey(key);
    setProgress(10);
    setProgressLabel('Verificando permissões...');
    try {
      const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
      if (adminError || !isAdmin) {
        toast({
          title: '⛔ Acesso Negado',
          description: 'Somente administradores autenticados podem excluir dados do sistema.',
          variant: 'destructive',
        });
        return;
      }

      setProgress(30);
      setProgressLabel('Excluindo dados...');

      let totalDeleted = 0;
      let hasMore = true;
      let iteration = 0;
      const MAX_ITERATIONS = 50; // proteção contra loop infinito

      while (hasMore && iteration < MAX_ITERATIONS) {
        iteration += 1;
        if (target.kind === 'table') {
          const { data, error } = await supabase.rpc('cleanup_system_table', {
            p_table: target.table,
            p_retention_days: parseInt(retentionDays, 10),
            p_batch_size: BATCH_SIZE,
          } as any);
          if (error) throw error;
          totalDeleted += Number((data as any)?.total_deleted ?? 0);
          hasMore = Boolean((data as any)?.has_more);
        } else {
          const sectionId = target.kind === 'all' ? 'all' : target.section.id;
          const { data, error } = await supabase.rpc('cleanup_system_data', {
            p_section: sectionId,
            p_retention_days: parseInt(retentionDays, 10),
            p_batch_size: BATCH_SIZE,
          } as any);
          if (error) throw error;
          totalDeleted += Number((data as any)?.total_deleted ?? 0);
          hasMore = Boolean((data as any)?.has_more);
        }
        setProgressLabel(`Excluindo dados... (${totalDeleted.toLocaleString('pt-BR')} removidos)`);
        setProgress(Math.min(95, 30 + iteration * 5));
      }

      setProgress(100);
      setProgressLabel('Concluído!');
      toast({
        title: 'Limpeza concluída',
        description: `${totalDeleted.toLocaleString('pt-BR')} registros removidos com sucesso.`,
      });
      await fetchCounts();
    } catch (err: any) {
      console.error('Cleanup error:', err);
      toast({
        title: 'Erro na limpeza',
        description: err?.message || 'Ocorreu um erro.',
        variant: 'destructive',
      });
    } finally {
      setTimeout(() => {
        setBusyKey(null);
        setProgress(0);
        setProgressLabel('');
      }, 1200);
    }
  }

  const openConfirm = (target: ConfirmTarget) => {
    setConfirmTarget(target);
    setTypedPhrase('');
  };

  const targetLabel = (t: ConfirmTarget) =>
    t.kind === 'all'
      ? 'TODOS os dados temporários'
      : t.kind === 'section'
        ? t.section.label
        : `tabela ${t.table}`;

  const targetPhrase = (t: ConfirmTarget) =>
    t.kind === 'all' ? 'EXCLUIR TUDO' : t.kind === 'section' ? 'EXCLUIR' : 'CONFIRMAR';

  const confirmAndDelete = () => {
    if (!confirmTarget) return;
    const target = confirmTarget;
    setConfirmTarget(null);
    setTypedPhrase('');
    runDelete(target);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Limpeza de Sistema</h2>
          <p className="text-sm text-muted-foreground">
            Remova dados temporários e expirados com segurança.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={retentionDays} onValueChange={setRetentionDays}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Retenção" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Mais de 7 dias</SelectItem>
              <SelectItem value="15">Mais de 15 dias</SelectItem>
              <SelectItem value="30">Mais de 30 dias</SelectItem>
              <SelectItem value="60">Mais de 60 dias</SelectItem>
              <SelectItem value="90">Mais de 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchCounts} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Progress */}
      {busyKey && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm font-medium text-foreground">{progressLabel}</span>
            </div>
            <Progress value={progress} className="h-3" />
            <p className="text-xs text-muted-foreground">{progress}% concluído</p>
          </CardContent>
        </Card>
      )}

      {/* Section Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const count = sectionCount(section);
          const size = sectionSize(section);
          const sectionBusy = busyKey === section.id || busyKey === 'all';
          return (
            <Card key={section.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-muted">
                      <Icon className={`w-5 h-5 ${section.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-base text-foreground">{section.label}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {loading ? '...' : `${count.toLocaleString('pt-BR')} registros elegíveis`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {loading ? '...' : formatBytes(size)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">armazenamento total</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2 space-y-3">
                <p className="text-sm text-muted-foreground">{section.description}</p>
                {/* Per-table breakdown w/ delete buttons */}
                <div className="space-y-2">
                  {section.tables.map((t) => {
                    const tCount = tableCounts[t] ?? 0;
                    const tSize = tableSizes[t] || 0;
                    const tableKey = `${section.id}::${t}`;
                    const tableBusy = busyKey === tableKey || sectionBusy;
                    return (
                      <div
                        key={t}
                        className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-mono text-foreground truncate">{t}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {loading ? '...' : `${tCount.toLocaleString('pt-BR')} reg · ${formatBytes(tSize)}`}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                          disabled={tableBusy || tCount === 0}
                          onClick={() => openConfirm({ kind: 'table', section, table: t })}
                          title={`Excluir registros de ${t}`}
                        >
                          {busyKey === tableKey ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  disabled={sectionBusy || count === 0}
                  onClick={() => openConfirm({ kind: 'section', section })}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {sectionBusy ? 'Excluindo...' : `Excluir ${section.label}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Delete All */}
      <Card className="border-destructive/30">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-destructive/10">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Limpar Todos os Dados Temporários</h3>
                <p className="text-xs text-muted-foreground">
                  {loading
                    ? '...'
                    : `${totalRecords.toLocaleString('pt-BR')} registros · ${formatBytes(totalSize)}`}
                </p>
              </div>
            </div>
            <Button
              variant="destructive"
              disabled={!!busyKey || totalRecords === 0}
              onClick={() => openConfirm({ kind: 'all' })}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {busyKey === 'all' ? 'Excluindo...' : 'Excluir Tudo'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={!!confirmTarget}
        onOpenChange={(open) => {
          if (!open) setConfirmTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Você está prestes a excluir{' '}
              <strong>{confirmTarget ? targetLabel(confirmTarget) : ''}</strong>. Esta ação é
              irreversível.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Digite{' '}
              <strong className="text-destructive">
                {confirmTarget ? targetPhrase(confirmTarget) : ''}
              </strong>{' '}
              para confirmar:
            </p>
            <Input
              value={typedPhrase}
              onChange={(e) => setTypedPhrase(e.target.value)}
              placeholder={confirmTarget ? targetPhrase(confirmTarget) : ''}
              className="font-mono"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={!confirmTarget || typedPhrase !== targetPhrase(confirmTarget)}
              onClick={confirmAndDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
