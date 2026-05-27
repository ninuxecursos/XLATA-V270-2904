import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Lightbulb,
  ChevronRight,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  GUIDE_GROUPS,
  GUIDE_SECTIONS,
  GuideSection,
} from './blog-guide/guideContent';
import { downloadGuidePdf } from './blog-guide/generateGuidePdf';
import { toast } from 'sonner';

const groupAccent: Record<GuideSection['group'], string> = {
  'visao-geral': 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
  conteudo: 'text-sky-400 border-sky-500/40 bg-sky-500/10',
  ia: 'text-violet-400 border-violet-500/40 bg-violet-500/10',
  seo: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
  monitoramento: 'text-rose-400 border-rose-500/40 bg-rose-500/10',
  sistema: 'text-slate-300 border-slate-500/40 bg-slate-500/10',
};

export const BlogGuidePanel: React.FC = () => {
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string>(GUIDE_SECTIONS[0].id);

  const filteredSections = useMemo(() => {
    if (!query.trim()) return GUIDE_SECTIONS;
    const q = query.toLowerCase();
    return GUIDE_SECTIONS.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.label.toLowerCase().includes(q) ||
        s.tagline.toLowerCase().includes(q) ||
        s.whatItDoes.toLowerCase().includes(q)
    );
  }, [query]);

  const active = GUIDE_SECTIONS.find((s) => s.id === activeId) ?? GUIDE_SECTIONS[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-emerald-500/10 via-sky-500/5 to-violet-500/10 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-foreground mb-1">
              Guia do CMS Blog
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Manual passo a passo de cada funcionalidade: o que faz, quando usar e
              como usar. Use a busca para encontrar rapidamente o que precisa.
            </p>
          </div>
          <Button
            onClick={() => {
              try {
                downloadGuidePdf();
                toast.success('PDF gerado com sucesso');
              } catch (e) {
                console.error(e);
                toast.error('Falha ao gerar PDF');
              }
            }}
            className="hidden sm:inline-flex gap-2 bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            <Download className="w-4 h-4" />
            Exportar PDF
          </Button>
        </div>

        <div className="relative mt-5 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar funcionalidade (ex: agendar, fila, otimizador...)"
            className="pl-9 h-11 bg-background/60"
          />
        </div>
      </div>

      {/* Navegação compacta: chips por grupo + lista da seção ativa */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {GUIDE_GROUPS.map((group) => {
            const count = filteredSections.filter((s) => s.group === group.id).length;
            if (count === 0) return null;
            const isActive = active.group === group.id;
            return (
              <button
                key={group.id}
                onClick={() => {
                  const first = filteredSections.find((s) => s.group === group.id);
                  if (first) setActiveId(first.id);
                }}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/30 text-foreground/70 border-border hover:bg-muted/60'
                )}
              >
                {group.title}
                <span className="ml-1.5 opacity-60">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Lista horizontal de seções do grupo ativo */}
        <div className="flex flex-wrap gap-1.5 pb-2 border-b border-border">
          {filteredSections
            .filter((s) => s.group === active.group)
            .map((s) => {
              const isActive = s.id === activeId;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveId(s.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-sm transition-colors',
                    isActive
                      ? 'bg-primary/15 text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  )}
                >
                  {s.label}
                </button>
              );
            })}
        </div>

        {filteredSections.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma seção encontrada para "{query}".
          </p>
        )}

        {/* Conteúdo da seção ativa */}
        <Card className="bg-card border-border">
          <CardContent className="p-6 space-y-6">
            <div>
              <Badge
                variant="outline"
                className={cn('mb-3', groupAccent[active.group])}
              >
                {GUIDE_GROUPS.find((g) => g.id === active.group)?.title}
              </Badge>
              <h2 className="text-2xl font-bold text-foreground">
                {active.title}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {active.tagline}
              </p>
            </div>

            <Section
              icon={<BookOpen className="w-4 h-4" />}
              title="O que faz"
              tone="default"
            >
              {active.whatItDoes}
            </Section>

            <Section
              icon={<Clock className="w-4 h-4" />}
              title="Quando usar"
              tone="default"
            >
              {active.whenToUse}
            </Section>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-foreground">
                  Passo a passo
                </h3>
              </div>
              <ol className="space-y-3">
                {active.steps.map((step, i) => (
                  <li
                    key={i}
                    className="flex gap-3 p-3 rounded-lg bg-muted/30 border border-border"
                  >
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground text-sm">
                        {step.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {step.detail}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {active.tips && active.tips.length > 0 && (
              <Section
                icon={<Lightbulb className="w-4 h-4 text-amber-400" />}
                title="Dicas"
                tone="tip"
              >
                <ul className="space-y-1.5 list-disc list-inside">
                  {active.tips.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </Section>
            )}

            {active.warnings && active.warnings.length > 0 && (
              <Section
                icon={<AlertTriangle className="w-4 h-4 text-rose-400" />}
                title="Atenção"
                tone="warning"
              >
                <ul className="space-y-1.5 list-disc list-inside">
                  {active.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </Section>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const Section: React.FC<{
  icon: React.ReactNode;
  title: string;
  tone: 'default' | 'tip' | 'warning';
  children: React.ReactNode;
}> = ({ icon, title, tone, children }) => {
  const toneClass =
    tone === 'tip'
      ? 'bg-amber-500/5 border-amber-500/20 text-amber-100/90'
      : tone === 'warning'
      ? 'bg-rose-500/5 border-rose-500/20 text-rose-100/90'
      : 'bg-muted/30 border-border text-foreground/90';

  return (
    <div className={cn('rounded-lg border p-4', toneClass)}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className="font-semibold text-foreground text-sm">{title}</h3>
      </div>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
};

export default BlogGuidePanel;
