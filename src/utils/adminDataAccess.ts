
import { supabase } from '@/integrations/supabase/client';
import { Order, CashRegister, Material } from '@/types/pdv';

export const getOrdersForUser = async (userId: string): Promise<Order[]> => {
  try {
    const { data, error } = await supabase.rpc('get_user_orders', {
      target_user_id: userId
    });

    if (error) {
      console.error('Error fetching user orders:', error);
      return [];
    }

    if (!data) return [];

    // A função RPC agora retorna JSON diretamente (não SETOF)
    // O data já é um array de orders com items aninhados
    const ordersArray = Array.isArray(data) ? data : [];

    // Transform database format to frontend format
    return ordersArray.map((order: any) => ({
      id: order.id,
      customerId: order.customer_id,
      items: (order.items || []).map((item: any) => ({
        materialId: item.material_id,
        materialName: item.material_name,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        tara: item.tara,
        originalPrice: item.original_price,
        priceAdjustment: item.price_adjustment
      })),
      total: order.total,
      timestamp: new Date(order.created_at).getTime(),
      status: order.status,
      type: order.type,
      cancelled: order.cancelled,
      cancelled_at: order.cancelled_at,
      cancellation_reason: order.cancellation_reason
    }));
  } catch (error) {
    console.error('Error in getOrdersForUser:', error);
    return [];
  }
};

export const getMaterialsForUser = async (userId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase.rpc('get_user_materials', {
      target_user_id: userId
    });

    if (error) {
      console.error('Error fetching user materials:', error);
      return [];
    }

    return (data || []).map((m: any) => ({
      id: m.id,
      name: m.name,
      price: m.price,
      salePrice: m.sale_price || m.salePrice || 0,
      previousPrice: m.previous_price,
      previousSalePrice: m.previous_sale_price,
      category_id: m.category_id,
      unit: m.unit || 'kg',
      user_id: m.user_id || userId
    }));
  } catch (error) {
    console.error('Error in getMaterialsForUser:', error);
    return [];
  }
};

export const getCashRegistersForUser = async (userId: string): Promise<CashRegister[]> => {
  try {
    const { data, error } = await supabase.rpc('get_user_cash_registers', {
      target_user_id: userId
    });

    if (error) {
      console.error('Error fetching user cash registers:', error);
      return [];
    }

    if (!data) return [];

    // Transform database format to frontend format
    return data.map((register: any) => ({
      id: register.id,
      initialAmount: register.initial_amount,
      currentAmount: register.current_amount,
      transactions: register.transactions || [],
      openingTimestamp: new Date(register.opening_timestamp).getTime(),
      closingTimestamp: register.closing_timestamp ? new Date(register.closing_timestamp).getTime() : undefined,
      status: register.status as 'open' | 'closed',
      finalAmount: register.final_amount,
      grossProfit: register.gross_profit,
      netProfit: register.net_profit
    }));
  } catch (error) {
    console.error('Error in getCashRegistersForUser:', error);
    return [];
  }
};

export const getActiveCashRegisterForUser = async (userId: string): Promise<CashRegister | null> => {
  try {
    const { data, error } = await supabase.rpc('get_user_active_cash_register', {
      target_user_id: userId
    });

    if (error) {
      console.error('Error fetching user active cash register:', error);
      return null;
    }

    if (!data || data.length === 0) return null;

    const register = data[0];
    
    // Transform database format to frontend format
    return {
      id: register.id,
      initialAmount: register.initial_amount,
      currentAmount: register.current_amount,
      transactions: [],
      openingTimestamp: new Date(register.opening_timestamp).getTime(),
      closingTimestamp: register.closing_timestamp ? new Date(register.closing_timestamp).getTime() : undefined,
      status: register.status as 'open' | 'closed',
      finalAmount: register.final_amount
    };
  } catch (error) {
    console.error('Error in getActiveCashRegisterForUser:', error);
    return null;
  }
};

// Get cash transactions for a specific user (for expenses, additions, etc.)
export const getCashTransactionsForUser = async (userId: string): Promise<any[]> => {
  try {
    // Fetch cash transactions directly from the cash_transactions table
    const { data, error } = await supabase
      .from('cash_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching cash transactions:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getCashTransactionsForUser:', error);
    return [];
  }
};

// Get closed cash registers with summary for a specific user (for Daily Flow)
export const getClosedCashRegistersWithSummaryForUser = async (userId: string): Promise<any[]> => {
  try {
    // Query using RPC to bypass RLS
    const { data: registersData, error: registersError } = await supabase
      .from('cash_registers')
      .select(`
        *,
        cash_transactions (*)
      `)
      .eq('user_id', userId)
      .eq('status', 'closed')
      .order('closing_timestamp', { ascending: false, nullsFirst: false });
    
    if (registersError) {
      console.error('Error fetching closed cash registers for user:', registersError);
      return [];
    }

    if (!registersData || registersData.length === 0) {
      return [];
    }

    // Get user profile once
    const { data: profileData } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .single();

    const userName = profileData?.name || 'Usuário';

    // Buscar orders do usuário para calcular vendas/compras reais (excluindo canceladas)
    const userOrders = await getOrdersForUser(userId);
    const activeOrders = userOrders.filter(o => o.status === 'completed' && !o.cancelled);

    // Process all registers locally
    return registersData.map(register => {
      const transactions = register.cash_transactions || [];
      
      const initialAmount = Number(register.initial_amount) || 0;
      const finalAmount = Number(register.final_amount) || 0;
      
      const openingTs = new Date(register.opening_timestamp || register.created_at).getTime();
      const closingTs = register.closing_timestamp ? new Date(register.closing_timestamp).getTime() : undefined;
      
      // Calcular vendas/compras a partir das orders ativas do período (não das transações)
      const periodOrders = activeOrders.filter(o => 
        o.timestamp >= openingTs &&
        (!closingTs || o.timestamp <= closingTs)
      );
      
      const totalSales = periodOrders
        .filter(o => o.type === 'venda')
        .reduce((sum, o) => sum + o.total, 0);
        
      const totalPurchases = periodOrders
        .filter(o => o.type === 'compra')
        .reduce((sum, o) => sum + o.total, 0);
        
      const totalAdditions = transactions
        .filter((t: any) => t.type === 'addition')
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
        
      const totalExpenses = transactions
        .filter((t: any) => t.type === 'expense')
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
      
      const expectedAmount = initialAmount + totalSales - totalPurchases + totalAdditions - totalExpenses;
      
      const grossProfit = Number(register.gross_profit) || totalSales;
      const netProfit = Number(register.net_profit) || (totalSales - totalPurchases - totalExpenses);
      
      return {
        id: register.id,
        openingDate: new Date(register.opening_timestamp || register.created_at),
        closingDate: register.closing_timestamp ? new Date(register.closing_timestamp) : null,
        openingAmount: initialAmount,
        finalAmount: finalAmount,
        totalSales,
        totalPurchases,
        totalExpenses,
        expectedAmount,
        difference: finalAmount - expectedAmount,
        userName,
        grossProfit,
        netProfit
      };
    });
  } catch (error) {
    console.error('Error in getClosedCashRegistersWithSummaryForUser:', error);
    return [];
  }
};

// Helper to check if we're in admin view mode and get appropriate data
export const getDataForContext = async <T>(
  normalFetch: () => Promise<T>,
  adminFetch: (userId: string) => Promise<T>,
  adminViewingUserId?: string | null
): Promise<T> => {
  if (adminViewingUserId) {
    return adminFetch(adminViewingUserId);
  }
  return normalFetch();
};
