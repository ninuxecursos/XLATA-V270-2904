
import { supabase } from '@/integrations/supabase/client';
import { Customer, Order, Material, CashRegister, CashTransaction, CashSummary, MaterialCategory, UserMaterialSettings } from '../types/pdv';
import { cleanMaterialName, cleanOrderItemNames } from './materialNameCleaner';
import { createLogger } from './logger';

// Create logger for this module
const logger = createLogger('[Storage]');

// Helper function to ensure user is authenticated
const ensureAuthenticated = async () => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error('User not authenticated');
  }
  return userData.user;
};

// Helper function to generate UUID
const generateUUID = () => {
  return crypto.randomUUID();
};

// Helper function to validate UUID format
const isValidUUID = (uuid: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Customer functions
export const getCustomers = async (): Promise<Customer[]> => {
  const user = await ensureAuthenticated();
  
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('user_id', user.id)
    .order('name');
  
  if (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
  
  return data?.map(customer => ({
    id: customer.id,
    name: customer.name,
    orders: [] // Orders are handled separately
  })) || [];
};

// Cache para evitar saves desnecessários
const customerCache = new Map<string, { name: string; timestamp: number }>();
const CACHE_TTL = 5000; // 5 segundos

// Nomes placeholder que não devem ser salvos na tabela customers
const PLACEHOLDER_NAMES = ['# Nome Cliente', '# Nome do Cliente', 'Cliente sem nome'];

const isPlaceholderName = (name: string): boolean => {
  return PLACEHOLDER_NAMES.includes(name.trim());
};

export const findCustomerByName = async (name: string): Promise<Customer | undefined> => {
  const user = await ensureAuthenticated();
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('user_id', user.id)
    .eq('name', name.trim())
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error || !data) return undefined;
  return { id: data.id, name: data.name, orders: [] };
};

export const saveCustomer = async (customer: Omit<Customer, 'orders'>): Promise<void> => {
  const user = await ensureAuthenticated();

  // Verificar cache para evitar saves duplicados
  const cached = customerCache.get(customer.id);
  const now = Date.now();
  
  if (cached && cached.name === customer.name && (now - cached.timestamp) < CACHE_TTL) {
    return;
  }

  // Para nomes placeholder, pular deduplicação e ir direto ao upsert
  // Isso garante que o customer_id sempre exista no banco para a FK de orders
  if (!isPlaceholderName(customer.name)) {
    // Verificar se já existe um cliente com o mesmo nome para este user
    const existingByName = await findCustomerByName(customer.name);
    if (existingByName && existingByName.id !== customer.id) {
      // Cliente já existe com esse nome - skip save, usar o existente
      customerCache.set(existingByName.id, { name: existingByName.name, timestamp: now });
      return;
    }
  }

  // Verificar se o customer já existe com os mesmos dados
  const existing = await getCustomerById(customer.id);
  if (existing && existing.name === customer.name) {
    customerCache.set(customer.id, { name: customer.name, timestamp: now });
    return;
  }

  const customerData = {
    id: customer.id,
    name: customer.name,
    user_id: user.id
  };

  const { error } = await supabase
    .from('customers')
    .upsert(customerData);
  
  if (error) {
    console.error('Error saving customer:', error);
    throw error;
  }

  customerCache.set(customer.id, { name: customer.name, timestamp: now });
};

export const removeCustomer = async (customerId: string): Promise<void> => {
  const user = await ensureAuthenticated();
  
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', customerId)
    .eq('user_id', user.id);
  
  if (error) {
    console.error('Error removing customer:', error);
    throw error;
  }
};

export const getCustomerById = async (id: string): Promise<Customer | undefined> => {
  const user = await ensureAuthenticated();
  
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching customer:', error);
    return undefined;
  }
  
  return data ? {
    id: data.id,
    name: data.name,
    orders: []
  } : undefined;
};

