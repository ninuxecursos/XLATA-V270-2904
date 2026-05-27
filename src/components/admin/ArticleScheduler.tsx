import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, setHours, setMinutes, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar,
  Clock,
  Play,
  Pause,
  RefreshCw,
  Loader2,
  FileText,
  Trash2,
  CalendarPlus,
  Zap,
  CheckCircle,
  Target,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { TopicBankManager } from './TopicBankManager';

interface QueueArticle {
  id: string;
  title: string;
  slug: string;
  status: string;
  published_at: string | null;
  created_at: string;
  category_id: string | null;
}

interface UpcomingTopic {
  id: string;
  topic: string;
  keywords: string[];
  category: string;
  priority: number;
  estimatedDate: Date;
}

interface ScheduleConfig {
  enabled: boolean;
  frequency: 'daily' | 'every2days' | 'every3days' | 'weekly';
  publishHour: number;
  publishMinute: number;
}

export const ArticleScheduler: React.FC = () => {
  const [queue, setQueue] = useState<QueueArticle[]>([]);
  const [scheduled, setScheduled] = useState<QueueArticle[]>([]);
  const [published, setPublished] = useState<QueueArticle[]>([]);
  const [upcomingTopics, setUpcomingTopics] = useState<UpcomingTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({
    enabled: false,
    frequency: 'daily',
    publishHour: 9,
    publishMinute: 0,
  });

  const frequencyOptions = [
    { value: 'daily', label: '1 por dia', days: 1 },
    { value: 'every2days', label: '1 a cada 2 dias', days: 2 },
    { value: 'every3days', label: '1 a cada 3 dias', days: 3 },
    { value: 'weekly', label: '1 por semana', days: 7 },
  ];

  const loadArticles = useCallback(async () => {
    setLoading(true);
    try {
      // Draft articles without scheduled date (queue)
      const { data: drafts, error: e1 } = await supabase
        .from('blog_posts')
        .select('id, title, slug, status, published_at, created_at, category_id')
        .eq('status', 'draft')
        .is('published_at', null)
        .order('created_at', { ascending: true });

      // Draft articles with scheduled date (scheduled)
      const { data: scheduledData, error: e2 } = await supabase
        .from('blog_posts')
        .select('id, title, slug, status, published_at, created_at, category_id')
        .eq('status', 'draft')
        .not('published_at', 'is', null)
        .order('published_at', { ascending: true });

      // Recently published
      const { data: publishedData, error: e3 } = await supabase
        .from('blog_posts')
        .select('id, title, slug, status, published_at, created_at, category_id')
        .eq('status', 'published')
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false })
        .limit(10);

      if (e1 || e2 || e3) throw e1 || e2 || e3;

      setQueue(drafts || []);
      setScheduled(scheduledData || []);
      setPublished(publishedData || []);

      // Load schedule config from ai_automation_config
      const { data: config } = await supabase
        .from('ai_automation_config')
        .select('automation_enabled, publish_hour, publish_interval_days, last_generation_at')
        .single();

      if (config) {
        const intervalDays = config.publish_interval_days || 1;
        setScheduleConfig({
          enabled: config.automation_enabled,
          frequency: intervalDays === 1 ? 'daily'
            : intervalDays === 2 ? 'every2days'
            : intervalDays === 3 ? 'every3days'
            : 'weekly',
          publishHour: config.publish_hour,
          publishMinute: 0,
        });

        // Load upcoming topics (not used yet, sorted by priority)
        const { data: topics } = await supabase
          .from('seo_topic_bank')
          .select('id, topic, keywords, category, priority')
          .eq('is_used', false)
          .order('priority', { ascending: false })
          .order('created_at', { ascending: true })
          .limit(15);

        if (topics && topics.length > 0) {
          const lastGen = config.last_generation_at ? new Date(config.last_generation_at) : new Date();
          const upcoming: UpcomingTopic[] = topics.map((t, i) => ({
            id: t.id,
            topic: t.topic,
            keywords: t.keywords || [],
            category: t.category || 'educacional',
            priority: t.priority,
            estimatedDate: addDays(
              setHours(startOfDay(lastGen), config.publish_hour),
              (i + 1) * intervalDays
            ),
          }));
          setUpcomingTopics(upcoming);
        }
      }
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const saveScheduleConfig = async () => {
    const intervalDays = frequencyOptions.find(f => f.value === scheduleConfig.frequency)?.days || 1;
    
    const { error } = await supabase
      .from('ai_automation_config')
      .update({
        automation_enabled: scheduleConfig.enabled,
        publish_hour: scheduleConfig.publishHour,
        publish_interval_days: intervalDays,
        updated_at: new Date().toISOString(),
      })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // update all

    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Configuração salva' });
    }
  };

  const autoScheduleQueue = async () => {
    if (queue.length === 0) {
      toast({ title: 'Fila vazia', description: 'Não há artigos para agendar', variant: 'destructive' });
      return;
    }

    setScheduling(true);
    try {
      const intervalDays = frequencyOptions.find(f => f.value === scheduleConfig.frequency)?.days || 1;
      
      // Find the last scheduled date or start from tomorrow
      let nextDate: Date;
      if (scheduled.length > 0) {
        const lastScheduled = new Date(scheduled[scheduled.length - 1].published_at!);
        nextDate = addDays(lastScheduled, intervalDays);
      } else {
        nextDate = addDays(startOfDay(new Date()), 1);
      }

      let count = 0;
      for (const article of queue) {
        const publishDate = setMinutes(setHours(nextDate, scheduleConfig.publishHour), scheduleConfig.publishMinute);
        
        const { error } = await supabase
          .from('blog_posts')
          .update({ published_at: publishDate.toISOString() })
          .eq('id', article.id);

        if (!error) {
          count++;
          nextDate = addDays(nextDate, intervalDays);
        }
      }

      toast({
        title: `${count} artigos agendados`,
        description: `Publicação automática configurada a cada ${intervalDays} dia(s)`,
      });
      
      await loadArticles();
    } catch (error) {
      toast({ title: 'Erro ao agendar', variant: 'destructive' });
    } finally {
      setScheduling(false);
    }
  };

  const scheduleArticle = async (articleId: string, date: Date) => {
    const { error } = await supabase
      .from('blog_posts')
      .update({ published_at: date.toISOString() })
      .eq('id', articleId);

    if (error) {
      toast({ title: 'Erro', variant: 'destructive' });
    } else {
      toast({ title: 'Artigo agendado' });
      await loadArticles();
    }
  };

  const unscheduleArticle = async (articleId: string) => {
    const { error } = await supabase
      .from('blog_posts')
      .update({ published_at: null })
      .eq('id', articleId);

    if (!error) {
      toast({ title: 'Agendamento removido' });
      await loadArticles();
    }
  };

  const publishNow = async (articleId: string) => {
    const { error } = await supabase
      .from('blog_posts')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', articleId);

    if (!error) {
      toast({ title: 'Artigo publicado!' });
      await loadArticles();
    }
  };

  const clearAllSchedules = async () => {
    const ids = scheduled.map(a => a.id);
    if (ids.length === 0) return;

    for (const id of ids) {
      await supabase.from('blog_posts').update({ published_at: null }).eq('id', id);
    }

    toast({ title: 'Todos agendamentos removidos' });
    await loadArticles();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Schedule Config */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Calendar className="h-5 w-5 text-red-500" />
            Configuração de Agendamento
          </CardTitle>
          <CardDescription>Configure a frequência e horário de publicação automática</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white">Publicação automática</Label>
              <p className="text-sm text-gray-400">Publica artigos agendados automaticamente no horário definido</p>
            </div>
            <Switch
              checked={scheduleConfig.enabled}
              onCheckedChange={(v) => setScheduleConfig(prev => ({ ...prev, enabled: v }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-gray-300">Frequência</Label>
              <Select
                value={scheduleConfig.frequency}
                onValueChange={(v: ScheduleConfig['frequency']) => setScheduleConfig(prev => ({ ...prev, frequency: v }))}
              >
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {frequencyOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-300">Hora</Label>
              <Input
                type="number"
                min={0}
                max={23}
                value={scheduleConfig.publishHour}
                onChange={(e) => setScheduleConfig(prev => ({ ...prev, publishHour: parseInt(e.target.value) || 0 }))}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>

            <div>
              <Label className="text-gray-300">Minuto</Label>
              <Input
                type="number"
                min={0}
                max={59}
                value={scheduleConfig.publishMinute}
                onChange={(e) => setScheduleConfig(prev => ({ ...prev, publishMinute: parseInt(e.target.value) || 0 }))}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
          </div>

          <Button onClick={saveScheduleConfig} className="bg-red-600 hover:bg-red-700">
            Salvar Configuração
          </Button>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-orange-600 to-orange-800 border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Na Fila</p>
                <p className="text-2xl font-bold text-white">{queue.length}</p>
              </div>
              <FileText className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-600 to-blue-800 border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Agendados</p>
                <p className="text-2xl font-bold text-white">{scheduled.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-600 to-green-800 border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Publicados</p>
                <p className="text-2xl font-bold text-white">{published.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-600 to-purple-800 border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Status</p>
                <p className="text-lg font-bold text-white">
                  {scheduleConfig.enabled ? 'Ativo' : 'Parado'}
                </p>
              </div>
              {scheduleConfig.enabled ? (
                <Play className="h-8 w-8 text-purple-200" />
              ) : (
                <Pause className="h-8 w-8 text-purple-200" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auto-schedule all button */}
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-white font-medium">Agendar toda a fila automaticamente</p>
            <p className="text-sm text-gray-400">
              {queue.length} artigos serão distribuídos conforme a frequência configurada
            </p>
          </div>
          <div className="flex gap-2">
            {scheduled.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearAllSchedules} className="border-gray-600 text-gray-300">
                <Trash2 className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
            <Button 
              onClick={autoScheduleQueue} 
              disabled={scheduling || queue.length === 0}
              className="bg-red-600 hover:bg-red-700"
            >
              {scheduling ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              Agendar Tudo ({queue.length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Articles */}
      {scheduled.length > 0 && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Clock className="h-5 w-5 text-blue-500" />
              Artigos Agendados ({scheduled.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {scheduled.map((article, index) => (
                  <div
                    key={article.id}
                    className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Badge variant="outline" className="text-blue-400 border-blue-600 shrink-0">
                        #{index + 1}
                      </Badge>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{article.title}</p>
                        <p className="text-gray-400 text-xs flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(article.published_at!), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => publishNow(article.id)}
                        className="text-green-400 hover:text-green-300 h-8"
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => unscheduleArticle(article.id)}
                        className="text-red-400 hover:text-red-300 h-8"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Queue */}
      {queue.length > 0 && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <FileText className="h-5 w-5 text-orange-500" />
              Fila de Artigos ({queue.length})
            </CardTitle>
            <CardDescription>Artigos rascunho aguardando agendamento</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {queue.map((article) => (
                  <div
                    key={article.id}
                    className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm font-medium truncate">{article.title}</p>
                      <p className="text-gray-400 text-xs">
                        Criado em {format(new Date(article.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const tomorrow = setMinutes(
                            setHours(addDays(new Date(), 1), scheduleConfig.publishHour),
                            scheduleConfig.publishMinute
                          );
                          scheduleArticle(article.id, tomorrow);
                        }}
                        className="text-blue-400 hover:text-blue-300 h-8"
                        title="Agendar para amanhã"
                      >
                        <CalendarPlus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => publishNow(article.id)}
                        className="text-green-400 hover:text-green-300 h-8"
                        title="Publicar agora"
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}


      {/* Topic Bank Manager — agendamento individual por tópico */}
      <TopicBankManager />

      {/* Upcoming Topics to Generate */}
      {upcomingTopics.length > 0 && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Próximos Artigos a Gerar ({upcomingTopics.length})
            </CardTitle>
            <CardDescription>Temas na fila de geração automática com datas estimadas</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[350px]">
              <div className="space-y-2">
                {upcomingTopics.map((topic, index) => {
                  const isPast = topic.estimatedDate < new Date();
                  return (
                    <div
                      key={topic.id}
                      className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Badge variant="outline" className={`shrink-0 ${isPast ? 'text-yellow-400 border-yellow-600' : 'text-purple-400 border-purple-600'}`}>
                          #{index + 1}
                        </Badge>
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">{topic.topic}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-gray-400 text-xs flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(topic.estimatedDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                            <Badge className={`text-[10px] px-1.5 py-0 ${
                              topic.category === 'comercial' ? 'bg-purple-600' :
                              topic.category === 'tecnico' ? 'bg-green-600' : 'bg-blue-600'
                            } text-white`}>
                              {topic.category}
                            </Badge>
                            <span className="text-[10px] text-gray-500">P:{topic.priority}</span>
                          </div>
                          {topic.keywords.length > 0 && (
                            <p className="text-gray-500 text-[10px] mt-0.5 truncate">
                              🔑 {topic.keywords.slice(0, 3).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {isPast ? (
                          <Badge className="bg-yellow-600/20 text-yellow-400 text-[10px]">Pendente</Badge>
                        ) : (
                          <Badge className="bg-purple-600/20 text-purple-400 text-[10px]">Agendado</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}


      {published.length > 0 && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Publicados Recentemente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {published.map((article) => (
                  <div
                    key={article.id}
                    className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-gray-300 text-sm truncate">{article.title}</p>
                      <p className="text-gray-500 text-xs">
                        {article.published_at && format(new Date(article.published_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <Badge className="bg-green-600/20 text-green-400 shrink-0">Publicado</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ArticleScheduler;
