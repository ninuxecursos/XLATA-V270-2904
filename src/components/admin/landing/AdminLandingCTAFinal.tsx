import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';

interface CTAFinalData {
  id: string;
  main_text: string;
  sub_text: string | null;
  button_text: string;
  button_url: string | null;
  notes: string | null;
  is_active: boolean;
}

export function AdminLandingCTAFinal() {
  const queryClient = useQueryClient();

  const { data: ctaData, isLoading } = useQuery({
    queryKey: ['admin-landing-cta-final'],
    queryFn: async () => {
      const { data, error } = await supabase.from('landing_cta_final').select('*').limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data as CTAFinalData | null;
    },
  });

  const [formData, setFormData] = useState<CTAFinalData>({
    id: '',
    main_text: 'Comece a Lucrar Mais Hoje',
    sub_text: 'Teste grátis por 7 dias. Sem cartão de crédito.',
    button_text: 'Começar Teste Grátis',
    button_url: '/cadastro',
    notes: '✓ 7 dias grátis  ✓ Sem cartão  ✓ Cancela quando quiser',
    is_active: true,
  });

  useEffect(() => {
    if (ctaData) {
      setFormData(ctaData);
    }
  }, [ctaData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (formData.id) {
        const { error } = await supabase.from('landing_cta_final').update(formData).eq('id', formData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('landing_cta_final').insert(formData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-landing-cta-final'] });
      queryClient.invalidateQueries({ queryKey: ['landing-cta-final'] });
      toast.success('CTA Final salvo!');
    },
    onError: () => toast.error('Erro ao salvar'),
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">CTA Final (Chamada para Ação)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-slate-300">Texto Principal</label>
          <Input
            value={formData.main_text}
            onChange={(e) => setFormData(prev => ({ ...prev, main_text: e.target.value }))}
            placeholder="Comece a Lucrar Mais Hoje"
            className="bg-slate-700 border-slate-600 text-white"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-300">Subtexto</label>
          <Input
            value={formData.sub_text || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, sub_text: e.target.value }))}
            placeholder="Teste grátis por 7 dias..."
            className="bg-slate-700 border-slate-600 text-white"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Texto do Botão</label>
            <Input
              value={formData.button_text}
              onChange={(e) => setFormData(prev => ({ ...prev, button_text: e.target.value }))}
              placeholder="Começar Teste Grátis"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300">URL do Botão</label>
            <Input
              value={formData.button_url || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, button_url: e.target.value }))}
              placeholder="/cadastro"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-300">Notas (separadas por ✓)</label>
          <Textarea
            value={formData.notes || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="✓ 7 dias grátis  ✓ Sem cartão  ✓ Cancela quando quiser"
            className="bg-slate-700 border-slate-600 text-white"
            rows={2}
          />
        </div>

        <div className="pt-4">
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar CTA Final
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