// Order functions - CRITICAL FIX: Always filter by user_id and preserve exact material names
export const getOrders = async (): Promise<Order[]> => {
  const user = await ensureAuthenticated();
  
  // CORREÇÃO: Paginação infinita para buscar TODOS os pedidos
  // O Supabase tem limite padrão de 1000 registros por query
  const batchSize = 1000;
  let allData: any[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, from + batchSize - 1);

    if (error) {
      console.error('Error fetching orders:', error);
      return [];
    }

    if (data && data.length > 0) {
      allData.push(...data);
      from += batchSize;
      hasMore = data.length === batchSize;
    } else {
      hasMore = false;
    }
  }
  
  // Process orders data (reduced logging)
  logger.debug('Processing orders data:', allData.length, 'orders');
  
  return allData.map(order => {
    return {
      id: order.id,
      customerId: order.customer_id,
      type: order.type as 'venda' | 'compra',
      status: order.status as 'open' | 'completed',
      total: Number(order.total),
      items: order.order_items?.map((item: any) => {
        // Use material_name exactly as stored, with cleaning for trailing zeros
        const exactMaterialName = item.material_name;
        const cleanedMaterialName = cleanMaterialName(exactMaterialName);
        
        // Log cleaning only if name was actually changed (dev only)
        if (exactMaterialName !== cleanedMaterialName) {
          logger.debug('Material name cleaned:', {
            original: exactMaterialName,
            cleaned: cleanedMaterialName
          });
        }
        
        return {
          materialId: item.material_id,
          materialName: cleanedMaterialName,
          quantity: Number(item.quantity),
          price: Number(item.price),
          total: Number(item.total),
          tara: Number(item.tara || 0),
          originalPrice: Number(item.original_price || 0),
          priceAdjustment: Number(item.price_adjustment || 0)
        };
      }) || [],
      timestamp: new Date(order.created_at).getTime(),
      cancelled: order.cancelled || false,
      cancelled_at: order.cancelled_at,
      cancelled_by: order.cancelled_by,
      cancellation_reason: order.cancellation_reason
    };
  }) || [];
};

// Cache para evitar saves de orders desnecessários
const orderCache = new Map<string, { hash: string; timestamp: number }>();
const ORDER_CACHE_TTL = 3000; // 3 segundos

const hashOrder = (order: Order): string => {
  return `${order.status}-${order.total}-${order.items.length}-${order.type}`;
};

export const saveOrder = async (order: Order): Promise<void> => {
  const user = await ensureAuthenticated();

  try {
    // CRITICAL: total must always equal Σ items.total — recompute from items to
    // prevent drift between order.total and the items list (causing receipts and
    // financial reports to show divergent values).
    const recomputedTotal = (order.items || []).reduce(
      (sum, item) => sum + (Number(item.total) || 0),
      0
    );
    // Mutate in place so callers see the corrected total
    order.total = recomputedTotal;

    const orderHash = hashOrder(order);
    const cached = orderCache.get(order.id);
    const now = Date.now();
    
    // Skip se ordem idêntica foi salva recentemente
    if (cached && cached.hash === orderHash && (now - cached.timestamp) < ORDER_CACHE_TTL) {
      return;
    }
    
    // Save order with user_id to ensure isolation
    const orderData = {
      id: order.id,
      customer_id: order.customerId,
      type: order.type,
      status: order.status,
      total: recomputedTotal,
      user_id: user.id // CRITICAL: Always set user_id
    };

    const { error: orderError } = await supabase
      .from('orders')
      .upsert(orderData);
    
    if (orderError) throw orderError;

    // CRITICAL SAFETY: Only delete + reinsert items when the incoming order
    // actually has items. Saving an order object with items=[] (e.g. stale
    // closure from autoSaveSessionData firing after finalization) would
    // permanently wipe the items of a completed order, leaving "0 itens"
    // displayed in history while the total remains. Skip the destructive
    // step entirely in that case.
    if (order.items && order.items.length > 0) {
      await supabase
        .from('order_items')
        .delete()
        .eq('order_id', order.id)
        .eq('user_id', user.id);
    } else {
      console.warn('[saveOrder] Skipping item delete/insert: incoming order has no items', { orderId: order.id, status: order.status });
    }

    // Save order items with user_id - CRITICAL FIX: Preserve material name exactly as provided
    if (order.items.length > 0) {
      const orderItems = order.items.map(item => {
        console.log('SAVING ORDER ITEM - Original item:', item);
        console.log('SAVING ORDER ITEM - Material name details:', {
          materialName: item.materialName,
          materialNameType: typeof item.materialName,
          materialNameStringified: JSON.stringify(item.materialName),
          materialId: item.materialId
        });
        
        // CRITICAL FIX: Use the material name EXACTLY as provided - no processing at all
        const exactMaterialName = item.materialName;
        
        console.log('EXACT MATERIAL NAME FOR SAVE:', {
          original: item.materialName,
          exact: exactMaterialName,
          areIdentical: item.materialName === exactMaterialName,
          originalStringified: JSON.stringify(item.materialName),
          exactStringified: JSON.stringify(exactMaterialName)
        });
        
        const itemToSave = {
          order_id: order.id,
          material_id: item.materialId === 'avulso' ? null : item.materialId,
          material_name: item.linkedMaterialName || exactMaterialName, // Use linked material name for stock tracking if present
          quantity: item.linkedStockQuantity || item.quantity, // Use linked stock quantity for stock subtraction if present
          price: item.price,
          total: item.total,
          tara: item.tara || 0,
          original_price: item.originalPrice || 0,
          price_adjustment: item.priceAdjustment || 0,
          user_id: user.id // CRITICAL: Always set user_id
        };
        
        console.log('ITEM BEING SAVED TO DATABASE:', itemToSave);
        return itemToSave;
      });

      console.log('ALL ORDER ITEMS BEING SAVED:', orderItems);

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) {
        console.error('Error saving order items:', itemsError);
        throw itemsError;
      }
      
      // Order items saved (dev only)
      if (import.meta.env.DEV) console.log('ORDER ITEMS SAVED SUCCESSFULLY');
    }

    // Handle cash register updates for completed orders
    if (order.status === 'completed') {
      const activeCashRegister = await getActiveCashRegister();
      if (activeCashRegister && activeCashRegister.status === 'open') {
        const customer = await getCustomerById(order.customerId);
        
        const transaction = {
          id: generateUUID(),
          cash_register_id: activeCashRegister.id,
          type: order.type === 'venda' ? 'sale' : 'purchase',
          amount: order.total,
          order_id: order.id,
          description: order.type === 'venda' 
            ? `Venda para ${customer?.name || 'Cliente'}`
            : `Compra de ${customer?.name || 'Cliente'}`,
          user_id: user.id
        };

        await supabase.from('cash_transactions').insert(transaction);

        // Update cash register amount
        const newAmount = order.type === 'venda' 
          ? activeCashRegister.currentAmount + order.total
          : activeCashRegister.currentAmount - order.total;

        await supabase
          .from('cash_registers')
          .update({ current_amount: newAmount })
          .eq('id', activeCashRegister.id)
          .eq('user_id', user.id);
      }
    }

    // Atualizar cache após save bem-sucedido
    orderCache.set(order.id, { hash: orderHash, timestamp: Date.now() });
  } catch (error) {
    console.error('Error saving order:', error);
    throw error;
  }
};

