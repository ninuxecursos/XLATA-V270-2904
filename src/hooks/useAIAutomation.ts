import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AIConfig {
  id: string;
  ai_provider: 'lovable_cloud' | 'google_gemini';
  ai_model: string;
  is_ai_active: boolean;
  automation_enabled: boolean;
  articles_per_month: number;
  publish_hour: number;
  publish_interval_days: number;
  min_word_count: number;
  max_word_count: number;
  default_category_id: string | null;
  last_generation_at: string | null;
  next_generation_at: string | null;
  total_articles_generated: number;
  gemini_api_key: string | null;
  created_at: string;
  updated_at: string;
}

interface SEOTopic {
  id: string;
  topic: string;
  keywords: string[];
  category: 'educacional' | 'tecnico' | 'comercial';
  priority: number;
  is_used: boolean;
  used_at: string | null;
  created_at: string;
}

interface GenerationLog {
  id: string;
  blog_post_id: string | null;
  topic_id: string | null;
  topic_used: string;
  ai_provider: string;
  ai_model: string | null;
  generation_time_ms: number | null;
  word_count: number | null;
  status: 'pending' | 'success' | 'failed';
  error_message: string | null;
  created_at: string;
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

export const useAIAutomation = () => {
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [topics, setTopics] = useState<SEOTopic[]>([]);
  const [logs, setLogs] = useState<GenerationLog[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [generating, setGenerating] = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('ai_automation_config')
        .select('*')
        .single();

      if (error) throw error;
      setConfig(data as AIConfig);
    } catch (error) {
      console.error('Error loading AI config:', error);
    }
  }, []);

  const loadTopics = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('seo_topic_bank')
        .select('*')
        .order('priority', { ascending: false })
        .order('is_used', { ascending: true });

      if (error) throw error;
      setTopics((data || []) as SEOTopic[]);
    } catch (error) {
      console.error('Error loading topics:', error);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('article_generation_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs((data || []) as GenerationLog[]);
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('id, name, slug')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadConfig(), loadTopics(), loadLogs(), loadCategories()]);
    setLoading(false);
  }, [loadConfig, loadTopics, loadLogs, loadCategories]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const updateConfig = async (updates: Partial<AIConfig>) => {
    if (!config) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('ai_automation_config')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', config.id);

      if (error) throw error;
      
      setConfig({ ...config, ...updates });
      toast({
        title: 'Sucesso',
        description: 'Configurações salvas com sucesso',
      });
    } catch (error) {
      console.error('Error updating config:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar configurações',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async (geminiApiKey?: string) => {
    if (!config) return;
    
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-ai-connection', {
        body: {
          provider: config.ai_provider,
          model: config.ai_model,
          geminiApiKey: geminiApiKey || undefined,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Conexão OK',
          description: `Conectado com sucesso! Tempo de resposta: ${data.responseTime}ms`,
        });
      } else {
        toast({
          title: 'Falha na conexão',
          description: data.error || 'Erro desconhecido',
          variant: 'destructive',
        });
      }
      
      return data;
    } catch (error) {
      console.error('Error testing connection:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao testar conexão com a IA',
        variant: 'destructive',
      });
      return { success: false };
    } finally {
      setTesting(false);
    }
  };

  const generateArticle = async (topicId?: string) => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-seo-article', {
        body: topicId ? { topic_id: topicId } : {},
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Artigo gerado!',
          description: `"${data.article.title}" - ${data.article.wordCount} palavras`,
        });
        await loadAll();
      } else {
        toast({
          title: 'Falha na geração',
          description: data.error || 'Erro desconhecido',
          variant: 'destructive',
        });
      }
      
      return data;
    } catch (error) {
      console.error('Error generating article:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao gerar artigo',
        variant: 'destructive',
      });
      return { success: false };
    } finally {
      setGenerating(false);
    }
  };

  const addTopic = async (topic: string, keywords: string[], category: string, priority: number) => {
    try {
      const { error } = await supabase
        .from('seo_topic_bank')
        .insert({
          topic,
          keywords,
          category,
          priority,
        });

      if (error) throw error;
      
      toast({
        title: 'Sucesso',
        description: 'Tema adicionado com sucesso',
      });
      await loadTopics();
    } catch (error) {
      console.error('Error adding topic:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao adicionar tema',
        variant: 'destructive',
      });
    }
  };

  const deleteTopic = async (topicId: string) => {
    try {
      const { error } = await supabase
        .from('seo_topic_bank')
        .delete()
        .eq('id', topicId);

      if (error) throw error;
      
      toast({
        title: 'Sucesso',
        description: 'Tema removido com sucesso',
      });
      await loadTopics();
    } catch (error) {
      console.error('Error deleting topic:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao remover tema',
        variant: 'destructive',
      });
    }
  };

  const resetTopic = async (topicId: string) => {
    try {
      const { error } = await supabase
        .from('seo_topic_bank')
        .update({ is_used: false, used_at: null })
        .eq('id', topicId);

      if (error) throw error;
      
      toast({
        title: 'Sucesso',
        description: 'Tema resetado para disponível',
      });
      await loadTopics();
    } catch (error) {
      console.error('Error resetting topic:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao resetar tema',
        variant: 'destructive',
      });
    }
  };

  // Stats calculations
  const stats = {
    totalTopics: topics.length,
    usedTopics: topics.filter(t => t.is_used).length,
    availableTopics: topics.filter(t => !t.is_used).length,
    successfulGenerations: logs.filter(l => l.status === 'success').length,
    failedGenerations: logs.filter(l => l.status === 'failed').length,
    successRate: logs.length > 0 
      ? Math.round((logs.filter(l => l.status === 'success').length / logs.length) * 100) 
      : 0,
    avgGenerationTime: logs.filter(l => l.generation_time_ms).length > 0
      ? Math.round(
          logs.filter(l => l.generation_time_ms)
            .reduce((sum, l) => sum + (l.generation_time_ms || 0), 0) / 
          logs.filter(l => l.generation_time_ms).length
        )
      : 0,
    avgWordCount: logs.filter(l => l.word_count).length > 0
      ? Math.round(
          logs.filter(l => l.word_count)
            .reduce((sum, l) => sum + (l.word_count || 0), 0) / 
          logs.filter(l => l.word_count).length
        )
      : 0,
  };

  return {
    config,
    topics,
    logs,
    categories,
    stats,
    loading,
    saving,
    testing,
    generating,
    updateConfig,
    testConnection,
    generateArticle,
    addTopic,
    deleteTopic,
    resetTopic,
    refresh: loadAll,
  };
};

export default useAIAutomation;
