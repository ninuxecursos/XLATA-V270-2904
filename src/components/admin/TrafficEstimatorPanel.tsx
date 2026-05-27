import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { TrendingUp, DollarSign, Users, Eye, RefreshCw, BarChart3, Zap } from 'lucide-react';

interface ArticleEstimate {
  id: string;
  article_id: string;
  keyword_primary: string;
  keyword_type: string;
  search_volume: string;
  ranking_difficulty: string;
  current_position: number | null;
  estimated_monthly_visits: number;
  purchase_intent: string;
  estimated_conversion_rate: number;
  estimated_monthly_clients: number;
  estimated_monthly_value: number;
  value_score: number;
  classification: string;
  visitor_profile: string;
  ai_analysis_summary: string;
  analyzed_at: string;
  blog_posts: {
    id: string;
    title: string;
    slug: string;
    status: string;
    published_at: string;
    view_count: number;
  } | null;
}

interface Stats {
  total_articles_analyzed: number;
  total_estimated_visits: number;
  total_estimated_clients: number;
  total_estimated_value: number;
  avg_value_score: number;
  high_potential: number;
  medium_potential: number;
  low_potential: number;
  avg_conversion_rate: string;
}

export const TrafficEstimatorPanel = () => {
  const [estimates, setEstimates] = useState<ArticleEstimate[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [classFilter, setClassFilter] = useState<string>('all');

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('estimate-article-potential', {
        body: { action: 'get_dashboard' },
      });
      if (error) throw error;
      if (data.success) {
        setStats(data.stats);
        setEstimates(data.estimates || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  const handleAnalyzeAll = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('estimate-article-potential', {
        body: { action: 'analyze_all' },
      });
      if (error) throw error;
      if (data.success) {
        toast({ title: 'Análise completa!', description: `${data.analyzed} artigos analisados` });
        await loadDashboard();
      }
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyzeSingle = async (articleId: string) => {
    setAnalyzingId(articleId);
    try {
      const { data, error } = await supabase.functions.invoke('estimate-article-potential', {
        body: { action: 'analyze_single', article_id: articleId },
      });
      if (error) throw error;
      if (data.success) {
        toast({ title: 'Analisado!', description: 'Estimativa atualizada' });
        await loadDashboard();
      }
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setAnalyzingId(null);
    }
  };

  const filtered = estimates.filter(e => {
    if (classFilter !== 'all' && e.classification !== classFilter) return false;
    return true;
  });

  const getClassBadge = (c: string) => {
    if (c === 'alto') return <Badge className="bg-green-600">🟢 Alto</Badge>;
    if (c === 'medio') return <Badge className="bg-yellow-600">🟡 Médio</Badge>;
    return <Badge variant="destructive">🔴 Baixo</Badge>;
  };

  const getIntentBadge = (i: string) => {
    const map: Record<string, string> = { baixa: '📖', media: '🔍', alta: '🛒' };
    return <Badge variant="outline" className="text-xs">{map[i] || ''} {i}</Badge>;
  };

  const formatCurrency = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  if (loading) {
    return <div className="flex items-center justify-center py-12"><RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">📊 Estimador de Tráfego & Conversão</h2>
          <p className="text-sm text-muted-foreground">Previsão de visitas, conversões e receita por artigo via Gemini</p>
        </div>
        <Button onClick={handleAnalyzeAll} disabled={analyzing}>
          {analyzing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
          {analyzing ? 'Analisando...' : 'Analisar Todos'}
        </Button>
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.total_estimated_visits.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Visitas estimadas/mês</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-400" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.total_estimated_clients}</p>
                    <p className="text-xs text-muted-foreground">Clientes estimados/mês</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-yellow-400" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.total_estimated_value)}</p>
                    <p className="text-xs text-muted-foreground">Receita estimada/mês</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.avg_conversion_rate}%</p>
                    <p className="text-xs text-muted-foreground">Conversão média</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Card className="border-green-500/20">
              <CardContent className="p-3 text-center">
                <p className="text-lg font-bold text-foreground">{stats.high_potential}</p>
                <p className="text-xs text-muted-foreground">🟢 Alto potencial</p>
              </CardContent>
            </Card>
            <Card className="border-yellow-500/20">
              <CardContent className="p-3 text-center">
                <p className="text-lg font-bold text-foreground">{stats.medium_potential}</p>
                <p className="text-xs text-muted-foreground">🟡 Médio potencial</p>
              </CardContent>
            </Card>
            <Card className="border-red-500/20">
              <CardContent className="p-3 text-center">
                <p className="text-lg font-bold text-foreground">{stats.low_potential}</p>
                <p className="text-xs text-muted-foreground">🔴 Baixo potencial</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <div className="flex gap-3">
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Classificação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="alto">🟢 Alto</SelectItem>
            <SelectItem value="medio">🟡 Médio</SelectItem>
            <SelectItem value="baixo">🔴 Baixo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Estimativas por Artigo ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Artigo</TableHead>
                <TableHead>Keyword</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead className="text-center">Visitas/mês</TableHead>
                <TableHead className="text-center">Conversão</TableHead>
                <TableHead className="text-center">Clientes/mês</TableHead>
                <TableHead className="text-center">Valor/mês</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    Nenhuma estimativa ainda. Clique em "Analisar Todos" para começar.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((est) => (
                  <TableRow key={est.id}>
                    <TableCell>
                      <div className="max-w-[200px]">
                        <p className="font-medium text-foreground text-sm truncate">{est.blog_posts?.title || 'Artigo'}</p>
                        {est.ai_analysis_summary && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{est.ai_analysis_summary}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm text-foreground">{est.keyword_primary}</p>
                        {getIntentBadge(est.purchase_intent)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`text-lg font-bold ${
                        est.value_score >= 70 ? 'text-green-400' :
                        est.value_score >= 40 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {est.value_score}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-medium text-foreground">
                      {est.estimated_monthly_visits.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center text-foreground">
                      {est.estimated_conversion_rate}%
                    </TableCell>
                    <TableCell className="text-center font-bold text-foreground">
                      {est.estimated_monthly_clients}
                    </TableCell>
                    <TableCell className="text-center font-bold text-green-400">
                      {formatCurrency(est.estimated_monthly_value)}
                    </TableCell>
                    <TableCell>{getClassBadge(est.classification)}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAnalyzeSingle(est.article_id)}
                        disabled={analyzingId === est.article_id}
                      >
                        {analyzingId === est.article_id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
