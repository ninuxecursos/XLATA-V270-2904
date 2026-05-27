import { supabase } from '@/integrations/supabase/client';
import { wouldCreateDuplicate } from './materialMatching';
import { getMaterials } from './supabaseStorage';

export interface OrphanMaterial {
  materialName: string;
  currentStock: number;
  totalPurchases: number;
  totalSales: number;
  totalPurchaseCost: number;
  totalSaleCost: number;
  transactionCount: number;
}

// Ensure user is authenticated
const ensureAuthenticated = async () => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error('User not authenticated');
  }
  return userData.user;
};

/**
 * Get all orphan materials (materials in order_items that don't have a corresponding entry in materials)
 */
export const getOrphanMaterials = async (): Promise<OrphanMaterial[]> => {
  const user = await ensureAuthenticated();

  // Get all unique material names from order_items with their transactions
  const { data: orderItems, error: orderItemsError } = await supabase
    .from('order_items')
    .select(`
      material_name,
      quantity,
      price,
      total,
      orders!inner(type, status, user_id)
    `)
    .eq('user_id', user.id);

  if (orderItemsError) {
    console.error('Error fetching order items:', orderItemsError);
    return [];
  }

  // Get all registered materials for this user
  const { data: materials, error: materialsError } = await supabase
    .from('materials')
    .select('name')
    .eq('user_id', user.id);

  if (materialsError) {
    console.error('Error fetching materials:', materialsError);
    return [];
  }

  // Create a set of registered material names (lowercase for comparison)
  const registeredMaterialNames = new Set(
    materials?.map(m => m.name.toLowerCase().trim()) || []
  );

  // Group order items by material name and calculate totals
  const orphanMap = new Map<string, OrphanMaterial>();

  orderItems?.forEach(item => {
    const order = item.orders as { type: string; status: string; user_id: string };
    
    // Only process completed orders
    if (order.status !== 'completed') return;

    const materialNameLower = item.material_name.toLowerCase().trim();
    
    // Skip if material is registered
    if (registeredMaterialNames.has(materialNameLower)) return;

    // Initialize orphan if not exists
    if (!orphanMap.has(item.material_name)) {
      orphanMap.set(item.material_name, {
        materialName: item.material_name,
        currentStock: 0,
        totalPurchases: 0,
        totalSales: 0,
        totalPurchaseCost: 0,
        totalSaleCost: 0,
        transactionCount: 0
      });
    }

    const orphan = orphanMap.get(item.material_name)!;
    orphan.transactionCount++;

    if (order.type === 'compra') {
      orphan.currentStock += item.quantity;
      orphan.totalPurchases += item.quantity;
      orphan.totalPurchaseCost += item.total;
    } else if (order.type === 'venda') {
      orphan.currentStock -= item.quantity;
      orphan.totalSales += item.quantity;
      orphan.totalSaleCost += item.total;
    }
  });

  // Return only orphans with positive stock
  return Array.from(orphanMap.values())
    .filter(orphan => orphan.currentStock > 0)
    .sort((a, b) => b.currentStock - a.currentStock);
};

/**
 * Link an orphan material to an existing registered material
 * This updates all order_items with the old name to the new name
 */
export const linkOrphanToMaterial = async (
  orphanName: string,
  targetMaterialName: string
): Promise<{ success: boolean; updatedCount: number }> => {
  const user = await ensureAuthenticated();

  const { data, error } = await supabase
    .from('order_items')
    .update({ material_name: targetMaterialName })
    .eq('user_id', user.id)
    .eq('material_name', orphanName)
    .select();

  if (error) {
    console.error('Error linking orphan material:', error);
    throw error;
  }

  return {
    success: true,
    updatedCount: data?.length || 0
  };
};

/**
 * Create a new material from an orphan name
 */
export const createMaterialFromOrphan = async (
  orphanName: string,
  price: number,
  salePrice: number,
  categoryId?: string
): Promise<void> => {
  const user = await ensureAuthenticated();

  // Check for case-insensitive duplicates before creating
  const existingMaterials = await getMaterials();
  if (wouldCreateDuplicate(orphanName, existingMaterials)) {
    const similarMaterial = existingMaterials.find(
      m => m.name.toLowerCase().trim() === orphanName.toLowerCase().trim()
    );
    throw new Error(`Material com nome similar a "${orphanName}" já existe no cadastro${similarMaterial ? ` (${similarMaterial.name})` : ''}.`);
  }

  const { error } = await supabase
    .from('materials')
    .insert({
      user_id: user.id,
      name: orphanName,
      price: price,
      sale_price: salePrice,
      category_id: categoryId || null
    });

  if (error) {
    console.error('Error creating material from orphan:', error);
    throw error;
  }
};

/**
 * Clear stock for an orphan material (delete all order_items)
 */
export const clearOrphanStock = async (
  orphanName: string
): Promise<{ success: boolean; deletedCount: number }> => {
  const user = await ensureAuthenticated();

  // First get the order_items to identify orders that might become empty
  const { data: orderItems, error: fetchError } = await supabase
    .from('order_items')
    .select('id, order_id')
    .eq('user_id', user.id)
    .eq('material_name', orphanName);

  if (fetchError) {
    console.error('Error fetching orphan order items:', fetchError);
    throw fetchError;
  }

  if (!orderItems || orderItems.length === 0) {
    return { success: true, deletedCount: 0 };
  }

  // Delete the order_items
  const { error: deleteError } = await supabase
    .from('order_items')
    .delete()
    .eq('user_id', user.id)
    .eq('material_name', orphanName);

  if (deleteError) {
    console.error('Error deleting orphan order items:', deleteError);
    throw deleteError;
  }

  // Clean up orphaned orders (orders with no items)
  const orderIds = [...new Set(orderItems.map(i => i.order_id))];
  for (const orderId of orderIds) {
    const { data: remainingItems } = await supabase
      .from('order_items')
      .select('id')
      .eq('order_id', orderId)
      .limit(1);

    if (!remainingItems || remainingItems.length === 0) {
      await supabase.from('orders').delete().eq('id', orderId);
    }
  }

  return {
    success: true,
    deletedCount: orderItems.length
  };
};
