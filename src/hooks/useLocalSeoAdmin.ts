import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { 
  LocalSeoState, 
  LocalSeoCity, 
  LocalSeoPage,
  LocalSeoFeature,
  LocalSeoFaq 
} from '@/types/localSeo';

// Helper to safely parse JSONB features
const parseFeatures = (features: unknown): LocalSeoFeature[] => {
  if (!Array.isArray(features)) return [];
  return features.map(f => {
    if (typeof f === 'object' && f !== null) {
      return {
        icon: typeof (f as Record<string, unknown>).icon === 'string' ? (f as Record<string, unknown>).icon as string : undefined,
        title: typeof (f as Record<string, unknown>).title === 'string' ? (f as Record<string, unknown>).title as string : '',
        description: typeof (f as Record<string, unknown>).description === 'string' ? (f as Record<string, unknown>).description as string : '',
      };
    }
    return { title: '', description: '' };
  });
};

// Helper to safely parse JSONB FAQ
const parseFaq = (faq: unknown): LocalSeoFaq[] => {
  if (!Array.isArray(faq)) return [];
  return faq.map(f => {
    if (typeof f === 'object' && f !== null) {
      return {
        question: typeof (f as Record<string, unknown>).question === 'string' ? (f as Record<string, unknown>).question as string : '',
        answer: typeof (f as Record<string, unknown>).answer === 'string' ? (f as Record<string, unknown>).answer as string : '',
      };
    }
    return { question: '', answer: '' };
  });
};

export interface LocalSeoStats {
  totalPages: number;
  pagesWithContent: number;
  pagesWithoutContent: number;
  totalStates: number;
  totalCities: number;
  publishedPages: number;
  draftPages: number;
  averageWordCount: number;
}

export interface PageStatus {
  id: string;
  slug: string;
  pageType: 'state' | 'city';
  stateName: string;
  cityName?: string;
  status: 'published' | 'draft';
  hasContent: boolean;
  wordCount: number;
  updatedAt: string;
}

