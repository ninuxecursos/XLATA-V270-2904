import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Save, Plus, Trash2, Loader2, GripVertical } from 'lucide-react';

interface KPIItem {
  id: string;
  value: string;
  label: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  display_order: number;
}

export function AdminLandingKPIs() {
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<KPIItem | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-landing-kpis'],
    queryFn: async () => {
      const { data, error } = await supabase.from('landing_kpis').select('*').order('display_order');
      if (error) throw error;
      return data as KPIItem[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (item: Partial<KPIItem>) => {
      if (item.id) {
        const { error } = await supabase.from('landing_kpis').update(item).eq('id', item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('landing_kpis').insert({ value: item.value, label: item.label, description: item.description, icon: item.icon, is_active: item.is_active, display_order: items.length + 1 });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-landing-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['landing-kpis'] });
      toast.success('Salvo!');
      setEditingItem(null);
    },
    onError: () => toast.error('Erro ao salvar'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('landing_kpis').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-landing-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['landing-kpis'] });
      toast.success('Removido!');
    },
  });

  const handleNew = () => {
    setEditingItem({ id: '', value: '', label: '', description: null, icon: 'Zap', is_active: true, display_order: items.length + 1 });
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">KPIs (O XLata resolve)</h3>
        <Button onClick={handleNew} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" /> Adicionar</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <Card key={item.id} className={`bg-slate-800 border-slate-700 ${!item.is_active ? 'opacity-50' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-emerald-400">{item.value}</span>
                <Switch checked={item.is_active} onCheckedChange={() => saveMutation.mutate({ id: item.id, is_active: !item.is_active })} />
              </div>
              <p className="text-white font-medium">{item.label}</p>
              {item.description && <p className="text-sm text-slate-400">{item.description}</p>}
              <div className="flex gap-2 mt-3">
                <Button variant="ghost" size="sm" onClick={() => setEditingItem(item)}>Editar</Button>
                <Button variant="ghost" size="sm" className="text-red-400" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingItem && (
        <Card className="bg-slate-800 border-emerald-500">
          <CardHeader><CardTitle className="text-white">{editingItem.id ? 'Editar' : 'Novo'} KPI</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Valor (ex: +300%)</label>
                <Input value={editingItem.value} onChange={(e) => setEditingItem(prev => prev ? { ...prev, value: e.target.value } : null)} className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Label</label>
                <Input value={editingItem.label} onChange={(e) => setEditingItem(prev => prev ? { ...prev, label: e.target.value } : null)} placeholder="Produtividade" className="bg-slate-700 border-slate-600 text-white" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Descrição (opcional)</label>
                <Input value={editingItem.description || ''} onChange={(e) => setEditingItem(prev => prev ? { ...prev, description: e.target.value } : null)} className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Ícone</label>
                <Input value={editingItem.icon || ''} onChange={(e) => setEditingItem(prev => prev ? { ...prev, icon: e.target.value } : null)} placeholder="TrendingUp, CheckCircle, Heart" className="bg-slate-700 border-slate-600 text-white" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => saveMutation.mutate(editingItem)} disabled={saveMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Salvar
              </Button>
              <Button variant="outline" onClick={() => setEditingItem(null)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
