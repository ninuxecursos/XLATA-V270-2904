import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect, useCallback } from 'react';

export interface InteractiveEvent {
  id: string;
  product_id: string;
  initial_value: number;
  current_value: number;
  minimum_increment: number;
  start_at: string;
  end_at: string;
  status: 'scheduled' | 'active' | 'finished' | 'cancelled';
  winner_user_id: string | null;
  winning_offer_id: string | null;
  final_order_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  product?: {
    id: string;
    name: string;
    slug: string;
    images: string[];
    description: string | null;
  };
  winner?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface InteractiveOffer {
  id: string;
  event_id: string;
  user_id: string;
  offer_value: number;
  is_winning: boolean;
  is_valid: boolean;
  created_at: string;
  // Joined data
  user?: {
    id: string;
    name: string;
  };
}

export interface InteractiveConfig {
  id: string;
  default_duration_minutes: number;
  default_increment: number;
  is_enabled: boolean;
  event_title_label: string;
  participate_button_text: string;
  current_value_label: string;
  time_remaining_label: string;
  enable_sounds: boolean;
  enable_animations: boolean;
}

export interface CreateEventInput {
  product_id: string;
  initial_value: number;
  minimum_increment: number;
  start_at: string;
  end_at: string;
}

// ============ HOOKS ============

export function useInteractiveEvents(options?: { 
  status?: 'scheduled' | 'active' | 'finished' | 'cancelled' | 'all';
}) {
  return useQuery({
    queryKey: ['interactive-events', options?.status],
    queryFn: async () => {
      let query = supabase
        .from('shop_interactive_events')
        .select(`
          *,
          product:shop_products(id, name, slug, images, description),
          winner:shop_users!shop_interactive_events_winner_user_id_fkey(id, name, email)
        `)
        .order('created_at', { ascending: false });

      if (options?.status && options.status !== 'all') {
        query = query.eq('status', options.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        product: item.product || null,
        winner: item.winner || null,
      })) as InteractiveEvent[];
    }
  });
}

export function useInteractiveEvent(eventId: string | null) {
  return useQuery({
    queryKey: ['interactive-event', eventId],
    queryFn: async () => {
      if (!eventId) return null;

      const { data, error } = await supabase
        .from('shop_interactive_events')
        .select(`
          *,
          product:shop_products(id, name, slug, images, description, short_description),
          winner:shop_users!shop_interactive_events_winner_user_id_fkey(id, name, email)
        `)
        .eq('id', eventId)
        .maybeSingle();

      if (error) throw error;
      return data as InteractiveEvent | null;
    },
    enabled: !!eventId
  });
}

export function useActiveInteractiveEvents() {
  return useQuery({
    queryKey: ['interactive-events', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_interactive_events')
        .select(`
          *,
          product:shop_products(id, name, slug, images, description, short_description)
        `)
        .eq('status', 'active')
        .order('end_at', { ascending: true });

      if (error) throw error;
      return (data || []) as InteractiveEvent[];
    }
  });
}

export function useEventOffers(eventId: string | null) {
  return useQuery({
    queryKey: ['interactive-offers', eventId],
    queryFn: async () => {
      if (!eventId) return [];

      const { data, error } = await supabase
        .from('shop_interactive_offers')
        .select(`
          *,
          user:shop_users(id, name)
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as InteractiveOffer[];
    },
    enabled: !!eventId
  });
}

export function useInteractiveConfig() {
  return useQuery({
    queryKey: ['interactive-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_interactive_config')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as InteractiveConfig | null;
    }
  });
}

// ============ MUTATIONS ============

export function useCreateInteractiveEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateEventInput) => {
      const { data, error } = await supabase
        .from('shop_interactive_events')
        .insert({
          ...input,
          current_value: input.initial_value,
          status: new Date(input.start_at) <= new Date() ? 'active' : 'scheduled'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interactive-events'] });
      toast.success('Evento interativo criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar evento: ${error.message}`);
    }
  });
}

export function useUpdateInteractiveEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateEventInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('shop_interactive_events')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interactive-events'] });
      toast.success('Evento atualizado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    }
  });
}

export function useCancelInteractiveEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from('shop_interactive_events')
        .update({ status: 'cancelled' })
        .eq('id', eventId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interactive-events'] });
      toast.success('Evento cancelado');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao cancelar: ${error.message}`);
    }
  });
}

export function useActivateInteractiveEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const { data, error } = await supabase.rpc('activate_scheduled_event', {
        p_event_id: eventId
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interactive-events'] });
      toast.success('Evento ativado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao ativar: ${error.message}`);
    }
  });
}

export function useFinalizeInteractiveEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const { data, error } = await supabase.rpc('finalize_interactive_event', {
        p_event_id: eventId
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data: unknown) => {
      queryClient.invalidateQueries({ queryKey: ['interactive-events'] });
      queryClient.invalidateQueries({ queryKey: ['shop-orders'] });
      
      const result = data as { success: boolean; result?: string; message?: string };
      if (result?.result === 'completed') {
        toast.success('Evento finalizado! Pedido criado automaticamente.');
      } else if (result?.result === 'no_offers') {
        toast.info('Evento finalizado sem participação.');
      }
    },
    onError: (error: Error) => {
      toast.error(`Erro ao finalizar: ${error.message}`);
    }
  });
}

export function useCreateOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, userId, offerValue }: { 
      eventId: string; 
      userId: string; 
      offerValue: number; 
    }) => {
      const { data, error } = await supabase.rpc('create_interactive_offer', {
        p_event_id: eventId,
        p_user_id: userId,
        p_offer_value: offerValue
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; offer_id?: string };
      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar oferta');
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interactive-events'] });
      queryClient.invalidateQueries({ queryKey: ['interactive-offers'] });
      toast.success('Oferta registrada!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
}

export function useUpdateInteractiveConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Partial<InteractiveConfig> & { id: string }) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from('shop_interactive_config')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interactive-config'] });
      toast.success('Configurações salvas!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao salvar: ${error.message}`);
    }
  });
}

// Update minimum_increment for all active/scheduled events
export function useUpdateAllActiveEventsIncrement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newIncrement: number) => {
      const { data, error } = await supabase
        .from('shop_interactive_events')
        .update({ minimum_increment: newIncrement })
        .in('status', ['active', 'scheduled'])
        .select();

      if (error) throw error;
      return data?.length || 0;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['interactive-events'] });
      toast.success(`Incremento atualizado em ${count} evento(s)!`);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar eventos: ${error.message}`);
    }
  });
}

// ============ REALTIME HOOK ============

export function useInteractiveEventRealtime(eventId: string | null) {
  const queryClient = useQueryClient();

  const handleEventChange = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['interactive-event', eventId] });
    queryClient.invalidateQueries({ queryKey: ['interactive-events'] });
  }, [queryClient, eventId]);

  const handleOfferChange = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['interactive-offers', eventId] });
    queryClient.invalidateQueries({ queryKey: ['interactive-event', eventId] });
  }, [queryClient, eventId]);

  useEffect(() => {
    if (!eventId) return;

    const channel = supabase
      .channel(`interactive-event-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shop_interactive_events',
          filter: `id=eq.${eventId}`
        },
        handleEventChange
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shop_interactive_offers',
          filter: `event_id=eq.${eventId}`
        },
        handleOfferChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, handleEventChange, handleOfferChange]);
}
