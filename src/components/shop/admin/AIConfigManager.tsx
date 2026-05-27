import { useState, useEffect } from 'react';
import { Brain, Save, Wifi, WifiOff, ExternalLink, Loader2, BarChart3, AlertTriangle, Eye, Sparkles, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Progress } from '@/components/ui/progress';
import { useAIAutomation } from '@/hooks/useAIAutomation';
import { useAIUsage } from '@/hooks/useAIUsage';
import { ScannerUsageCard } from './ScannerUsageCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Models that support multimodal vision (used by Escanear Produto por Foto)
const VISION_MODELS = new Set<string>([
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'google/gemini-3-flash-preview',
  'google/gemini-2.5-flash',
]);

const GEMINI_MODELS = [
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', vision: true },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', vision: true },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', vision: true },
];

const LOVABLE_MODELS = [
  { value: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash Preview', vision: true },
  { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash', vision: true },
];

export function AIConfigManager() {
  const { config, loading, saving, testing, updateConfig, testConnection } = useAIAutomation();
  const aiUsage = useAIUsage();

  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState<'google_gemini' | 'lovable_cloud'>('google_gemini');
  const [model, setModel] = useState('gemini-2.5-flash');
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'failed'>('idle');

  useEffect(() => {
    if (config) {
      setApiKey(config.gemini_api_key || '');
      setProvider(config.ai_provider);
      setModel(config.ai_model);
    }
  }, [config]);

  const models = provider === 'google_gemini' ? GEMINI_MODELS : LOVABLE_MODELS;

  const handleProviderChange = (value: string) => {
    const newProvider = value as 'google_gemini' | 'lovable_cloud';
    setProvider(newProvider);
    const defaultModel = newProvider === 'google_gemini' ? 'gemini-2.5-flash' : 'google/gemini-3-flash-preview';
    setModel(defaultModel);
  };

  const handleSave = async () => {
    await updateConfig({
      gemini_api_key: apiKey || null,
      ai_provider: provider,
      ai_model: model,
    } as any);
  };

  const handleTest = async () => {
    setConnectionStatus('idle');
    const result = await testConnection(apiKey || undefined);
    setConnectionStatus(result?.success ? 'success' : 'failed');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--shop-primary))]" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-[hsl(var(--shop-primary))] to-[hsl(var(--shop-primary-hover))] rounded-xl flex items-center justify-center">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[hsl(var(--shop-text-primary))]">Configuração da IA</h1>
          <p className="text-sm text-[hsl(var(--shop-text-muted))]">Configure a API de IA para criação de produtos e geração de imagens</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <div className="space-y-6 bg-[hsl(var(--shop-bg-card))] rounded-xl border border-[hsl(var(--shop-border-default))] p-5">
        {/* Provider */}
        <div className="space-y-2">
          <Label className="text-[hsl(var(--shop-text-primary))]">Provedor de IA</Label>
          <Select value={provider} onValueChange={handleProviderChange}>
            <SelectTrigger className="bg-[hsl(var(--shop-bg-elevated))] border-[hsl(var(--shop-border-default))] text-[hsl(var(--shop-text-primary))]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="google_gemini">Google Gemini (API própria)</SelectItem>
              <SelectItem value="lovable_cloud">Lovable Cloud (gateway)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* API Key */}
        {provider === 'google_gemini' && (
          <div className="space-y-2">
            <Label className="text-[hsl(var(--shop-text-primary))]">API Key do Google Gemini</Label>
            <PasswordInput
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Cole sua API Key aqui..."
              className="bg-[hsl(var(--shop-bg-elevated))] border-[hsl(var(--shop-border-default))] text-[hsl(var(--shop-text-primary))]"
            />
            <p className="text-xs text-[hsl(var(--shop-text-muted))]">
              Obtenha sua chave em{' '}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[hsl(var(--shop-primary))] hover:underline inline-flex items-center gap-1"
              >
                Google AI Studio <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
        )}

        {/* Model */}
        <div className="space-y-2">
          <Label className="text-[hsl(var(--shop-text-primary))]">Modelo de IA</Label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className="bg-[hsl(var(--shop-bg-elevated))] border-[hsl(var(--shop-border-default))] text-[hsl(var(--shop-text-primary))]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {models.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  <span className="flex items-center gap-2">
                    {m.label}
                    {m.vision && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium">
                        <Eye className="w-2.5 h-2.5" /> visão
                      </span>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-[hsl(var(--shop-text-muted))]">
            Para <strong>Escanear Produto por Foto</strong>, escolha um modelo com suporte a visão (todos Gemini 2.0+).
          </p>
          {!VISION_MODELS.has(model) && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Este modelo não suporta análise de imagens. Para usar <strong>Escanear Produto</strong>, escolha um modelo marcado com 👁️ visão.</span>
            </div>
          )}
          {provider === 'lovable_cloud' && (
            <p className="text-xs text-[hsl(var(--shop-text-muted))]">
              ℹ️ Lovable Cloud usa créditos do workspace — nenhuma API key necessária.
            </p>
          )}
          {provider === 'google_gemini' && (
            <p className="text-xs text-[hsl(var(--shop-text-muted))]">
              🔑 A mesma API key funciona para Telegram e Escaneamento de Produtos.
            </p>
          )}
        </div>

        {/* Where this AI is used */}
        <div className="space-y-2 pt-2 border-t border-[hsl(var(--shop-border-default))]">
          <Label className="text-[hsl(var(--shop-text-primary))] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[hsl(var(--shop-primary))]" />
            Recursos que usam esta IA
          </Label>
          <ul className="space-y-1.5 text-sm text-[hsl(var(--shop-text-secondary))]">
            <li className="flex items-center gap-2">
              <MessageCircle className="w-3.5 h-3.5 text-[hsl(var(--shop-text-muted))]" />
              Geração de produtos via Telegram
            </li>
            <li className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
              Escanear Produto por Foto <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium">novo</span>
            </li>
          </ul>
        </div>

        {/* Connection Status */}
        {connectionStatus !== 'idle' && (
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            connectionStatus === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {connectionStatus === 'success' ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            {connectionStatus === 'success' ? 'Conexão estabelecida com sucesso!' : 'Falha na conexão. Verifique sua API Key.'}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={handleTest}
            disabled={testing || (provider === 'google_gemini' && !apiKey)}
            variant="outline"
            className="border-[hsl(var(--shop-border-default))] text-[hsl(var(--shop-text-primary))] hover:bg-[hsl(var(--shop-bg-elevated))]"
          >
            {testing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wifi className="w-4 h-4 mr-2" />}
            Testar Conexão
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-[hsl(var(--shop-primary))] to-[hsl(var(--shop-primary-hover))] text-white"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar Configurações
          </Button>
        </div>
      </div>

      {/* AI Usage Monitor */}
      <div className="bg-[hsl(var(--shop-bg-card))] rounded-xl border border-[hsl(var(--shop-border-default))] p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-[hsl(var(--shop-primary))]" />
          <h2 className="text-lg font-semibold text-[hsl(var(--shop-text-primary))]">Uso de Hoje (Gemini Free Tier)</h2>
        </div>

        {aiUsage.isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-[hsl(var(--shop-text-muted))]" />
          </div>
        ) : (
          <div className="space-y-4">
            {aiUsage.categories.map((cat) => {
              const pct = cat.limit > 0 ? (cat.count / cat.limit) * 100 : 0;
              const isWarning = pct >= 80;
              const isDanger = pct >= 100;

              return (
                <div key={cat.type} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[hsl(var(--shop-text-secondary))]">{cat.label}</span>
                    <span className={`font-mono font-medium ${isDanger ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-[hsl(var(--shop-text-primary))]'}`}>
                      {cat.count} / {cat.limit} RPD
                    </span>
                  </div>
                  <Progress
                    value={Math.min(pct, 100)}
                    className={`h-2 ${isDanger ? '[&>div]:bg-red-500' : isWarning ? '[&>div]:bg-amber-500' : '[&>div]:bg-[hsl(var(--shop-primary))]'}`}
                  />
                </div>
              );
            })}

            {/* Total */}
            <div className="pt-3 border-t border-[hsl(var(--shop-border-default))]">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-[hsl(var(--shop-text-primary))]">Total chamadas IA</span>
                <span className="font-mono font-medium text-[hsl(var(--shop-text-primary))]">
                  {aiUsage.totalCalls} / {aiUsage.totalLimit}
                </span>
              </div>
              <Progress
                value={Math.min((aiUsage.totalCalls / aiUsage.totalLimit) * 100, 100)}
                className="h-2 mt-1.5 [&>div]:bg-[hsl(var(--shop-primary))]"
              />
            </div>

            {/* Alert */}
            {aiUsage.totalCalls >= aiUsage.totalLimit * 0.8 && (
              <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                aiUsage.totalCalls >= aiUsage.totalLimit
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {aiUsage.totalCalls >= aiUsage.totalLimit
                  ? 'Limite diário atingido! Novas chamadas podem falhar.'
                  : 'Atenção: uso próximo do limite diário.'}
              </div>
            )}
          </div>
        )}
      </div>
      </div>

      {/* Detailed Scanner Usage & Costs (full width) */}
      <div className="mt-6">
        <ScannerUsageCard scanner={aiUsage.scanner} isLoading={aiUsage.isLoading} />
      </div>
    </div>
  );
}
