import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  TrendingUp, TrendingDown, Minus, Search, Plus, RefreshCw, 
  AlertTriangle, Trophy, Target, Eye, ArrowUp, ArrowDown, Bell, X
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ArticleKeyword {
  id: string;
  article_id: string;
  keyword: string;
  is_primary: boolean;
  article_title?: string;
}

interface RankingRecord {
  keyword: string;
  position: number | null;
  article_id: string;
  checked_at: string;
  previous_position?: number | null;
  position_change?: number | null;
}

interface RankingAlert {
  id: string;
  keyword: string;
  alert_type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  new_position: number | null;
  old_position: number | null;
}

export const RankingMonitorPanel = () => {
  const [keywords, setKeywords] = useState<ArticleKeyword[]>([]);
  const [articles, setArticles] = useState<{ id: string; title: string; slug: string }[]>([]);
  const [alerts, setAlerts] = useState<RankingAlert[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [selectedArticle, setSelectedArticle] = useState('');
  const [selectedKeyword, setSelectedKeyword] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [newIsPrimary, setNewIsPrimary] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [manualPosition, setManualPosition] = useState('');
  const [manualKeyword, setManualKeyword] = useState('');
  const [manualArticleId, setManualArticleId] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch articles
      const { data: articleData } = await supabase
        .from('blog_posts')
        .select('id, title, slug')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      setArticles(articleData || []);

      // Fetch keywords with article info
      const { data: kwData } = await supabase
        .from('article_keywords')
        .select('*')
        .order('is_primary', { ascending: false });

      // Enrich with article titles
      const enriched = (kwData || []).map(kw => ({
        ...kw,
        article_title: (articleData || []).find(a => a.id === kw.article_id)?.title || 'Artigo removido',
      }));
      setKeywords(enriched);

      // Fetch alerts
      const { data: alertData } = await supabase
        .from('ranking_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      setAlerts(alertData || []);

      // Fetch dashboard via edge function
      const { data: dashData, error } = await supabase.functions.invoke('check-google-ranking', {
        body: { action: 'get_dashboard' },
      });

      if (!error && dashData) setDashboardData(dashData);

    } catch (err) {
      console.error('Error fetching ranking data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addKeyword = async () => {
    if (!selectedArticle || !newKeyword.trim()) {
      toast.error('Selecione um artigo e digite uma keyword');
      return;
    }

    const { error } = await supabase.from('article_keywords').insert({
      article_id: selectedArticle,
      keyword: newKeyword.toLowerCase().trim(),
      is_primary: newIsPrimary,
    });

    if (error) {
      if (error.code === '23505') toast.error('Keyword já cadastrada para este artigo');
      else toast.error('Erro ao adicionar keyword');
      return;
    }

    toast.success('Keyword adicionada!');
    setNewKeyword('');
    setNewIsPrimary(false);
    fetchData();
  };

  const removeKeyword = async (id: string) => {
    await supabase.from('article_keywords').delete().eq('id', id);
    toast.success('Keyword removida');
    fetchData();
  };

  const checkRankings = async () => {
    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-google-ranking', {
        body: { action: 'check_ranking' },
      });

      if (error) throw error;
      toast.success(`Ranking verificado! ${data?.total || 0} keywords checadas`);
      fetchData();
    } catch (err: any) {
      toast.error('Erro ao verificar ranking: ' + err.message);
    } finally {
      setChecking(false);
    }
  };

  const saveManualPosition = async () => {
    if (!manualArticleId || !manualKeyword || !manualPosition) {
      toast.error('Preencha todos os campos');
      return;
    }

    const { data: lastRanking } = await supabase
      .from('ranking_tracking')
      .select('position')
      .eq('article_id', manualArticleId)
      .eq('keyword', manualKeyword)
      .order('checked_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error } = await supabase.from('ranking_tracking').insert({
      article_id: manualArticleId,
      keyword: manualKeyword,
      position: parseInt(manualPosition),
      device: 'desktop',
      previous_position: lastRanking?.position || null,
    });

    if (error) {
      toast.error('Erro ao salvar posição');
      return;
    }

    toast.success('Posição salva!');
    setManualPosition('');
    fetchData();
  };

  const loadHistory = async (keyword: string) => {
    setSelectedKeyword(keyword);
    const { data } = await supabase
      .from('ranking_tracking')
      .select('*')
      .eq('keyword', keyword)
      .order('checked_at', { ascending: true })
      .limit(60);

    const chartData = (data || []).map(r => ({
      date: new Date(r.checked_at).toLocaleDateString('pt-BR'),
      position: r.position,
    }));
    setHistoryData(chartData);
  };

  const markAlertRead = async (id: string) => {
    await supabase.from('ranking_alerts').update({ is_read: true }).eq('id', id);
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const getPositionBadge = (pos: number | null) => {
    if (pos === null) return <Badge variant="outline" className="text-muted-foreground">N/A</Badge>;
    if (pos <= 3) return <Badge className="bg-yellow-500 text-black">🏆 #{pos}</Badge>;
    if (pos <= 10) return <Badge className="bg-green-600 text-white">#{pos}</Badge>;
    if (pos <= 20) return <Badge className="bg-blue-500 text-white">#{pos}</Badge>;
    if (pos <= 50) return <Badge className="bg-orange-500 text-white">#{pos}</Badge>;
    return <Badge variant="destructive">#{pos}</Badge>;
  };

  const getChangeIcon = (change: number | null) => {
    if (change === null) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (change > 0) return <span className="flex items-center text-green-500"><ArrowUp className="h-4 w-4" /> +{change}</span>;
    if (change < 0) return <span className="flex items-center text-red-500"><ArrowDown className="h-4 w-4" /> {change}</span>;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const unreadAlerts = alerts.filter(a => !a.is_read);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-6 w-6 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{dashboardData?.totalKeywords || keywords.length}</div>
            <p className="text-xs text-muted-foreground">Keywords Rastreadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold">{dashboardData?.top10?.length || 0}</div>
            <p className="text-xs text-muted-foreground">No Top 10</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{dashboardData?.totalTracked || 0}</div>
            <p className="text-xs text-muted-foreground">Com Posição</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Bell className="h-6 w-6 mx-auto mb-2 text-red-500" />
            <div className="text-2xl font-bold">{unreadAlerts.length}</div>
            <p className="text-xs text-muted-foreground">Alertas</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Banner */}
      {unreadAlerts.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Alertas de Ranking ({unreadAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {unreadAlerts.slice(0, 5).map(alert => (
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

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="flex-wrap h-auto p-1">
          <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
          <TabsTrigger value="keywords">🔑 Keywords</TabsTrigger>
          <TabsTrigger value="manual">✏️ Entrada Manual</TabsTrigger>
          <TabsTrigger value="history">📈 Histórico</TabsTrigger>
        </TabsList>

        {/* DASHBOARD TAB */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Monitoramento de Rankings</h3>
            <Button onClick={checkRankings} disabled={checking} size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Verificando...' : 'Verificar Agora'}
            </Button>
          </div>

          {/* Top 10 */}
          {dashboardData?.top10?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">🏆 Top 10 no Google</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Keyword</TableHead>
                      <TableHead>Posição</TableHead>
                      <TableHead>Última verificação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboardData.top10.map((r: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{r.keyword}</TableCell>
                        <TableCell>{getPositionBadge(r.position)}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {new Date(r.checked_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Opportunities */}
          {dashboardData?.opportunities?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">💡 Oportunidades de Melhoria (posição {'>'} 20)</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Keyword</TableHead>
                      <TableHead>Posição</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboardData.opportunities.slice(0, 10).map((r: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell>{r.keyword}</TableCell>
                        <TableCell>{getPositionBadge(r.position)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {!dashboardData?.top10?.length && !dashboardData?.opportunities?.length && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Nenhum dado de ranking ainda</p>
                <p className="text-sm mt-1">Adicione keywords e execute uma verificação ou insira posições manualmente.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* KEYWORDS TAB */}
        <TabsContent value="keywords" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Adicionar Keyword</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Select value={selectedArticle} onValueChange={setSelectedArticle}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar artigo..." />
                </SelectTrigger>
                <SelectContent>
                  {articles.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.title.substring(0, 60)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Input
                  value={newKeyword}
                  onChange={e => setNewKeyword(e.target.value)}
                  placeholder="Ex: preço da sucata hoje"
                  onKeyDown={e => e.key === 'Enter' && addKeyword()}
                />
                <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={newIsPrimary}
                    onChange={e => setNewIsPrimary(e.target.checked)}
                  />
                  Principal
                </label>
                <Button onClick={addKeyword} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Keywords Cadastradas ({keywords.length})</CardTitle></CardHeader>
            <CardContent>
              {keywords.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma keyword cadastrada</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Keyword</TableHead>
                      <TableHead>Artigo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {keywords.map(kw => (
                      <TableRow key={kw.id}>
                        <TableCell className="font-medium">{kw.keyword}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {kw.article_title}
                        </TableCell>
                        <TableCell>
                          {kw.is_primary ? (
                            <Badge className="bg-primary text-primary-foreground">Principal</Badge>
                          ) : (
                            <Badge variant="outline">Secundária</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => removeKeyword(kw.id)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* MANUAL ENTRY TAB */}
        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Registrar Posição Manual</CardTitle>
              <p className="text-xs text-muted-foreground">
                Pesquise no Google em aba anônima e registre a posição encontrada.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={manualArticleId} onValueChange={v => {
                setManualArticleId(v);
                const articleKws = keywords.filter(k => k.article_id === v);
                if (articleKws.length > 0) setManualKeyword(articleKws[0].keyword);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar artigo..." />
                </SelectTrigger>
                <SelectContent>
                  {articles.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.title.substring(0, 60)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={manualKeyword} onValueChange={setManualKeyword}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar keyword..." />
                </SelectTrigger>
                <SelectContent>
                  {keywords
                    .filter(k => !manualArticleId || k.article_id === manualArticleId)
                    .map(k => (
                      <SelectItem key={k.id} value={k.keyword}>{k.keyword}</SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Input
                  type="number"
                  value={manualPosition}
                  onChange={e => setManualPosition(e.target.value)}
                  placeholder="Posição (ex: 5)"
                  min={1}
                  max={100}
                />
                <Button onClick={saveManualPosition}>
                  <Eye className="h-4 w-4 mr-2" /> Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HISTORY TAB */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Histórico de Posição</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Select value={selectedKeyword} onValueChange={loadHistory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar keyword..." />
                </SelectTrigger>
                <SelectContent>
                  {[...new Set(keywords.map(k => k.keyword))].map(kw => (
                    <SelectItem key={kw} value={kw}>{kw}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {historyData.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis reversed domain={[1, 'auto']} tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: any) => [`#${value}`, 'Posição']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="position" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Selecione uma keyword para ver o histórico de posição.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RankingMonitorPanel;
