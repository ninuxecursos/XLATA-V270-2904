import React, { useState } from 'react';
import { AISectorConfigPanel } from './AISectorConfigPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { 
  Bot, Settings, FileText, History, Zap, CheckCircle, XCircle, Clock,
  RefreshCw, Plus, Trash2, RotateCcw, Play, Loader2, Wifi, Calendar,
  TrendingUp, Target, Sparkles, Eye, EyeOff, Key, Save, Wand2, ExternalLink,
  ArrowRight, PenTool, ListChecks
} from 'lucide-react';
import { ArticleReconstructor } from './ArticleReconstructor';
import { ArticleScheduler } from './ArticleScheduler';
import { supabase } from '@/integrations/supabase/client';
import { useAIAutomation } from '@/hooks/useAIAutomation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AI_MODELS = [
  { value: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash (Rápido)' },
  { value: 'google/gemini-3-pro-preview', label: 'Gemini 3 Pro (Qualidade)' },
  { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  { value: 'openai/gpt-5-mini', label: 'GPT-5 Mini' },
  { value: 'openai/gpt-5', label: 'GPT-5 (Premium)' },
];

const TOPIC_CATEGORIES = [
  { value: 'educacional', label: 'Educacional', color: 'bg-blue-500' },
  { value: 'tecnico', label: 'Técnico', color: 'bg-green-500' },
  { value: 'comercial', label: 'Comercial', color: 'bg-purple-500' },
];

export const AIAutomationPanel: React.FC = () => {
  const {
    config, topics, logs, categories, stats, loading, saving, testing,
    generating, updateConfig, testConnection, generateArticle, addTopic,
    deleteTopic, resetTopic, refresh,
  } = useAIAutomation();

  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);
  const [newTopic, setNewTopic] = useState({ topic: '', keywords: '', category: 'educacional', priority: 5 });
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [savedGeminiApiKey, setSavedGeminiApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingApiKey, setSavingApiKey] = useState(false);

  React.useEffect(() => {
    if (config?.gemini_api_key) {
      setSavedGeminiApiKey(config.gemini_api_key);
    }
  }, [config?.gemini_api_key]);

  const handleAddTopic = async () => {
    if (!newTopic.topic.trim()) return;
    const keywords = newTopic.keywords.split(',').map(k => k.trim()).filter(Boolean);
    await addTopic(newTopic.topic, keywords, newTopic.category, newTopic.priority);
    setNewTopic({ topic: '', keywords: '', category: 'educacional', priority: 5 });
    setIsAddTopicOpen(false);
  };

  const handleSaveGeminiApiKey = async () => {
    if (!geminiApiKey.trim()) {
      toast({ title: 'Erro', description: 'Insira uma API key válida', variant: 'destructive' });
      return;
    }
    setSavingApiKey(true);
    try {
      const result = await testConnection(geminiApiKey);
      if (result?.success) {
        await updateConfig({ gemini_api_key: geminiApiKey });
        toast({ title: 'API Key Salva', description: 'Chave do Gemini configurada e salva!' });
        setSavedGeminiApiKey(geminiApiKey);
        setShowApiKey(false);
      }
    } catch (error) {
      console.error('Error saving API key:', error);
    } finally {
      setSavingApiKey(false);
    }
  };

  const getCurrentApiKey = () => geminiApiKey.trim() || savedGeminiApiKey;

  // Connection status
  const isConfigured = config?.is_ai_active && (
    config.ai_provider === 'lovable_cloud' || getCurrentApiKey()
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (!config) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <p className="text-gray-400">Erro ao carregar configurações de IA.</p>
          <Button onClick={refresh} variant="outline" className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" /> Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Bar - Quick Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatusCard label="IA" value={config.is_ai_active ? 'Ativa' : 'Inativa'} color={config.is_ai_active ? 'green' : 'gray'} icon={<Bot className="h-5 w-5" />} />
        <StatusCard label="Temas" value={stats.availableTopics.toString()} color="blue" icon={<Target className="h-5 w-5" />} />
        <StatusCard label="Gerados" value={config.total_articles_generated.toString()} color="purple" icon={<FileText className="h-5 w-5" />} />
        <StatusCard label="Sucesso" value={`${stats.successRate}%`} color="emerald" icon={<TrendingUp className="h-5 w-5" />} />
        <StatusCard label="Média" value={`${stats.avgWordCount} pal.`} color="orange" icon={<Sparkles className="h-5 w-5" />} />
      </div>

      {/* Main 3-Tab Workflow */}
      <Card className="bg-gray-800 border-gray-700">
        <Tabs defaultValue="create" className="w-full">
          <CardHeader className="pb-2">
            <TabsList className="grid w-full grid-cols-4 bg-gray-700 h-12">
              <TabsTrigger value="setup" className="data-[state=active]:bg-red-600 text-sm gap-2">
                <Settings className="h-4 w-4" />
                1. Configurar
              </TabsTrigger>
              <TabsTrigger value="sectors" className="data-[state=active]:bg-red-600 text-sm gap-2">
                <Bot className="h-4 w-4" />
                IA por Setor
              </TabsTrigger>
              <TabsTrigger value="create" className="data-[state=active]:bg-red-600 text-sm gap-2">
                <PenTool className="h-4 w-4" />
                2. Criar Artigos
              </TabsTrigger>
              <TabsTrigger value="manage" className="data-[state=active]:bg-red-600 text-sm gap-2">
                <ListChecks className="h-4 w-4" />
                3. Gerenciar
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="pt-4">
            {/* ===== TAB: IA POR SETOR ===== */}
            <TabsContent value="sectors">
              <AISectorConfigPanel />
            </TabsContent>

            {/* ===== TAB 1: CONFIGURAR ===== */}
            <TabsContent value="setup" className="space-y-6">
              {/* AI On/Off + Provider + Model */}
              <div className="space-y-4">
                <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                  <Bot className="h-5 w-5 text-red-400" />
                  Provedor & Modelo
                </h3>

                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${config.is_ai_active ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                    <div>
                      <p className="font-medium text-white">IA Ativa</p>
                      <p className="text-sm text-gray-400">Habilitar geração de conteúdo</p>
                    </div>
                  </div>
                  <Switch checked={config.is_ai_active} onCheckedChange={(checked) => updateConfig({ is_ai_active: checked })} disabled={saving} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">Provedor</Label>
                    <Select value={config.ai_provider} onValueChange={(v: 'lovable_cloud' | 'google_gemini') => updateConfig({ ai_provider: v })} disabled={saving}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lovable_cloud">
                          <span className="flex items-center gap-2"><Zap className="h-4 w-4 text-yellow-500" /> Lovable Cloud</span>
                        </SelectItem>
                        <SelectItem value="google_gemini">
                          <span className="flex items-center gap-2"><Bot className="h-4 w-4 text-blue-500" /> Google Gemini Direto</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-300">Modelo</Label>
                    <Select value={config.ai_model} onValueChange={(v) => updateConfig({ ai_model: v })} disabled={saving}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AI_MODELS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Gemini API Key */}
                {config.ai_provider === 'google_gemini' && (
                  <div className="p-4 bg-blue-900/30 border border-blue-700/50 rounded-lg space-y-3">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-blue-400" />
                      <Label className="text-blue-300 font-medium">API Key do Gemini</Label>
                      {savedGeminiApiKey && <Badge className="bg-green-600 text-xs">Configurada</Badge>}
                    </div>
                    <p className="text-xs text-blue-200/70">
                      Obtenha em <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">aistudio.google.com/apikey</a>
                    </p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type={showApiKey ? 'text' : 'password'}
                          value={geminiApiKey}
                          onChange={(e) => setGeminiApiKey(e.target.value)}
                          placeholder={savedGeminiApiKey ? '••••••• (já configurada)' : 'AIza...'}
                          className="bg-gray-700 border-gray-600 text-white pr-10"
                        />
                        <button type="button" onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                          {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <Button onClick={handleSaveGeminiApiKey} disabled={savingApiKey || !geminiApiKey.trim()} size="sm" className="bg-blue-600 hover:bg-blue-700">
                        {savingApiKey ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Test Connection */}
                <Button
                  onClick={() => testConnection(config.ai_provider === 'google_gemini' ? getCurrentApiKey() : undefined)}
                  disabled={testing || !config.is_ai_active || (config.ai_provider === 'google_gemini' && !getCurrentApiKey())}
                  variant="outline"
                  className="w-full"
                >
                  {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wifi className="h-4 w-4 mr-2" />}
                  Testar Conexão
                </Button>
              </div>

              {/* Automation Settings */}
              <div className="space-y-4 pt-4 border-t border-gray-700">
                <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-400" />
                  Automação & Qualidade
                </h3>

                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-white">Publicação Automática</p>
                    <p className="text-sm text-gray-400">Publica artigos agendados no horário</p>
                  </div>
                  <Switch checked={config.automation_enabled} onCheckedChange={(checked) => updateConfig({ automation_enabled: checked })} disabled={saving} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-gray-300 text-xs">Artigos/mês</Label>
                    <Input type="number" value={config.articles_per_month} onChange={(e) => updateConfig({ articles_per_month: parseInt(e.target.value) || 8 })} min={1} max={30} className="bg-gray-700 border-gray-600 text-white" disabled={saving} />
                  </div>
                  <div>
                    <Label className="text-gray-300 text-xs">Intervalo (dias)</Label>
                    <Input type="number" value={config.publish_interval_days} onChange={(e) => updateConfig({ publish_interval_days: parseInt(e.target.value) || 3 })} min={1} max={14} className="bg-gray-700 border-gray-600 text-white" disabled={saving} />
                  </div>
                  <div>
                    <Label className="text-gray-300 text-xs">Hora publicação</Label>
                    <Select value={config.publish_hour.toString()} onValueChange={(v) => updateConfig({ publish_hour: parseInt(v) })} disabled={saving}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={i.toString()}>{i.toString().padStart(2, '0')}:00</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-300 text-xs">Categoria padrão</Label>
                    <Select value={config.default_category_id || ''} onValueChange={(v) => updateConfig({ default_category_id: v || null })} disabled={saving}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Selecionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300 text-xs">
                    Tamanho: {config.min_word_count} – {config.max_word_count} palavras
                  </Label>
                  <Slider value={[config.min_word_count, config.max_word_count]} min={800} max={3000} step={100} onValueChange={([min, max]) => updateConfig({ min_word_count: min, max_word_count: max })} className="w-full" disabled={saving} />
                </div>
              </div>
            </TabsContent>

            {/* ===== TAB 2: CRIAR ARTIGOS ===== */}
            <TabsContent value="create" className="space-y-6">
              {/* Quick status */}
              {!isConfigured && (
                <div className="p-4 bg-yellow-900/30 border border-yellow-700/50 rounded-lg flex items-center gap-3">
                  <Clock className="h-5 w-5 text-yellow-400 shrink-0" />
                  <div>
                    <p className="text-yellow-300 font-medium text-sm">Configure a IA primeiro</p>
                    <p className="text-yellow-200/70 text-xs">Vá na aba "1. Configurar" para ativar a IA e escolher o modelo.</p>
                  </div>
                </div>
              )}

              {/* Method 1: From Topic */}
              <div className="space-y-3">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-400" />
                  Gerar por Tema
                  <Badge className="bg-blue-600 text-xs ml-2">{stats.availableTopics} disponíveis</Badge>
                </h3>
                <p className="text-gray-400 text-sm">Selecione um tema do banco e gere automaticamente um artigo SEO completo.</p>

                {/* Quick generate from random topic */}
                <Button
                  onClick={() => generateArticle()}
                  disabled={generating || !isConfigured || stats.availableTopics === 0}
                  className="w-full bg-red-600 hover:bg-red-700 h-12 text-base"
                >
                  {generating ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Zap className="h-5 w-5 mr-2" />}
                  Gerar Artigo Automático (Próximo Tema)
                </Button>

                {/* Topic list with generate buttons */}
                <div className="flex justify-between items-center pt-2">
                  <div className="flex gap-2">
                    {TOPIC_CATEGORIES.map((cat) => (
                      <Badge key={cat.value} className={`${cat.color} text-white text-xs`}>
                        {cat.label}: {topics.filter(t => t.category === cat.value && !t.is_used).length}
                      </Badge>
                    ))}
                  </div>
                  <Dialog open={isAddTopicOpen} onOpenChange={setIsAddTopicOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="border-gray-600 text-gray-300">
                        <Plus className="h-4 w-4 mr-1" /> Novo Tema
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-800 border-gray-700">
                      <DialogHeader>
                        <DialogTitle className="text-white">Novo Tema SEO</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-gray-300">Tema do Artigo</Label>
                          <Textarea value={newTopic.topic} onChange={(e) => setNewTopic({ ...newTopic, topic: e.target.value })} placeholder="Ex: Como calcular margem de lucro em ferro velho" className="bg-gray-700 border-gray-600 text-white" />
                        </div>
                        <div>
                          <Label className="text-gray-300">Palavras-chave (separadas por vírgula)</Label>
                          <Input value={newTopic.keywords} onChange={(e) => setNewTopic({ ...newTopic, keywords: e.target.value })} placeholder="margem lucro, ferro velho, calcular lucro" className="bg-gray-700 border-gray-600 text-white" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-gray-300">Categoria</Label>
                            <Select value={newTopic.category} onValueChange={(v) => setNewTopic({ ...newTopic, category: v })}>
                              <SelectTrigger className="bg-gray-700 border-gray-600 text-white"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {TOPIC_CATEGORIES.map((cat) => (
                                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-gray-300">Prioridade (1-10)</Label>
                            <Input type="number" value={newTopic.priority} onChange={(e) => setNewTopic({ ...newTopic, priority: parseInt(e.target.value) || 5 })} min={1} max={10} className="bg-gray-700 border-gray-600 text-white" />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddTopicOpen(false)}>Cancelar</Button>
                        <Button onClick={handleAddTopic} className="bg-red-600 hover:bg-red-700">Adicionar</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <ScrollArea className="h-[250px] pr-2">
                  <div className="space-y-1.5">
                    {topics.filter(t => !t.is_used).map((topic) => {
                      const catInfo = TOPIC_CATEGORIES.find(c => c.value === topic.category);
                      return (
                        <div key={topic.id} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-700 border border-gray-600 hover:border-gray-500 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm truncate">{topic.topic}</p>
                            <div className="flex gap-2 mt-0.5">
                              <Badge className={`${catInfo?.color} text-white text-[10px] px-1.5 py-0`}>{catInfo?.label}</Badge>
                              <span className="text-[10px] text-gray-500">P:{topic.priority}</span>
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button size="sm" variant="ghost" onClick={() => generateArticle(topic.id)} disabled={generating || !isConfigured} className="h-7 text-green-400 hover:text-green-300" title="Gerar artigo">
                              <Play className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => deleteTopic(topic.id)} className="h-7 text-red-400 hover:text-red-300" title="Remover">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    {topics.filter(t => !t.is_used).length === 0 && (
                      <p className="text-center text-gray-500 py-6 text-sm">Nenhum tema disponível. Adicione novos temas.</p>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Divider */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-700" /></div>
                <div className="relative flex justify-center"><span className="bg-gray-800 px-4 text-gray-500 text-sm">ou</span></div>
              </div>

              {/* Method 2: Reconstruct from text */}
              <div className="space-y-3">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-red-400" />
                  Reconstruir de Texto
                </h3>
                <p className="text-gray-400 text-sm">Cole um artigo existente e o sistema cria um conteúdo 100% original, superior e otimizado para SEO.</p>
                <ArticleReconstructor />
              </div>
            </TabsContent>

            {/* ===== TAB 3: GERENCIAR ===== */}
            <TabsContent value="manage" className="space-y-6">
              {/* Sub-tabs inside manage */}
              <Tabs defaultValue="schedule" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-700">
                  <TabsTrigger value="schedule" className="data-[state=active]:bg-gray-600 text-xs gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Agenda
                  </TabsTrigger>
                  <TabsTrigger value="history" className="data-[state=active]:bg-gray-600 text-xs gap-1">
                    <History className="h-3.5 w-3.5" /> Histórico
                  </TabsTrigger>
                  <TabsTrigger value="used-topics" className="data-[state=active]:bg-gray-600 text-xs gap-1">
                    <CheckCircle className="h-3.5 w-3.5" /> Temas Usados
                  </TabsTrigger>
                </TabsList>

                {/* Schedule */}
                <TabsContent value="schedule" className="pt-4">
                  <ArticleScheduler />
                </TabsContent>

                {/* History */}
                <TabsContent value="history" className="pt-4 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex gap-4 text-sm">
                      <span className="flex items-center gap-1 text-green-400"><CheckCircle className="h-3.5 w-3.5" /> {stats.successfulGenerations}</span>
                      <span className="flex items-center gap-1 text-red-400"><XCircle className="h-3.5 w-3.5" /> {stats.failedGenerations}</span>
                      <span className="flex items-center gap-1 text-gray-400"><Clock className="h-3.5 w-3.5" /> {(stats.avgGenerationTime / 1000).toFixed(1)}s</span>
                    </div>
                    <Button size="sm" variant="outline" onClick={refresh} className="border-gray-600 text-gray-300">
                      <RefreshCw className="h-3.5 w-3.5 mr-1" /> Atualizar
                    </Button>
                  </div>

                  <ScrollArea className="h-[400px] pr-2">
                    <div className="space-y-1.5">
                      {logs.map((log) => (
                        <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-700 border border-gray-600">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {log.status === 'success' ? <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> : log.status === 'failed' ? <XCircle className="h-4 w-4 text-red-500 shrink-0" /> : <Loader2 className="h-4 w-4 text-yellow-500 animate-spin shrink-0" />}
                              <span className="text-white text-sm truncate">{log.topic_used}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 ml-6">
                              <span className="text-xs text-gray-500">{format(new Date(log.created_at), "dd/MM HH:mm", { locale: ptBR })}</span>
                              {log.word_count && <span className="text-xs text-gray-400">{log.word_count} pal.</span>}
                              {log.generation_time_ms && <span className="text-xs text-gray-400">{(log.generation_time_ms / 1000).toFixed(1)}s</span>}
                              {log.error_message && <span className="text-xs text-red-400 truncate max-w-[200px]">{log.error_message}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {log.status === 'success' && log.blog_post_id && (
                              <Button
                                size="sm" variant="outline"
                                className="border-green-600 text-green-400 hover:bg-green-600/20 text-xs h-7"
                                onClick={async () => {
                                  const { data } = await supabase.from('blog_posts').select('slug').eq('id', log.blog_post_id).single();
                                  if (data?.slug) window.open(`/blog/${data.slug}`, '_blank');
                                }}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" /> Ver
                              </Button>
                            )}
                            <Badge className={log.status === 'success' ? 'bg-green-600' : log.status === 'failed' ? 'bg-red-600' : 'bg-yellow-600'}>
                              {log.status === 'success' ? '✓' : log.status === 'failed' ? '✗' : '...'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {logs.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <History className="h-10 w-10 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">Nenhum artigo gerado ainda</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* Used Topics */}
                <TabsContent value="used-topics" className="pt-4">
                  <ScrollArea className="h-[400px] pr-2">
                    <div className="space-y-1.5">
                      {topics.filter(t => t.is_used).map((topic) => {
                        const catInfo = TOPIC_CATEGORIES.find(c => c.value === topic.category);
                        return (
                          <div key={topic.id} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-700/50 border border-gray-600">
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-400 text-sm line-through truncate">{topic.topic}</p>
                              <div className="flex gap-2 mt-0.5">
                                <Badge className={`${catInfo?.color} text-white text-[10px] px-1.5 py-0`}>{catInfo?.label}</Badge>
                                {topic.used_at && <span className="text-[10px] text-gray-500">Usado: {format(new Date(topic.used_at), 'dd/MM/yyyy', { locale: ptBR })}</span>}
                              </div>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button size="sm" variant="ghost" onClick={() => resetTopic(topic.id)} className="h-7 text-blue-400" title="Resetar">
                                <RotateCcw className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => deleteTopic(topic.id)} className="h-7 text-red-400" title="Remover">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                      {topics.filter(t => t.is_used).length === 0 && (
                        <p className="text-center text-gray-500 py-6 text-sm">Nenhum tema usado ainda.</p>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
};

// Mini component for status cards
const StatusCard = ({ label, value, color, icon }: { label: string; value: string; color: string; icon: React.ReactNode }) => {
  const colorMap: Record<string, string> = {
    green: 'from-green-600 to-green-800',
    blue: 'from-blue-600 to-blue-800',
    purple: 'from-purple-600 to-purple-800',
    emerald: 'from-emerald-600 to-emerald-800',
    orange: 'from-orange-600 to-orange-800',
    gray: 'from-gray-600 to-gray-800',
  };
  return (
    <Card className={`bg-gradient-to-br ${colorMap[color] || colorMap.gray} border-0`}>
      <CardContent className="p-3 flex items-center justify-between">
        <div>
          <p className="text-white/70 text-xs">{label}</p>
          <p className="text-lg font-bold text-white">{value}</p>
        </div>
        <div className="text-white/40">{icon}</div>
      </CardContent>
    </Card>
  );
};

export default AIAutomationPanel;
