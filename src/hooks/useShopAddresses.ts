import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ShopAddress {
  id: string;
  user_id: string;
  label: string;
  recipient_name: string;
  phone: string | null;
  zip_code: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAddressData {
  user_id: string;
  label: string;
  recipient_name: string;
  phone?: string;
  zip_code: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  is_default?: boolean;
}

// Hook para buscar endereços de um usuário
export function useShopAddresses(userId: string | undefined) {
  return useQuery({
    queryKey: ['shop-addresses', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('shop_user_addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ShopAddress[];
    },
    enabled: !!userId,
  });
}

// Hook para buscar endereço padrão
export function useDefaultAddress(userId: string | undefined) {
  return useQuery({
    queryKey: ['shop-default-address', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('shop_user_addresses')
        .select('*')
        .eq('user_id', userId)
        .eq('is_default', true)
        .maybeSingle();

      if (error) throw error;
      return data as ShopAddress | null;
    },
    enabled: !!userId,
  });
}

// Hook para criar endereço
export function useCreateAddress() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (addressData: CreateAddressData) => {
      const { data, error } = await supabase
        .from('shop_user_addresses')
        .insert({
          ...addressData,
          country: 'Brasil'
        })
        .select()
        .single();

      if (error) throw error;
      return data as ShopAddress;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shop-addresses', variables.user_id] });
      queryClient.invalidateQueries({ queryKey: ['shop-default-address', variables.user_id] });
      toast.success('Endereço adicionado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao criar endereço:', error);
      toast.error('Erro ao adicionar endereço');
    }
  });
}

// Hook para atualizar endereço
export function useUpdateAddress() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      addressId, 
      userId,
      data 
    }: { 
      addressId: string; 
      userId: string;
      data: Partial<CreateAddressData>;
    }) => {
      const { data: updated, error } = await supabase
        .from('shop_user_addresses')
        .update(data)
        .eq('id', addressId)
        .select()
        .single();

      if (error) throw error;
      return updated as ShopAddress;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shop-addresses', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['shop-default-address', variables.userId] });
      toast.success('Endereço atualizado!');
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar endereço:', error);
      toast.error('Erro ao atualizar endereço');
    }
  });
}

// Hook para deletar endereço
export function useDeleteAddress() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      addressId, 
      userId 
    }: { 
      addressId: string; 
      userId: string;
    }) => {
      const { error } = await supabase
        .from('shop_user_addresses')
        .delete()
        .eq('id', addressId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shop-addresses', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['shop-default-address', variables.userId] });
      toast.success('Endereço removido');
    },
    onError: (error: Error) => {
      console.error('Erro ao remover endereço:', error);
      toast.error('Erro ao remover endereço');
    }
  });
}

// Hook para definir endereço padrão
export function useSetDefaultAddress() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      addressId, 
      userId 
    }: { 
      addressId: string; 
      userId: string;
    }) => {
      const { error } = await supabase
        .from('shop_user_addresses')
        .update({ is_default: true })
        .eq('id', addressId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shop-addresses', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['shop-default-address', variables.userId] });
      toast.success('Endereço padrão atualizado');
    },
    onError: (error: Error) => {
      console.error('Erro ao definir endereço padrão:', error);
      toast.error('Erro ao definir endereço padrão');
    }
  });
}

// Hook para buscar CEP (via API externa)
export function useCepLookup() {
  return useMutation({
    mutationFn: async (cep: string) => {
      const cleanCep = cep.replace(/\D/g, '');
      
      if (cleanCep.length !== 8) {
        throw new Error('CEP inválido');
      }
      
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        throw new Error('CEP não encontrado');
      }
      
      return {
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || ''
      };
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao buscar CEP');
    }
  });
}
