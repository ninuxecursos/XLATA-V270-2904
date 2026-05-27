import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PinterestConfig {
  id: string;
  app_id: string | null;
  app_secret: string | null;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  is_enabled: boolean;
  default_board_id: string | null;
  boards_cache: any[];
  delay_minutes: number;
  max_pins_per_product: number;
  created_at: string;
  updated_at: string;
}

export interface PinterestPinLog {
  id: string;
  product_id: string | null;
  pin_id: string | null;
  board_id: string | null;
  pin_url: string | null;
  status: string;
  error_message: string | null;
  title: string | null;
  description: string | null;
  image_url: string | null;
  created_at: string;
}

export function usePinterestConfig() {
  return useQuery({
    queryKey: ['pinterest-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pinterest_config')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as PinterestConfig | null;
    }
  });
}

export function useUpsertPinterestConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<PinterestConfig>) => {
      // Check if config exists
      const { data: existing } = await supabase
        .from('pinterest_config')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('pinterest_config')
          .update(updates)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('pinterest_config')
          .insert(updates)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pinterest-config'] });
      toast.success('Configuração salva!');
    },
    onError: (err: Error) => {
      toast.error(`Erro: ${err.message}`);
    }
  });
}

export function usePinterestPinsLog(limit = 50) {
  return useQuery({
    queryKey: ['pinterest-pins-log', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pinterest_pins_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as PinterestPinLog[];
    }
  });
}

export function usePinterestStats() {
  return useQuery({
    queryKey: ['pinterest-stats'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: todayPins } = await supabase
        .from('pinterest_pins_log')
        .select('status')
        .gte('created_at', today.toISOString());

      const { count: productsWithoutPin } = await supabase
        .from('shop_products')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .not('id', 'in', `(SELECT DISTINCT product_id FROM pinterest_pins_log WHERE status = 'published')`)

      const total = todayPins?.length || 0;
      const published = todayPins?.filter(p => p.status === 'published').length || 0;
      const failed = todayPins?.filter(p => p.status === 'failed').length || 0;

      return {
        todayTotal: total,
        todayPublished: published,
        todayFailed: failed,
        successRate: total > 0 ? Math.round((published / total) * 100) : 0,
        productsWithoutPin: productsWithoutPin || 0
      };
    }
  });
}

export function useRepublishPin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      const { data, error } = await supabase.functions.invoke('pinterest-publish-pin', {
        body: { product_id: productId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pinterest-pins-log'] });
      queryClient.invalidateQueries({ queryKey: ['pinterest-stats'] });
      toast.success('Pin republicado!');
    },
    onError: (err: Error) => {
      toast.error(`Erro ao republicar: ${err.message}`);
    }
  });
}
