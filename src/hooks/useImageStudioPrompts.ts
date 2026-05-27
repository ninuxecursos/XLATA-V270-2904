import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ImageStudioPrompt {
  id: string;
  name: string;
  prompt: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useImageStudioPrompts() {
  const [prompts, setPrompts] = useState<ImageStudioPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPrompts = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('image_studio_prompts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching prompts:', error);
      toast.error('Erro ao carregar prompts');
    } else {
      setPrompts(data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const activePrompt = prompts.find(p => p.is_active) || null;

  const createPrompt = async (name: string, prompt: string) => {
    const { error } = await supabase
      .from('image_studio_prompts')
      .insert({ name, prompt, is_active: false });

    if (error) {
      toast.error('Erro ao criar prompt');
      return false;
    }
    toast.success('Prompt criado!');
    await fetchPrompts();
    return true;
  };

  const updatePrompt = async (id: string, updates: { name?: string; prompt?: string }) => {
    const { error } = await supabase
      .from('image_studio_prompts')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast.error('Erro ao atualizar prompt');
      return false;
    }
    toast.success('Prompt atualizado!');
    await fetchPrompts();
    return true;
  };

  const deletePrompt = async (id: string) => {
    const { error } = await supabase
      .from('image_studio_prompts')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erro ao excluir prompt');
      return false;
    }
    toast.success('Prompt excluído!');
    await fetchPrompts();
    return true;
  };

  const activatePrompt = async (id: string) => {
    // Deactivate all first
    await supabase
      .from('image_studio_prompts')
      .update({ is_active: false })
      .neq('id', '00000000-0000-0000-0000-000000000000');

    // Activate the selected one
    const { error } = await supabase
      .from('image_studio_prompts')
      .update({ is_active: true })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao ativar prompt');
      return false;
    }
    toast.success('Prompt ativado!');
    await fetchPrompts();
    return true;
  };

  const deactivatePrompt = async (id: string) => {
    const { error } = await supabase
      .from('image_studio_prompts')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao desativar prompt');
      return false;
    }
    toast.success('Prompt desativado!');
    await fetchPrompts();
    return true;
  };

  return {
    prompts,
    activePrompt,
    isLoading,
    createPrompt,
    updatePrompt,
    deletePrompt,
    activatePrompt,
    deactivatePrompt,
    refetch: fetchPrompts,
  };
}
