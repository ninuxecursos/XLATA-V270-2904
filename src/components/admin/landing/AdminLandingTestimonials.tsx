import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Save, Plus, Trash2, Loader2, Star } from 'lucide-react';

interface TestimonialItem {
  id: string;
  name: string;
  company: string | null;
  location: string | null;
  rating: number;
  text: string;
  revenue: string | null;
  photo_url: string | null;
  is_active: boolean;
  display_order: number;
}

export function AdminLandingTestimonials() {
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<TestimonialItem | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-landing-testimonials'],
    queryFn: async () => {
      const { data, error } = await supabase.from('landing_testimonials').select('*').order('display_order');
      if (error) throw error;
      return data as TestimonialItem[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (item: Partial<TestimonialItem>) => {
      if (item.id) {
        const { error } = await supabase.from('landing_testimonials').update(item).eq('id', item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('landing_testimonials').insert({ name: item.name, company: item.company, location: item.location, rating: item.rating, text: item.text, revenue: item.revenue, photo_url: item.photo_url, is_active: item.is_active, display_order: items.length + 1 });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-landing-testimonials'] });
      queryClient.invalidateQueries({ queryKey: ['landing-testimonials'] });
      toast.success('Salvo!');
      setEditingItem(null);
    },
    onError: () => toast.error('Erro ao salvar'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('landing_testimonials').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-landing-testimonials'] });
      queryClient.invalidateQueries({ queryKey: ['landing-testimonials'] });
      toast.success('Removido!');
    },
  });

  const handleNew = () => {
    setEditingItem({ id: '', name: '', company: null, location: null, rating: 5, text: '', revenue: null, photo_url: null, is_active: true, display_order: items.length + 1 });
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Depoimentos</h3>
        <Button onClick={handleNew} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" /> Adicionar</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <Card key={item.id} className={`bg-slate-800 border-slate-700 ${!item.is_active ? 'opacity-50' : ''}`}>
            <CardContent className="p-4">
              <div className="flex gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < item.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
                ))}
              </div>
              <p className="text-slate-300 text-sm mb-3 line-clamp-2">"{item.text}"</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{item.name}</p>
                  <p className="text-xs text-slate-400">{item.company} • {item.location}</p>
                  {item.revenue && <p className="text-sm text-emerald-400 font-medium">{item.revenue}</p>}
                </div>
                <Switch checked={item.is_active} onCheckedChange={() => saveMutation.mutate({ id: item.id, is_active: !item.is_active })} />
              </div>
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
          <CardHeader><CardTitle className="text-white">{editingItem.id ? 'Editar' : 'Novo'} Depoimento</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Nome</label>
                <Input value={editingItem.name} onChange={(e) => setEditingItem(prev => prev ? { ...prev, name: e.target.value } : null)} className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Empresa</label>
                <Input value={editingItem.company || ''} onChange={(e) => setEditingItem(prev => prev ? { ...prev, company: e.target.value } : null)} className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Localização</label>
                <Input value={editingItem.location || ''} onChange={(e) => setEditingItem(prev => prev ? { ...prev, location: e.target.value } : null)} placeholder="São Paulo, SP" className="bg-slate-700 border-slate-600 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Depoimento</label>
              <Textarea value={editingItem.text} onChange={(e) => setEditingItem(prev => prev ? { ...prev, text: e.target.value } : null)} className="bg-slate-700 border-slate-600 text-white" rows={3} />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Nota (1-5)</label>
                <Input type="number" min={1} max={5} value={editingItem.rating} onChange={(e) => setEditingItem(prev => prev ? { ...prev, rating: parseInt(e.target.value) || 5 } : null)} className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Ganho/mês (opcional)</label>
                <Input value={editingItem.revenue || ''} onChange={(e) => setEditingItem(prev => prev ? { ...prev, revenue: e.target.value } : null)} placeholder="+R$ 8.000/mês" className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-300">URL da Foto</label>
                <Input value={editingItem.photo_url || ''} onChange={(e) => setEditingItem(prev => prev ? { ...prev, photo_url: e.target.value } : null)} className="bg-slate-700 border-slate-600 text-white" />
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
