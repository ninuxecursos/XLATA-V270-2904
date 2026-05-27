import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CreditCard, 
  Wallet, 
  Settings, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Save, 
  RefreshCw,
  AlertCircle,
  Copy,
  ExternalLink,
  Bell,
  History,
  Wifi,
  WifiOff,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PaymentConfig {
  id: string;
  gateway_name: string;
  is_active: boolean;
  environment: 'sandbox' | 'production';
  public_key: string | null;
  pix_enabled: boolean;
  card_enabled: boolean;
  max_installments: number;
  min_installment_value: number;
  notification_email: string | null;
  notify_on_approval: boolean;
  notify_on_failure: boolean;
  webhook_url: string | null;
  last_test_at: string | null;
  last_test_status: string | null;
  access_token_configured: boolean;
  webhook_secret_configured: boolean;
  created_at: string;
  updated_at: string;
}

interface RecentPayment {
  id: string;
  status: string;
  transaction_amount: number;
  payer_email: string;
  created_at: string;
  payment_method_id: string | null;
}

interface ConnectionTestResult {
  success: boolean;
  message: string;
  environment?: 'sandbox' | 'production';
  payment_methods?: Array<{
    id: string;
    name: string;
    payment_type_id: string;
    status: string;
    thumbnail: string;
  }>;
  account_info?: {
    id: number;
    email: string;
    site_id: string;
  };
  error_code?: string;
  timestamp: string;
}

