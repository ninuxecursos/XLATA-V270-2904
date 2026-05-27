import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Globe, RefreshCw, AlertTriangle, CheckCircle, XCircle,
  HelpCircle, Bell, X, ExternalLink, Search, FileWarning
} from 'lucide-react';

interface IndexRecord {
  id: string;
  url: string;
  page_type: string;
  status: string;
  priority: string;
  last_checked: string | null;
  days_without_index: number;
  needs_action: boolean;
  check_attempts: number;
}

interface IndexAlert {
  id: string;
  url: string;
  alert_type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const IndexationMonitorPanel = () => {
  const [dashboard, setDashboard] = useState<any>(null);
  const [alerts, setAlerts] = useState<IndexAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [checking, setChecking] = useState(false);
  const [filter, setFilter] = useState('all');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-indexation', {
        body: { action: 'get_dashboard' },
      });
      if (!error && data) {
        setDashboard(data);
        setAlerts(data.alerts || []);
      }
    } catch (err) {
      console.error('Error fetching indexation data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const syncUrls = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-indexation', {
        body: { action: 'sync_urls' },
      });
      if (error) throw error;
      toast.success(`${data?.synced || 0} URLs sincronizadas!`);
      fetchDashboard();
    } catch (err: any) {
      toast.error('Erro ao sincronizar: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const checkIndexation = async () => {
    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-indexation', {
        body: { action: 'check_indexation' },
      });
      if (error) throw error;
      toast.success(`${data?.checked || 0} URLs verificadas!`);
      fetchDashboard();
    } catch (err: any) {
      toast.error('Erro ao verificar: ' + err.message);
    } finally {
      setChecking(false);
    }
  };

  const markAlertRead = async (id: string) => {
    await supabase.from('index_alerts').update({ is_read: true }).eq('id', id);
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'indexed':
        return <Badge className="bg-green-600 text-white"><CheckCircle className="h-3 w-3 mr-1" /> Indexada</Badge>;
      case 'not_indexed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Não Indexada</Badge>;
      default:
        return <Badge variant="outline"><HelpCircle className="h-3 w-3 mr-1" /> Desconhecido</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      blog: '📝 Blog',
      page: '📄 Página',
      local_seo: '📍 SEO Local',
    };
    return labels[type] || type;
  };

  const indexRate = parseFloat(dashboard?.rate || '0');
  const urls: IndexRecord[] = dashboard?.urls || [];

  const filteredUrls = urls.filter(u => {
    if (filter === 'all') return true;
    if (filter === 'indexed') return u.status === 'indexed';
    if (filter === 'not_indexed') return u.status === 'not_indexed';
    if (filter === 'unknown') return u.status === 'unknown';
    if (filter === 'needs_action') return u.needs_action;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Globe className="h-5 w-5 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold">{dashboard?.total || 0}</div>
            <p className="text-xs text-muted-foreground">Total URLs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <div className="text-2xl font-bold">{dashboard?.indexed || 0}</div>
            <p className="text-xs text-muted-foreground">Indexadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <XCircle className="h-5 w-5 mx-auto mb-1 text-red-500" />
            <div className="text-2xl font-bold">{dashboard?.notIndexed || 0}</div>
            <p className="text-xs text-muted-foreground">Não Indexadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <HelpCircle className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-2xl font-bold">{dashboard?.unknown || 0}</div>
            <p className="text-xs text-muted-foreground">Desconhecidas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <FileWarning className="h-5 w-5 mx-auto mb-1 text-orange-500" />
            <div className="text-2xl font-bold">{dashboard?.needsAction || 0}</div>
            <p className="text-xs text-muted-foreground">Precisam Ação</p>
          </CardContent>
        </Card>
      </div>

      {/* Indexation Rate */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Taxa de Indexação</span>
            <span className="text-sm font-bold">{dashboard?.rate || 0}%</span>
          </div>
          <Progress value={indexRate} className="h-3" />
        </CardContent>
      </Card>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bell className="h-4 w-4 text-yellow-500" />
              Alertas de Indexação ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.slice(0, 5).map(alert => (
              <div key={alert.id} className="flex justify-between items-center text-sm p-2 bg-card rounded">
                <span>{alert.message}</span>
                <Button variant="ghost" size="sm" onClick={() => markAlertRead(alert.id)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Actions & Table */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={syncUrls} disabled={syncing} size="sm" variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Sincronizando...' : 'Sincronizar URLs'}
        </Button>
        <Button onClick={checkIndexation} disabled={checking} size="sm">
          <Search className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
          {checking ? 'Verificando...' : 'Verificar Indexação'}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-1">
        {[
          { key: 'all', label: 'Todos' },
          { key: 'indexed', label: '✅ Indexadas' },
          { key: 'not_indexed', label: '❌ Não Indexadas' },
          { key: 'unknown', label: '❓ Desconhecidas' },
          { key: 'needs_action', label: '⚠️ Precisam Ação' },
        ].map(f => (
          <Button
            key={f.key}
            variant={filter === f.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* URL Table */}
      <Card>
        <CardContent className="p-0">
          {filteredUrls.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Nenhuma URL encontrada</p>
              <p className="text-sm mt-1">Clique em "Sincronizar URLs" para começar.</p>
            </div>
          ) : (
            <div className="overflow-auto max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dias s/ Index</TableHead>
                    <TableHead>Última Verificação</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUrls.map(u => (
                    <TableRow key={u.id} className={u.needs_action ? 'bg-destructive/5' : ''}>
                      <TableCell className="max-w-[300px] truncate text-xs font-mono">
                        {u.url.replace('https://xlata.site', '')}
                      </TableCell>
                      <TableCell className="text-xs">{getTypeLabel(u.page_type)}</TableCell>
                      <TableCell>{getStatusBadge(u.status)}</TableCell>
                      <TableCell>
                        {u.days_without_index > 0 ? (
                          <span className={u.days_without_index >= 7 ? 'text-red-500 font-bold' : 'text-orange-500'}>
                            {u.days_without_index}d
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {u.last_checked ? new Date(u.last_checked).toLocaleDateString('pt-BR') : 'Nunca'}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={u.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* By Type Summary */}
      {dashboard?.byType && Object.keys(dashboard.byType).length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Indexação por Tipo</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(dashboard.byType).map(([type, data]: [string, any]) => (
                <div key={type} className="p-3 bg-muted/30 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground mb-1">{getTypeLabel(type)}</p>
                  <p className="text-lg font-bold">{data.indexed}/{data.total}</p>
                  <p className="text-xs text-muted-foreground">
                    {data.total > 0 ? ((data.indexed / data.total) * 100).toFixed(0) : 0}% indexadas
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IndexationMonitorPanel;
