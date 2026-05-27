import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Save, Plus, Trash2, Loader2, HelpCircle } from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  is_active: boolean;
  display_order: number;
}

export function AdminLandingFAQ() {
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<FAQItem | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-landing-faq'],
    queryFn: async () => {
      const { data, error } = await supabase.from('landing_faq').select('*').order('display_order');
      if (error) throw error;
      return data as FAQItem[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (item: Partial<FAQItem>) => {
      if (item.id) {
        const { error } = await supabase.from('landing_faq').update(item).eq('id', item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('landing_faq').insert({ question: item.question, answer: item.answer, is_active: item.is_active, display_order: items.length + 1 });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-landing-faq'] });
      queryClient.invalidateQueries({ queryKey: ['landing-faq'] });
      toast.success('Salvo!');
      setEditingItem(null);
    },
    onError: () => toast.error('Erro ao salvar'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('landing_faq').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-landing-faq'] });
      queryClient.invalidateQueries({ queryKey: ['landing-faq'] });
      toast.success('Removido!');
    },
  });

  const handleNew = () => {
    setEditingItem({ id: '', question: '', answer: '', is_active: true, display_order: items.length + 1 });
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Perguntas Frequentes (FAQ)</h3>
        <Button onClick={handleNew} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" /> Adicionar</Button>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <Card key={item.id} className={`bg-slate-800 border-slate-700 ${!item.is_active ? 'opacity-50' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400 font-bold text-sm flex-shrink-0">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-white mb-1">{item.question}</h4>
                  <p className="text-sm text-slate-400 line-clamp-2">{item.answer}</p>
                </div>
                <Switch checked={item.is_active} onCheckedChange={() => saveMutation.mutate({ id: item.id, is_active: !item.is_active })} />
                <Button variant="ghost" size="sm" onClick={() => setEditingItem(item)}>Editar</Button>
                <Button variant="ghost" size="sm" className="text-red-400" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingItem && (
        <Card className="bg-slate-800 border-emerald-500">
          <CardHeader><CardTitle className="text-white">{editingItem.id ? 'Editar' : 'Nova'} Pergunta</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Pergunta</label>
              <Input value={editingItem.question} onChange={(e) => setEditingItem(prev => prev ? { ...prev, question: e.target.value } : null)} placeholder="Precisa instalar algo?" className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Resposta</label>
              <Textarea value={editingItem.answer} onChange={(e) => setEditingItem(prev => prev ? { ...prev, answer: e.target.value } : null)} className="bg-slate-700 border-slate-600 text-white" rows={4} />
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
