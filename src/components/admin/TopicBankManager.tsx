import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CalendarClock,
  Sparkles,
  Plus,
  Loader2,
  Zap,
  Save,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Wand2,
  ExternalLink,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TopicRow {
  id: string;
  topic: string;
  keywords: string[];
  category: string | null;
  priority: number;
  is_used: boolean;
  used_at: string | null;
  scheduled_for: string | null;
  created_at: string;
  post_slug?: string | null;
  post_status?: string | null;
}

type FilterMode = 'all' | 'unscheduled' | 'scheduled' | 'used';

const formatDateTimeLocal = (iso: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  // YYYY-MM-DDTHH:MM
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const TopicBankManager: React.FC = () => {
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>('unscheduled');
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [scheduleEdits, setScheduleEdits] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  // New topic dialog
  const [showAdd, setShowAdd] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [newKeywords, setNewKeywords] = useState('');
  const [newCategory, setNewCategory] = useState<'comercial' | 'educacional' | 'tecnico'>('educacional');
  const [newPriority, setNewPriority] = useState(7);
  const [newScheduled, setNewScheduled] = useState('');
  const [adding, setAdding] = useState(false);

  // Bulk auto-schedule controls — intervalo customizável (quantidade + unidade)
  const [bulkIntervalAmount, setBulkIntervalAmount] = useState<number>(1);
  const [bulkIntervalUnit, setBulkIntervalUnit] = useState<'minutes' | 'hours' | 'days'>('days');
  const [bulkStartMode, setBulkStartMode] = useState<'now' | 'tomorrow' | 'continue'>('continue');
  const [bulkStartHour, setBulkStartHour] = useState<number>(9);
  const [bulkScheduling, setBulkScheduling] = useState(false);
  const [configIntervalDays, setConfigIntervalDays] = useState<number>(1);
  const [configHour, setConfigHour] = useState<number>(9);
  const [confirmRescheduleOpen, setConfirmRescheduleOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data, error }, { data: cfg }] = await Promise.all([
      supabase
        .from('seo_topic_bank')
        .select('id, topic, keywords, category, priority, is_used, used_at, scheduled_for, created_at')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(500),
      supabase
        .from('ai_automation_config')
        .select('publish_interval_days, publish_hour')
        .maybeSingle(),
    ]);

    let rows = (data ?? []) as TopicRow[];

    // For used topics, look up matching blog post by exact title
    const usedTitles = rows.filter((t) => t.is_used).map((t) => t.topic);
    if (usedTitles.length > 0) {
      const { data: posts } = await supabase
        .from('blog_posts')
        .select('title, slug, status')
        .in('title', usedTitles);
      const map = new Map<string, { slug: string; status: string }>();
      (posts ?? []).forEach((p: any) => map.set(p.title, { slug: p.slug, status: p.status }));
      rows = rows.map((t) => {
        if (t.is_used) {
          const m = map.get(t.topic);
          return { ...t, post_slug: m?.slug ?? null, post_status: m?.status ?? null };
        }
        return t;
      });
    }

    if (!error) setTopics(rows);
    if (cfg) {
      setConfigIntervalDays(cfg.publish_interval_days || 1);
      setConfigHour(cfg.publish_hour ?? 9);
      setBulkStartHour(cfg.publish_hour ?? 9);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = topics.filter((t) => {
    if (filter === 'all') return true;
    if (filter === 'used') return t.is_used;
    if (filter === 'scheduled') return !t.is_used && !!t.scheduled_for;
    if (filter === 'unscheduled') return !t.is_used && !t.scheduled_for;
    return true;
  });

  const counts = {
    all: topics.length,
    unscheduled: topics.filter((t) => !t.is_used && !t.scheduled_for).length,
    scheduled: topics.filter((t) => !t.is_used && !!t.scheduled_for).length,
    used: topics.filter((t) => t.is_used).length,
  };

  const saveSchedule = async (topicId: string) => {
    const value = scheduleEdits[topicId];
    setSavingId(topicId);
    try {
      const iso = value ? new Date(value).toISOString() : null;
      const { error } = await supabase
        .from('seo_topic_bank')
        .update({ scheduled_for: iso })
        .eq('id', topicId);
      if (error) throw error;
      toast({
        title: iso ? 'Agendamento salvo' : 'Agendamento removido',
        description: iso ? `Será gerado em ${format(new Date(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}` : undefined,
      });
      setScheduleEdits((prev) => {
        const n = { ...prev };
        delete n[topicId];
        return n;
      });
      await load();
    } catch (e: any) {
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' });
    } finally {
      setSavingId(null);
    }
  };

  const generateNow = async (topicId: string) => {
    setGeneratingId(topicId);
    try {
      const { data, error } = await supabase.functions.invoke('generate-seo-article', {
        body: { topic_id: topicId },
      });
      if (error) throw error;
      if ((data as any)?.success === false) throw new Error((data as any)?.error || 'Falha na geração');

      toast({
        title: 'Artigo gerado!',
        description: (data as any)?.article?.title ?? 'Confira em Artigos.',
      });
      await load();
    } catch (e: any) {
      toast({ title: 'Falha ao gerar', description: e.message, variant: 'destructive' });
    } finally {
      setGeneratingId(null);
    }
  };

  const addManualTopic = async () => {
    if (!newTopic.trim()) {
      toast({ title: 'Informe o tópico', variant: 'destructive' });
      return;
    }
    setAdding(true);
    try {
      const keywords = newKeywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);

      const { error } = await supabase.from('seo_topic_bank').insert({
        topic: newTopic.trim(),
        keywords,
        category: newCategory,
        priority: newPriority,
        is_used: false,
        scheduled_for: newScheduled ? new Date(newScheduled).toISOString() : null,
      });

      if (error) throw error;

      toast({ title: 'Tópico adicionado', description: newScheduled ? 'Agendado com sucesso' : 'Disponível na fila' });
      setShowAdd(false);
      setNewTopic('');
      setNewKeywords('');
      setNewScheduled('');
      setNewPriority(7);
      setNewCategory('educacional');
      await load();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally {
      setAdding(false);
    }
  };

  // Compute interval in milliseconds from custom amount + unit
  const getIntervalMs = (): number => {
    const amount = Math.max(1, bulkIntervalAmount || 1);
    const unitMs = bulkIntervalUnit === 'minutes' ? 60_000 : bulkIntervalUnit === 'hours' ? 3_600_000 : 86_400_000;
    return amount * unitMs;
  };

  const intervalLabel = (): string => {
    const a = Math.max(1, bulkIntervalAmount || 1);
    const unit = bulkIntervalUnit === 'minutes' ? (a > 1 ? 'minutos' : 'minuto') : bulkIntervalUnit === 'hours' ? (a > 1 ? 'horas' : 'hora') : (a > 1 ? 'dias' : 'dia');
    return `${a} ${unit}`;
  };

  const bulkAutoSchedule = async () => {
    const unscheduled = topics.filter((t) => !t.is_used && !t.scheduled_for);
    if (unscheduled.length === 0) {
      toast({ title: 'Nada para agendar', description: 'Todos os tópicos já estão agendados ou usados.' });
      return;
    }

    const intervalMs = getIntervalMs();

    setBulkScheduling(true);
    try {
      // Determine starting point based on selected mode
      let nextDate: Date;
      if (bulkStartMode === 'continue') {
        const scheduledList = topics.filter((t) => !t.is_used && t.scheduled_for);
        const latestScheduled = scheduledList.reduce<Date | null>((acc, t) => {
          const d = new Date(t.scheduled_for!);
          return !acc || d > acc ? d : acc;
        }, null);
        if (latestScheduled) {
          nextDate = new Date(latestScheduled.getTime() + intervalMs);
        } else if (bulkIntervalUnit === 'days') {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(bulkStartHour, 0, 0, 0);
          nextDate = tomorrow;
        } else {
          nextDate = new Date(Date.now() + intervalMs);
        }
      } else if (bulkStartMode === 'tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(bulkStartHour, 0, 0, 0);
        nextDate = tomorrow;
      } else {
        // 'now' → start in `intervalMs` from now (avoid scheduling in the past)
        nextDate = new Date(Date.now() + intervalMs);
      }

      // Order by priority desc, then creation asc
      const ordered = [...unscheduled].sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      let success = 0;
      let failures = 0;

      for (const topic of ordered) {
        const { error } = await supabase
          .from('seo_topic_bank')
          .update({ scheduled_for: nextDate.toISOString() })
          .eq('id', topic.id);

        if (error) {
          failures++;
        } else {
          success++;
          nextDate = new Date(nextDate.getTime() + intervalMs);
        }
      }

      toast({
        title: 'Agendamento em massa concluído',
        description: `${success} tópico${success !== 1 ? 's' : ''} agendado${success !== 1 ? 's' : ''} (a cada ${intervalLabel()})${failures > 0 ? ` · ${failures} falha${failures > 1 ? 's' : ''}` : ''}.`,
      });
      setFilter('scheduled');
      await load();
    } catch (e: any) {
      toast({ title: 'Erro no agendamento em massa', description: e.message, variant: 'destructive' });
    } finally {
      setBulkScheduling(false);
    }
  };

  // Open confirmation modal for reschedule (replaces native confirm)
  const requestBulkReschedule = () => {
    const scheduledList = topics.filter((t) => !t.is_used && t.scheduled_for);
    if (scheduledList.length === 0) {
      toast({ title: 'Nenhum tópico agendado para reajustar' });
      return;
    }
    setConfirmRescheduleOpen(true);
  };

  // Reschedule ALL already-scheduled topics with the new interval (overwrites)
  const executeBulkReschedule = async () => {
    setConfirmRescheduleOpen(false);
    const scheduledList = topics.filter((t) => !t.is_used && t.scheduled_for);
    if (scheduledList.length === 0) return;

    const intervalMs = getIntervalMs();
    setBulkScheduling(true);
    try {
      let nextDate: Date;
      if (bulkStartMode === 'tomorrow' || (bulkStartMode === 'continue' && bulkIntervalUnit === 'days')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(bulkStartHour, 0, 0, 0);
        nextDate = tomorrow;
      } else {
        nextDate = new Date(Date.now() + intervalMs);
      }

      const ordered = [...scheduledList].sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return new Date(a.scheduled_for!).getTime() - new Date(b.scheduled_for!).getTime();
      });

      let success = 0;
      let failures = 0;
      for (const topic of ordered) {
        const { error } = await supabase
          .from('seo_topic_bank')
          .update({ scheduled_for: nextDate.toISOString() })
          .eq('id', topic.id);
        if (error) failures++;
        else {
          success++;
          nextDate = new Date(nextDate.getTime() + intervalMs);
        }
      }

      toast({
        title: 'Reajuste concluído',
        description: `${success} tópico${success !== 1 ? 's' : ''} reagendado${success !== 1 ? 's' : ''} a cada ${intervalLabel()}${failures > 0 ? ` · ${failures} falha${failures > 1 ? 's' : ''}` : ''}.`,
      });
      await load();
    } catch (e: any) {
      toast({ title: 'Erro ao reajustar', description: e.message, variant: 'destructive' });
    } finally {
      setBulkScheduling(false);
    }
  };


  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-white">
            <CalendarClock className="h-5 w-5 text-emerald-500" />
            Banco de Tópicos Programáveis
          </CardTitle>
          <CardDescription>
            Defina data e hora exatas para cada tópico ser gerado e publicado automaticamente.
          </CardDescription>
        </div>

        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 shrink-0">
              <Plus className="h-4 w-4 mr-1" />
              Novo Tópico
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle>Adicionar Tópico Manualmente</DialogTitle>
              <DialogDescription className="text-gray-400">
                Insira um título sob medida com data/hora opcional para geração programada.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-gray-300">Título do tópico *</Label>
                <Input
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="Ex: 💰 Preço do Cobre KG Hoje 2026 — Tabela Atualizada"
                  className="bg-gray-800 border-gray-600 text-white h-12"
                />
              </div>
              <div>
                <Label className="text-gray-300">Palavras-chave (separadas por vírgula)</Label>
                <Input
                  value={newKeywords}
                  onChange={(e) => setNewKeywords(e.target.value)}
                  placeholder="preço cobre kg, cobre 2026, sucata"
                  className="bg-gray-800 border-gray-600 text-white h-12"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-gray-300">Categoria</Label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full h-12 rounded-md bg-gray-800 border border-gray-600 text-white px-3"
                  >
                    <option value="educacional">Educacional</option>
                    <option value="comercial">Comercial</option>
                    <option value="tecnico">Técnico</option>
                  </select>
                </div>
                <div>
                  <Label className="text-gray-300">Prioridade (1-10)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={newPriority}
                    onChange={(e) => setNewPriority(parseInt(e.target.value) || 7)}
                    className="bg-gray-800 border-gray-600 text-white h-12"
                  />
                </div>
              </div>
              <div>
                <Label className="text-gray-300">Data/hora de publicação (opcional)</Label>
                <Input
                  type="datetime-local"
                  value={newScheduled}
                  onChange={(e) => setNewScheduled(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white h-12"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Se preenchido: será gerado e publicado nesse horário exato. Se vazio: entra na fila normal.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)} className="border-gray-600 text-gray-300">
                Cancelar
              </Button>
              <Button onClick={addManualTopic} disabled={adding} className="bg-emerald-600 hover:bg-emerald-700">
                {adding ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                Adicionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterMode)}>
          <TabsList className="bg-gray-800 border border-gray-700">
            <TabsTrigger value="unscheduled" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              Sem agendamento ({counts.unscheduled})
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Agendados ({counts.scheduled})
            </TabsTrigger>
            <TabsTrigger value="used" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white">
              Já usados ({counts.used})
            </TabsTrigger>
            <TabsTrigger value="all" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white">
              Todos ({counts.all})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Bulk auto-schedule — intervalo customizável */}
        <div className="rounded-lg border border-emerald-700/40 bg-emerald-950/20 p-3 space-y-3">
          <div className="flex items-start gap-2">
            <Wand2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Agendar / Reajustar em massa</p>
              <p className="text-xs text-gray-400">
                Defina o intervalo entre cada postagem (minutos, horas ou dias) e a quantidade exata. Ex: 1 a cada 30 minutos, 1 a cada 6 horas, 1 a cada 2 dias.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="w-24">
              <Label className="text-gray-300 text-xs">A cada</Label>
              <Input
                type="number"
                min={1}
                value={bulkIntervalAmount}
                onChange={(e) => setBulkIntervalAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="bg-gray-800 border-gray-600 text-white h-9"
              />
            </div>
            <div className="w-32">
              <Label className="text-gray-300 text-xs">Unidade</Label>
              <Select value={bulkIntervalUnit} onValueChange={(v) => setBulkIntervalUnit(v as any)}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600 text-white">
                  <SelectItem value="minutes" className="text-white focus:bg-gray-700">Minutos</SelectItem>
                  <SelectItem value="hours" className="text-white focus:bg-gray-700">Horas</SelectItem>
                  <SelectItem value="days" className="text-white focus:bg-gray-700">Dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Label className="text-gray-300 text-xs">Início</Label>
              <Select value={bulkStartMode} onValueChange={(v) => setBulkStartMode(v as any)}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600 text-white">
                  <SelectItem value="continue" className="text-white focus:bg-gray-700">Continuar do último</SelectItem>
                  <SelectItem value="now" className="text-white focus:bg-gray-700">A partir de agora</SelectItem>
                  <SelectItem value="tomorrow" className="text-white focus:bg-gray-700">Amanhã na hora X</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(bulkStartMode === 'tomorrow' || (bulkStartMode === 'continue' && bulkIntervalUnit === 'days')) && (
              <div className="w-20">
                <Label className="text-gray-300 text-xs">Hora</Label>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={bulkStartHour}
                  onChange={(e) => setBulkStartHour(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                  className="bg-gray-800 border-gray-600 text-white h-9"
                />
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={bulkAutoSchedule}
              disabled={bulkScheduling || counts.unscheduled === 0}
              className="bg-emerald-600 hover:bg-emerald-700 h-9"
            >
              {bulkScheduling ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Processando...</>
              ) : (
                <><Wand2 className="h-4 w-4 mr-1" />Agendar {counts.unscheduled} sem agendamento</>
              )}
            </Button>
            <Button
              onClick={requestBulkReschedule}
              disabled={bulkScheduling || counts.scheduled === 0}
              variant="outline"
              className="border-blue-600 text-blue-300 hover:bg-blue-600/10 h-9"
            >
              <CalendarClock className="h-4 w-4 mr-1" />
              Reajustar {counts.scheduled} já agendados
            </Button>
          </div>
          <p className="text-[11px] text-gray-500">
            ℹ️ <strong>Agendar:</strong> aplica o intervalo apenas aos tópicos sem agendamento. <strong>Reajustar:</strong> sobrescreve TODOS os agendados com o novo intervalo. Tópicos com data passada já são gerados e <strong>publicados automaticamente</strong> pelo cron a cada minuto.
          </p>
        </div>



        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
            <Sparkles className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">Nenhum tópico nesta categoria</p>
          </div>
        ) : (
          <ScrollArea className="h-[480px] pr-2">
            <div className="space-y-2">
              {filtered.map((t) => {
                const editingValue = scheduleEdits[t.id];
                const currentValue = editingValue !== undefined ? editingValue : formatDateTimeLocal(t.scheduled_for);
                const hasChanges = editingValue !== undefined && editingValue !== formatDateTimeLocal(t.scheduled_for);
                const isOverdue = t.scheduled_for && !t.is_used && new Date(t.scheduled_for) < new Date();

                return (
                  <div
                    key={t.id}
                    className="p-3 bg-gray-800 rounded-lg border border-gray-700 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">{t.topic}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {t.is_used && (
                            <Badge className="bg-gray-700 text-gray-300 text-[10px]">
                              <CheckCircle2 className="h-3 w-3 mr-0.5" />
                              Usado {t.used_at ? format(new Date(t.used_at), 'dd/MM', { locale: ptBR }) : ''}
                            </Badge>
                          )}
                          {!t.is_used && t.scheduled_for && !isOverdue && (
                            <Badge className="bg-blue-600/20 text-blue-300 text-[10px]">
                              <Clock className="h-3 w-3 mr-0.5" />
                              Agendado {format(new Date(t.scheduled_for), "dd/MM 'às' HH:mm", { locale: ptBR })}
                            </Badge>
                          )}
                          {isOverdue && (
                            <Badge className="bg-yellow-600/20 text-yellow-300 text-[10px]">
                              <AlertCircle className="h-3 w-3 mr-0.5" />
                              Pendente — gerando em breve
                            </Badge>
                          )}
                          <Badge
                            className={`text-[10px] ${
                              t.category === 'comercial'
                                ? 'bg-purple-600/30 text-purple-300'
                                : t.category === 'tecnico'
                                ? 'bg-green-600/30 text-green-300'
                                : 'bg-blue-600/30 text-blue-300'
                            }`}
                          >
                            {t.category ?? 'educacional'}
                          </Badge>
                          <Badge className="bg-gray-700/60 text-gray-300 text-[10px]">P:{t.priority}</Badge>
                        </div>
                        {t.keywords && t.keywords.length > 0 && (
                          <p className="text-gray-500 text-[11px] mt-1 truncate">
                            🔑 {t.keywords.slice(0, 4).join(' · ')}
                          </p>
                        )}
                      </div>
                    </div>

                    {!t.is_used && (
                      <div className="flex flex-wrap items-end gap-2 pt-1 border-t border-gray-700/60">
                        <div className="flex-1 min-w-[200px]">
                          <Label className="text-gray-400 text-[11px]">Agendar para</Label>
                          <Input
                            type="datetime-local"
                            value={currentValue}
                            onChange={(e) =>
                              setScheduleEdits((prev) => ({ ...prev, [t.id]: e.target.value }))
                            }
                            className="bg-gray-900 border-gray-600 text-white h-9 text-xs"
                          />
                        </div>
                        {hasChanges && (
                          <Button
                            size="sm"
                            onClick={() => saveSchedule(t.id)}
                            disabled={savingId === t.id}
                            className="bg-blue-600 hover:bg-blue-700 h-9"
                          >
                            {savingId === t.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Save className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                        {t.scheduled_for && !hasChanges && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setScheduleEdits((prev) => ({ ...prev, [t.id]: '' }));
                            }}
                            className="border-gray-600 text-gray-300 h-9"
                            title="Remover agendamento"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => generateNow(t.id)}
                          disabled={generatingId === t.id}
                          className="bg-emerald-600 hover:bg-emerald-700 h-9"
                        >
                          {generatingId === t.id ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Gerando...
                            </>
                          ) : (
                            <>
                              <Zap className="h-3 w-3 mr-1" />
                              Gerar agora
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {t.is_used && t.post_slug && (
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-700/60">
                        <Badge
                          className={`text-[10px] ${
                            t.post_status === 'published'
                              ? 'bg-emerald-600/20 text-emerald-300'
                              : 'bg-yellow-600/20 text-yellow-300'
                          }`}
                        >
                          {t.post_status === 'published' ? '✓ Publicado' : `Status: ${t.post_status}`}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          className="ml-auto h-8 border-emerald-600 text-emerald-300 hover:bg-emerald-600/10"
                          onClick={() => window.open(`/blog/${t.post_slug}`, '_blank', 'noopener,noreferrer')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Visualizar artigo
                        </Button>
                      </div>
                    )}
                    {t.is_used && !t.post_slug && (
                      <div className="pt-2 border-t border-gray-700/60">
                        <p className="text-[11px] text-gray-500 italic">
                          Artigo não localizado pelo título — verifique em "Artigos".
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      <AlertDialog open={confirmRescheduleOpen} onOpenChange={setConfirmRescheduleOpen}>
        <AlertDialogContent className="bg-gray-900 border-gray-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-emerald-400" />
              Reajustar tópicos agendados?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Isso vai sobrescrever a data de{' '}
              <strong className="text-white">{counts.scheduled} tópico{counts.scheduled !== 1 ? 's' : ''}</strong>{' '}
              já agendado{counts.scheduled !== 1 ? 's' : ''} com o novo intervalo (
              <strong className="text-emerald-300">a cada {intervalLabel()}</strong>
              {bulkStartMode === 'now' && ', a partir de agora'}
              {bulkStartMode === 'tomorrow' && `, começando amanhã às ${String(bulkStartHour).padStart(2, '0')}:00`}
              {bulkStartMode === 'continue' && ', continuando da última data agendada'}
              ).
              <br /><br />
              Tópicos com data passada serão gerados e <strong className="text-white">publicados automaticamente</strong> pelo cron a cada minuto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeBulkReschedule}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Confirmar reajuste
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default TopicBankManager;
