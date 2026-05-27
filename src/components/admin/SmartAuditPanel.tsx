import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  Brain, RefreshCw, TrendingUp, AlertTriangle, DollarSign,
  Search, Zap, BarChart3, Target, Sparkles, ChevronDown, ChevronUp,
  Rocket, Pen, Plus, RotateCcw
} from 'lucide-react';

interface AuditCategory {
  score: number;
  issues: number;
  label: string;
}

interface ArticleAction {
  type: string;
  label: string;
  priority: string;
  impact: string;
}

interface ArticleClassification {
  article_id: string;
  title: string;
  classification: string;
  classification_label: string;
  problems: string[];
  actions: ArticleAction[];
}

interface ActionItem {
  action: string;
  type: string;
  article_id: string | null;
  article_title: string;
}

interface AuditResult {
  health_score: number;
  executive_summary: string;
  traffic_increase_potential: string;
  revenue_increase_potential: string;
  categories: Record<string, AuditCategory>;
  articles_classification: ArticleClassification[];
  action_plan: { high: ActionItem[]; medium: ActionItem[]; low: ActionItem[] };
  opportunities: { description: string; potential_impact: string }[];
}

interface AuditData {
  audit: AuditResult;
  stats: Record<string, number>;
  analyzed_at: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
  content: <Pen className="h-4 w-4" />,
  seo: <Search className="h-4 w-4" />,
  performance: <BarChart3 className="h-4 w-4" />,
  conversion: <Target className="h-4 w-4" />,
  revenue: <DollarSign className="h-4 w-4" />,
  scale: <Rocket className="h-4 w-4" />,
};

const classificationColors: Record<string, string> = {
  money: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  high_potential: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  low_performance: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  useless: 'bg-red-500/20 text-red-300 border-red-500/30',
};

const priorityColors: Record<string, string> = {
  high: 'bg-red-500/20 text-red-300',
  medium: 'bg-amber-500/20 text-amber-300',
  low: 'bg-slate-500/20 text-slate-300',
};

