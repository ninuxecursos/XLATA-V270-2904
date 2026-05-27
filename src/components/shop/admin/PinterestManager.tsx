import { useState, useEffect } from 'react';
import { 
  Link as LinkIcon, Unlink, RefreshCw, Send, Settings, BarChart3, 
  CheckCircle, XCircle, Clock, ExternalLink, AlertTriangle, Eye, Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  usePinterestConfig, 
  useUpsertPinterestConfig, 
  usePinterestPinsLog, 
  usePinterestStats,
  useRepublishPin 
} from '@/hooks/usePinterestConfig';

export function PinterestManager() {
  const { data: config, isLoading } = usePinterestConfig();
  const upsertConfig = useUpsertPinterestConfig();
  const { data: pinsLog = [] } = usePinterestPinsLog();
  const { data: stats } = usePinterestStats();
  const republishPin = useRepublishPin();

  const [appId, setAppId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [defaultBoardId, setDefaultBoardId] = useState('');
  const [delayMinutes, setDelayMinutes] = useState(5);
  const [maxPins, setMaxPins] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [boards, setBoards] = useState<any[]>([]);
  const [loadingBoards, setLoadingBoards] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  useEffect(() => {
    if (config) {
      setAppId(config.app_id || '');
      setAppSecret(config.app_secret || '');
      setIsEnabled(config.is_enabled);
      setDefaultBoardId(config.default_board_id || '');
      setDelayMinutes(config.delay_minutes);
      setMaxPins(config.max_pins_per_product);
      if (Array.isArray(config.boards_cache) && config.boards_cache.length > 0) {
        setBoards(config.boards_cache);
      }
    }
  }, [config]);

  // Listen for OAuth callback
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data === 'pinterest-connected') {
        toast.success('Pinterest conectado com sucesso!');
        window.location.reload();
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const isConnected = !!config?.access_token;
  const tokenExpired = config?.token_expires_at ? new Date(config.token_expires_at) < new Date() : false;

  const handleSaveCredentials = () => {
    upsertConfig.mutate({ app_id: appId, app_secret: appSecret });
  };

  const handleConnect = async () => {
    if (!appId || !appSecret) {
      toast.error('Configure App ID e App Secret primeiro');
      return;
    }
    // Save credentials first
    await upsertConfig.mutateAsync({ app_id: appId, app_secret: appSecret });

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pinterest-oauth?action=authorize`,
      {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
        }
      }
    );
    const result = await res.json();
    if (result.url) {
      window.open(result.url, 'pinterest-oauth', 'width=600,height=700');
    } else {
      toast.error(result.error || 'Erro ao gerar URL de autorização');
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pinterest-oauth?action=test`,
        {
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
          }
        }
      );
      const data = await res.json();
      if (data.success) {
        toast.success(`Conexão OK! Usuário: ${data.username}`);
      } else {
        toast.error(data.error || 'Falha no teste de conexão');
      }
    } catch {
      toast.error('Erro ao testar conexão');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleDisconnect = async () => {
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pinterest-oauth?action=disconnect`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Content-Type': 'application/json'
        },
        body: '{}'
      }
    );
    if (res.ok) {
      toast.success('Pinterest desconectado');
      window.location.reload();
    }
  };

  const handleLoadBoards = async () => {
    setLoadingBoards(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pinterest-oauth?action=boards`,
        {
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
          }
        }
      );
      const data = await res.json();
      if (data.boards) {
        setBoards(data.boards);
        toast.success(`${data.boards.length} boards carregados`);
      } else {
        toast.error(data.error || 'Erro ao carregar boards');
      }
    } finally {
      setLoadingBoards(false);
    }
  };

  const handleSaveSettings = () => {
    upsertConfig.mutate({
      is_enabled: isEnabled,
      default_board_id: defaultBoardId || null,
      delay_minutes: delayMinutes,
      max_pins_per_product: maxPins
    });
  };

  const filteredLogs = statusFilter === 'all'
    ? pinsLog
    : pinsLog.filter(l => l.status === statusFilter);

  const statusIcon = (status: string) => {
    switch (status) {
      case 'published': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  if (isLoading) {
    return <div className="p-6 animate-pulse"><div className="h-8 bg-gray-200 rounded w-48 mb-4" /><div className="h-64 bg-gray-100 rounded" /></div>;
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Pinterest</h2>
        <p className="text-gray-500 text-sm mt-1">Integração e autopost de produtos no Pinterest</p>
      </div>

      {/* Connection Status */}
      <div className="bg-white rounded-xl border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <LinkIcon className="w-5 h-5" />
            Conexão OAuth
          </h3>
          {isConnected ? (
            <Badge className="bg-green-100 text-green-700">
              <CheckCircle className="w-3 h-3 mr-1" /> Conectado
            </Badge>
          ) : (
            <Badge variant="secondary">Desconectado</Badge>
          )}
        </div>

        {tokenExpired && isConnected && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2 text-sm text-yellow-700">
            <AlertTriangle className="w-4 h-4" />
            Token expirado. Reconecte ou aguarde refresh automático.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm text-gray-900">Pinterest App ID</Label>
            <Input value={appId} onChange={e => setAppId(e.target.value)} placeholder="Cole seu App ID" />
          </div>
          <div>
            <Label className="text-sm text-gray-900">Pinterest App Secret</Label>
            <Input value={appSecret} onChange={e => setAppSecret(e.target.value)} placeholder="Cole seu App Secret" type="password" />
          </div>
        </div>

        {/* Redirect URI */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
          <p className="font-medium text-blue-800 mb-1">Redirect URI (cole no Pinterest Developer → Configure → Redirect URIs):</p>
          <code className="text-xs bg-blue-100 px-2 py-1 rounded select-all block break-all text-blue-900">
            {import.meta.env.VITE_SUPABASE_URL}/functions/v1/pinterest-callback
          </code>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={handleSaveCredentials} disabled={upsertConfig.isPending}>
            <Save className="w-4 h-4 mr-1" /> Salvar Credenciais
          </Button>
          {!isConnected ? (
            <Button size="sm" variant="outline" onClick={handleConnect} disabled={!appId || !appSecret}>
              <LinkIcon className="w-4 h-4 mr-1" /> Conectar Pinterest
            </Button>
          ) : (
            <Button size="sm" variant="destructive" onClick={handleDisconnect}>
              <Unlink className="w-4 h-4 mr-1" /> Desconectar
            </Button>
          )}
          {isConnected && (
            <Button size="sm" variant="outline" onClick={handleTestConnection} disabled={testingConnection}>
              <RefreshCw className={`w-4 h-4 mr-1 ${testingConnection ? 'animate-spin' : ''}`} /> Testar Conexão
            </Button>
          )}
        </div>
      </div>

      {/* Autopost Settings */}
      <div className="bg-white rounded-xl border p-5 space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Configurações de Autopost
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Autopost ativo</p>
            <p className="text-xs text-gray-600">Publicar pins automaticamente ao criar produtos</p>
          </div>
          <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm text-gray-900">Board padrão</Label>
            <div className="flex gap-2">
              <Select value={defaultBoardId} onValueChange={setDefaultBoardId}>
                <SelectTrigger><SelectValue placeholder="Selecione um board" /></SelectTrigger>
                <SelectContent>
                  {boards.map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="icon" variant="outline" onClick={handleLoadBoards} disabled={!isConnected || loadingBoards}>
                <RefreshCw className={`w-4 h-4 ${loadingBoards ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Crie boards em <a href="https://www.pinterest.com" target="_blank" rel="noopener noreferrer" className="underline text-blue-600">pinterest.com</a> → Criar → Board, depois clique ⟳ para carregar</p>
          </div>
          <div>
            <Label className="text-sm text-gray-900">Delay entre posts (min)</Label>
            <Input type="number" min={1} max={60} value={delayMinutes} onChange={e => setDelayMinutes(Number(e.target.value))} />
          </div>
        </div>

        <Button size="sm" onClick={handleSaveSettings} disabled={upsertConfig.isPending}>
          <Save className="w-4 h-4 mr-1" /> Salvar Configurações
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Estatísticas de Hoje
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{stats.todayPublished}</p>
              <p className="text-xs text-gray-500">Publicados</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{stats.todayFailed}</p>
              <p className="text-xs text-gray-500">Falhas</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{stats.successRate}%</p>
              <p className="text-xs text-gray-500">Taxa Sucesso</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{stats.productsWithoutPin}</p>
              <p className="text-xs text-gray-500">Sem Pin</p>
            </div>
          </div>
        </div>
      )}

      {/* Pins History */}
      <div className="bg-white rounded-xl border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Histórico de Pins
          </h3>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="published">Publicados</SelectItem>
              <SelectItem value="failed">Falhas</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredLogs.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Nenhum pin encontrado</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredLogs.map(log => (
              <div key={log.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg text-sm">
                {statusIcon(log.status)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{log.title || 'Sem título'}</p>
                  <p className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString('pt-BR')}</p>
                  {log.error_message && (
                    <p className="text-xs text-red-500 truncate mt-0.5">{log.error_message}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  {log.pin_url && (
                    <a href={log.pin_url} target="_blank" rel="noopener noreferrer">
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </a>
                  )}
                  {log.status === 'failed' && log.product_id && (
                    <Button 
                      size="icon" variant="ghost" className="h-8 w-8"
                      onClick={() => republishPin.mutate(log.product_id!)}
                      disabled={republishPin.isPending}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${republishPin.isPending ? 'animate-spin' : ''}`} />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
