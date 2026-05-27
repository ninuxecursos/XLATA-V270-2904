import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TelegramBotConfig {
  id: string;
  bot_token: string;
  allowed_chat_ids: number[];
  default_category_id: string | null;
  is_active: boolean;
  webhook_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface TelegramPendingProduct {
  id: string;
  media_group_id: string;
  chat_id: number;
  photos: Array<{ message_id: number; file_id: string }>;
  raw_user_text: string;
  ai_parsed_data: any;
  temp_image_urls: string[];
  product_id: string | null;
  status: string;
  preview_message_id: number | null;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export function useTelegramBotConfig() {
  return useQuery({
    queryKey: ['telegram-bot-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('telegram_bot_config')
        .select('*')
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as TelegramBotConfig | null;
    }
  });
}

export function useUpdateTelegramBotConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: Partial<TelegramBotConfig> & { id?: string }) => {
      const { id, created_at, updated_at, ...updateData } = config;

      if (id) {
        // Update existing
        const { data, error } = await supabase
          .from('telegram_bot_config')
          .update({ ...updateData, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Create new - ensure bot_token is provided
        if (!updateData.bot_token) {
          throw new Error('bot_token is required');
        }
        const { data, error } = await supabase
          .from('telegram_bot_config')
          .insert({
            bot_token: updateData.bot_token,
            allowed_chat_ids: updateData.allowed_chat_ids,
            default_category_id: updateData.default_category_id,
            is_active: updateData.is_active,
            webhook_url: updateData.webhook_url,
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram-bot-config'] });
      toast.success('Configuração salva com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating telegram config:', error);
      toast.error('Erro ao salvar configuração');
    }
  });
}

export function useTelegramPendingProducts() {
  return useQuery({
    queryKey: ['telegram-pending-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('telegram_product_pending')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as TelegramPendingProduct[];
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}

export function useDeleteTelegramPending() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('telegram_product_pending')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram-pending-products'] });
      toast.success('Registro removido');
    },
    onError: (error) => {
      console.error('Error deleting pending:', error);
      toast.error('Erro ao remover registro');
    }
  });
}
