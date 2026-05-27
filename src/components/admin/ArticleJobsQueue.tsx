import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ListOrdered, RefreshCw, Play, X, Trash2, Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  status: 'pending' | 'generating' | 'completed' | 'error' | 'cancelled';
  progress: number;
  error_message: string | null;
  retry_count: number;
  max_retries: number;
  scheduled_at: string;
  finished_at: string | null;
  blog_post_id: string | null;
  created_at: string;
}

const statusBadge = (s: Job['status']) => {
  const map: Record<Job['status'], { icon: any; cls: string; label: string }> = {
    pending: { icon: Clock, cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30', label: 'Pendente' },
    generating: { icon: Loader2, cls: 'bg-blue-500/10 text-blue-400 border-blue-500/30 animate-pulse', label: 'Gerando' },
    completed: { icon: CheckCircle2, cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', label: 'Concluído' },
    error: { icon: AlertCircle, cls: 'bg-red-500/10 text-red-400 border-red-500/30', label: 'Erro' },
    cancelled: { icon: X, cls: 'bg-muted text-muted-foreground', label: 'Cancelado' },
  };
  return map[s];
};

export function ArticleJobsQueue() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('article_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    setJobs((data || []) as Job[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel('article_jobs_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'article_jobs' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const runNow = async (id: string) => {
    toast({ title: 'Disparado', description: 'Job enviado para processamento' });
    await supabase.from('article_jobs').update({ scheduled_at: new Date().toISOString(), status: 'pending', error_message: null }).eq('id', id);
    supabase.functions.invoke('process-article-job', { body: { job_id: id } }).catch(() => {});
  };

  const cancel = async (id: string) => {
    await supabase.from('article_jobs').update({ status: 'cancelled', finished_at: new Date().toISOString() }).eq('id', id);
    toast({ title: 'Cancelado' });
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir este job?')) return;
    await supabase.from('article_jobs').delete().eq('id', id);
    toast({ title: 'Removido' });
  };

  const clearCompleted = async () => {
    if (!confirm('Limpar todos os jobs concluídos e cancelados?')) return;
    await supabase.from('article_jobs').delete().in('status', ['completed', 'cancelled']);
    toast({ title: 'Limpos' });
    load();
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <ListOrdered className="h-5 w-5 text-primary" /> Fila de Artigos
          <Badge variant="outline" className="ml-2">{jobs.length}</Badge>
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-1" /> Atualizar</Button>
          <Button variant="outline" size="sm" onClick={clearCompleted}><Trash2 className="h-4 w-4 mr-1" /> Limpar finalizados</Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Carregando…</div>
        ) : jobs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Nenhum job na fila</div>
        ) : (
          <div className="space-y-2">
            {jobs.map((j) => {
              const sb = statusBadge(j.status);
              const Icon = sb.icon;
              return (
                <div key={j.id} className="border border-border rounded-xl p-3 bg-background/40">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={sb.cls}>
                          <Icon className="h-3 w-3 mr-1" /> {sb.label}
                        </Badge>
                        {j.retry_count > 0 && (
                          <Badge variant="outline" className="text-xs">Tentativa {j.retry_count}/{j.max_retries}</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          Agendado: {new Date(j.scheduled_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground mt-1 truncate">{j.title}</p>
                      {j.status === 'generating' && (
                        <Progress value={j.progress} className="h-1.5 mt-2" />
                      )}
                      {j.error_message && (
                        <p className="text-xs text-red-400 mt-1 break-all">{j.error_message}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {(j.status === 'pending' || j.status === 'error') && (
                        <Button size="sm" variant="outline" onClick={() => runNow(j.id)} title="Processar agora">
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      {(j.status === 'pending' || j.status === 'generating') && (
                        <Button size="sm" variant="outline" onClick={() => cancel(j.id)} title="Cancelar">
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => remove(j.id)} title="Excluir">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ArticleJobsQueue;
