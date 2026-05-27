import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ShopCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  image_url?: string | null;
  parent_id?: string | null;
  is_active: boolean;
  display_order: number;
}

export function useShopCategories() {
  return useQuery({
    queryKey: ['shop-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as ShopCategory[];
    }
  });
}
