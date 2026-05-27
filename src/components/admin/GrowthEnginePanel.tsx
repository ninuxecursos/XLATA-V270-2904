import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  Brain, Zap, RefreshCw, Play, Shield, RotateCcw, CheckCircle, XCircle,
  Clock, TrendingUp, Settings, BarChart3, AlertTriangle
} from 'lucide-react';

interface EngineConfig {
  id: string;
  mode: string;
  max_actions_per_day: number;
  max_rewrites_per_day: number;
  max_new_articles_per_day: number;
  protect_top5: boolean;
  protect_high_conversion: boolean;
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  run_interval_hours: number;
  total_actions_executed: number;
}

interface EngineAction {
  id: string;
  article_id: string | null;
  article_title: string;
  action_type: string;
  action_reason: string;
  priority: string;
  status: string;
  result_summary: string | null;
  error_message: string | null;
  executed_at: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-300',
  approved: 'bg-blue-500/20 text-blue-300',
  executing: 'bg-purple-500/20 text-purple-300',
  success: 'bg-emerald-500/20 text-emerald-300',
  failed: 'bg-red-500/20 text-red-300',
  rolled_back: 'bg-slate-500/20 text-slate-300',
  skipped: 'bg-slate-500/20 text-slate-400',
};

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  executing: 'Executando',
  success: 'Sucesso',
  failed: 'Falhou',
  rolled_back: 'Revertido',
  skipped: 'Ignorado',
};

const actionLabels: Record<string, string> = {
  optimize_seo: 'Otimizar SEO',
  update_content: 'Atualizar Conteúdo',
  add_cta: 'Melhorar CTAs',
  scale: 'Escalar',
  rewrite: 'Reescrever',
  regenerate: 'Regenerar',
};

const modeLabels: Record<string, string> = {
  manual: '🔒 Manual',
  semi_auto: '⚡ Semi-automático',
  auto: '🤖 Automático',
};

