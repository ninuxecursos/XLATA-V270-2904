import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ShopUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  status: 'active' | 'inactive' | 'blocked' | 'banned';
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export function useShopUsers() {
  return useQuery({
    queryKey: ['shop-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ShopUser[];
    }
  });
}

export function useShopUserById(userId: string) {
  return useQuery({
    queryKey: ['shop-user', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data as ShopUser;
    },
    enabled: !!userId
  });
}

export function useUpdateShopUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      status 
    }: { 
      userId: string; 
      status: 'active' | 'inactive';
    }) => {
      const { data, error } = await supabase
        .from('shop_users')
        .update({ status })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-users'] });
      toast.success('Status do usuário atualizado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    }
  });
}