export const useLocalSeoAdmin = () => {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 });

  // Fetch all pages with their states and cities
  const { data: allPages, isLoading: loadingPages, refetch: refetchPages } = useQuery({
    queryKey: ['local-seo-admin-pages'],
    queryFn: async (): Promise<PageStatus[]> => {
      const { data, error } = await supabase
        .from('local_seo_pages')
        .select(`
          id,
          slug,
          page_type,
          status,
          content_html,
          updated_at,
          state:local_seo_states(name),
          city:local_seo_cities(name)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(page => ({
        id: page.id,
        slug: page.slug,
        pageType: page.page_type as 'state' | 'city',
        stateName: (page.state as any)?.name || '',
        cityName: (page.city as any)?.name || undefined,
        status: page.status as 'published' | 'draft',
        hasContent: !!page.content_html && page.content_html.length > 100,
        wordCount: countWords(page.content_html || ''),
        updatedAt: page.updated_at,
      }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Calculate stats
  const stats: LocalSeoStats = {
    totalPages: allPages?.length || 0,
    pagesWithContent: allPages?.filter(p => p.hasContent).length || 0,
    pagesWithoutContent: allPages?.filter(p => !p.hasContent).length || 0,
    totalStates: allPages?.filter(p => p.pageType === 'state').length || 0,
    totalCities: allPages?.filter(p => p.pageType === 'city').length || 0,
    publishedPages: allPages?.filter(p => p.status === 'published').length || 0,
    draftPages: allPages?.filter(p => p.status === 'draft').length || 0,
    averageWordCount: allPages && allPages.length > 0
      ? Math.round(allPages.reduce((sum, p) => sum + p.wordCount, 0) / allPages.length)
      : 0,
  };

  // Generate content for a single page
  const generateSinglePage = useMutation({
    mutationFn: async (pageId: string) => {
      setIsGenerating(true);
      
      const response = await supabase.functions.invoke('generate-local-seo-content', {
        body: { pageId }
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Conteúdo gerado',
        description: data.message || 'Página atualizada com sucesso',
      });
      queryClient.invalidateQueries({ queryKey: ['local-seo-admin-pages'] });
    },
    onError: (error) => {
      console.error('Generation error:', error);
      toast({
        title: 'Erro ao gerar conteúdo',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsGenerating(false);
    }
  });

  // Generate content in batch
  const generateBatch = useCallback(async (type: 'states' | 'cities' | 'all', limit: number = 10, forceRegenerate: boolean = false) => {
    setIsGenerating(true);
    setGenerationProgress({ current: 0, total: limit });

    try {
      const response = await supabase.functions.invoke('generate-local-seo-content', {
        body: { batchType: type, limit, forceRegenerate }
      });

      if (response.error) throw response.error;

      const data = response.data;
      setGenerationProgress({ current: data.generated || 0, total: limit });

      toast({
        title: data.generated > 0 ? 'Geração em lote concluída' : 'Nenhuma página para gerar',
        description: data.generated > 0 
          ? `${data.generated} páginas geradas, ${data.errors || 0} erros`
          : 'Todas as páginas já possuem conteúdo gerado.',
        variant: (data.errors || 0) > 0 ? 'destructive' : 'default',
      });

      queryClient.invalidateQueries({ queryKey: ['local-seo-admin-pages'] });
      return data;

    } catch (error) {
      console.error('Batch generation error:', error);
      toast({
        title: 'Erro na geração em lote',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [queryClient]);

  // Update page status
  const updatePageStatus = useMutation({
    mutationFn: async ({ pageId, status }: { pageId: string; status: 'published' | 'draft' }) => {
      const { error } = await supabase
        .from('local_seo_pages')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', pageId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Status atualizado' });
      queryClient.invalidateQueries({ queryKey: ['local-seo-admin-pages'] });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar status',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  });

  // Get single page details for editing
  const getPageDetails = async (pageId: string): Promise<LocalSeoPage | null> => {
    const { data, error } = await supabase
      .from('local_seo_pages')
      .select(`
        *,
        state:local_seo_states(*),
        city:local_seo_cities(*)
      `)
      .eq('id', pageId)
      .single();

    if (error) {
      console.error('Error fetching page:', error);
      return null;
    }

    return {
      ...data,
      page_type: data.page_type as 'state' | 'city',
      status: data.status as 'draft' | 'published',
      features: parseFeatures(data.features),
      faq: parseFaq(data.faq),
      schema_data: data.schema_data as LocalSeoPage['schema_data'] || null,
      state: data.state as LocalSeoState | undefined,
      city: data.city as LocalSeoCity | undefined,
    } as LocalSeoPage;
  };

  // Update page content
  const updatePageContent = useMutation({
    mutationFn: async (page: Partial<LocalSeoPage> & { id: string }) => {
      // Convert features and faq to JSON-compatible format
      const featuresJson = page.features ? JSON.parse(JSON.stringify(page.features)) : null;
      const faqJson = page.faq ? JSON.parse(JSON.stringify(page.faq)) : null;

      const { error } = await supabase
        .from('local_seo_pages')
        .update({
          headline: page.headline,
          subheadline: page.subheadline,
          content_html: page.content_html,
          seo_title: page.seo_title,
          seo_description: page.seo_description,
          features: featuresJson,
          faq: faqJson,
          status: page.status,
          allow_indexing: page.allow_indexing,
          updated_at: new Date().toISOString(),
        })
        .eq('id', page.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Página atualizada com sucesso' });
      queryClient.invalidateQueries({ queryKey: ['local-seo-admin-pages'] });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar página',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  });

  return {
    allPages,
    stats,
    loadingPages,
    isGenerating,
    generationProgress,
    refetchPages,
    generateSinglePage,
    generateBatch,
    updatePageStatus,
    getPageDetails,
    updatePageContent,
  };
};

// Helper function to count words
function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.split(' ').filter(word => word.length > 0).length;
}
