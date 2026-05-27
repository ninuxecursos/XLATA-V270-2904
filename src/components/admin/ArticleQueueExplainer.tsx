import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, Database, ListOrdered, FileEdit, CheckCircle2, Calendar, Sparkles } from 'lucide-react';

interface Counters {
  topicsAvailable: number;
  jobsActive: number;
  drafts: number;
  scheduled: number;
  published: number;
}

interface NextTopic {
  id: string;
  topic: string;
  priority: number;
  category: string;
}

interface ScheduledPost {
  id: string;
  title: string;
  slug: string;
  published_at: string;
}

export function ArticleQueueExplainer() {
  const [counters, setCounters] = useState<Counters>({
    topicsAvailable: 0,
    jobsActive: 0,
    drafts: 0,
    scheduled: 0,
    published: 0,
  });
  const [nextTopics, setNextTopics] = useState<NextTopic[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const nowIso = new Date().toISOString();

    try {
      const [topicsRes, jobsRes, draftsRes, scheduledRes, publishedRes, nextTopicsRes, scheduledPostsRes] = await Promise.all([
        supabase.from('seo_topic_bank').select('id', { count: 'exact', head: true }).eq('is_used', false),
        supabase.from('article_jobs').select('id', { count: 'exact', head: true }).in('status', ['pending', 'generating']),
        supabase.from('blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'draft').or(`published_at.is.null,published_at.lte.${nowIso}`),
        supabase.from('blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'draft').gt('published_at', nowIso),
        supabase.from('blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('seo_topic_bank').select('id, topic, priority, category').eq('is_used', false).order('priority', { ascending: false }).limit(10),
        supabase.from('blog_posts').select('id, title, slug, published_at').eq('status', 'draft').gt('published_at', nowIso).order('published_at', { ascending: true }).limit(10),
      ]);

      setCounters({
        topicsAvailable: topicsRes.count || 0,
        jobsActive: jobsRes.count || 0,
        drafts: draftsRes.count || 0,
        scheduled: scheduledRes.count || 0,
        published: publishedRes.count || 0,
      });
      setNextTopics((nextTopicsRes.data || []) as NextTopic[]);
      setScheduledPosts((scheduledPostsRes.data || []) as ScheduledPost[]);
    } catch (err) {
      console.error('Error loading explainer data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedLoad = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      load();
    }, 1000); // 1s debounce
  }, [load]);

  useEffect(() => {
    load();
    const ch = supabase
      .channel('queue_explainer_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'article_jobs' }, () => debouncedLoad())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seo_topic_bank' }, () => debouncedLoad())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blog_posts' }, () => debouncedLoad())
      .subscribe();
    return () => { 
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(ch); 
    };
  }, [load, debouncedLoad]);

  return (
    <div className="space-y-4">
      {/* Card explicativo */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-foreground text-lg">
            <Info className="h-5 w-5 text-primary" /> Como funciona o pipeline
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            O sistema gera artigos automaticamente em 4 etapas. Cada etapa tem sua própria visualização:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-3">
            <div className="rounded-lg border border-border bg-background/50 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Database className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-semibold text-foreground">1. Banco de Temas</span>
              </div>
              <p className="text-xs">Tópicos aguardando para virar artigo (descobertos pela IA).</p>
            </div>
            <div className="rounded-lg border border-border bg-background/50 p-3">
              <div className="flex items-center gap-2 mb-1">
                <ListOrdered className="h-4 w-4 text-blue-400" />
                <span className="text-xs font-semibold text-foreground">2. Fila de Execução</span>
              </div>
              <p className="text-xs">Jobs sendo processados pela IA em tempo real.</p>
            </div>
            <div className="rounded-lg border border-border bg-background/50 p-3">
              <div className="flex items-center gap-2 mb-1">
                <FileEdit className="h-4 w-4 text-purple-400" />
                <span className="text-xs font-semibold text-foreground">3. Rascunhos/Agendados</span>
              </div>
              <p className="text-xs">Artigos prontos esperando data de publicação.</p>
            </div>
            <div className="rounded-lg border border-border bg-background/50 p-3">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-semibold text-foreground">4. Publicados</span>
              </div>
              <p className="text-xs">No ar, indexados no sitemap, escalando no Google.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contadores */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Database className="h-4 w-4 text-amber-400" />
              <span className="text-xs text-muted-foreground">Temas no banco</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{loading ? '…' : counters.topicsAvailable}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <ListOrdered className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-muted-foreground">Jobs ativos</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{loading ? '…' : counters.jobsActive}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <FileEdit className="h-4 w-4 text-purple-400" />
              <span className="text-xs text-muted-foreground">Rascunhos</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{loading ? '…' : counters.drafts}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="h-4 w-4 text-cyan-400" />
              <span className="text-xs text-muted-foreground">Agendados</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{loading ? '…' : counters.scheduled}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-muted-foreground">Publicados</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{loading ? '…' : counters.published}</div>
          </CardContent>
        </Card>
      </div>

      {/* Próximos artigos agendados (blog_posts scheduled) */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-foreground text-base">
            <Calendar className="h-4 w-4 text-cyan-400" /> Próximos a publicar
            <Badge variant="outline" className="ml-1">{scheduledPosts.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Carregando…</div>
          ) : scheduledPosts.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nenhum artigo agendado. Os próximos artigos gerados aparecerão aqui.</div>
          ) : (
            <div className="space-y-1.5">
              {scheduledPosts.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 p-2 rounded-lg border border-border bg-background/40">
                  <span className="text-sm text-foreground truncate flex-1">{p.title}</span>
                  <Badge variant="outline" className="text-xs whitespace-nowrap">
                    {new Date(p.published_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Próximos tópicos do banco de temas */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-foreground text-base">
            <Sparkles className="h-4 w-4 text-amber-400" /> Próximos tópicos do banco
            <Badge variant="outline" className="ml-1">{nextTopics.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Carregando…</div>
          ) : nextTopics.length === 0 ? (
            <div className="text-sm text-muted-foreground">Banco vazio. A descoberta automática de keywords roda diariamente às 03:00.</div>
          ) : (
            <div className="space-y-1.5">
              {nextTopics.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 p-2 rounded-lg border border-border bg-background/40">
                  <span className="text-sm text-foreground truncate flex-1">{t.topic}</span>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-xs capitalize">{t.category}</Badge>
                    <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/30">P{t.priority}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ArticleQueueExplainer;
