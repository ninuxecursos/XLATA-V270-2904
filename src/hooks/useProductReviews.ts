import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ShopReviewWithProduct {
  id: string;
  rating: number;
  comment: string | null;
  is_verified: boolean;
  created_at: string;
  user: {
    name: string;
  } | null;
  product: {
    id: string;
    name: string;
    slug: string;
    images: string[] | null;
  } | null;
}

export interface ProductReview {
  id: string;
  product_id: string;
  order_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  is_verified: boolean;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    name: string;
  };
}

export interface ProductRatingStats {
  product_id: string;
  review_count: number;
  average_rating: number;
  five_star: number;
  four_star: number;
  three_star: number;
  two_star: number;
  one_star: number;
}

// Hook para buscar avaliações de um produto
export function useProductReviews(productId: string | undefined) {
  return useQuery({
    queryKey: ['product-reviews', productId],
    queryFn: async () => {
      if (!productId) return [];
      
      const { data, error } = await supabase
        .from('shop_product_reviews')
        .select(`
          *,
          user:shop_users(name)
        `)
        .eq('product_id', productId)
        .eq('is_visible', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ProductReview[];
    },
    enabled: !!productId,
  });
}

// Hook para buscar TODAS as avaliações visíveis da loja (de todos os produtos)
export function useAllShopReviews() {
  return useQuery({
    queryKey: ['all-shop-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_product_reviews')
        .select(`
          id,
          rating,
          comment,
          is_verified,
          created_at,
          user:shop_users(name),
          product:shop_products(id, name, slug, images)
        `)
        .eq('is_visible', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ShopReviewWithProduct[];
    },
  });
}

// Hook para buscar estatísticas de avaliação de um produto
export function useProductRatingStats(productId: string | undefined) {
  return useQuery({
    queryKey: ['product-rating-stats', productId],
    queryFn: async () => {
      if (!productId) return null;
      
      const { data, error } = await supabase
        .from('shop_product_rating_stats')
        .select('*')
        .eq('product_id', productId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as ProductRatingStats | null;
    },
    enabled: !!productId,
  });
}

// Hook para verificar se usuário já avaliou um produto em um pedido
export function useUserReviewForOrder(orderId: string | undefined, productId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ['user-review', orderId, productId, userId],
    queryFn: async () => {
      if (!orderId || !productId || !userId) return null;
      
      const { data, error } = await supabase
        .from('shop_product_reviews')
        .select('*')
        .eq('order_id', orderId)
        .eq('product_id', productId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data as ProductReview | null;
    },
    enabled: !!orderId && !!productId && !!userId,
  });
}

// Hook para criar/atualizar avaliação
export function useSubmitReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      productId, 
      orderId, 
      userId, 
      rating, 
      comment,
      existingReviewId 
    }: { 
      productId: string; 
      orderId: string; 
      userId: string; 
      rating: number; 
      comment?: string;
      existingReviewId?: string;
    }) => {
      if (existingReviewId) {
        // Atualizar avaliação existente
        const { data, error } = await supabase
          .from('shop_product_reviews')
          .update({ 
            rating, 
            comment: comment || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingReviewId)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Criar nova avaliação
        const { data, error } = await supabase
          .from('shop_product_reviews')
          .insert({
            product_id: productId,
            order_id: orderId,
            user_id: userId,
            rating,
            comment: comment || null,
            is_verified: true,
            is_visible: true
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['product-rating-stats', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['user-review', variables.orderId, variables.productId] });
      toast.success('Avaliação enviada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao enviar avaliação:', error);
      toast.error('Erro ao enviar avaliação. Tente novamente.');
    }
  });
}
