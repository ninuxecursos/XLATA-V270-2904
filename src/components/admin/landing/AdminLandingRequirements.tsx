import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Save, Plus, Trash2, Loader2, GripVertical } from 'lucide-react';

interface RequirementItem {
  id: string;
  text: string;
  icon: string;
  is_active: boolean;
  display_order: number;
}

export function AdminLandingRequirements() {
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<RequirementItem | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-landing-requirements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_requirements')
        .select('*')
        .order('display_order');
      if (error) throw error;
      return data as RequirementItem[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (item: Partial<RequirementItem>) => {
      if (item.id) {
        const { error } = await supabase.from('landing_requirements').update(item).eq('id', item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('landing_requirements').insert({ text: item.text, icon: item.icon, is_active: item.is_active, display_order: items.length + 1 });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-landing-requirements'] });
      queryClient.invalidateQueries({ queryKey: ['landing-requirements'] });
      toast.success('Salvo!');
      setEditingItem(null);
    },
    onError: () => toast.error('Erro ao salvar'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('landing_requirements').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-landing-requirements'] });
      queryClient.invalidateQueries({ queryKey: ['landing-requirements'] });
      toast.success('Removido!');
    },
  });

  const handleNew = () => {
    setEditingItem({ id: '', text: '', icon: 'Check', is_active: true, display_order: items.length + 1 });
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Requisitos para Usar</h3>
        <Button onClick={handleNew} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" /> Adicionar</Button>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.id} className={`bg-slate-800 border-slate-700 ${!item.is_active ? 'opacity-50' : ''}`}>
            <CardContent className="p-4 flex items-center gap-4">
              <GripVertical className="w-5 h-5 text-slate-500" />
              <div className="flex-1">
                <p className="text-white">{item.text}</p>
                <p className="text-xs text-slate-400">Ícone: {item.icon}</p>
              </div>
              <Switch checked={item.is_active} onCheckedChange={() => saveMutation.mutate({ id: item.id, is_active: !item.is_active })} />
              <Button variant="ghost" size="sm" onClick={() => setEditingItem(item)}>Editar</Button>
              <Button variant="ghost" size="sm" className="text-red-400" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="w-4 h-4" /></Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingItem && (
        <Card className="bg-slate-800 border-emerald-500">
          <CardHeader><CardTitle className="text-white">{editingItem.id ? 'Editar' : 'Novo'} Requisito</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Texto</label>
              <Input value={editingItem.text} onChange={(e) => setEditingItem(prev => prev ? { ...prev, text: e.target.value } : null)} className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Ícone (Lucide)</label>
              <Input value={editingItem.icon} onChange={(e) => setEditingItem(prev => prev ? { ...prev, icon: e.target.value } : null)} placeholder="Smartphone, Wifi, Scale, Printer" className="bg-slate-700 border-slate-600 text-white" />
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