export const SmartAuditPanel = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AuditData | null>(null);
  const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set());
  const [executingAction, setExecutingAction] = useState<string | null>(null);

  const runAudit = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('smart-audit');
      if (error) throw error;
      if (!result?.success) {
        toast({
          title: result?.retryable ? 'IA temporariamente indisponível' : 'Erro na auditoria',
          description: result?.error || 'Tente novamente em alguns instantes.',
          variant: 'destructive',
        });
        return;
      }
      setData(result);
      toast({ title: 'Auditoria concluída', description: `Score: ${result.audit.health_score}/100` });
    } catch (err: any) {
      toast({ title: 'Erro na auditoria', description: err?.message || 'Falha desconhecida', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const executeAction = async (type: string, articleId?: string | null) => {
    const key = `${type}-${articleId}`;
    setExecutingAction(key);
    try {
      let fnName = '';
      const body: Record<string, any> = {};

      switch (type) {
        case 'optimize_seo':
          fnName = 'seo-optimizer';
          body.article_id = articleId;
          break;
        case 'update_content':
        case 'rewrite':
          fnName = 'reconstruct-article';
          body.article_id = articleId;
          break;
        case 'scale':
          fnName = 'scale-content';
          body.article_id = articleId;
          break;
        case 'add_cta':
          fnName = 'seo-optimizer';
          body.article_id = articleId;
          body.focus = 'cta';
          break;
        default:
          fnName = 'seo-optimizer';
          body.article_id = articleId;
      }

      const { data: result, error } = await supabase.functions.invoke(fnName, { body });
      if (error) throw error;
      toast({ title: 'Ação executada', description: `${type} aplicado com sucesso` });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setExecutingAction(null);
    }
  };

  const toggleArticle = (id: string) => {
    setExpandedArticles(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return '[&>div]:bg-emerald-500';
    if (score >= 60) return '[&>div]:bg-amber-500';
    return '[&>div]:bg-red-500';
  };

  const audit = data?.audit;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-purple-400" />
          <div>
            <h2 className="text-xl font-bold text-white">Auditoria Inteligente</h2>
            <p className="text-sm text-slate-400">Análise completa do ecossistema com IA</p>
          </div>
        </div>
        <Button onClick={runAudit} disabled={loading} className="gap-2">
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? 'Analisando...' : 'Analisar Sistema'}
        </Button>
      </div>

      {loading && (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-8 text-center">
            <Brain className="h-12 w-12 text-purple-400 mx-auto mb-4 animate-pulse" />
            <p className="text-white font-medium">Analisando ecossistema...</p>
            <p className="text-sm text-slate-400 mt-1">Coletando dados e processando com Gemini</p>
          </CardContent>
        </Card>
      )}

      {audit && !loading && (
        <>
          {/* Health Score */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-slate-800 border-slate-700 md:col-span-2">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`text-5xl font-bold ${getScoreColor(audit.health_score)}`}>
                    {audit.health_score}
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Saúde Geral do SEO</p>
                    <Progress value={audit.health_score} className={`h-2 mt-2 bg-slate-700 ${getProgressColor(audit.health_score)}`} />
                  </div>
                </div>
                <p className="text-sm text-slate-300 mt-4">{audit.executive_summary}</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{audit.traffic_increase_potential}</p>
                <p className="text-xs text-slate-400">Potencial de aumento de tráfego</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6 text-center">
                <DollarSign className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{audit.revenue_increase_potential}</p>
                <p className="text-xs text-slate-400">Potencial de aumento de receita</p>
              </CardContent>
            </Card>
          </div>

          {/* Category Scores */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(audit.categories || {}).map(([key, cat]) => (
              <Card key={key} className="bg-slate-800 border-slate-700">
                <CardContent className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    {categoryIcons[key]}
                    <span className="text-xs text-slate-400">{cat.label}</span>
                  </div>
                  <p className={`text-2xl font-bold ${getScoreColor(cat.score)}`}>{cat.score}</p>
                  {cat.issues > 0 && (
                    <p className="text-[10px] text-amber-400 mt-1">{cat.issues} problemas</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Action Plan */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-400" />
                Plano de Ação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(['high', 'medium', 'low'] as const).map(priority => {
                const items = audit.action_plan?.[priority] || [];
                if (items.length === 0) return null;
                const labels = { high: '🔴 Alta Prioridade', medium: '🟡 Média Prioridade', low: '🟢 Baixa Prioridade' };
                return (
                  <div key={priority}>
                    <p className="text-sm font-semibold text-slate-300 mb-2">{labels[priority]}</p>
                    <div className="space-y-2">
                      {items.slice(0, 5).map((item, i) => (
                        <div key={i} className="flex items-center justify-between bg-slate-700/50 rounded-lg p-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{item.action}</p>
                            {item.article_title && (
                              <p className="text-xs text-slate-400 truncate">Artigo: {item.article_title}</p>
                            )}
                          </div>
                          {item.article_id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-purple-400 hover:text-purple-300 ml-2 shrink-0"
                              disabled={executingAction === `${item.type}-${item.article_id}`}
                              onClick={() => executeAction(item.type, item.article_id)}
                            >
                              {executingAction === `${item.type}-${item.article_id}` ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <Zap className="h-3 w-3" />
                              )}
                              <span className="ml-1 text-xs">Executar</span>
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Articles Classification */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-400" />
                Classificação dos Artigos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(audit.articles_classification || []).map(article => (
                <div key={article.article_id} className="bg-slate-700/50 rounded-lg overflow-hidden">
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-700/80"
                    onClick={() => toggleArticle(article.article_id)}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Badge className={`shrink-0 text-[10px] ${classificationColors[article.classification] || 'bg-slate-600 text-slate-300'}`}>
                        {article.classification_label}
                      </Badge>
                      <p className="text-sm text-white truncate">{article.title}</p>
                    </div>
                    {expandedArticles.has(article.article_id) ? (
                      <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                    )}
                  </div>

                  {expandedArticles.has(article.article_id) && (
                    <div className="px-3 pb-3 space-y-3 border-t border-slate-600/50 pt-3">
                      {article.problems?.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-400 mb-1.5">Problemas detectados:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {article.problems.map((p, i) => (
                              <Badge key={i} variant="outline" className="text-[10px] border-red-500/30 text-red-300">
                                <AlertTriangle className="h-2.5 w-2.5 mr-1" />{p}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {article.actions?.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-400 mb-1.5">Ações sugeridas:</p>
                          <div className="space-y-1.5">
                            {article.actions.map((action, i) => (
                              <div key={i} className="flex items-center justify-between bg-slate-800/50 rounded p-2">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <Badge className={`text-[9px] ${priorityColors[action.priority]}`}>{action.priority}</Badge>
                                    <span className="text-xs text-white">{action.label}</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 mt-0.5">{action.impact}</p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-purple-400 hover:text-purple-300 shrink-0 h-7"
                                  disabled={executingAction === `${action.type}-${article.article_id}`}
                                  onClick={() => executeAction(action.type, article.article_id)}
                                >
                                  {executingAction === `${action.type}-${article.article_id}` ? (
                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Zap className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Opportunities */}
          {audit.opportunities?.length > 0 && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="h-5 w-5 text-emerald-400" />
                  Oportunidades Detectadas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {audit.opportunities.map((opp, i) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-700/50 rounded-lg p-3">
                    <Plus className="h-4 w-4 text-emerald-400 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white">{opp.description}</p>
                    </div>
                    <Badge className={`shrink-0 text-[10px] ${
                      opp.potential_impact === 'alto' ? 'bg-emerald-500/20 text-emerald-300' :
                      opp.potential_impact === 'médio' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-slate-500/20 text-slate-300'
                    }`}>
                      {opp.potential_impact}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <p className="text-xs text-slate-500 text-center">
            Última análise: {new Date(data.analyzed_at).toLocaleString('pt-BR')}
          </p>
        </>
      )}

      {!audit && !loading && (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-12 text-center">
            <Brain className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">Clique em "Analisar Sistema" para iniciar</p>
            <p className="text-sm text-slate-500 mt-2">A IA analisará todos os artigos, rankings, indexação e receita</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SmartAuditPanel;