export const getOrderById = async (id: string): Promise<Order | undefined> => {
  const user = await ensureAuthenticated();
  
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  
  if (error) {
    console.error('Error fetching order:', error);
    return undefined;
  }
  
  return data ? {
    id: data.id,
    customerId: data.customer_id,
    type: data.type as 'venda' | 'compra',
    status: data.status as 'open' | 'completed',
    total: Number(data.total),
    items: data.order_items?.map((item: any) => ({
      materialId: item.material_id,
      materialName: cleanMaterialName(item.material_name), // Clean material name on restore
      quantity: Number(item.quantity),
      price: Number(item.price),
      total: Number(item.total),
      tara: Number(item.tara || 0)
    })) || [],
    timestamp: new Date(data.created_at).getTime()
  } : undefined;
};

// Material functions
export const getMaterials = async (): Promise<Material[]> => {
  const user = await ensureAuthenticated();
  
  const { data, error } = await supabase
    .from('materials')
    .select('id, name, price, sale_price, unit, user_id, category_id, is_default, previous_price, previous_sale_price')
    .eq('user_id', user.id)
    .order('name');
  
  if (error) {
    console.error('Error fetching materials:', error);
    return [];
  }
  
  return data?.map(material => ({
    id: material.id,
    name: material.name,
    price: Number(material.price),
    salePrice: Number(material.sale_price),
    unit: material.unit || 'kg',
    user_id: material.user_id || user.id,
    category_id: material.category_id || null,
    previousPrice: material.previous_price != null ? Number(material.previous_price) : null,
    previousSalePrice: material.previous_sale_price != null ? Number(material.previous_sale_price) : null
  })) || [];
};

