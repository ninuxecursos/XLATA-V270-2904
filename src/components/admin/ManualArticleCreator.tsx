import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Sparkles, Loader2, Calendar, Send } from 'lucide-react';

interface Category { id: string; name: string }

export function ManualArticleCreator() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    topic: '',
    keywords: '',
    tone: 'profissional, prático e direto',
    focus: 'conversão de donos de ferro velho para o XLata',
    category_id: '',
    minWords: 1500,
    autoPublish: false,
    scheduleNow: true,
    scheduleAt: '',
  });

  useEffect(() => {
    supabase.from('blog_categories').select('id, name').order('name').then(({ data }) => {
      setCategories((data || []) as Category[]);
    });
  }, []);

  const submit = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Título obrigatório', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const scheduledAt = form.scheduleNow
        ? new Date().toISOString()
        : new Date(form.scheduleAt).toISOString();

      const { data, error } = await supabase.from('article_jobs').insert({
        title: form.title.trim(),
        status: 'pending',
        scheduled_at: scheduledAt,
        created_by: userData.user?.id,
        payload: {
          topic: form.topic || form.title,
          keywords: form.keywords.split(',').map((k) => k.trim()).filter(Boolean),
          tone: form.tone,
          focus: form.focus,
          category_id: form.category_id || null,
          category: categories.find((c) => c.id === form.category_id)?.name || 'Geral',
          minWords: form.minWords,
          autoPublish: form.autoPublish,
          source: 'manual',
        },
      }).select('id').single();

      if (error) throw error;

      toast({ title: 'Job enfileirado!', description: 'Acompanhe na aba Fila de Artigos.' });
      setForm({ ...form, title: '', topic: '', keywords: '' });

      // Se for "agora", dispara imediato (não aguarda)
      if (form.scheduleNow && data?.id) {
        supabase.functions.invoke('process-article-job', { body: { job_id: data.id } }).catch(() => {});
      }
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Sparkles className="h-5 w-5 text-primary" /> Criação Manual Assistida por IA
        </CardTitle>
        <CardDescription>
          Forneça os dados, a IA gera o artigo completo respeitando os prompts configurados em "Prompts IA".
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Título sugerido *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex.: Preço do Cobre KG Hoje 2026" className="h-12 rounded-xl" />
          </div>
          <div>
            <Label>Tópico/Tema (opcional)</Label>
            <Input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}
              placeholder="Mantém o título se vazio" className="h-12 rounded-xl" />
          </div>
        </div>

        <div>
          <Label>Palavras-chave (separadas por vírgula)</Label>
          <Input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })}
            placeholder="preço cobre kg, cobre 2026, valor cobre hoje" className="h-12 rounded-xl" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Tom de voz</Label>
            <Input value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })} className="h-12 rounded-xl" />
          </div>
          <div>
            <Label>Foco / Objetivo</Label>
            <Input value={form.focus} onChange={(e) => setForm({ ...form, focus: e.target.value })} className="h-12 rounded-xl" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Categoria</Label>
            <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
              <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Selecione…" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Mínimo de palavras</Label>
            <Input type="number" min={500} max={5000} step={100} value={form.minWords}
              onChange={(e) => setForm({ ...form, minWords: parseInt(e.target.value) || 1500 })} className="h-12 rounded-xl" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 items-end">
          <div className="flex items-center justify-between bg-muted/40 rounded-xl p-3 h-12">
            <Label className="cursor-pointer">Publicar automaticamente</Label>
            <Switch checked={form.autoPublish} onCheckedChange={(v) => setForm({ ...form, autoPublish: v })} />
          </div>
          <div className="flex items-center justify-between bg-muted/40 rounded-xl p-3 h-12">
            <Label className="cursor-pointer">Gerar agora</Label>
            <Switch checked={form.scheduleNow} onCheckedChange={(v) => setForm({ ...form, scheduleNow: v })} />
          </div>
        </div>

        {!form.scheduleNow && (
          <div>
            <Label className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Agendar para</Label>
            <Input type="datetime-local" value={form.scheduleAt}
              onChange={(e) => setForm({ ...form, scheduleAt: e.target.value })} className="h-12 rounded-xl" />
          </div>
        )}

        <Button onClick={submit} disabled={submitting} className="w-full h-12 rounded-xl">
          {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
          {form.scheduleNow ? 'Gerar agora' : 'Agendar geração'}
        </Button>
      </CardContent>
    </Card>
  );
}

export default ManualArticleCreator;
