import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TelegramProductBuffer {
  id: string;
  chat_id: number;
  messages: string[];
  photo_file_ids: string[];
  draft_product_id: string | null;
  status: 'collecting' | 'awaiting_confirm' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export function useTelegramProductBuffers() {
  return useQuery({
    queryKey: ['telegram-product-buffers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('telegram_product_buffer')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as TelegramProductBuffer[];
    },
    refetchInterval: 5000, // Refetch every 5 seconds
  });
}

export function useDeleteProductBuffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('telegram_product_buffer')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram-product-buffers'] });
      toast.success('Buffer removido');
    },
    onError: (error) => {
      console.error('Error deleting buffer:', error);
      toast.error('Erro ao remover buffer');
    }
  });
}

export function useCleanupExpiredBuffers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('cleanup_expired_telegram_buffers');
      
      if (error) throw error;
      return data as number;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['telegram-product-buffers'] });
      toast.success(`${count} buffers expirados removidos`);
    },
    onError: (error) => {
      console.error('Error cleaning up buffers:', error);
      toast.error('Erro ao limpar buffers');
    }
  });
}