export const saveMaterial = async (material: Material): Promise<void> => {
  const user = await ensureAuthenticated();

  console.log('Saving material with data:', material);

  // Validate and generate UUID if needed
  let materialId = material.id;
  if (!materialId || !isValidUUID(materialId)) {
    materialId = generateUUID();
    console.log('Generated new UUID for material:', materialId);
  }

  // Check if material with same name already exists for this user (case-insensitive, excluding current material ID)
  const { data: existingMaterials, error: checkError } = await supabase
    .from('materials')
    .select('id, name, price, sale_price')
    .eq('user_id', user.id)
    .ilike('name', material.name.trim())
    .neq('id', materialId);

  if (checkError) {
    console.error('Error checking existing materials:', checkError);
    throw checkError;
  }

  if (existingMaterials && existingMaterials.length > 0) {
    throw new Error(`Material com nome similar a "${material.name.trim()}" já existe (${existingMaterials[0].name}).`);
  }

  // Fetch current prices to store as previous (for price variation indicators)
  const { data: currentMaterial } = await supabase
    .from('materials')
    .select('price, sale_price')
    .eq('id', materialId)
    .eq('user_id', user.id)
    .single();

  // Determine previous prices - only update if price actually changed
  const newPrice = Number(material.price);
  const newSalePrice = Number(material.salePrice);
  const currentPrice = currentMaterial ? Number(currentMaterial.price) : null;
  const currentSalePrice = currentMaterial ? Number(currentMaterial.sale_price) : null;

  const materialData: any = {
    id: materialId,
    name: material.name.trim(),
    price: newPrice,
    sale_price: newSalePrice,
    unit: material.unit || 'kg',
    user_id: user.id,
    category_id: material.category_id || null,
    // Only update previous_price if the price actually changed
    previous_price: currentPrice !== null && currentPrice !== newPrice 
      ? currentPrice 
      : material.previousPrice ?? null,
    previous_sale_price: currentSalePrice !== null && currentSalePrice !== newSalePrice 
      ? currentSalePrice 
      : material.previousSalePrice ?? null
  };

  console.log('Material data to save:', materialData);

  const { error } = await supabase
    .from('materials')
    .upsert(materialData, {
      onConflict: 'id'
    });
  
  if (error) {
    console.error('Error saving material:', error);
    throw error;
  }

  // Record price change in history if price actually changed
  const priceChanged = currentPrice !== null && currentPrice !== newPrice;
  const salePriceChanged = currentSalePrice !== null && currentSalePrice !== newSalePrice;
  
  if (priceChanged || salePriceChanged) {
    const { error: historyError } = await supabase
      .from('material_price_history')
      .insert({
        user_id: user.id,
        material_id: materialId,
        material_name: material.name.trim(),
        old_price: currentPrice,
        old_sale_price: currentSalePrice,
        new_price: newPrice,
        new_sale_price: newSalePrice,
        change_type: 'manual'
      });
    
    if (historyError) {
      console.warn('Failed to record price history:', historyError);
      // Don't throw - history is secondary to main save
    } else {
      console.log('Price history recorded successfully');
    }
  }

  console.log('Material saved successfully');
};

export const removeMaterial = async (materialId: string): Promise<void> => {
  const user = await ensureAuthenticated();
  
  const { error } = await supabase
    .from('materials')
    .delete()
    .eq('id', materialId)
    .eq('user_id', user.id);
  
  if (error) {
    console.error('Error removing material:', error);
    throw error;
  }
};

export const getMaterialById = async (id: string): Promise<Material | undefined> => {
  const user = await ensureAuthenticated();
  
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  
  if (error) {
    console.error('Error fetching material:', error);
    return undefined;
  }
  
  return data ? {
    id: data.id,
    name: data.name,
    price: Number(data.price),
    salePrice: Number(data.sale_price),
    unit: data.unit || 'kg',
    user_id: data.user_id || user.id,
    category_id: data.category_id || null
  } : undefined;
};

