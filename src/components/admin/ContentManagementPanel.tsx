import React, { useState } from 'react';
import {
  FileText, Search, BookOpen, HelpCircle, Layers, BarChart3, Globe2, Sparkles,
  Lightbulb, TrendingUp, DollarSign, Rocket, UserCheck, Brain, Cpu, Wand2,
  ListOrdered, MessageSquareCode, GraduationCap, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import BlogGuidePanel from './BlogGuidePanel';
import { BlogManagement } from './BlogManagement';
import { AIPromptsManager } from './AIPromptsManager';
import { ManualArticleCreator } from './ManualArticleCreator';
import { ArticleJobsQueue } from './ArticleJobsQueue';
import { ArticleQueueExplainer } from './ArticleQueueExplainer';
import { SEOManagement } from './SEOManagement';
import { HelpArticlesManagement } from './HelpArticlesManagement';
import { GlossaryManagement } from './GlossaryManagement';
import { PillarPagesManagement } from './PillarPagesManagement';
import { RankingMonitorPanel } from './RankingMonitorPanel';
import { IndexationMonitorPanel } from './IndexationMonitorPanel';
import { SeoOptimizerPanel } from './SeoOptimizerPanel';
import { KeywordDiscoveryPanel } from './KeywordDiscoveryPanel';
import { TrafficEstimatorPanel } from './TrafficEstimatorPanel';
import { ArticleRevenuePanel } from './ArticleRevenuePanel';
import { ContentScalerPanel } from './ContentScalerPanel';
import { AdaptiveCopyPanel } from './AdaptiveCopyPanel';
import { SmartAuditPanel } from './SmartAuditPanel';
import { GrowthEnginePanel } from './GrowthEnginePanel';

type GroupId = 'guia' | 'conteudo' | 'visao' | 'ia' | 'seo' | 'monitor' | 'sistema';

type Item = {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  group: GroupId;
  render: () => React.ReactNode;
};

const ITEMS: Item[] = [
  // Guia (entrada para novos operadores)
  { id: 'guia', label: 'Guia de Uso', description: 'Manual completo de cada funcionalidade', icon: GraduationCap, group: 'guia', render: () => <BlogGuidePanel /> },

  // Visão Geral (leitura)
  { id: 'revenue', label: 'Receita', description: 'Receita por artigo', icon: DollarSign, group: 'visao', render: () => <ArticleRevenuePanel /> },
  { id: 'estimator', label: 'Estimador de Tráfego', description: 'Projeção de visitas e cliques', icon: TrendingUp, group: 'visao', render: () => <TrafficEstimatorPanel /> },
  { id: 'scaler', label: 'Escalador', description: 'Onde escalar conteúdo', icon: Rocket, group: 'visao', render: () => <ContentScalerPanel /> },

  // Conteúdo (CRUD)
  { id: 'blog', label: 'Blog', description: 'Posts publicados e rascunhos', icon: FileText, group: 'conteudo', render: () => <BlogManagement /> },
  { id: 'help', label: 'Ajuda', description: 'Artigos da Central de Ajuda', icon: HelpCircle, group: 'conteudo', render: () => <HelpArticlesManagement /> },
  { id: 'glossary', label: 'Glossário', description: 'Termos e definições', icon: BookOpen, group: 'conteudo', render: () => <GlossaryManagement /> },
  { id: 'pillar', label: 'Páginas-Pilar', description: 'Soluções e clusters', icon: Layers, group: 'conteudo', render: () => <PillarPagesManagement /> },
  { id: 'manual', label: 'Criar Manual', description: 'Editor de artigo manual', icon: Wand2, group: 'conteudo', render: () => <ManualArticleCreator /> },

  // IA
  { id: 'audit', label: 'Auditoria IA', description: 'Health Score do blog', icon: Brain, group: 'ia', render: () => <SmartAuditPanel /> },
  { id: 'growth', label: 'Motor de Crescimento', description: 'Otimização autônoma', icon: Cpu, group: 'ia', render: () => <GrowthEnginePanel /> },
  { id: 'optimizer', label: 'Otimizador', description: 'Reescreve artigos posições 5-20', icon: Sparkles, group: 'ia', render: () => <SeoOptimizerPanel /> },
  { id: 'adaptive', label: 'Copy IA', description: 'Copy adaptativa por audiência', icon: UserCheck, group: 'ia', render: () => <AdaptiveCopyPanel /> },
  { id: 'prompts', label: 'Prompts IA', description: 'Configuração dos prompts', icon: MessageSquareCode, group: 'ia', render: () => <AIPromptsManager /> },

  // SEO
  { id: 'seo', label: 'SEO', description: 'Configurações e topic bank', icon: Search, group: 'seo', render: () => <SEOManagement /> },
  { id: 'keywords', label: 'Descoberta de Keywords', description: 'Gaps e long-tail', icon: Lightbulb, group: 'seo', render: () => <KeywordDiscoveryPanel /> },

  // Monitoramento
  { id: 'ranking', label: 'Rankings', description: 'Posições no Google', icon: BarChart3, group: 'monitor', render: () => <RankingMonitorPanel /> },
  { id: 'indexation', label: 'Indexação', description: 'Status no Search Console', icon: Globe2, group: 'monitor', render: () => <IndexationMonitorPanel /> },

  // Sistema
  { id: 'jobs', label: 'Fila de Jobs', description: 'Agendador e execuções', icon: ListOrdered, group: 'sistema', render: () => (
    <div className="space-y-4">
      <ArticleQueueExplainer />
      <ArticleJobsQueue />
    </div>
  ) },
];

const GROUPS: { id: GroupId; title: string; subtitle: string }[] = [
  { id: 'guia', title: 'Comece aqui', subtitle: 'Manual de uso' },
  { id: 'visao', title: 'Visão Geral', subtitle: 'Leitura diária' },
  { id: 'conteudo', title: 'Conteúdo', subtitle: 'Criação e edição' },
  { id: 'ia', title: 'Inteligência IA', subtitle: 'Automação e qualidade' },
  { id: 'seo', title: 'SEO', subtitle: 'Estratégia e descoberta' },
  { id: 'monitor', title: 'Monitoramento', subtitle: 'Saúde do tráfego' },
  { id: 'sistema', title: 'Sistema', subtitle: 'Operação' },
];

export const ContentManagementPanel = () => {
  const [activeId, setActiveId] = useState<string>('guia');
  const active = ITEMS.find((i) => i.id === activeId) ?? ITEMS[0];
  const activeGroup = GROUPS.find((g) => g.id === active.group);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
      {/* Sidebar agrupada */}
      <aside className="space-y-6">
        {GROUPS.map((group) => {
          const items = ITEMS.filter((i) => i.group === group.id);
          if (items.length === 0) return null;
          return (
            <div key={group.id}>
              <div className="px-2 mb-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.title}
                </h3>
                <p className="text-[10px] text-muted-foreground/60">{group.subtitle}</p>
              </div>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.id === activeId;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveId(item.id)}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 group transition-all text-sm border',
                        isActive
                          ? 'bg-primary/15 text-primary border-primary/30 shadow-sm'
                          : 'text-foreground/80 hover:bg-muted/40 border-transparent'
                      )}
                    >
                      <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')} />
                      <span className="flex-1 truncate font-medium">{item.label}</span>
                      <ChevronRight
                        className={cn(
                          'w-3.5 h-3.5 transition-opacity',
                          isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </aside>

      {/* Área de conteúdo */}
      <main className="min-w-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 px-1">
          <span>CMS Blog</span>
          <ChevronRight className="w-3 h-3" />
          <span>{activeGroup?.title}</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">{active.label}</span>
        </div>
        <div>{active.render()}</div>
      </main>
    </div>
  );
};

export default ContentManagementPanel;
