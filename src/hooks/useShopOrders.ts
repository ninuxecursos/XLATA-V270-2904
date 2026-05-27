import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CartItem } from './useShopCart';

export interface ShopOrder {
  id: string;
  order_number: string | null;
  user_id: string | null;
  shop_user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_document: string | null;
  shipping_address: Record<string, unknown> | null;
  billing_address: Record<string, unknown> | null;
  items: ShopOrderItem[];
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  status: string;
  payment_method: string | null;
  payment_id: string | null;
  tracking_code: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShopOrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export function useShopOrders(shopUserId?: string) {
  return useQuery({
    queryKey: ['shop-orders', shopUserId],
    queryFn: async () => {
      let query = supabase
        .from('shop_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (shopUserId) {
        query = query.eq('shop_user_id' as never, shopUserId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return (data || []).map(order => ({
        ...order,
        items: Array.isArray(order.items) ? order.items : []
      })) as unknown as ShopOrder[];
    }
  });
}

export function useShopOrderById(orderId: string) {
  return useQuery({
    queryKey: ['shop-order', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;
      
      return {
        ...data,
        items: Array.isArray(data.items) ? data.items : []
      } as unknown as ShopOrder;
    },
    enabled: !!orderId
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      shopUserId, 
      customerName,
      customerEmail,
      customerPhone,
      customerDocument,
      items, 
      notes,
      shippingAddress
    }: { 
      shopUserId?: string;
      customerName: string;
      customerEmail: string;
      customerPhone?: string;
      customerDocument?: string;
      items: CartItem[]; 
      notes?: string;
      shippingAddress?: { [key: string]: string | undefined };
    }) => {
      // Create order WITHOUT decrementing stock (stock will be decremented on payment approval)
      const { data, error } = await supabase.rpc('shop_create_order_pending', {
        p_shop_user_id: shopUserId || null,
        p_customer_name: customerName,
        p_customer_email: customerEmail,
        p_customer_phone: customerPhone || null,
        p_customer_document: customerDocument || null,
        p_shipping_address: shippingAddress || {},
        p_items: items.map(item => ({
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.price
        })),
        p_notes: notes || null
      });

      if (error) throw error;
      
      // RPC returns the order data
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-orders'] });
      toast.success('Pedido criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar pedido: ${error.message}`);
    }
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      orderId, 
      status 
    }: { 
      orderId: string; 
      status: string;
    }) => {
      const { data, error } = await supabase
        .from('shop_orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-orders'] });
      toast.success('Status do pedido atualizado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    }
  });
}
