import { useState, useEffect } from 'react';
import { Send, Copy, Check, Plus, X, RefreshCw, ExternalLink, Bot, Clock, CheckCircle, AlertCircle, Loader2, MessageSquare, MessageCircle, Settings, Link2, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { 
  useTelegramBotConfig, 
  useUpdateTelegramBotConfig, 
  useTelegramPendingProducts,
  useDeleteTelegramPending 
} from '@/hooks/useTelegramBotConfig';
import { useTelegramWizardSessions } from '@/hooks/useTelegramWizardSessions';
import { useShopCategories } from '@/hooks/useShopCategories';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TelegramWizardSessionsTab } from './TelegramWizardSessionsTab';
import { TelegramChatSimulator } from './TelegramChatSimulator';

const WEBHOOK_URL = 'https://oxawvjcckmbevjztyfgp.supabase.co/functions/v1/webhook-telegram-products';

export function TelegramBotManager() {
  const { data: config, isLoading: configLoading } = useTelegramBotConfig();
  const { data: categories } = useShopCategories();
  const { data: pendingProducts, isLoading: pendingLoading, refetch: refetchPending } = useTelegramPendingProducts();
  const { data: wizardSessions } = useTelegramWizardSessions();
  const updateConfig = useUpdateTelegramBotConfig();
  const deletePending = useDeleteTelegramPending();

  const [token, setToken] = useState('');
  const [newChatId, setNewChatId] = useState('');
  const [chatIds, setChatIds] = useState<number[]>([]);
  const [categoryId, setCategoryId] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [copied, setCopied] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [testing, setTesting] = useState(false);
  const [webhookInfo, setWebhookInfo] = useState<{ url?: string; pending_update_count?: number; last_error_message?: string } | null>(null);
  const [botInfo, setBotInfo] = useState<{ username?: string; first_name?: string } | null>(null);

  useEffect(() => {
    if (config?.bot_token) {
      // Auto-load bot/webhook status once
      handleTestConnection(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.bot_token]);

  const handleRegisterWebhook = async () => {
    setRegistering(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-set-webhook');
      if (error) throw error;
      if (!data?.success) throw new Error(data?.message || 'Falha ao registrar webhook');
      setWebhookInfo(data.info);
      toast.success('Webhook registrado no Telegram com sucesso!');
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao registrar webhook');
    } finally { setRegistering(false); }
  };

  const handleTestConnection = async (silent = false) => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-test-bot');
      if (error) throw error;
      if (!data?.success) throw new Error(data?.message || 'Bot inválido');
      setBotInfo(data.bot);
      setWebhookInfo(data.webhook);
      if (!silent) toast.success(`Conectado: @${data.bot?.username}`);
    } catch (e: any) {
      if (!silent) toast.error(e?.message || 'Falha ao testar bot');
    } finally { setTesting(false); }
  };
  if (config && !initialized) {
    setToken(config.bot_token || '');
    setChatIds(config.allowed_chat_ids || []);
    setCategoryId(config.default_category_id || '');
    setIsActive(config.is_active);
    setInitialized(true);
  }

  const handleCopyWebhook = async () => {
    await navigator.clipboard.writeText(WEBHOOK_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddChatId = () => {
    const id = parseInt(newChatId);
    if (!isNaN(id) && !chatIds.includes(id)) {
      setChatIds([...chatIds, id]);
      setNewChatId('');
    }
  };

  const handleRemoveChatId = (id: number) => {
    setChatIds(chatIds.filter(c => c !== id));
  };

  const handleSave = () => {
    updateConfig.mutate({
      id: config?.id,
      bot_token: token,
      allowed_chat_ids: chatIds,
      default_category_id: categoryId || null,
      is_active: isActive,
      webhook_url: WEBHOOK_URL,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'collecting':
        return <Badge variant="outline" className="bg-[hsl(var(--shop-info)/0.1)] text-[hsl(var(--shop-info))] border-[hsl(var(--shop-info)/0.3)]"><Clock className="w-3 h-3 mr-1" />Coletando</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-[hsl(var(--shop-warning)/0.1)] text-[hsl(var(--shop-warning-text))] border-[hsl(var(--shop-warning)/0.3)]"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Processando</Badge>;
      case 'pending_approval':
        return <Badge variant="outline" className="bg-[hsl(var(--shop-warning)/0.15)] text-[hsl(var(--shop-warning-text))] border-[hsl(var(--shop-warning)/0.4)]"><AlertCircle className="w-3 h-3 mr-1" />Aguardando</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-[hsl(var(--shop-success)/0.1)] text-[hsl(var(--shop-success-text))] border-[hsl(var(--shop-success)/0.3)]"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-[hsl(var(--shop-error)/0.1)] text-[hsl(var(--shop-error))] border-[hsl(var(--shop-error)/0.3)]"><X className="w-3 h-3 mr-1" />Rejeitado</Badge>;
      case 'expired':
        return <Badge variant="outline" className="bg-[hsl(var(--shop-bg-elevated))] text-[hsl(var(--shop-text-secondary))] border-[hsl(var(--shop-border-default))]"><Clock className="w-3 h-3 mr-1" />Expirado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (configLoading) {
    return (
      <div className="flex items-center justify-center h-64 shop-card">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--shop-primary))]" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Header - compacto */}
      <div className="flex items-center gap-3 pb-4 border-b border-[hsl(var(--shop-border-default))]">
        <div className="w-10 h-10 bg-[hsl(var(--shop-primary)/0.1)] rounded-xl flex items-center justify-center flex-shrink-0">
          <Send className="w-5 h-5 text-[hsl(var(--shop-primary))]" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-[hsl(var(--shop-text-primary))] truncate">Telegram Bot</h1>
          <p className="text-sm text-[hsl(var(--shop-text-muted))] truncate">Cadastro de produtos via Telegram</p>
        </div>
      </div>

      <Tabs defaultValue="chat" className="space-y-4">
        {/* Tabs com scroll horizontal para mobile */}
        <ScrollArea className="w-full -mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6">
          <TabsList className="bg-[hsl(var(--shop-bg-elevated))] p-1 inline-flex w-max min-w-full gap-1 rounded-xl">
            <TabsTrigger value="chat" className="data-[state=active]:bg-[hsl(var(--shop-bg-card))] data-[state=active]:shadow-sm px-4 py-2.5 text-sm whitespace-nowrap flex-shrink-0 rounded-lg min-h-[40px]">
              <MessageCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>Chat</span>
            </TabsTrigger>
            <TabsTrigger value="config" className="data-[state=active]:bg-[hsl(var(--shop-bg-card))] data-[state=active]:shadow-sm px-4 py-2.5 text-sm whitespace-nowrap flex-shrink-0 rounded-lg min-h-[40px]">
              <Settings className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>Config</span>
            </TabsTrigger>
            <TabsTrigger value="sessions" className="data-[state=active]:bg-[hsl(var(--shop-bg-card))] data-[state=active]:shadow-sm px-4 py-2.5 text-sm whitespace-nowrap flex-shrink-0 rounded-lg min-h-[40px]">
              <MessageSquare className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>Sessões</span>
              {wizardSessions && wizardSessions.filter(s => s.step !== 'idle').length > 0 && (
                <Badge variant="secondary" className="ml-2 bg-[hsl(var(--shop-primary)/0.15)] text-[hsl(var(--shop-primary))] text-xs px-2 py-0.5">
                  {wizardSessions.filter(s => s.step !== 'idle').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-[hsl(var(--shop-bg-card))] data-[state=active]:shadow-sm px-4 py-2.5 text-sm whitespace-nowrap flex-shrink-0 rounded-lg min-h-[40px]">
              <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>Legado</span>
              {pendingProducts && pendingProducts.length > 0 && (
                <Badge variant="secondary" className="ml-2 bg-[hsl(var(--shop-text-muted)/0.2)] text-[hsl(var(--shop-text-secondary))] text-xs px-2 py-0.5">
                  {pendingProducts.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" className="h-1.5 opacity-0" />
        </ScrollArea>

        {/* Tab: Chat Simulator */}
        <TabsContent value="chat" className="space-y-4">
          <div className="shop-card p-4">
            <div className="flex items-center gap-3 mb-4">
              <MessageCircle className="w-5 h-5 text-[hsl(var(--shop-primary))]" />
              <h3 className="font-semibold text-[hsl(var(--shop-text-primary))]">Cadastro via Chat</h3>
              <Badge variant="outline" className="bg-[hsl(var(--shop-primary)/0.1)] text-[hsl(var(--shop-primary))] border-[hsl(var(--shop-primary)/0.3)]">
                Novo
              </Badge>
            </div>
            <p className="text-sm text-[hsl(var(--shop-text-muted))] mb-4">
              Cadastre produtos diretamente pelo computador usando a mesma experiência do Telegram.
            </p>
            <TelegramChatSimulator />
          </div>
        </TabsContent>

        {/* Tab: Configuração */}
        <TabsContent value="config" className="space-y-4">
          {/* Status Card */}
          <div className="shop-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${isActive ? 'bg-[hsl(var(--shop-success))]' : 'bg-[hsl(var(--shop-text-muted))]'}`} />
                <div>
                  <p className="font-semibold text-[hsl(var(--shop-text-primary))]">
                    {isActive ? 'Bot Ativo' : 'Bot Inativo'}
                  </p>
                  <p className="text-sm text-[hsl(var(--shop-text-muted))]">
                    {isActive ? 'O bot está pronto para receber mensagens' : 'O bot não está recebendo mensagens'}
                  </p>
                </div>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>

          {/* Token */}
          <div className="shop-card p-4 space-y-3">
            <Label htmlFor="token" className="text-[hsl(var(--shop-text-primary))] font-semibold">Token do Bot</Label>
            <PasswordInput
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Cole o token do seu bot aqui"
              className="shop-input font-mono text-sm"
            />
            <p className="text-sm text-[hsl(var(--shop-text-muted))]">
              Obtenha o token criando um bot no <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-[hsl(var(--shop-primary))] hover:underline font-medium">@BotFather</a>
            </p>
          </div>

          {/* Chat IDs */}
          <div className="shop-card p-4 space-y-3">
            <Label className="text-[hsl(var(--shop-text-primary))] font-semibold">Chat IDs Autorizados</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {chatIds.map((id) => (
                <Badge key={id} variant="secondary" className="bg-[hsl(var(--shop-bg-elevated))] text-[hsl(var(--shop-text-primary))] px-3 py-1 text-sm">
                  {id}
                  <button
                    onClick={() => handleRemoveChatId(id)}
                    className="ml-2 hover:text-[hsl(var(--shop-error))] transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              {chatIds.length === 0 && (
                <p className="text-sm text-[hsl(var(--shop-text-muted))]">Nenhum chat autorizado</p>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                value={newChatId}
                onChange={(e) => setNewChatId(e.target.value)}
                placeholder="Digite o chat_id"
                className="shop-input flex-1 min-w-0"
                onKeyDown={(e) => e.key === 'Enter' && handleAddChatId()}
              />
              <Button onClick={handleAddChatId} variant="outline" size="icon" className="shop-btn-outline flex-shrink-0 h-11 w-11 min-h-[44px]">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-[hsl(var(--shop-text-muted))]">
              💡 Envie /start para o bot para descobrir seu chat_id
            </p>
          </div>

          {/* Categoria Padrão */}
          <div className="shop-card p-4 space-y-3">
            <Label className="text-[hsl(var(--shop-text-primary))] font-semibold">Categoria Padrão</Label>
            <Select value={categoryId || ""} onValueChange={setCategoryId}>
              <SelectTrigger className="shop-input h-11">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent className="bg-[hsl(var(--shop-bg-card))] border-[hsl(var(--shop-border-default))] z-50">
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id} className="text-[hsl(var(--shop-text-primary))]">
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-[hsl(var(--shop-text-muted))]">
              Produtos cadastrados via Telegram serão adicionados nesta categoria
            </p>
          </div>

          {/* Webhook URL */}
          <div className="shop-card p-4 space-y-3">
            <Label className="text-[hsl(var(--shop-text-primary))] font-semibold">URL do Webhook</Label>
            <div className="flex gap-2">
              <Input
                value={WEBHOOK_URL}
                readOnly
                className="shop-input font-mono text-xs bg-[hsl(var(--shop-bg-elevated))] flex-1 min-w-0"
              />
              <Button onClick={handleCopyWebhook} variant="outline" size="icon" className="shop-btn-outline flex-shrink-0 h-11 w-11 min-h-[44px]">
                {copied ? <Check className="w-4 h-4 text-[hsl(var(--shop-success))]" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Webhook & Bot Status */}
          <div className="shop-card p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-[hsl(var(--shop-primary))]" />
              <Label className="text-[hsl(var(--shop-text-primary))] font-semibold">Status & Webhook</Label>
            </div>

            {botInfo && (
              <div className="flex items-center gap-2 text-sm bg-[hsl(var(--shop-success)/0.1)] text-[hsl(var(--shop-success-text))] border border-[hsl(var(--shop-success)/0.3)] rounded-lg px-3 py-2">
                <CheckCircle className="w-4 h-4" />
                Bot conectado: <strong>@{botInfo.username}</strong>
              </div>
            )}
            {webhookInfo && (
              webhookInfo.url === WEBHOOK_URL ? (
                <div className="flex items-center gap-2 text-sm bg-[hsl(var(--shop-success)/0.1)] text-[hsl(var(--shop-success-text))] border border-[hsl(var(--shop-success)/0.3)] rounded-lg px-3 py-2">
                  <CheckCircle className="w-4 h-4" /> Webhook ativo e correto
                  {typeof webhookInfo.pending_update_count === 'number' && webhookInfo.pending_update_count > 0 && (
                    <span className="ml-auto text-xs">({webhookInfo.pending_update_count} pendentes)</span>
                  )}
                </div>
              ) : (
                <div className="flex items-start gap-2 text-sm bg-[hsl(var(--shop-warning)/0.1)] text-[hsl(var(--shop-warning-text))] border border-[hsl(var(--shop-warning)/0.3)] rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                  <div className="min-w-0">
                    <p>Webhook não registrado ou aponta para outra URL.</p>
                    {webhookInfo.last_error_message && <p className="text-xs mt-1 opacity-80">Erro: {webhookInfo.last_error_message}</p>}
                  </div>
                </div>
              )
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <Button onClick={() => handleTestConnection(false)} disabled={testing || !token} variant="outline" className="shop-btn-outline h-11">
                {testing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Testar conexão
              </Button>
              <Button onClick={handleRegisterWebhook} disabled={registering || !token} className="shop-btn-primary h-11">
                {registering ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Link2 className="w-4 h-4 mr-2" />}
                Registrar webhook
              </Button>
            </div>
            <p className="text-xs text-[hsl(var(--shop-text-muted))]">
              Salve o token primeiro. "Registrar webhook" ativa o recebimento de mensagens; sem isso o Telegram não chama o bot.
            </p>
          </div>


          {/* Save Button */}
          <Button 
            onClick={handleSave} 
            className="shop-btn-primary w-full h-12 text-base font-semibold"
            disabled={updateConfig.isPending}
          >
            {updateConfig.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Salvar Configuração
          </Button>
        </TabsContent>

        {/* Tab: Sessões do Wizard */}
        <TabsContent value="sessions" className="space-y-4">
          <TelegramWizardSessionsTab />
        </TabsContent>

        {/* Tab: Pendentes (Sistema Legado) */}
        <TabsContent value="pending" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-[hsl(var(--shop-text-muted))] flex-1 min-w-0">
              Produtos aguardando aprovação ou em processamento
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetchPending()}
              disabled={pendingLoading}
              className="shop-btn-outline flex-shrink-0 h-10 min-h-[44px]"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${pendingLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>

          {pendingLoading ? (
            <div className="flex items-center justify-center h-32 shop-card">
              <Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--shop-primary))]" />
            </div>
          ) : pendingProducts && pendingProducts.length > 0 ? (
            <div className="shop-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="shop-table w-full">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Status</th>
                      <th>Fotos</th>
                      <th>Data</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingProducts.map((pending) => (
                      <tr key={pending.id}>
                        <td>
                          <div className="max-w-[150px]">
                            <p className="text-sm font-medium text-[hsl(var(--shop-text-primary))] truncate">
                              {pending.ai_parsed_data?.name || pending.raw_user_text?.slice(0, 50) || 'Sem nome'}
                            </p>
                          </div>
                        </td>
                        <td>
                          {getStatusBadge(pending.status)}
                        </td>
                        <td>
                          <Badge variant="outline" className="bg-[hsl(var(--shop-bg-elevated))]">
                            {pending.photos?.length || 0} fotos
                          </Badge>
                        </td>
                        <td className="text-sm text-[hsl(var(--shop-text-muted))] whitespace-nowrap">
                          {format(new Date(pending.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            {pending.product_id && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 min-h-[44px] min-w-[44px]"
                                asChild
                              >
                                <a href={`/shop-cms?section=products&id=${pending.product_id}`} target="_blank">
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deletePending.mutate(pending.id)}
                              className="text-[hsl(var(--shop-error))] hover:text-[hsl(var(--shop-error))] hover:bg-[hsl(var(--shop-error)/0.1)] h-8 w-8 min-h-[44px] min-w-[44px]"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="shop-card p-8 text-center">
              <Clock className="w-12 h-12 text-[hsl(var(--shop-text-muted)/0.3)] mx-auto mb-3" />
              <p className="text-[hsl(var(--shop-text-secondary))] font-medium">Nenhum produto pendente</p>
              <p className="text-sm text-[hsl(var(--shop-text-muted))] mt-1">
                Envie fotos + descrição no Telegram para cadastrar
              </p>
            </div>
          )}

          <div className="bg-[hsl(var(--shop-warning)/0.1)] border border-[hsl(var(--shop-warning)/0.3)] rounded-xl p-4">
            <p className="text-sm text-[hsl(var(--shop-warning-text))]">
              💡 Produtos podem ser aprovados respondendo "OK" diretamente no Telegram
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
