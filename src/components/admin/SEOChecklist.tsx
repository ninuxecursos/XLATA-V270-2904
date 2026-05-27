import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SEOChecklistProps {
  title: string;
  seoTitle: string;
  seoDescription: string;
  content: string;
  ogImage: string;
  categoryId: string;
  tags: string;
}

interface CheckItem {
  label: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  weight: number;
}

export const SEOChecklist: React.FC<SEOChecklistProps> = ({
  title,
  seoTitle,
  seoDescription,
  content,
  ogImage,
  categoryId,
  tags
}) => {
  const wordCount = useMemo(() => {
    if (!content) return 0;
    return content.trim().split(/\s+/).filter(Boolean).length;
  }, [content]);

  const internalLinksCount = useMemo(() => {
    if (!content) return 0;
    // Count markdown links that point to internal paths
    const internalLinkPattern = /\[([^\]]+)\]\(\/[^)]+\)/g;
    const matches = content.match(internalLinkPattern);
    return matches ? matches.length : 0;
  }, [content]);

  const checks: CheckItem[] = useMemo(() => {
    const items: CheckItem[] = [];

    // Title check
    const titleLength = (seoTitle || title || '').length;
    if (titleLength === 0) {
      items.push({ label: 'Título SEO', status: 'error', message: 'Não definido', weight: 15 });
    } else if (titleLength > 60) {
      items.push({ label: 'Título SEO', status: 'warning', message: `${titleLength} caracteres (máx: 60)`, weight: 10 });
    } else if (titleLength < 30) {
      items.push({ label: 'Título SEO', status: 'warning', message: `${titleLength} caracteres (mín: 30)`, weight: 10 });
    } else {
      items.push({ label: 'Título SEO', status: 'success', message: `${titleLength} caracteres`, weight: 15 });
    }

    // Meta description check
    const descLength = (seoDescription || '').length;
    if (descLength === 0) {
      items.push({ label: 'Meta descrição', status: 'error', message: 'Não definida', weight: 15 });
    } else if (descLength > 160) {
      items.push({ label: 'Meta descrição', status: 'warning', message: `${descLength} caracteres (máx: 160)`, weight: 10 });
    } else if (descLength < 70) {
      items.push({ label: 'Meta descrição', status: 'warning', message: `${descLength} caracteres (mín: 70)`, weight: 10 });
    } else {
      items.push({ label: 'Meta descrição', status: 'success', message: `${descLength} caracteres`, weight: 15 });
    }

    // Word count check
    if (wordCount === 0) {
      items.push({ label: 'Conteúdo', status: 'error', message: 'Sem conteúdo', weight: 25 });
    } else if (wordCount < 400) {
      items.push({ label: 'Conteúdo', status: 'error', message: `${wordCount} palavras (mín: 400)`, weight: 5 });
    } else if (wordCount < 1200) {
      items.push({ label: 'Conteúdo', status: 'warning', message: `${wordCount} palavras (ideal: 1200+)`, weight: 15 });
    } else {
      items.push({ label: 'Conteúdo', status: 'success', message: `${wordCount} palavras ✓`, weight: 25 });
    }

    // OG Image check
    if (!ogImage) {
      items.push({ label: 'Imagem de capa', status: 'error', message: 'Não definida', weight: 15 });
    } else {
      items.push({ label: 'Imagem de capa', status: 'success', message: 'Definida', weight: 15 });
    }

    // Internal links check
    if (internalLinksCount === 0) {
      items.push({ label: 'Links internos', status: 'warning', message: 'Nenhum detectado', weight: 10 });
    } else if (internalLinksCount < 2) {
      items.push({ label: 'Links internos', status: 'warning', message: `${internalLinksCount} link (ideal: 2+)`, weight: 8 });
    } else {
      items.push({ label: 'Links internos', status: 'success', message: `${internalLinksCount} links`, weight: 15 });
    }

    // Category check
    if (!categoryId) {
      items.push({ label: 'Categoria', status: 'warning', message: 'Não atribuída', weight: 5 });
    } else {
      items.push({ label: 'Categoria', status: 'success', message: 'Atribuída', weight: 10 });
    }

    // Tags check
    const tagsArray = tags ? tags.split(',').filter(t => t.trim()) : [];
    if (tagsArray.length === 0) {
      items.push({ label: 'Tags', status: 'warning', message: 'Nenhuma definida', weight: 5 });
    } else if (tagsArray.length < 3) {
      items.push({ label: 'Tags', status: 'warning', message: `${tagsArray.length} tags (ideal: 3+)`, weight: 5 });
    } else {
      items.push({ label: 'Tags', status: 'success', message: `${tagsArray.length} tags`, weight: 10 });
    }

    return items;
  }, [title, seoTitle, seoDescription, content, ogImage, categoryId, tags, wordCount, internalLinksCount]);

  const score = useMemo(() => {
    const totalWeight = checks.reduce((sum, item) => sum + item.weight, 0);
    const earnedWeight = checks.reduce((sum, item) => {
      if (item.status === 'success') return sum + item.weight;
      if (item.status === 'warning') return sum + (item.weight * 0.5);
      return sum;
    }, 0);
    return Math.round((earnedWeight / totalWeight) * 100);
  }, [checks]);

  const getScoreColor = () => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getProgressColor = () => {
    if (score >= 80) return '[&>div]:bg-emerald-500';
    if (score >= 60) return '[&>div]:bg-yellow-500';
    return '[&>div]:bg-red-500';
  };

  const StatusIcon: React.FC<{ status: 'success' | 'warning' | 'error' }> = ({ status }) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-400 flex-shrink-0" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />;
    }
  };

  return (
    <Card className="bg-gray-700/50 border-gray-600">
      <CardHeader className="py-3 px-4">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-emerald-400">
            <TrendingUp className="h-4 w-4" />
            Verificação SEO
          </span>
          <span className={cn("text-lg font-bold", getScoreColor())}>
            {score}%
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-4 pb-4">
        <Progress value={score} className={cn("h-2 mb-4", getProgressColor())} />
        
        <div className="space-y-2">
          {checks.map((check, index) => (
            <div key={index} className="flex items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <StatusIcon status={check.status} />
                <span className="text-gray-300 truncate">{check.label}</span>
              </div>
              <span className={cn(
                "text-xs whitespace-nowrap",
                check.status === 'success' && 'text-emerald-400',
                check.status === 'warning' && 'text-yellow-400',
                check.status === 'error' && 'text-red-400'
              )}>
                {check.message}
              </span>
            </div>
          ))}
        </div>

        {score < 60 && (
          <p className="text-xs text-red-400 mt-3 p-2 bg-red-500/10 rounded">
            ⚠️ SEO precisa de melhorias significativas antes de publicar
          </p>
        )}
        {score >= 60 && score < 80 && (
          <p className="text-xs text-yellow-400 mt-3 p-2 bg-yellow-500/10 rounded">
            💡 Algumas melhorias recomendadas para SEO ideal
          </p>
        )}
        {score >= 80 && (
          <p className="text-xs text-emerald-400 mt-3 p-2 bg-emerald-500/10 rounded">
            ✓ Ótimo! Artigo bem otimizado para SEO
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default SEOChecklist;