// Cash register functions - CRITICAL FIX: Always filter by user_id
export const getCashRegisters = async (): Promise<CashRegister[]> => {
  const user = await ensureAuthenticated();
  
  // Fetch cash registers
  const { data, error } = await supabase
    .from('cash_registers')
    .select(`
      *,
      cash_transactions (*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching cash registers:', error);
    return [];
  }

  // Fetch user profile for the name
  const { data: profileData } = await supabase
    .from('profiles')
    .select('name, email')
    .eq('id', user.id)
    .single();
  
  return data?.map(register => {
    return {
      id: register.id,
      initialAmount: Number(register.initial_amount),
      currentAmount: Number(register.current_amount),
      transactions: register.cash_transactions?.map((transaction: any) => ({
        id: transaction.id,
        type: transaction.type as any,
        amount: Number(transaction.amount),
        timestamp: new Date(transaction.created_at).getTime(),
        orderId: transaction.order_id,
        description: transaction.description
      })) || [],
      openingTimestamp: new Date(register.opening_timestamp || register.created_at).getTime(),
      closingTimestamp: register.closing_timestamp ? new Date(register.closing_timestamp).getTime() : undefined,
      status: register.status as 'open' | 'closed',
      finalAmount: register.final_amount ? Number(register.final_amount) : undefined,
      userName: profileData?.name || undefined,
      userEmail: profileData?.email || undefined
    };
  }) || [];
};

export const getActiveCashRegister = async (): Promise<CashRegister | null> => {
  const user = await ensureAuthenticated();
  
  const { data, error } = await supabase
    .from('cash_registers')
    .select(`
      *,
      cash_transactions (*)
    `)
    .eq('status', 'open')
    .eq('user_id', user.id)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching active cash register:', error);
    return null;
  }
  
  return data ? {
    id: data.id,
    initialAmount: Number(data.initial_amount),
    currentAmount: Number(data.current_amount),
    transactions: data.cash_transactions?.map((transaction: any) => ({
      id: transaction.id,
      type: transaction.type as any,
      amount: Number(transaction.amount),
      timestamp: new Date(transaction.created_at).getTime(),
      orderId: transaction.order_id,
      description: transaction.description
    })) || [],
    openingTimestamp: new Date(data.opening_timestamp || data.created_at).getTime(),
    closingTimestamp: data.closing_timestamp ? new Date(data.closing_timestamp).getTime() : undefined,
    status: data.status as 'open' | 'closed',
    finalAmount: data.final_amount ? Number(data.final_amount) : undefined
  } : null;
};

export const openCashRegister = async (initialAmount: number): Promise<CashRegister> => {
  const user = await ensureAuthenticated();

  // Close any existing open register for this user
  await supabase
    .from('cash_registers')
    .update({ 
      status: 'closed',
      closing_timestamp: new Date().toISOString()
    })
    .eq('status', 'open')
    .eq('user_id', user.id);

  // Create new register with proper UUID
  const registerId = generateUUID();
  const { error: registerError } = await supabase
    .from('cash_registers')
    .insert({
      id: registerId,
      initial_amount: initialAmount,
      current_amount: initialAmount,
      status: 'open',
      user_id: user.id
    });

  if (registerError) {
    console.error('Error creating cash register:', registerError);
    throw registerError;
  }

  // Create opening transaction with proper UUID
  const transactionId = generateUUID();
  const { error: transactionError } = await supabase
    .from('cash_transactions')
    .insert({
      id: transactionId,
      cash_register_id: registerId,
      type: 'opening',
      amount: initialAmount,
      description: 'Abertura de caixa',
      user_id: user.id
    });

  if (transactionError) {
    console.error('Error creating opening transaction:', transactionError);
    throw transactionError;
  }

  return {
    id: registerId,
    initialAmount,
    currentAmount: initialAmount,
    transactions: [{
      id: transactionId,
      type: 'opening',
      amount: initialAmount,
      timestamp: Date.now(),
      description: 'Abertura de caixa'
    }],
    openingTimestamp: Date.now(),
    status: 'open'
  };
};

export const hasSufficientFunds = async (amount: number, orderType: 'venda' | 'compra' = 'compra'): Promise<boolean> => {
  const register = await getActiveCashRegister();
  if (!register || register.status !== 'open') {
    return false;
  }
  
  if (orderType === 'venda') {
    return true;
  }
  
  return register.currentAmount >= amount;
};

// Active order and customer state (using localStorage for temporary session data only)
export const getActiveOrder = (): Order | null => {
  const data = localStorage.getItem('pdv_active_order');
  if (!data) return null;
  
  try {
    const order = JSON.parse(data);
    // Clean material names when restoring from localStorage
    if (order && order.items) {
      order.items = cleanOrderItemNames(order.items);
    }
    return order;
  } catch (error) {
    console.error('Error parsing active order from localStorage:', error);
    return null;
  }
};

export const setActiveOrder = (order: Order | null): void => {
  if (order) {
    localStorage.setItem('pdv_active_order', JSON.stringify(order));
  } else {
    localStorage.removeItem('pdv_active_order');
  }
};

export const getActiveCustomer = (): Customer | null => {
  const data = localStorage.getItem('pdv_active_customer');
  return data ? JSON.parse(data) : null;
};

export const setActiveCustomer = (customer: Customer | null): void => {
  if (customer) {
    localStorage.setItem('pdv_active_customer', JSON.stringify(customer));
  } else {
    localStorage.removeItem('pdv_active_customer');
  }
};

export const setActiveCashRegister = (register: CashRegister | null): void => {
  if (register) {
    localStorage.setItem('pdv_active_cash_register', JSON.stringify(register));
  } else {
    localStorage.removeItem('pdv_active_cash_register');
  }
};

// Clear session data when user logs out - CRITICAL for user isolation
export const clearUserSessionData = (): void => {
  localStorage.removeItem('pdv_active_order');
  localStorage.removeItem('pdv_active_customer');
  localStorage.removeItem('pdv_active_cash_register');
  localStorage.removeItem('pdv_temp_session');
  localStorage.removeItem('pdv_sale_mode');
};

// Remove the initializeData function as it's no longer needed
export const initializeData = () => {
  console.log('Data initialization is now handled by Supabase');
};

export const addCashToRegister = async (amount: number, description?: string): Promise<CashRegister | null> => {
  const user = await ensureAuthenticated();
  const activeCashRegister = await getActiveCashRegister();
  
  if (!activeCashRegister || activeCashRegister.status !== 'open') {
    return null;
  }

  try {
    // Create addition transaction with proper UUID
    const transactionId = generateUUID();
    const { error: transactionError } = await supabase
      .from('cash_transactions')
      .insert({
        id: transactionId,
        cash_register_id: activeCashRegister.id,
        type: 'addition',
        amount: amount,
        description: description || 'Adição de saldo',
        user_id: user.id
      });

    if (transactionError) throw transactionError;

    // Update cash register amount
    const newAmount = activeCashRegister.currentAmount + amount;
    const { error: updateError } = await supabase
      .from('cash_registers')
      .update({ current_amount: newAmount })
      .eq('id', activeCashRegister.id)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    return await getActiveCashRegister();
  } catch (error) {
    console.error('Error adding cash to register:', error);
    throw error;
  }
};

export const addExpenseToCashRegister = async (amount: number, description: string): Promise<CashRegister | null> => {
  const user = await ensureAuthenticated();
  const activeCashRegister = await getActiveCashRegister();
  
  if (!activeCashRegister || activeCashRegister.status !== 'open') {
    return null;
  }

  if (activeCashRegister.currentAmount < amount) {
    throw new Error('Saldo insuficiente');
  }

  try {
    // Create expense transaction with proper UUID
    const transactionId = generateUUID();
    const { error: transactionError } = await supabase
      .from('cash_transactions')
      .insert({
        id: transactionId,
        cash_register_id: activeCashRegister.id,
        type: 'expense',
        amount: amount,
        description: description,
        user_id: user.id
      });

    if (transactionError) throw transactionError;

    // Update cash register amount
    const newAmount = activeCashRegister.currentAmount - amount;
    const { error: updateError } = await supabase
      .from('cash_registers')
      .update({ current_amount: newAmount })
      .eq('id', activeCashRegister.id)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    return await getActiveCashRegister();
  } catch (error) {
    console.error('Error adding expense to register:', error);
    throw error;
  }
};

export const closeActiveCashRegister = async (finalAmount: number, grossProfit?: number, netProfit?: number): Promise<CashRegister | null> => {
  const user = await ensureAuthenticated();
  const activeCashRegister = await getActiveCashRegister();
  
  if (!activeCashRegister || activeCashRegister.status !== 'open') {
    return null;
  }

  try {
    // Create closing transaction with proper UUID
    const transactionId = generateUUID();
    const { error: transactionError } = await supabase
      .from('cash_transactions')
      .insert({
        id: transactionId,
        cash_register_id: activeCashRegister.id,
        type: 'closing',
        amount: finalAmount,
        description: 'Fechamento de caixa',
        user_id: user.id
      });

    if (transactionError) throw transactionError;

    // Close the cash register with profit data
    const { error: updateError } = await supabase
      .from('cash_registers')
      .update({ 
        status: 'closed',
        closing_timestamp: new Date().toISOString(),
        final_amount: finalAmount,
        gross_profit: grossProfit ?? 0,
        net_profit: netProfit ?? 0
      })
      .eq('id', activeCashRegister.id)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    return {
      ...activeCashRegister,
      status: 'closed' as const,
      closingTimestamp: Date.now(),
      finalAmount: finalAmount,
      grossProfit: grossProfit ?? 0,
      netProfit: netProfit ?? 0
    };
  } catch (error) {
    console.error('Error closing cash register:', error);
    throw error;
  }
};

export const calculateCashSummary = async (cashRegister: CashRegister): Promise<CashSummary> => {
  const user = await ensureAuthenticated();
  
  // Buscar orders para calcular vendas/compras reais (excluindo canceladas)
  const orders = await getOrders();
  const activeOrders = orders.filter(o => 
    o.status === 'completed' && 
    !o.cancelled &&
    o.timestamp >= cashRegister.openingTimestamp &&
    (!cashRegister.closingTimestamp || o.timestamp <= cashRegister.closingTimestamp)
  );
  
  const totalSales = activeOrders
    .filter(o => o.type === 'venda')
    .reduce((sum, o) => sum + o.total, 0);
    
  const totalPurchases = activeOrders
    .filter(o => o.type === 'compra')
    .reduce((sum, o) => sum + o.total, 0);
  
  // Additions e expenses continuam vindo das transactions
  const totalAdditions = cashRegister.transactions
    .filter(t => t.type === 'addition')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const expenses = cashRegister.transactions
    .filter(t => t.type === 'expense')
    .map(t => ({
      id: t.id,
      amount: t.amount,
      description: t.description,
      timestamp: t.timestamp
    }));
    
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  // Calcular peso total apenas de orders ativas do período
  const totalWeight = activeOrders.reduce((sum, order) => 
    sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  );
  
  const expectedAmount = cashRegister.initialAmount + totalSales - totalPurchases + totalAdditions - totalExpenses;
  
  return {
    openingAmount: cashRegister.initialAmount,
    currentAmount: cashRegister.currentAmount,
    totalSales,
    totalPurchases,
    totalWeight,
    expectedAmount,
    finalAmount: cashRegister.finalAmount,
    expenses
  };
};

// =====================================================
// MATERIAL CATEGORIES FUNCTIONS
// =====================================================

// Get all material categories for the current user
export const getMaterialCategories = async (): Promise<MaterialCategory[]> => {
  const user = await ensureAuthenticated();
  
  const { data, error } = await supabase
    .from('material_categories')
    .select('*')
    .eq('user_id', user.id)
    .order('display_order', { ascending: true });
  
  if (error) {
    console.error('Error fetching material categories:', error);
    return [];
  }
  
  return data?.map(cat => ({
    id: cat.id,
    user_id: cat.user_id,
    name: cat.name,
    color: cat.color,
    hex_color: cat.hex_color,
    display_order: cat.display_order,
    is_system: cat.is_system,
    is_required: cat.is_required,
    is_active: cat.is_active,
    system_key: cat.system_key
  })) || [];
};

// Get only active material categories
export const getActiveMaterialCategories = async (): Promise<MaterialCategory[]> => {
  const categories = await getMaterialCategories();
  return categories.filter(c => c.is_active !== false);
};

// Save (create or update) a material category
export const saveMaterialCategory = async (category: Omit<MaterialCategory, 'user_id'>): Promise<MaterialCategory> => {
  const user = await ensureAuthenticated();
  
  const categoryData: any = {
    id: category.id,
    user_id: user.id,
    name: category.name.trim(),
    color: category.color,
    hex_color: category.hex_color ?? null,
    display_order: category.display_order
  };
  
  const { data, error } = await supabase
    .from('material_categories')
    .upsert(categoryData, { onConflict: 'id' })
    .select()
    .single();
  
  if (error) {
    console.error('Error saving material category:', error);
    throw error;
  }
  
  return {
    id: data.id,
    user_id: data.user_id,
    name: data.name,
    color: data.color,
    hex_color: data.hex_color,
    display_order: data.display_order,
    is_system: data.is_system,
    is_required: data.is_required,
    is_active: data.is_active,
    system_key: data.system_key
  };
};

// Remove a material category (only non-system categories)
export const removeMaterialCategory = async (categoryId: string): Promise<void> => {
  const user = await ensureAuthenticated();
  
  // First check if it's a system category
  const { data: category } = await supabase
    .from('material_categories')
    .select('is_system')
    .eq('id', categoryId)
    .eq('user_id', user.id)
    .single();
  
  if (category?.is_system) {
    throw new Error('Categorias do sistema não podem ser excluídas');
  }
  
  const { error } = await supabase
    .from('material_categories')
    .delete()
    .eq('id', categoryId)
    .eq('user_id', user.id);
  
  if (error) {
    console.error('Error removing material category:', error);
    throw error;
  }
};

// Reset all categories for the current user (for admin reset functionality)
export const resetAllCategories = async (): Promise<void> => {
  const user = await ensureAuthenticated();
  
  // Delete ALL categories for this user (bypassing is_system check)
  const { error } = await supabase
    .from('material_categories')
    .delete()
    .eq('user_id', user.id);
  
  if (error) {
    console.error('Error resetting categories:', error);
    throw error;
  }
};

// Toggle category active status (only for non-required system categories or user categories)
export const toggleCategoryActive = async (categoryId: string, isActive: boolean): Promise<void> => {
  const user = await ensureAuthenticated();

  const { error } = await supabase
    .from('material_categories')
    .update({ is_active: isActive })
    .eq('id', categoryId)
    .eq('user_id', user.id);
  
  if (error) {
    console.error('Error toggling category active status:', error);
    throw error;
  }
};

// Seed default categories and materials for the current user
export const seedDefaultCategoriesAndMaterials = async (): Promise<void> => {
  const user = await ensureAuthenticated();
  
  // Call the database function
  const { error } = await supabase.rpc('seed_default_categories_for_current_user');
  
  if (error) {
    console.error('Error seeding default categories:', error);
    throw error;
  }
};

// Get user material settings
export const getUserMaterialSettings = async (): Promise<UserMaterialSettings | null> => {
  const user = await ensureAuthenticated();
  
  const { data, error } = await supabase
    .from('user_material_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching user material settings:', error);
    return null;
  }
  
  if (!data) return null;
  
  return {
    id: data.id,
    user_id: data.user_id,
    use_categories: data.use_categories
  };
};

// Update user material settings
export const updateUserMaterialSettings = async (useCategories: boolean): Promise<UserMaterialSettings> => {
  const user = await ensureAuthenticated();
  
  const { data, error } = await supabase
    .from('user_material_settings')
    .upsert({
      user_id: user.id,
      use_categories: useCategories
    }, { onConflict: 'user_id' })
    .select()
    .single();
  
  if (error) {
    console.error('Error updating user material settings:', error);
    throw error;
  }
  
  return {
    id: data.id,
    user_id: data.user_id,
    use_categories: data.use_categories
  };
};

// =====================================================
// OPTIMIZED CASH FLOW DATA LOADING
// =====================================================

export interface CashFlowItem {
  id: string;
  openingDate: Date;
  closingDate: Date | null;
  openingAmount: number;
  finalAmount: number;
  totalSales: number;
  totalPurchases: number;
  totalExpenses: number;
  expectedAmount: number;
  difference: number;
  userName: string;
  grossProfit: number;
  netProfit: number;
}

/**
 * Optimized function to get closed cash registers with pre-calculated summaries.
 * This function does everything in minimal queries instead of N+1 queries.
 */
export const getClosedCashRegistersWithSummary = async (): Promise<CashFlowItem[]> => {
  const user = await ensureAuthenticated();
  
  // Single query to get all closed registers with their transactions
  const { data: registersData, error: registersError } = await supabase
    .from('cash_registers')
    .select(`
      *,
      cash_transactions (*)
    `)
    .eq('user_id', user.id)
    .eq('status', 'closed')
    .order('closing_timestamp', { ascending: false, nullsFirst: false });
  
  if (registersError) {
    console.error('Error fetching closed cash registers:', registersError);
    return [];
  }

  if (!registersData || registersData.length === 0) {
    return [];
  }

  // Get user profile once
  const { data: profileData } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single();

  const userName = profileData?.name || 'Usuário';

  // Process all registers locally - no additional queries needed
  return registersData.map(register => {
    const transactions = register.cash_transactions || [];
    
    const initialAmount = Number(register.initial_amount) || 0;
    const finalAmount = Number(register.final_amount) || 0;
    
    const totalSales = transactions
      .filter((t: any) => t.type === 'sale')
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
      
    const totalPurchases = transactions
      .filter((t: any) => t.type === 'purchase')
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
      
    const totalAdditions = transactions
      .filter((t: any) => t.type === 'addition')
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
      
    const totalExpenses = transactions
      .filter((t: any) => t.type === 'expense')
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
    
    const expectedAmount = initialAmount + totalSales - totalPurchases + totalAdditions - totalExpenses;
    
    // Calculate profit metrics
    // If stored in DB, use those values; otherwise calculate from transactions
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
};
