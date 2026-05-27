// Data auditing utilities for material consistency
import { supabase } from '@/integrations/supabase/client';
import { findDuplicateMaterialGroups } from './materialMatching';
import { getCanonicalKey, areMaterialsEquivalent } from './materialNormalization';

export interface DuplicateMaterial {
  id: string;
  name: string;
  canonicalKey: string;
}

export interface DuplicateGroup {
  canonicalKey: string;
  materials: DuplicateMaterial[];
  orderItemsCount: number;
}

export interface InconsistentOrderItem {
  id: string;
  orderId: string;
  materialId: string;
  materialName: string;
  actualMaterialName?: string;
  canonicalKey: string;
  suggestedMaterialId?: string;
}

export interface AuditResult {
  duplicateGroups: DuplicateGroup[];
  inconsistentOrderItems: InconsistentOrderItem[];
  totalDuplicates: number;
  totalInconsistencies: number;
}

/**
 * Finds duplicate materials in the database
 */
export const findDuplicateMaterials = async (userId: string): Promise<DuplicateGroup[]> => {
  try {
    const { data: materials, error } = await supabase
      .from('materials')
      .select('id, name')
      .eq('user_id', userId);

    if (error) throw error;
    if (!materials) return [];

    const duplicateGroups = findDuplicateMaterialGroups(materials);
    
    // Get order items count for each group
    const enrichedGroups: DuplicateGroup[] = [];
    
    for (const group of duplicateGroups) {
      const materialIds = group.materials.map(m => m.id);
      
      const { count } = await supabase
        .from('order_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('material_id', materialIds);
      
      enrichedGroups.push({
        canonicalKey: group.canonicalKey,
        materials: group.materials.map(m => ({
          ...m,
          canonicalKey: getCanonicalKey(m.name)
        })),
        orderItemsCount: count || 0
      });
    }
    
    return enrichedGroups;
  } catch (error) {
    console.error('Error finding duplicate materials:', error);
    return [];
  }
};

/**
 * Finds order items with inconsistent material names
 */
export const findInconsistentOrderItems = async (userId: string): Promise<InconsistentOrderItem[]> => {
  try {
    // Get all materials for reference
    const { data: materials, error: materialsError } = await supabase
      .from('materials')
      .select('id, name')
      .eq('user_id', userId);

    if (materialsError) throw materialsError;
    if (!materials) return [];

    // Get all order items
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select('id, order_id, material_id, material_name')
      .eq('user_id', userId);

    if (orderItemsError) throw orderItemsError;
    if (!orderItems) return [];

    const inconsistencies: InconsistentOrderItem[] = [];
    
    for (const item of orderItems) {
      const referenceMaterial = materials.find(m => m.id === item.material_id);
      
      if (referenceMaterial) {
        // Check if stored material_name matches the reference material name
        const isConsistent = areMaterialsEquivalent(
          item.material_name, 
          referenceMaterial.name
        );
        
        if (!isConsistent) {
          // Try to find a better matching material
          const betterMatch = materials.find(m => 
            areMaterialsEquivalent(item.material_name, m.name)
          );
          
          inconsistencies.push({
            id: item.id,
            orderId: item.order_id,
            materialId: item.material_id,
            materialName: item.material_name,
            actualMaterialName: referenceMaterial?.name,
            canonicalKey: getCanonicalKey(item.material_name),
            suggestedMaterialId: betterMatch?.id
          });
        }
      }
    }
    
    return inconsistencies;
  } catch (error) {
    console.error('Error finding inconsistent order items:', error);
    return [];
  }
};

/**
 * Performs a complete audit of material data
 */
export const performDataAudit = async (userId: string): Promise<AuditResult> => {
  try {
    const [duplicateGroups, inconsistentOrderItems] = await Promise.all([
      findDuplicateMaterials(userId),
      findInconsistentOrderItems(userId)
    ]);
    
    return {
      duplicateGroups,
      inconsistentOrderItems,
      totalDuplicates: duplicateGroups.reduce((sum, group) => sum + group.materials.length, 0),
      totalInconsistencies: inconsistentOrderItems.length
    };
  } catch (error) {
    console.error('Error performing data audit:', error);
    return {
      duplicateGroups: [],
      inconsistentOrderItems: [],
      totalDuplicates: 0,
      totalInconsistencies: 0
    };
  }
};

/**
 * Gets material usage statistics
 */
export const getMaterialUsageStats = async (userId: string, materialId: string) => {
  try {
    const { data: orderItems, error } = await supabase
      .from('order_items')
      .select(`
        id,
        quantity,
        total,
        created_at,
        orders!inner(type, status)
      `)
      .eq('user_id', userId)
      .eq('material_id', materialId);

    if (error) throw error;

    const stats = {
      totalTransactions: orderItems?.length || 0,
      totalQuantity: orderItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0,
      totalValue: orderItems?.reduce((sum, item) => sum + (item.total || 0), 0) || 0,
      purchaseCount: orderItems?.filter(item => item.orders.type === 'compra').length || 0,
      saleCount: orderItems?.filter(item => item.orders.type === 'venda').length || 0,
      lastUsed: orderItems?.length ? Math.max(...orderItems.map(item => new Date(item.created_at).getTime())) : null
    };

    return stats;
  } catch (error) {
    console.error('Error getting material usage stats:', error);
    return null;
  }
};