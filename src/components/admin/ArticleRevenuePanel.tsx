import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Users, Eye, TrendingUp, RefreshCw, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

const classificationConfig: Record<string, { label: string; emoji: string; color: string }> = {
  high_revenue: { label: 'Alto Retorno', emoji: '💰', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  medium_revenue: { label: 'Médio Retorno', emoji: '📊', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  high_traffic: { label: 'Alto Tráfego', emoji: '📈', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  low_performance: { label: 'Baixo Desempenho', emoji: '⚠️', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

export const ArticleRevenuePanel = () => {
  const queryClient = useQueryClient();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['article-revenue-dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('calculate-article-revenue', {
        body: { action: 'get_dashboard' },
      });
      if (error) throw error;
      return data;
    },
  });

  const calculateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('calculate-article-revenue', {
        body: { action: 'calculate_all' },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`${data.articles_processed} artigos processados`);
      queryClient.invalidateQueries({ queryKey: ['article-revenue-dashboard'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const dashboard = dashboardData?.dashboard;
  const articles = dashboardData?.articles || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">Receita por Artigo</h3>
          <p className="text-sm text-muted-foreground">Quais artigos geram clientes pagantes</p>
        </div>
        <Button onClick={() => calculateMutation.mutate()} disabled={calculateMutation.isPending} size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${calculateMutation.isPending ? 'animate-spin' : ''}`} />
          Recalcular
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <DollarSign className="h-6 w-6 mx-auto mb-2 text-green-400" />
            <p className="text-2xl font-bold text-foreground">
              R$ {(dashboard?.total_revenue || 0).toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground">Receita Total</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-blue-400" />
            <p className="text-2xl font-bold text-foreground">{dashboard?.total_customers || 0}</p>
            <p className="text-xs text-muted-foreground">Clientes Gerados</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <Eye className="h-6 w-6 mx-auto mb-2 text-purple-400" />
            <p className="text-2xl font-bold text-foreground">{dashboard?.total_views || 0}</p>
            <p className="text-xs text-muted-foreground">Views Totais</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-yellow-400" />
            <p className="text-2xl font-bold text-foreground">{dashboard?.avg_conversion || 0}%</p>
            <p className="text-xs text-muted-foreground">Conversão Média</p>
          </CardContent>
        </Card>
      </div>

      {/* Classification Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-green-400">💰 {dashboard?.high_revenue_count || 0}</p>
            <p className="text-xs text-muted-foreground">Alto Retorno</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-blue-400">📈 {dashboard?.high_traffic_count || 0}</p>
            <p className="text-xs text-muted-foreground">Alto Tráfego</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/5 border-red-500/20">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-red-400">⚠️ {dashboard?.low_performance_count || 0}</p>
            <p className="text-xs text-muted-foreground">Baixo Desempenho</p>
          </CardContent>
        </Card>
      </div>

      {/* Articles Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm">Detalhamento por Artigo</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : articles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-2">Nenhum dado de receita ainda</p>
              <Button onClick={() => calculateMutation.mutate()} size="sm" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Calcular agora
              </Button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {articles.map((article: any) => {
                const config = classificationConfig[article.classification] || classificationConfig.low_performance;
                return (
                  <div key={article.id} className="flex items-start justify-between p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={`text-xs ${config.color}`}>
                          {config.emoji} {config.label}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">
                        {article.blog_posts?.title || 'Artigo'}
                      </p>
                      {article.insight && (
                        <div className="flex items-start gap-1 mt-1">
                          <Lightbulb className="h-3 w-3 text-yellow-400 mt-0.5 shrink-0" />
                          <p className="text-xs text-muted-foreground">{article.insight}</p>
                        </div>
                      )}
                    </div>
                    <div className="text-right ml-4 shrink-0 space-y-0.5">
                      <p className="text-sm font-bold text-green-400">R$ {(article.revenue_generated || 0).toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">{article.views || 0} views</p>
                      <p className="text-xs text-muted-foreground">{article.paying_customers || 0} clientes</p>
                      <p className="text-xs text-muted-foreground">{article.conversion_rate || 0}% conv.</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
