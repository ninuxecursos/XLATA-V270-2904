import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { RefreshCw, Eye, MousePointer, TrendingUp, Users, Trophy } from 'lucide-react';
import { toast } from 'sonner';

const profileLabels: Record<string, { label: string; emoji: string }> = {
  buyer: { label: 'Comprador', emoji: '🟢' },
  interested: { label: 'Interessado', emoji: '🟡' },
  curious: { label: 'Curioso', emoji: '🔵' },
  problem: { label: 'Problema', emoji: '🔴' },
  owner: { label: 'Dono', emoji: '🟣' },
  beginner: { label: 'Iniciante', emoji: '🟠' },
};

const elementLabels: Record<string, string> = {
  headline: 'Título',
  cta_text: 'Botão CTA',
  cta_subtitle: 'Subtítulo CTA',
  argument: 'Argumento',
};

export const AdaptiveCopyPanel = () => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const { data: variations, isLoading } = useQuery({
    queryKey: ['copy-variations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('copy_variations')
        .select('*')
        .order('profile_type')
        .order('element_type');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: abStats } = useQuery({
    queryKey: ['ab-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('copy_ab_events')
        .select('variation_id, event_type');
      if (error) throw error;

      const stats: Record<string, { impressions: number; clicks: number }> = {};
      data?.forEach((e: any) => {
        if (!stats[e.variation_id]) stats[e.variation_id] = { impressions: 0, clicks: 0 };
        if (e.event_type === 'impression') stats[e.variation_id].impressions++;
        if (e.event_type === 'click') stats[e.variation_id].clicks++;
      });
      return stats;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { error } = await supabase
        .from('copy_variations')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Copy atualizada');
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['copy-variations'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Group by profile
  const grouped = (variations || []).reduce((acc: Record<string, any[]>, v: any) => {
    if (!acc[v.profile_type]) acc[v.profile_type] = [];
    acc[v.profile_type].push(v);
    return acc;
  }, {});

  // Overall stats
  const totalImpressions = Object.values(abStats || {}).reduce((s: number, v: any) => s + v.impressions, 0);
  const totalClicks = Object.values(abStats || {}).reduce((s: number, v: any) => s + v.clicks, 0);
  const overallCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground">Copy Adaptativa</h3>
        <p className="text-sm text-muted-foreground">Personalize CTAs por perfil de visitante com A/B testing</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="p-3 text-center">
            <Eye className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-xl font-bold text-foreground">{totalImpressions}</p>
            <p className="text-xs text-muted-foreground">Impressões</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3 text-center">
            <MousePointer className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-xl font-bold text-foreground">{totalClicks}</p>
            <p className="text-xs text-muted-foreground">Cliques</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3 text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-xl font-bold text-foreground">{overallCTR}%</p>
            <p className="text-xs text-muted-foreground">CTR Geral</p>
          </CardContent>
        </Card>
      </div>

      {/* Profiles */}
      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">Carregando...</p>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([profileType, items]) => {
            const config = profileLabels[profileType] || { label: profileType, emoji: '⚪' };
            return (
              <Card key={profileType} className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span>{config.emoji}</span>
                    <span>{config.label}</span>
                    <Badge variant="outline" className="text-xs ml-auto">{(items as any[]).length} variações</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(items as any[]).map((v: any) => {
                      const stats = abStats?.[v.id] || { impressions: 0, clicks: 0 };
                      const ctr = stats.impressions > 0 ? ((stats.clicks / stats.impressions) * 100).toFixed(1) : '0';
                      const isEditing = editingId === v.id;

                      return (
                        <div key={v.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 border border-border">
                          <Badge variant="outline" className="text-xs shrink-0 w-20 justify-center">
                            {elementLabels[v.element_type] || v.element_type}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            {isEditing ? (
                              <div className="flex gap-2">
                                <Input
                                  value={editContent}
                                  onChange={e => setEditContent(e.target.value)}
                                  className="text-sm h-8"
                                />
                                <Button size="sm" variant="outline" className="h-8"
                                  onClick={() => updateMutation.mutate({ id: v.id, content: editContent })}>
                                  Salvar
                                </Button>
                              </div>
                            ) : (
                              <p
                                className="text-sm text-foreground truncate cursor-pointer hover:text-primary"
                                onClick={() => { setEditingId(v.id); setEditContent(v.content); }}
                              >
                                {v.content}
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0 text-xs text-muted-foreground">
                            <span>{stats.impressions} imp</span>
                            <span className="mx-1">·</span>
                            <span>{ctr}% CTR</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
