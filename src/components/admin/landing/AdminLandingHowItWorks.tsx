import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Save, Plus, Trash2, Loader2, GripVertical } from 'lucide-react';

interface HowItWorksItem {
  id: string;
  step_number: number;
  title: string;
  description: string;
  icon: string;
  image_url: string | null;
  video_url: string | null;
  is_active: boolean;
  display_order: number;
}

export function AdminLandingHowItWorks() {
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<HowItWorksItem | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-landing-how-it-works'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_how_it_works')
        .select('*')
        .order('display_order');
      if (error) throw error;
      return data as HowItWorksItem[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (item: Partial<HowItWorksItem>) => {
      if (item.id) {
        const { error } = await supabase
          .from('landing_how_it_works')
          .update(item)
          .eq('id', item.id);
        if (error) throw error;
      } else {
        const { id, ...insertData } = item;
        const { error } = await supabase
          .from('landing_how_it_works')
          .insert({
            title: insertData.title,
            description: insertData.description,
            icon: insertData.icon,
            image_url: insertData.image_url,
            video_url: insertData.video_url,
            is_active: insertData.is_active,
            display_order: items.length + 1,
            step_number: items.length + 1,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-landing-how-it-works'] });
      queryClient.invalidateQueries({ queryKey: ['landing-how-it-works'] });
      toast.success('Salvo com sucesso!');
      setEditingItem(null);
    },
    onError: () => toast.error('Erro ao salvar'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('landing_how_it_works').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-landing-how-it-works'] });
      queryClient.invalidateQueries({ queryKey: ['landing-how-it-works'] });
      toast.success('Removido com sucesso!');
    },
    onError: () => toast.error('Erro ao remover'),
  });

  const toggleActive = async (item: HowItWorksItem) => {
    await saveMutation.mutateAsync({ id: item.id, is_active: !item.is_active });
  };

  const handleNew = () => {
    setEditingItem({
      id: '',
      step_number: items.length + 1,
      title: '',
      description: '',
      icon: 'Scale',
      image_url: null,
      video_url: null,
      is_active: true,
      display_order: items.length + 1,
    });
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Como Funciona</h3>
        <Button onClick={handleNew} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" /> Adicionar Passo
        </Button>
      </div>

      {/* Item List */}
      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.id} className={`bg-slate-800 border-slate-700 ${!item.is_active ? 'opacity-50' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <GripVertical className="w-5 h-5 text-slate-500 cursor-grab" />
                <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400 font-bold">
                  {item.step_number}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-white">{item.title}</h4>
                  <p className="text-sm text-slate-400 line-clamp-1">{item.description}</p>
                </div>
                <Switch checked={item.is_active} onCheckedChange={() => toggleActive(item)} />
                <Button variant="ghost" size="sm" onClick={() => setEditingItem(item)}>Editar</Button>
                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={() => deleteMutation.mutate(item.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <Card className="bg-slate-800 border-emerald-500">
          <CardHeader>
            <CardTitle className="text-white">{editingItem.id ? 'Editar' : 'Novo'} Passo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Número do Passo</label>
                <Input
                  type="number"
                  value={editingItem.step_number}
                  onChange={(e) => setEditingItem(prev => prev ? { ...prev, step_number: parseInt(e.target.value) } : null)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Título</label>
                <Input
                  value={editingItem.title}
                  onChange={(e) => setEditingItem(prev => prev ? { ...prev, title: e.target.value } : null)}
                  placeholder="Pesagem"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Descrição</label>
              <Textarea
                value={editingItem.description}
                onChange={(e) => setEditingItem(prev => prev ? { ...prev, description: e.target.value } : null)}
                placeholder="Descreva este passo..."
                className="bg-slate-700 border-slate-600 text-white"
                rows={3}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Ícone (Lucide)</label>
                <Input
                  value={editingItem.icon}
                  onChange={(e) => setEditingItem(prev => prev ? { ...prev, icon: e.target.value } : null)}
                  placeholder="Scale, Calculator, Printer"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-300">URL da Imagem (opcional)</label>
                <Input
                  value={editingItem.image_url || ''}
                  onChange={(e) => setEditingItem(prev => prev ? { ...prev, image_url: e.target.value } : null)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-300">URL do Vídeo (opcional)</label>
                <Input
                  value={editingItem.video_url || ''}
                  onChange={(e) => setEditingItem(prev => prev ? { ...prev, video_url: e.target.value } : null)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={() => saveMutation.mutate(editingItem)} disabled={saveMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Salvar
              </Button>
              <Button variant="outline" onClick={() => setEditingItem(null)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
