import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Zap, TrendingUp, BarChart3, RefreshCw, ChevronRight, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

const variationLabels: Record<string, string> = {
  city: '🏙️ Cidade',
  material: '🔩 Material',
  problem: '⚠️ Problema',
  question: '❓ Pergunta',
  comparative: '⚖️ Comparativo',
};

export const ContentScalerPanel = () => {
  const queryClient = useQueryClient();
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);

  const { data: moneyPages, isLoading: loadingPages } = useQuery({
    queryKey: ['money-pages'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('scale-content', {
        body: { action: 'get_money_pages' },
      });
      if (error) throw error;
      return data?.money_pages || [];
    },
  });

  const { data: dashboardData } = useQuery({
    queryKey: ['scaler-dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('scale-content', {
        body: { action: 'get_dashboard' },
      });
      if (error) throw error;
      return data;
    },
  });

  const { data: suggestions } = useQuery({
    queryKey: ['scale-suggestions', selectedArticle],
    queryFn: async () => {
      if (!selectedArticle) return [];
      const { data, error } = await supabase.functions.invoke('scale-content', {
        body: { action: 'suggest_variations', article_id: selectedArticle },
      });
      if (error) throw error;
      return data?.suggestions || [];
    },
    enabled: !!selectedArticle,
  });

  const scaleMutation = useMutation({
    mutationFn: async (params: { source_article_id: string; variation_type: string; variation_keyword: string }) => {
      const { data, error } = await supabase.functions.invoke('scale-content', {
        body: { action: 'scale_article', ...params },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Artigo criado: ${data.title} (${data.word_count} palavras)`);
      queryClient.invalidateQueries({ queryKey: ['scaler-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['scale-suggestions'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const dashboard = dashboardData?.dashboard;
  const scaledArticles = dashboardData?.articles || [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground">Escalador de Conteúdo</h3>
        <p className="text-sm text-muted-foreground">Replique artigos validados que geram receita</p>
      </div>

      <Tabs defaultValue="money-pages" className="w-full">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="money-pages">💰 Money Pages</TabsTrigger>
          <TabsTrigger value="scale">🚀 Escalar</TabsTrigger>
          <TabsTrigger value="history">📊 Histórico</TabsTrigger>
        </TabsList>

        {/* Money Pages Tab */}
        <TabsContent value="money-pages" className="mt-4 space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-card border-border">
              <CardContent className="p-3 text-center">
                <Copy className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-xl font-bold text-foreground">{dashboard?.total_scaled || 0}</p>
                <p className="text-xs text-muted-foreground">Artigos Escalados</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-3 text-center">
                <Zap className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-xl font-bold text-foreground">{dashboard?.published || 0}</p>
                <p className="text-xs text-muted-foreground">Publicados</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-3 text-center">
                <DollarSign className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-xl font-bold text-foreground">{moneyPages?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Money Pages</p>
              </CardContent>
            </Card>
          </div>

          {/* Money Pages List */}
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-sm">Artigos Validados (Geram Receita)</CardTitle></CardHeader>
            <CardContent>
              {loadingPages ? (
                <p className="text-center text-muted-foreground py-4">Carregando...</p>
              ) : !moneyPages?.length ? (
                <p className="text-center text-muted-foreground py-4">Nenhum artigo com receita comprovada ainda. Calcule a receita na aba "Receita" primeiro.</p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {moneyPages.map((mp: any) => (
                    <div
                      key={mp.id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedArticle === mp.article_id
                          ? 'bg-primary/10 border-primary/30'
                          : 'bg-muted/30 border-border hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedArticle(mp.article_id)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{mp.blog_posts?.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">R$ {(mp.revenue_generated || 0).toFixed(0)}</Badge>
                          <Badge variant="outline" className="text-xs">{mp.paying_customers || 0} clientes</Badge>
                          <Badge variant="outline" className="text-xs">{mp.scaled_total || 0} escalados</Badge>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scale Tab */}
        <TabsContent value="scale" className="mt-4 space-y-4">
          {!selectedArticle ? (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Selecione um artigo validado na aba "Money Pages" para ver variações sugeridas.</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border">
              <CardHeader><CardTitle className="text-sm">Variações Sugeridas</CardTitle></CardHeader>
              <CardContent>
                {!suggestions?.length ? (
                  <p className="text-center text-muted-foreground py-4">Carregando sugestões...</p>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {suggestions.map((s: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {variationLabels[s.variation_type] || s.variation_type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{s.variation_keyword}</span>
                          </div>
                          <p className="text-sm text-foreground truncate">{s.suggested_title}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => scaleMutation.mutate({
                            source_article_id: selectedArticle,
                            variation_type: s.variation_type,
                            variation_keyword: s.variation_keyword,
                          })}
                          disabled={scaleMutation.isPending}
                        >
                          {scaleMutation.isPending ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                          <span className="ml-1">Gerar</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-4 space-y-4">
          {/* By Type */}
          {dashboard?.by_type && Object.keys(dashboard.by_type).length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {Object.entries(dashboard.by_type).map(([type, count]) => (
                <Card key={type} className="bg-card border-border">
                  <CardContent className="p-2 text-center">
                    <p className="text-sm font-bold text-foreground">{count as number}</p>
                    <p className="text-xs text-muted-foreground">{variationLabels[type] || type}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-sm">Artigos Escalados</CardTitle></CardHeader>
            <CardContent>
              {!scaledArticles.length ? (
                <p className="text-center text-muted-foreground py-4">Nenhum artigo escalado ainda</p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {scaledArticles.map((sa: any) => (
                    <div key={sa.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">
                          Origem: {sa.source?.title || 'N/A'}
                        </p>
                        <p className="text-sm font-medium text-foreground truncate">
                          → {sa.generated?.title || 'Gerando...'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{variationLabels[sa.variation_type] || sa.variation_type}</Badge>
                          <Badge variant="outline" className="text-xs">{sa.variation_keyword}</Badge>
                          <Badge variant="outline" className={`text-xs ${sa.status === 'generated' ? 'border-green-500/30 text-green-400' : ''}`}>
                            {sa.status}
                          </Badge>
                        </div>
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