export const GrowthEnginePanel = () => {
  const [config, setConfig] = useState<EngineConfig | null>(null);
  const [actions, setActions] = useState<EngineAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [executing, setExecuting] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [configRes, actionsRes] = await Promise.all([
      supabase.from('growth_engine_config').select('*').single(),
      supabase.from('growth_engine_actions').select('*').order('created_at', { ascending: false }).limit(50),
    ]);
    if (configRes.data) setConfig(configRes.data as any);
    setActions((actionsRes.data || []) as any);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const updateConfig = async (updates: Partial<EngineConfig>) => {
    try {
      const { error } = await supabase.functions.invoke('growth-engine', {
        body: { action: 'update_config', updates },
      });
      if (error) throw error;
      setConfig(prev => prev ? { ...prev, ...updates } : prev);
      toast({ title: 'Configuração atualizada' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const runCycle = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('growth-engine', {
        body: { action: 'run_cycle' },
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      toast({
        title: 'Ciclo concluído',
        description: `${data.actions_created} ações sugeridas, ${data.actions_executed} executadas`,
      });
      await loadData();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setRunning(false);
    }
  };

  const handleAction = async (actionId: string, type: 'approve' | 'skip' | 'execute' | 'rollback') => {
    setExecuting(actionId);
    try {
      const actionMap: Record<string, string> = {
        approve: 'approve_action',
        skip: 'skip_action',
        execute: 'execute_action',
        rollback: 'rollback',
      };
      const { data, error } = await supabase.functions.invoke('growth-engine', {
        body: { action: actionMap[type], action_id: actionId },
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      toast({ title: type === 'rollback' ? 'Revertido' : 'Ação executada' });
      await loadData();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setExecuting(null);
    }
  };

  const todayActions = actions.filter(a => {
    const today = new Date().toISOString().split('T')[0];
    return a.created_at.startsWith(today);
  });
  const successToday = todayActions.filter(a => a.status === 'success').length;
  const pendingActions = actions.filter(a => a.status === 'pending');

  if (loading) {
    return <div className="flex items-center justify-center p-12"><RefreshCw className="h-8 w-8 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-emerald-400" />
          <div>
            <h2 className="text-xl font-bold text-white">Motor de Crescimento Autônomo</h2>
            <p className="text-sm text-slate-400">Analisa, decide e executa melhorias automaticamente</p>
          </div>
        </div>
        <Button onClick={runCycle} disabled={running} className="gap-2">
          {running ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {running ? 'Analisando...' : 'Executar Ciclo'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-white">{config?.total_actions_executed || 0}</p>
            <p className="text-xs text-slate-400">Total executadas</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{successToday}</p>
            <p className="text-xs text-slate-400">Sucesso hoje</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">{pendingActions.length}</p>
            <p className="text-xs text-slate-400">Pendentes</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 text-center">
            <Badge className={`${config?.mode === 'auto' ? 'bg-emerald-500/20 text-emerald-300' : config?.mode === 'semi_auto' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-500/20 text-slate-300'}`}>
              {modeLabels[config?.mode || 'manual']}
            </Badge>
            <p className="text-xs text-slate-400 mt-1">Modo atual</p>
          </CardContent>
        </Card>
      </div>

      {/* Config */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2 text-base">
            <Settings className="h-4 w-4" /> Configuração
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Modo de Operação</label>
              <Select value={config?.mode} onValueChange={v => updateConfig({ mode: v })}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">🔒 Manual (só sugestões)</SelectItem>
                  <SelectItem value="semi_auto">⚡ Semi-auto (precisa aprovar)</SelectItem>
                  <SelectItem value="auto">🤖 Automático (executa sozinho)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Máx ações/dia</label>
              <Select value={String(config?.max_actions_per_day)} onValueChange={v => updateConfig({ max_actions_per_day: Number(v) })}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1,2,3,5,10,15,20].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Intervalo (horas)</label>
              <Select value={String(config?.run_interval_hours)} onValueChange={v => updateConfig({ run_interval_hours: Number(v) })}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[6,12,24,48,72].map(n => <SelectItem key={n} value={String(n)}>{n}h</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <Switch checked={config?.protect_top5} onCheckedChange={v => updateConfig({ protect_top5: v })} />
              <Shield className="h-3.5 w-3.5 text-emerald-400" /> Proteger Top 5
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <Switch checked={config?.protect_high_conversion} onCheckedChange={v => updateConfig({ protect_high_conversion: v })} />
              <Shield className="h-3.5 w-3.5 text-blue-400" /> Proteger alta conversão
            </label>
          </div>
          {config?.last_run_at && (
            <p className="text-[11px] text-slate-500">
              Última execução: {new Date(config.last_run_at).toLocaleString('pt-BR')}
              {config.next_run_at && ` • Próxima: ${new Date(config.next_run_at).toLocaleString('pt-BR')}`}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Pending Actions */}
      {pendingActions.length > 0 && (
        <Card className="bg-slate-800 border-amber-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-amber-300 flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" /> Ações Pendentes ({pendingActions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingActions.map(action => (
              <div key={action.id} className="flex items-center justify-between bg-slate-700/50 rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={`text-[10px] ${action.priority === 'high' ? 'bg-red-500/20 text-red-300' : action.priority === 'medium' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-500/20 text-slate-300'}`}>
                      {action.priority}
                    </Badge>
                    <span className="text-xs text-purple-300">{actionLabels[action.action_type] || action.action_type}</span>
                  </div>
                  <p className="text-sm text-white truncate">{action.article_title}</p>
                  <p className="text-[11px] text-slate-400 truncate">{action.action_reason}</p>
                </div>
                <div className="flex gap-1 shrink-0 ml-2">
                  <Button size="sm" variant="ghost" className="h-7 text-emerald-400 hover:text-emerald-300"
                    disabled={executing === action.id}
                    onClick={() => handleAction(action.id, 'execute')}>
                    {executing === action.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-slate-400 hover:text-slate-300"
                    onClick={() => handleAction(action.id, 'skip')}>
                    <XCircle className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Action History */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-blue-400" /> Histórico de Ações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {actions.filter(a => a.status !== 'pending').slice(0, 20).map(action => (
            <div key={action.id} className="flex items-center justify-between bg-slate-700/30 rounded-lg p-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Badge className={`text-[10px] ${statusColors[action.status]}`}>
                    {statusLabels[action.status]}
                  </Badge>
                  <span className="text-[10px] text-slate-500">
                    {actionLabels[action.action_type] || action.action_type}
                  </span>
                </div>
                <p className="text-sm text-white truncate">{action.article_title}</p>
                {action.result_summary && <p className="text-[11px] text-emerald-400 truncate">{action.result_summary}</p>}
                {action.error_message && <p className="text-[11px] text-red-400 truncate">{action.error_message}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                {action.status === 'success' && (
                  <Button size="sm" variant="ghost" className="h-7 text-amber-400 hover:text-amber-300"
                    onClick={() => handleAction(action.id, 'rollback')}>
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                )}
                <span className="text-[10px] text-slate-500">
                  {new Date(action.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          ))}
          {actions.length === 0 && (
            <p className="text-center text-slate-500 py-6">Nenhuma ação registrada. Execute um ciclo.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GrowthEnginePanel;
