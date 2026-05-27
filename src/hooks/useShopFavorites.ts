import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ShopFavorite {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: {
    id: string;
    name: string;
    slug: string;
    price: number;
    sale_price: number | null;
    images: string[] | null;
    stock_quantity: number;
  };
}

// Hook para buscar favoritos de um usuário
export function useShopFavorites(userId: string | undefined) {
  return useQuery({
    queryKey: ['shop-favorites', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('shop_user_favorites')
        .select(`
          *,
          product:shop_products(id, name, slug, price, sale_price, images, stock_quantity)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ShopFavorite[];
    },
    enabled: !!userId,
  });
}

// Hook para verificar se um produto está nos favoritos
export function useIsFavorite(userId: string | undefined, productId: string | undefined) {
  return useQuery({
    queryKey: ['shop-favorite-check', userId, productId],
    queryFn: async () => {
      if (!userId || !productId) return false;
      
      const { data, error } = await supabase
        .from('shop_user_favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!userId && !!productId,
  });
}

// Hook para adicionar/remover favorito
export function useToggleFavorite() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      productId, 
      isFavorited 
    }: { 
      userId: string; 
      productId: string; 
      isFavorited: boolean;
    }) => {
      if (isFavorited) {
        // Remover dos favoritos
        const { error } = await supabase
          .from('shop_user_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('product_id', productId);
        
        if (error) throw error;
        return { action: 'removed' };
      } else {
        // Adicionar aos favoritos
        const { error } = await supabase
          .from('shop_user_favorites')
          .insert({
            user_id: userId,
            product_id: productId
          });
        
        if (error) throw error;
        return { action: 'added' };
      }
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shop-favorites', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['shop-favorite-check', variables.userId, variables.productId] });
      
      if (result.action === 'added') {
        toast.success('Adicionado aos favoritos!');
      } else {
        toast.success('Removido dos favoritos');
      }
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar favoritos:', error);
      toast.error('Erro ao atualizar favoritos');
    }
  });
}

// Hook para contar favoritos
export function useFavoritesCount(userId: string | undefined) {
  return useQuery({
    queryKey: ['shop-favorites-count', userId],
    queryFn: async () => {
      if (!userId) return 0;
      
      const { count, error } = await supabase
        .from('shop_user_favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
  });
}
