import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Zap, TrendingUp, TrendingDown, AlertTriangle, RefreshCw,
  Sparkles, Target, ArrowUp, ArrowDown, Minus, ChevronDown, ChevronUp,
  Settings, Clock, Save
} from 'lucide-react';

interface ScoreRecord {
  id: string;
  article_id: string;
  opportunity_score: number;
  ranking_score: number;
  freshness_score: number;
  content_score: number;
  cta_score: number;
  interlinking_score: number;
  best_keyword: string | null;
  best_position: number | null;
  position_trend: string;
  days_since_update: number;
  word_count: number;
  has_ctas: boolean;
  internal_links_count: number;
  suggestions: string;
  priority: string;
  last_analyzed: string | null;
  last_optimized: string | null;
  blog_posts: { title: string; slug: string; status: string };
}

export const SeoOptimizerPanel = () => {
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [optimizing, setOptimizing] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, urgent: 0, high: 0, rising: 0, falling: 0 });
  const [config, setConfig] = useState({
    enabled: false,
    articles_per_day: 5,
    hours_interval: 4,
    min_score: 50,
    last_run_at: null as string | null,
    articles_today: 0,
  });
  const [savingConfig, setSavingConfig] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      const { data } = await supabase.functions.invoke('seo-optimizer', {
        body: { action: 'get_config' },
      });
      if (data?.config) {
        setConfig({
          enabled: data.config.enabled ?? false,
          articles_per_day: data.config.articles_per_day ?? 5,
          hours_interval: data.config.hours_interval ?? 4,
          min_score: data.config.min_score ?? 50,
          last_run_at: data.config.last_run_at,
          articles_today: data.config.articles_today ?? 0,
        });
      }
    } catch (err) { console.error(err); }
  }, []);

  const saveConfig = async () => {
    setSavingConfig(true);
    try {
      const { error } = await supabase.functions.invoke('seo-optimizer', {
        body: {
          action: 'update_config',
          enabled: config.enabled,
          articles_per_day: config.articles_per_day,
          hours_interval: config.hours_interval,
          min_score: config.min_score,
        },
      });
      if (error) throw error;
      toast.success('Configuração salva!');
      fetchConfig();
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    } finally {
      setSavingConfig(false);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('seo-optimizer', {
        body: { action: 'get_dashboard' },
      });
      if (!error && data) {
        setScores(data.scores || []);
        setStats({ total: data.total, urgent: data.urgent, high: data.high, rising: data.rising, falling: data.falling });
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); fetchConfig(); }, [fetchData, fetchConfig]);

  const analyzeAll = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('seo-optimizer', {
        body: { action: 'analyze_all' },
      });
      if (error) throw error;
      toast.success(`${data?.analyzed || 0} artigos analisados!`);
      fetchData();
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const autoOptimize = async (articleId: string, title: string) => {
    setOptimizing(articleId);
    try {
      const { data, error } = await supabase.functions.invoke('seo-optimizer', {
        body: { action: 'auto_optimize', article_id: articleId },
      });
      if (error) throw error;
      // Backend pode retornar 200 com fallback (cota Gemini esgotada, etc.)
      if (data?.success === false || data?.fallback) {
        toast.error(data?.error || 'Não foi possível otimizar agora.', { duration: 8000 });
        return;
      }
      toast.success(`"${data?.title || title}" otimizado! (${data?.wordCount} palavras)`);
      fetchData();
    } catch (err: any) {
      toast.error('Erro ao otimizar: ' + err.message);
    } finally {
      setOptimizing(null);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent': return <Badge variant="destructive">🔴 Urgente</Badge>;
      case 'high': return <Badge className="bg-orange-500 text-white">🟠 Alta</Badge>;
      case 'normal': return <Badge variant="outline">🟢 Normal</Badge>;
      case 'low': return <Badge variant="secondary">⚪ Baixa</Badge>;
      default: return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'rising') return <ArrowUp className="h-4 w-4 text-green-500" />;
    if (trend === 'falling') return <ArrowDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-500';
    if (score >= 60) return 'text-orange-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-green-500';
  };

  const parseSuggestions = (sugStr: string): string[] => {
    try { return JSON.parse(sugStr); } catch { return []; }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-5 w-5 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Artigos Analisados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-red-500" />
            <div className="text-2xl font-bold">{stats.urgent}</div>
            <p className="text-xs text-muted-foreground">Urgente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="h-5 w-5 mx-auto mb-1 text-orange-500" />
            <div className="text-2xl font-bold">{stats.high}</div>
            <p className="text-xs text-muted-foreground">Alta Prioridade</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <div className="text-2xl font-bold">{stats.rising}</div>
            <p className="text-xs text-muted-foreground">Subindo</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingDown className="h-5 w-5 mx-auto mb-1 text-red-500" />
            <div className="text-2xl font-bold">{stats.falling}</div>
            <p className="text-xs text-muted-foreground">Caindo</p>
          </CardContent>
        </Card>
      </div>

      {/* Configuração de Otimização Automática */}
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Otimização Automática (respeita cota Gemini)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
            <div>
              <p className="text-sm font-medium">
                {config.enabled ? '🟢 Automação ativada' : '⚪ Automação desativada'}
              </p>
              <p className="text-xs text-muted-foreground">
                Quando ligada, o sistema otimiza artigos automaticamente respeitando o limite e o intervalo configurados.
              </p>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(v) => setConfig({ ...config, enabled: v })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Artigos por dia</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={config.articles_per_day}
                onChange={(e) => setConfig({ ...config, articles_per_day: parseInt(e.target.value) || 1 })}
              />
              <p className="text-xs text-muted-foreground mt-1">Máx 20/dia no plano grátis Gemini</p>
            </div>
            <div>
              <Label className="text-xs">Intervalo entre artigos (horas)</Label>
              <Input
                type="number"
                min={1}
                max={24}
                value={config.hours_interval}
                onChange={(e) => setConfig({ ...config, hours_interval: parseInt(e.target.value) || 1 })}
              />
              <p className="text-xs text-muted-foreground mt-1">Distribui ao longo do dia</p>
            </div>
            <div>
              <Label className="text-xs">Score mínimo (oportunidade)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={config.min_score}
                onChange={(e) => setConfig({ ...config, min_score: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground mt-1">Só otimiza acima desse score</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Hoje: {config.articles_today}/{config.articles_per_day} otimizados
              {config.last_run_at && ` · Última: ${new Date(config.last_run_at).toLocaleString('pt-BR')}`}
            </span>
            <Button size="sm" onClick={saveConfig} disabled={savingConfig}>
              <Save className="h-3 w-3 mr-1" />
              {savingConfig ? 'Salvando...' : 'Salvar config'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={analyzeAll} disabled={analyzing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${analyzing ? 'animate-spin' : ''}`} />
          {analyzing ? 'Analisando...' : 'Analisar Todos os Artigos'}
        </Button>
      </div>

      {/* Scores Table */}
      {scores.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Nenhum artigo analisado ainda</p>
            <p className="text-sm mt-1">Clique em "Analisar Todos" para começar.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Oportunidades de Otimização</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto max-h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Artigo</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Posição</TableHead>
                    <TableHead>Trend</TableHead>
                    <TableHead>Palavras</TableHead>
                    <TableHead>Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scores.map(s => {
                    const suggestions = parseSuggestions(s.suggestions);
                    const isExpanded = expandedRow === s.id;

                    return (
                      <React.Fragment key={s.id}>
                        <TableRow
                          className={`cursor-pointer ${s.priority === 'urgent' ? 'bg-destructive/5' : ''}`}
                          onClick={() => setExpandedRow(isExpanded ? null : s.id)}
                        >
                          <TableCell className="max-w-[250px]">
                            <div className="flex items-center gap-1">
                              {isExpanded ? <ChevronUp className="h-3 w-3 shrink-0" /> : <ChevronDown className="h-3 w-3 shrink-0" />}
                              <span className="truncate text-sm font-medium">{s.blog_posts?.title}</span>
                            </div>
                            {s.best_keyword && (
                              <span className="text-xs text-muted-foreground ml-4">🔑 {s.best_keyword}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className={`text-lg font-bold ${getScoreColor(s.opportunity_score)}`}>
                                {s.opportunity_score}
                              </span>
                              <Progress value={s.opportunity_score} className="w-16 h-2" />
                            </div>
                          </TableCell>
                          <TableCell>{getPriorityBadge(s.priority)}</TableCell>
                          <TableCell>
                            {s.best_position ? (
                              <Badge variant="outline">#{s.best_position}</Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>{getTrendIcon(s.position_trend)}</TableCell>
                          <TableCell>
                            <span className={s.word_count < 1500 ? 'text-red-500' : 'text-muted-foreground'}>
                              {s.word_count}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant={s.priority === 'urgent' ? 'destructive' : 'default'}
                              disabled={optimizing === s.article_id}
                              onClick={(e) => {
                                e.stopPropagation();
                                autoOptimize(s.article_id, s.blog_posts?.title);
                              }}
                            >
                              {optimizing === s.article_id ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <><Sparkles className="h-3 w-3 mr-1" /> Otimizar</>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>

                        {/* Expanded details */}
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={7} className="bg-muted/20 p-4">
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                                <div className="text-center">
                                  <p className="text-xs text-muted-foreground">Ranking</p>
                                  <p className="font-bold">{s.ranking_score}/100</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-muted-foreground">Frescor</p>
                                  <p className="font-bold">{s.freshness_score}/100</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-muted-foreground">Conteúdo</p>
                                  <p className="font-bold">{s.content_score}/100</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-muted-foreground">CTAs</p>
                                  <p className="font-bold">{s.cta_score}/100</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-muted-foreground">Links Int.</p>
                                  <p className="font-bold">{s.interlinking_score}/100</p>
                                </div>
                              </div>

                              {suggestions.length > 0 && (
                                <div>
                                  <p className="text-sm font-medium mb-2">Sugestões de Melhoria:</p>
                                  <ul className="space-y-1">
                                    {suggestions.map((sug, i) => (
                                      <li key={i} className="text-sm text-muted-foreground">{sug}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                                <span>📅 Última atualização: {s.days_since_update}d atrás</span>
                                <span>🔗 Links internos: {s.internal_links_count}</span>
                                <span>{s.has_ctas ? '✅ Tem CTAs' : '❌ Sem CTAs'}</span>
                                {s.last_optimized && (
                                  <span>✨ Otimizado: {new Date(s.last_optimized).toLocaleDateString('pt-BR')}</span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SeoOptimizerPanel;
