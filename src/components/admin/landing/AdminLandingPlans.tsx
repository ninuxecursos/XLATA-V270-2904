import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Save, Plus, Trash2, Loader2, Star, GripVertical } from 'lucide-react';

interface PlanItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  period_days: number;
  is_active: boolean;
  is_popular: boolean;
  display_order: number;
  features: string[];
  badge_text: string | null;
  savings: string | null;
}

export function AdminLandingPlans() {
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<PlanItem | null>(null);
  const [newFeature, setNewFeature] = useState('');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('display_order');
      if (error) throw error;
      return data.map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features : [],
      })) as PlanItem[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (item: Partial<PlanItem>) => {
      const { error } = await supabase
        .from('subscription_plans')
        .update({
          name: item.name,
          description: item.description,
          price: item.price,
          period_days: item.period_days,
          is_active: item.is_active,
          is_popular: item.is_popular,
          display_order: item.display_order,
          features: item.features,
          badge_text: item.badge_text,
          savings: item.savings,
        })
        .eq('id', item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscription-plans'] });
      toast.success('Plano salvo!');
      setEditingItem(null);
    },
    onError: () => toast.error('Erro ao salvar'),
  });

  const toggleActive = async (item: PlanItem) => {
    const { error } = await supabase
      .from('subscription_plans')
      .update({ is_active: !item.is_active })
      .eq('id', item.id);
    
    if (error) {
      toast.error('Erro ao atualizar');
    } else {
      queryClient.invalidateQueries({ queryKey: ['admin-subscription-plans'] });
      toast.success('Atualizado!');
    }
  };

  const togglePopular = async (item: PlanItem) => {
    // First, remove popular from all
    await supabase.from('subscription_plans').update({ is_popular: false }).neq('id', '');
    
    // Then set this one as popular
    const { error } = await supabase
      .from('subscription_plans')
      .update({ is_popular: !item.is_popular })
      .eq('id', item.id);
    
    if (error) {
      toast.error('Erro ao atualizar');
    } else {
      queryClient.invalidateQueries({ queryKey: ['admin-subscription-plans'] });
      toast.success('Atualizado!');
    }
  };

  const addFeature = () => {
    if (!newFeature.trim() || !editingItem) return;
    setEditingItem({
      ...editingItem,
      features: [...(editingItem.features || []), newFeature.trim()],
    });
    setNewFeature('');
  };

  const removeFeature = (index: number) => {
    if (!editingItem) return;
    setEditingItem({
      ...editingItem,
      features: editingItem.features.filter((_, i) => i !== index),
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const formatPeriod = (days: number) => {
    if (days === 7) return '7 dias';
    if (days === 30) return '1 mês';
    if (days === 90) return '3 meses';
    if (days === 180) return '6 meses';
    if (days === 365) return '1 ano';
    if (days === 1095) return '3 anos';
    return `${days} dias`;
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Planos de Assinatura</h3>
          <p className="text-sm text-slate-400">Gerencie os planos exibidos na landing page</p>
        </div>
      </div>

      {/* Plans List */}
      <div className="grid gap-4">
        {items.map((item) => (
          <Card key={item.id} className={`bg-slate-800 border-slate-700 ${!item.is_active ? 'opacity-50' : ''} ${item.is_popular ? 'border-emerald-500' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <GripVertical className="w-5 h-5 text-slate-500" />
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-white">{item.name}</h4>
                    {item.is_popular && (
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400">
                    {formatPrice(item.price)} / {formatPeriod(item.period_days)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs text-slate-500">Destaque</span>
                    <Switch checked={item.is_popular} onCheckedChange={() => togglePopular(item)} />
                  </div>
                  
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs text-slate-500">Ativo</span>
                    <Switch checked={item.is_active} onCheckedChange={() => toggleActive(item)} />
                  </div>
                  
                  <Button variant="ghost" size="sm" onClick={() => setEditingItem(item)}>
                    Editar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <Card className="bg-slate-800 border-emerald-500">
          <CardHeader>
            <CardTitle className="text-white">Editar Plano: {editingItem.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Nome do Plano</label>
                <Input
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Preço (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingItem.price}
                  onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || 0 })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Período (dias)</label>
                <Input
                  type="number"
                  value={editingItem.period_days}
                  onChange={(e) => setEditingItem({ ...editingItem, period_days: parseInt(e.target.value) || 30 })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-300">Descrição</label>
              <Textarea
                value={editingItem.description || ''}
                onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                rows={2}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Badge (opcional)</label>
                <Input
                  value={editingItem.badge_text || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, badge_text: e.target.value })}
                  placeholder="Ex: Mais Popular"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Economia (opcional)</label>
                <Input
                  value={editingItem.savings || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, savings: e.target.value })}
                  placeholder="Ex: Economize R$ 65,80"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Benefícios do Plano</label>
              <div className="space-y-2">
                {editingItem.features?.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="flex-1 text-sm text-slate-300 bg-slate-700 px-3 py-2 rounded">
                      ✓ {feature}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFeature(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Adicionar benefício..."
                  className="bg-slate-700 border-slate-600 text-white"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                />
                <Button type="button" onClick={addFeature} variant="outline" className="border-slate-600">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={() => saveMutation.mutate(editingItem)} 
                disabled={saveMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Salvar
              </Button>
              <Button variant="outline" onClick={() => setEditingItem(null)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Text */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <p className="text-slate-400 text-sm">
          💡 <strong>Dica:</strong> Apenas um plano pode ter o destaque "Popular" ativo por vez. 
          Os planos inativos não aparecem na landing page.
        </p>
      </div>
    </div>
  );
}
