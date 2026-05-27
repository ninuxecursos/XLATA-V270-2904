import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ShopProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: number;
  sale_price: number | null;
  cost_price: number;
  final_cost: number;
  sku: string | null;
  stock_quantity: number;
  images: string[];
  category_id: string | null;
  tags: string[];
  is_active: boolean;
  is_featured: boolean;
  is_visible: boolean;
  sale_type: 'normal' | 'interactive';
  delivery_type: 'pickup' | 'delivery' | 'both';
  condition: 'novo' | 'usado' | 'no_estado' | null;
  weight: number | null;
  dimensions: { width?: number; height?: number; depth?: number } | null;
  seo_title: string | null;
  seo_description: string | null;
  description_about: string | null;
  description_condition: string | null;
  description_highlights: string[] | null;
  specs: { label: string; value: string }[] | null;
  sold_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProductInput {
  name: string;
  slug?: string;
  description?: string;
  short_description?: string;
  price: number;
  sale_price?: number;
  cost_price?: number;
  final_cost?: number;
  sku?: string;
  stock_quantity?: number;
  images?: string[];
  category_id?: string;
  tags?: string[];
  is_active?: boolean;
  is_featured?: boolean;
  is_visible?: boolean;
  sale_type?: 'normal' | 'interactive';
  delivery_type?: 'pickup' | 'delivery' | 'both';
  weight?: number;
  dimensions?: { width?: number; height?: number; depth?: number };
  seo_title?: string;
  seo_description?: string;
  description_about?: string;
  description_condition?: string;
  description_highlights?: string[];
  specs?: { label: string; value: string }[];
  marketplace_data?: {
    mercado_livre?: { title: string; description: string; keywords?: string[] };
    shopee?: { title: string; description: string; hashtags?: string[] };
    olx?: { title: string; description: string };
  } | null;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function useShopProducts(options?: { 
  onlyVisible?: boolean; 
  saleType?: 'normal' | 'interactive';
  featured?: boolean;
}) {
  return useQuery({
    queryKey: ['shop-products', options],
    queryFn: async () => {
      let query = supabase
        .from('shop_products')
        .select('*')
        .order('created_at', { ascending: false });

      if (options?.onlyVisible) {
        query = query.eq('is_visible', true).eq('is_active', true);
      }
      
      if (options?.saleType) {
        query = query.eq('sale_type', options.saleType);
      }
      
      if (options?.featured) {
        query = query.eq('is_featured', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        images: Array.isArray(item.images) ? item.images : [],
        tags: Array.isArray(item.tags) ? item.tags : [],
        sale_type: item.sale_type || 'normal',
        delivery_type: (item as any).delivery_type || 'pickup',
        is_visible: item.is_visible ?? true,
        condition: item.condition || 'usado'
      })) as unknown as ShopProduct[];
    }
  });
}

export function useShopProductBySlug(slug: string) {
  return useQuery({
    queryKey: ['shop-product', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_products')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      
      // Return null if no product found
      if (!data) return null;
      
      return {
        ...data,
        images: Array.isArray(data.images) ? data.images : [],
        tags: Array.isArray(data.tags) ? data.tags : [],
        sale_type: data.sale_type || 'normal',
        delivery_type: (data as any).delivery_type || 'pickup',
        is_visible: data.is_visible ?? true
      } as unknown as ShopProduct;
    },
    enabled: !!slug
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProductInput) => {
      const slug = input.slug || generateSlug(input.name);
      
      const { data, error } = await supabase
        .from('shop_products')
        .insert({
          ...input,
          slug,
          images: input.images || [],
          tags: input.tags || [],
          stock_quantity: input.stock_quantity || 0,
          is_active: input.is_active ?? true,
          is_featured: input.is_featured ?? false,
          is_visible: input.is_visible ?? true,
          sale_type: input.sale_type || 'normal'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shop-products'] });
      toast.success('Produto criado com sucesso!');

      // Fire-and-forget SEO ping (Google/Bing via IndexNow + sitemap)
      if (data?.id) {
        supabase.functions.invoke('ping-search-engines', {
          body: { product_id: data.id, url: data.slug ? `https://xlata.site/shop/${data.slug}` : undefined }
        }).catch(err => console.warn('SEO ping failed (non-blocking):', err));
      }
      
      // Fire-and-forget Pinterest autopost (only if enabled)
      if (data?.id) {
        supabase
          .from('pinterest_config')
          .select('is_enabled, access_token')
          .limit(1)
          .maybeSingle()
          .then(({ data: cfg }) => {
            if (!cfg?.is_enabled || !cfg?.access_token) return;
            supabase.functions.invoke('pinterest-publish-pin', {
              body: { product_id: data.id }
            }).then(res => {
              if (res.error) {
                console.warn('Pinterest autopost failed:', res.error);
                toast.warning('Produto criado, mas o pin do Pinterest não foi publicado.');
              }
            }).catch(err => console.warn('Pinterest autopost failed (non-blocking):', err));
          });
      }
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar produto: ${error.message}`);
    }
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateProductInput> & { id: string }) => {
      const updateData: Record<string, unknown> = { ...input };
      
      if (input.name && !input.slug) {
        updateData.slug = generateSlug(input.name);
      }

      const { data, error } = await supabase
        .from('shop_products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shop-products'] });
      toast.success('Produto atualizado com sucesso!');

      // Fire-and-forget SEO ping
      if (data?.id) {
        supabase.functions.invoke('ping-search-engines', {
          body: { product_id: data.id, url: data.slug ? `https://xlata.site/shop/${data.slug}` : undefined }
        }).catch(err => console.warn('SEO ping failed (non-blocking):', err));
      }

      // Fire-and-forget Pinterest autopost on update (only if enabled)
      if (data?.id) {
        supabase
          .from('pinterest_config')
          .select('is_enabled, access_token')
          .limit(1)
          .maybeSingle()
          .then(({ data: cfg }) => {
            if (!cfg?.is_enabled || !cfg?.access_token) return;
            supabase.functions.invoke('pinterest-publish-pin', {
              body: { product_id: data.id }
            }).then(res => {
              if (res.error) {
                console.warn('Pinterest autopost on update failed:', res.error);
                toast.warning('Produto atualizado, mas o pin do Pinterest não foi publicado.');
              }
            }).catch(err => console.warn('Pinterest autopost on update failed (non-blocking):', err));
          });
      }
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar produto: ${error.message}`);
    }
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('shop_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-products'] });
      toast.success('Produto excluído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir produto: ${error.message}`);
    }
  });
}

// Bulk operations hooks
export function useBulkUpdateProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: Partial<CreateProductInput> }) => {
      const { error } = await supabase
        .from('shop_products')
        .update(updates)
        .in('id', ids);

      if (error) throw error;
      return ids.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['shop-products'] });
      toast.success(`${count} produto(s) atualizado(s) com sucesso!`);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar produtos: ${error.message}`);
    }
  });
}

export function useBulkDeleteProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('shop_products')
        .delete()
        .in('id', ids);

      if (error) throw error;
      return ids.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['shop-products'] });
      toast.success(`${count} produto(s) excluído(s) com sucesso!`);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir produtos: ${error.message}`);
    }
  });
}
