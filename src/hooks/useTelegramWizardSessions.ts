import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TelegramWizardSession {
  id: string;
  chat_id: number;
  step: string;
  sale_type: string | null;
  data: {
    photos?: string[];
    name?: string;
    description?: string;
    cost_price?: number;
    sale_price?: number;
    category_id?: string;
    category_name?: string;
    initial_value?: number;
    minimum_increment?: number;
    duration_minutes?: number;
    auto_renew?: boolean;
  };
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export function useTelegramWizardSessions() {
  return useQuery({
    queryKey: ['telegram-wizard-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('telegram_wizard_sessions')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as TelegramWizardSession[];
    },
    refetchInterval: 5000, // Refetch every 5 seconds
  });
}

export function useDeleteWizardSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('telegram_wizard_sessions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram-wizard-sessions'] });
      toast.success('Sessão removida');
    },
    onError: (error) => {
      console.error('Error deleting session:', error);
      toast.error('Erro ao remover sessão');
    }
  });
}

export function useCleanupExpiredSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('cleanup_expired_wizard_sessions');
      
      if (error) throw error;
      return data as number;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['telegram-wizard-sessions'] });
      toast.success(`${count} sessões expiradas removidas`);
    },
    onError: (error) => {
      console.error('Error cleaning up sessions:', error);
      toast.error('Erro ao limpar sessões');
    }
  });
}