export const PaymentGatewayConfig: React.FC = () => {
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingToken, setSavingToken] = useState(false);
  const [savingWebhookSecret, setSavingWebhookSecret] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [accessToken, setAccessToken] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const { toast } = useToast();

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_gateway_config')
        .select('id, gateway_name, is_active, environment, public_key, pix_enabled, card_enabled, max_installments, min_installment_value, notification_email, notify_on_approval, notify_on_failure, webhook_url, last_test_at, last_test_status, access_token_configured, webhook_secret_configured, created_at, updated_at')
        .eq('gateway_name', 'mercado_pago')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setConfig(data as PaymentConfig);
      }
    } catch (error) {
      console.error('Erro ao buscar configuração:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as configurações de pagamento.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('mercado_pago_payments')
        .select('id, status, transaction_amount, payer_email, created_at, payment_method_id')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentPayments((data || []) as RecentPayment[]);
    } catch (error) {
      console.error('Erro ao buscar pagamentos recentes:', error);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchRecentPayments();
  }, []);

  const handleSave = async () => {
    if (!config) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('payment_gateway_config')
        .update({
          is_active: config.is_active,
          environment: config.environment,
          public_key: config.public_key,
          pix_enabled: config.pix_enabled,
          card_enabled: config.card_enabled,
          max_installments: config.max_installments,
          min_installment_value: config.min_installment_value,
          notification_email: config.notification_email,
          notify_on_approval: config.notify_on_approval,
          notify_on_failure: config.notify_on_failure
        })
        .eq('id', config.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Configurações salvas com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as configurações.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAccessToken = async () => {
    if (!config || !accessToken.trim()) {
      toast({
        title: 'Atenção',
        description: 'Digite o Access Token antes de salvar.',
        variant: 'destructive'
      });
      return;
    }

    // Validate token format
    if (!accessToken.startsWith('APP_USR-') && !accessToken.startsWith('TEST-')) {
      toast({
        title: 'Formato inválido',
        description: 'O Access Token deve começar com APP_USR- ou TEST-',
        variant: 'destructive'
      });
      return;
    }

    setSavingToken(true);
    try {
      const { error } = await supabase
        .from('payment_gateway_config')
        .update({
          access_token_encrypted: accessToken.trim(),
          access_token_configured: true
        })
        .eq('id', config.id);

      if (error) throw error;

      setConfig({ ...config, access_token_configured: true });
      setAccessToken('');
      
      toast({
        title: 'Sucesso',
        description: 'Access Token salvo com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao salvar token:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o Access Token.',
        variant: 'destructive'
      });
    } finally {
      setSavingToken(false);
    }
  };

  const handleSaveWebhookSecret = async () => {
    if (!config || !webhookSecret.trim()) {
      toast({
        title: 'Atenção',
        description: 'Digite a Assinatura Secreta antes de salvar.',
        variant: 'destructive'
      });
      return;
    }

    setSavingWebhookSecret(true);
    try {
      const { error } = await supabase
        .from('payment_gateway_config')
        .update({
          webhook_secret: webhookSecret.trim(),
          webhook_secret_configured: true
        })
        .eq('id', config.id);

      if (error) throw error;

      setConfig({ ...config, webhook_secret_configured: true });
      setWebhookSecret('');
      
      toast({
        title: 'Sucesso',
        description: 'Assinatura Secreta salva com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao salvar assinatura:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a Assinatura Secreta.',
        variant: 'destructive'
      });
    } finally {
      setSavingWebhookSecret(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config) return;

    setTesting(true);
    setTestResult(null);
    
    try {
      console.log('🔍 Testing Mercado Pago connection via Edge Function...');
      
      const { data, error } = await supabase.functions.invoke('test-payment-connection', {
        method: 'POST'
      });

      if (error) {
        throw new Error(error.message);
      }

      const result = data as ConnectionTestResult;
      setTestResult(result);

      // Update local config with new test status
      setConfig(prev => prev ? {
        ...prev,
        last_test_at: result.timestamp,
        last_test_status: result.success ? 'success' : 'failed'
      } : null);

      if (result.success) {
        toast({
          title: '✅ Conexão Estabelecida!',
          description: `${result.message} Ambiente: ${result.environment === 'production' ? 'Produção' : 'Sandbox'}`
        });
      } else {
        toast({
          title: '❌ Falha na Conexão',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro no teste de conexão:', error);
      setTestResult({
        success: false,
        message: `Erro ao testar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        error_code: 'NETWORK_ERROR',
        timestamp: new Date().toISOString()
      });
      toast({
        title: 'Erro',
        description: 'Falha ao testar conexão com Mercado Pago.',
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  const copyWebhookUrl = () => {
    if (config?.webhook_url) {
      navigator.clipboard.writeText(config.webhook_url);
      toast({
        title: 'Copiado!',
        description: 'URL do webhook copiada para a área de transferência.'
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      approved: { label: 'Aprovado', className: 'bg-emerald-600' },
      pending: { label: 'Pendente', className: 'bg-amber-600' },
      rejected: { label: 'Recusado', className: 'bg-destructive' },
      cancelled: { label: 'Cancelado', className: 'bg-muted' }
    };
    const config = statusConfig[status] || { label: status, className: 'bg-muted' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!config) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Configuração de pagamento não encontrada.</p>
          <Button onClick={fetchConfig} variant="outline" className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Configuração de Pagamentos</h2>
          <p className="text-muted-foreground">Gerencie suas integrações de pagamento</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleTestConnection} variant="outline" disabled={testing}>
            {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Testar Conexão
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Configurações
          </Button>
        </div>
      </div>

      <Tabs defaultValue="mercadopago" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="mercadopago">Mercado Pago</TabsTrigger>
          <TabsTrigger value="methods">Métodos</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="mercadopago" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Credenciais do Mercado Pago
              </CardTitle>
              <CardDescription>
                Configure suas credenciais de integração com o Mercado Pago
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  {config.is_active ? (
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  <div>
                    <p className="font-medium text-foreground">
                      Gateway {config.is_active ? 'Ativo' : 'Inativo'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {config.last_test_at 
                        ? `Último teste: ${formatDate(config.last_test_at)} - ${config.last_test_status === 'success' ? 'OK' : 'Falhou'}`
                        : 'Nunca testado'
                      }
                    </p>
                  </div>
                </div>
                <Switch
                  checked={config.is_active}
                  onCheckedChange={(checked) => setConfig({ ...config, is_active: checked })}
                />
              </div>

              {/* Connection Test Result */}
              {testResult && (
                <div className={`p-4 rounded-lg border ${
                  testResult.success 
                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                    : 'bg-destructive/10 border-destructive/30'
                }`}>
                  <div className="flex items-start gap-3">
                    {testResult.success ? (
                      <Wifi className="h-5 w-5 text-emerald-500 mt-0.5" />
                    ) : (
                      <WifiOff className="h-5 w-5 text-destructive mt-0.5" />
                    )}
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className={`font-medium ${testResult.success ? 'text-emerald-400' : 'text-destructive'}`}>
                          {testResult.success ? 'Conexão Válida' : 'Falha na Conexão'}
                        </p>
                        <p className="text-sm text-muted-foreground">{testResult.message}</p>
                      </div>
                      
                      {testResult.account_info && (
                        <div className="p-3 bg-background/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Conta Mercado Pago</p>
                          <p className="text-sm text-foreground">
                            ID: {testResult.account_info.id} | {testResult.account_info.email}
                          </p>
                          <Badge className="mt-2" variant={testResult.environment === 'production' ? 'default' : 'secondary'}>
                            {testResult.environment === 'production' ? '🔴 Produção' : '🟡 Sandbox'}
                          </Badge>
                        </div>
                      )}

                      {testResult.payment_methods && testResult.payment_methods.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Activity className="h-3 w-3" />
                            {testResult.payment_methods.length} métodos de pagamento disponíveis
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {testResult.payment_methods.slice(0, 8).map((method) => (
                              <div 
                                key={method.id}
                                className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded text-xs"
                              >
                                {method.thumbnail && (
                                  <img 
                                    src={method.thumbnail} 
                                    alt={method.name} 
                                    className="h-4 w-auto"
                                  />
                                )}
                                <span className="text-foreground">{method.name}</span>
                              </div>
                            ))}
                            {testResult.payment_methods.length > 8 && (
                              <span className="text-xs text-muted-foreground px-2 py-1">
                                +{testResult.payment_methods.length - 8} mais
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {testResult.error_code && (
                        <p className="text-xs text-muted-foreground">
                          Código: {testResult.error_code}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Environment */}
              <div className="space-y-2">
                <Label>Ambiente</Label>
                <Select
                  value={config.environment}
                  onValueChange={(value: 'sandbox' | 'production') => 
                    setConfig({ ...config, environment: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-amber-600/20 text-amber-400 border-amber-600">
                          Sandbox
                        </Badge>
                        Ambiente de testes
                      </div>
                    </SelectItem>
                    <SelectItem value="production">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-emerald-600/20 text-emerald-400 border-emerald-600">
                          Produção
                        </Badge>
                        Ambiente real
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Use Sandbox para testes e Produção para pagamentos reais.
                </p>
              </div>

              {/* Public Key */}
              <div className="space-y-2">
                <Label>Chave Pública (Public Key)</Label>
                <Input
                  value={config.public_key || ''}
                  onChange={(e) => setConfig({ ...config, public_key: e.target.value })}
                  placeholder="APP_USR-xxxxxxxx ou TEST-xxxxxxxx"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Encontre em{' '}
                  <a 
                    href="https://www.mercadopago.com.br/developers/panel/app" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Mercado Pago Developers
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              </div>

              {/* Webhook URL */}
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={config.webhook_url || ''}
                    readOnly
                    className="font-mono text-sm bg-muted/30"
                  />
                  <Button variant="outline" size="icon" onClick={copyWebhookUrl}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Configure esta URL nas{' '}
                  <a 
                    href="https://www.mercadopago.com.br/developers/panel/app" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    configurações de webhook
                  </a>
                  {' '}do Mercado Pago.
                </p>
              </div>

              {/* Access Token Section */}
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${config.access_token_configured ? 'bg-emerald-500' : 'bg-destructive'}`} />
                    <div>
                      <p className="font-medium text-foreground">Access Token (Chave Secreta)</p>
                      <p className="text-sm text-muted-foreground">
                        {config.access_token_configured 
                          ? 'Token configurado e ativo' 
                          : 'Token não configurado'}
                      </p>
                    </div>
                  </div>
                  {config.access_token_configured && (
                    <Badge className="bg-emerald-600">Configurado</Badge>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>
                    {config.access_token_configured ? 'Atualizar Access Token' : 'Inserir Access Token'}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      placeholder="APP_USR-xxxxxxxx ou TEST-xxxxxxxx"
                      className="font-mono text-sm"
                    />
                    <Button 
                      onClick={handleSaveAccessToken} 
                      disabled={savingToken || !accessToken.trim()}
                      variant={config.access_token_configured ? 'outline' : 'default'}
                    >
                      {savingToken ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Encontre seu Access Token em{' '}
                    <a 
                      href="https://www.mercadopago.com.br/developers/panel/app" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Mercado Pago Developers → Credenciais
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                </div>

                <div className="p-3 bg-amber-600/10 border border-amber-600/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-amber-400">Segurança:</strong> O token é armazenado de forma segura no banco de dados e nunca é exibido após salvo.
                  </p>
                </div>
              </div>

              {/* Webhook Secret Signature Section */}
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${config.webhook_secret_configured ? 'bg-emerald-500' : 'bg-destructive'}`} />
                    <div>
                      <p className="font-medium text-foreground">Assinatura Secreta (Webhook)</p>
                      <p className="text-sm text-muted-foreground">
                        {config.webhook_secret_configured 
                          ? 'Assinatura configurada e ativa' 
                          : 'Assinatura não configurada'}
                      </p>
                    </div>
                  </div>
                  {config.webhook_secret_configured && (
                    <Badge className="bg-emerald-600">Configurado</Badge>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>
                    {config.webhook_secret_configured ? 'Atualizar Assinatura Secreta' : 'Inserir Assinatura Secreta'}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      value={webhookSecret}
                      onChange={(e) => setWebhookSecret(e.target.value)}
                      placeholder="Assinatura secreta do webhook"
                      className="font-mono text-sm"
                    />
                    <Button 
                      onClick={handleSaveWebhookSecret} 
                      disabled={savingWebhookSecret || !webhookSecret.trim()}
                      variant={config.webhook_secret_configured ? 'outline' : 'default'}
                    >
                      {savingWebhookSecret ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Encontre a Assinatura Secreta em{' '}
                    <a 
                      href="https://www.mercadopago.com.br/developers/panel/app" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Mercado Pago Developers → Webhooks → Assinatura secreta
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                </div>

                <div className="p-3 bg-blue-600/10 border border-blue-600/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-blue-400">Validação:</strong> A assinatura secreta é usada para verificar se as notificações de webhook realmente vieram do Mercado Pago.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="methods" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Métodos de Pagamento
              </CardTitle>
              <CardDescription>
                Configure quais métodos de pagamento estão disponíveis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* PIX */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-600/20 rounded-lg flex items-center justify-center">
                    <span className="font-bold text-teal-400">PIX</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Pagamento via PIX</p>
                    <p className="text-sm text-muted-foreground">QR Code instantâneo</p>
                  </div>
                </div>
                <Switch
                  checked={config.pix_enabled}
                  onCheckedChange={(checked) => setConfig({ ...config, pix_enabled: checked })}
                />
              </div>

              {/* Cartão */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Cartão de Crédito</p>
                    <p className="text-sm text-muted-foreground">Visa, Master, Elo, etc.</p>
                  </div>
                </div>
                <Switch
                  checked={config.card_enabled}
                  onCheckedChange={(checked) => setConfig({ ...config, card_enabled: checked })}
                />
              </div>

              {/* Parcelas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Máximo de Parcelas</Label>
                  <Select
                    value={config.max_installments.toString()}
                    onValueChange={(value) => setConfig({ ...config, max_installments: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                        <SelectItem key={n} value={n.toString()}>{n}x</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Valor Mínimo por Parcela</Label>
                  <Input
                    type="number"
                    value={config.min_installment_value}
                    onChange={(e) => setConfig({ ...config, min_installment_value: parseFloat(e.target.value) || 5 })}
                    min={1}
                    step={0.01}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notificações de Pagamento
              </CardTitle>
              <CardDescription>
                Configure alertas para eventos de pagamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>E-mail para Notificações</Label>
                <Input
                  type="email"
                  value={config.notification_email || ''}
                  onChange={(e) => setConfig({ ...config, notification_email: e.target.value })}
                  placeholder="admin@seusite.com"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                <div>
                  <p className="font-medium text-foreground">Notificar Aprovações</p>
                  <p className="text-sm text-muted-foreground">Receber alerta quando um pagamento for aprovado</p>
                </div>
                <Switch
                  checked={config.notify_on_approval}
                  onCheckedChange={(checked) => setConfig({ ...config, notify_on_approval: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                <div>
                  <p className="font-medium text-foreground">Notificar Falhas</p>
                  <p className="text-sm text-muted-foreground">Receber alerta quando um pagamento falhar</p>
                </div>
                <Switch
                  checked={config.notify_on_failure}
                  onCheckedChange={(checked) => setConfig({ ...config, notify_on_failure: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Pagamentos Recentes
              </CardTitle>
              <CardDescription>
                Últimos 10 pagamentos processados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum pagamento encontrado
                </div>
              ) : (
                <div className="space-y-3">
                  {recentPayments.map((payment) => (
                    <div 
                      key={payment.id} 
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                          {payment.payment_method_id === 'pix' ? (
                            <span className="text-xs font-bold text-primary">PIX</span>
                          ) : (
                            <CreditCard className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{payment.payer_email}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(payment.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-foreground">
                          {formatCurrency(payment.transaction_amount)}
                        </span>
                        {getStatusBadge(payment.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
