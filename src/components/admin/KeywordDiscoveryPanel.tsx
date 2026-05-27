import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Search, TrendingUp, Target, Zap, Plus, RefreshCw, CheckCircle, Star } from 'lucide-react';

interface KeywordOpportunity {
  id: string;
  keyword: string;
  variations: string[];
  category: string;
  intent: string;
  opportunity_score: number;
  traffic_potential: number;
  competition_level: number;
  purchase_intent: number;
  suggested_title: string;
  suggested_slug: string;
  has_existing_article: boolean;
  is_added_to_bank: boolean;
  status: string;
  discovered_at: string;
}

interface Stats {
  total: number;
  new_count: number;
  approved: number;
  added_to_bank: number;
  avg_score: number;
  high_potential: number;
  content_gaps: number;
  by_category: Record<string, number>;
}

export const KeywordDiscoveryPanel = () => {
  const [opportunities, setOpportunities] = useState<KeywordOpportunity[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('discover-keywords', {
        body: { action: 'get_dashboard' },
      });
      if (error) throw error;
      if (data.success) {
        setStats(data.stats);
        setOpportunities(data.opportunities || []);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  const handleDiscover = async () => {
    setDiscovering(true);
    try {
      const { data, error } = await supabase.functions.invoke('discover-keywords', {
        body: { action: 'discover' },
      });
      if (error) throw error;
      if (data.success) {
        toast({ title: 'Sucesso!', description: `${data.discovered} novas oportunidades descobertas` });
        await loadDashboard();
      } else {
        toast({ title: 'Erro', description: data.error, variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setDiscovering(false);
    }
  };

  const handleAddToBank = async (id: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('discover-keywords', {
        body: { action: 'add_to_bank', opportunity_id: id },
      });
      if (error) throw error;
      if (data.success) {
        toast({ title: 'Adicionado!', description: 'Keyword adicionada ao banco de temas' });
        await loadDashboard();
      }
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from('keyword_opportunities' as any)
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) {
      toast({ title: 'Aprovada!' });
      await loadDashboard();
    }
  };

  const handleReject = async (id: string) => {
    const { error } = await supabase
      .from('keyword_opportunities' as any)
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) {
      toast({ title: 'Rejeitada' });
      await loadDashboard();
    }
  };

  const filtered = opportunities.filter(o => {
    if (filter !== 'all' && o.status !== filter) return false;
    if (categoryFilter !== 'all' && o.category !== categoryFilter) return false;
    return true;
  });

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getCategoryBadge = (cat: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      comercial: { label: '💰 Comercial', variant: 'default' },
      informacional: { label: '📖 Informacional', variant: 'secondary' },
      local: { label: '📍 Local', variant: 'outline' },
      problema_dor: { label: '🔥 Problema/Dor', variant: 'destructive' },
    };
    const info = map[cat] || { label: cat, variant: 'secondary' as const };
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  const getIntentBadge = (intent: string) => {
    const map: Record<string, string> = {
      compra: '🛒 Compra',
      informacional: '📚 Info',
      navegacional: '🧭 Nav',
      transacional: '💳 Trans',
    };
    return <Badge variant="outline" className="text-xs">{map[intent] || intent}</Badge>;
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">🔍 Descoberta de Keywords</h2>
          <p className="text-sm text-muted-foreground">Detecte oportunidades de palavras-chave com potencial de tráfego e conversão</p>
        </div>
        <Button onClick={handleDiscover} disabled={discovering}>
          {discovering ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
          {discovering ? 'Descobrindo...' : 'Descobrir Keywords'}
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total descobertas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.high_potential}</p>
                  <p className="text-xs text-muted-foreground">Alto potencial (70+)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-400" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.content_gaps}</p>
                  <p className="text-xs text-muted-foreground">Gaps de conteúdo</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.avg_score}</p>
                  <p className="text-xs text-muted-foreground">Score médio</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category breakdown */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-primary/20">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-foreground">{stats.by_category.comercial || 0}</p>
              <p className="text-xs text-muted-foreground">💰 Comercial</p>
            </CardContent>
          </Card>
          <Card className="border-orange-500/20">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-foreground">{stats.by_category.problema_dor || 0}</p>
              <p className="text-xs text-muted-foreground">🔥 Problema/Dor</p>
            </CardContent>
          </Card>
          <Card className="border-blue-500/20">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-foreground">{stats.by_category.local || 0}</p>
              <p className="text-xs text-muted-foreground">📍 Local</p>
            </CardContent>
          </Card>
          <Card className="border-muted">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-foreground">{stats.by_category.informacional || 0}</p>
              <p className="text-xs text-muted-foreground">📖 Informacional</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="new">Novas</SelectItem>
            <SelectItem value="approved">Aprovadas</SelectItem>
            <SelectItem value="added_to_bank">No Banco</SelectItem>
            <SelectItem value="rejected">Rejeitadas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="comercial">Comercial</SelectItem>
            <SelectItem value="problema_dor">Problema/Dor</SelectItem>
            <SelectItem value="local">Local</SelectItem>
            <SelectItem value="informacional">Informacional</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Oportunidades ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Keyword</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Intenção</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead>Título Sugerido</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhuma oportunidade encontrada. Clique em "Descobrir Keywords" para começar.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((opp) => (
                  <TableRow key={opp.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{opp.keyword}</p>
                        {opp.variations?.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {opp.variations.slice(0, 3).join(', ')}
                          </p>
                        )}
                        {opp.has_existing_article && (
                          <Badge variant="outline" className="mt-1 text-xs text-green-400 border-green-400/30">
                            Já tem artigo
                          </Badge>
                        )}
                        {!opp.has_existing_article && opp.opportunity_score >= 50 && (
                          <Badge variant="outline" className="mt-1 text-xs text-orange-400 border-orange-400/30">
                            Gap de conteúdo
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getCategoryBadge(opp.category)}</TableCell>
                    <TableCell>{getIntentBadge(opp.intent)}</TableCell>
                    <TableCell className="text-center">
                      <span className={`text-lg font-bold ${getScoreColor(opp.opportunity_score)}`}>
                        {opp.opportunity_score}
                      </span>
                      <div className="flex gap-1 mt-1 justify-center">
                        <span className="text-[10px] text-muted-foreground" title="Tráfego">📈{opp.traffic_potential}</span>
                        <span className="text-[10px] text-muted-foreground" title="Concorrência">⚔️{opp.competition_level}</span>
                        <span className="text-[10px] text-muted-foreground" title="Compra">🛒{opp.purchase_intent}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-foreground max-w-[250px] truncate">{opp.suggested_title}</p>
                    </TableCell>
                    <TableCell>
                      {opp.status === 'new' && <Badge variant="secondary">Nova</Badge>}
                      {opp.status === 'approved' && <Badge className="bg-blue-600">Aprovada</Badge>}
                      {opp.status === 'added_to_bank' && <Badge className="bg-green-600">No Banco</Badge>}
                      {opp.status === 'rejected' && <Badge variant="destructive">Rejeitada</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {opp.status === 'new' && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => handleApprove(opp.id)} title="Aprovar">
                              <CheckCircle className="h-4 w-4 text-green-400" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleReject(opp.id)} title="Rejeitar">
                              ✕
                            </Button>
                          </>
                        )}
                        {(opp.status === 'new' || opp.status === 'approved') && !opp.is_added_to_bank && (
                          <Button size="sm" variant="outline" onClick={() => handleAddToBank(opp.id)} title="Adicionar ao banco">
                            <Plus className="h-4 w-4 mr-1" /> Banco
                          </Button>
                        )}
                      </div>
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
