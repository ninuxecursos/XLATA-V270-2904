
import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
// toast removido: erros de cálculo de estoque agora são apenas logados (o caller decide o que mostrar)
import { useAuth } from './useAuth';
import { getCanonicalKey, areMaterialsEquivalent } from '@/utils/materialNormalization';
import { roundToThreeDecimals } from '@/utils/numericComparison';

export const useStockCalculation = () => {
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [stockCache, setStockCache] = useState<Map<string, { stock: number; timestamp: number }>>(new Map());
  const { user } = useAuth();

  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000;

  const calculateMaterialStock = useCallback(async (materialName: string, skipCache: boolean = false): Promise<number> => {
    if (!user || !materialName) return 0;

    const canonicalKey = getCanonicalKey(materialName);
    
    // Check cache first (only if not skipping)
    if (!skipCache) {
      const cached = stockCache.get(canonicalKey);
      if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        return cached.stock;
      }
    }

    setIsLoadingStock(true);

    try {
      // CORREÇÃO: Paginação infinita para buscar TODOS os order_items do material
      // O Supabase tem limite padrão de 1000 registros por query
      const batchSize = 1000;
      let allOrderItems: any[] = [];
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        const { data: orderItems, error } = await supabase
          .from('order_items')
          .select(`
            material_name,
            quantity,
            orders!inner(
              type,
              status,
              cancelled
            )
          `)
          .eq('user_id', user.id)
          .eq('orders.status', 'completed')
          .eq('orders.cancelled', false)
          .ilike('material_name', materialName)
          .range(from, from + batchSize - 1);

        if (error) {
          // Log detalhado pra diagnóstico, mas SEM toast — quem chamou já trata
          // (ex.: PDV mostra "Estoque insuficiente" ou tenta auto-cadastrar avulso).
          // Antes esse toast aparecia até quando o usuário só tava finalizando uma venda
          // avulsa nova (sem histórico do material), confundindo o operador.
          console.error('[useStockCalculation] Falha ao buscar order_items:', {
            material: materialName,
            code: (error as any)?.code,
            message: (error as any)?.message,
            details: (error as any)?.details,
            hint: (error as any)?.hint,
          });
          return 0;
        }

        if (orderItems && orderItems.length > 0) {
          allOrderItems = [...allOrderItems, ...orderItems];
          from += batchSize;
          hasMore = orderItems.length === batchSize;
        } else {
          hasMore = false;
        }
      }

      let totalCompras = 0;
      let totalVendas = 0;

      allOrderItems.forEach(item => {
        const quantity = item.quantity || 0;
        if (item.orders.type === 'compra') {
          totalCompras += quantity;
        } else if (item.orders.type === 'venda') {
          totalVendas += quantity;
        }
      });

      const estoqueAtual = roundToThreeDecimals(totalCompras - totalVendas);
      const finalStock = Math.max(0, estoqueAtual);
      
      // Update cache
      setStockCache(prev => new Map(prev.set(canonicalKey, {
        stock: finalStock,
        timestamp: Date.now()
      })));

      return finalStock;

    } catch (error) {
      // Log silencioso. O fluxo de venda/compra que chamou já trata o resultado 0
      // (ex.: tenta auto-cadastrar avulso ou bloqueia com "estoque insuficiente").
      console.error('[useStockCalculation] Erro inesperado ao calcular estoque:', error);
      return 0;
    } finally {
      setIsLoadingStock(false);
    }
  }, [user, stockCache]);

  // Clear cache when user changes
  const clearCache = useCallback(() => {
    setStockCache(new Map());
  }, []);

  // Get all stock for multiple materials efficiently with infinite pagination
  const calculateMultipleMaterialsStock = useCallback(async (materialNames: string[]): Promise<Record<string, number>> => {
    if (!user || !materialNames.length) return {};

    const result: Record<string, number> = {};
    
    try {
      // CORREÇÃO: Paginação infinita para buscar TODOS os order_items
      // O Supabase tem limite padrão de 1000 registros por query
      const batchSize = 1000;
      let allOrderItems: any[] = [];
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        const { data: orderItems, error } = await supabase
          .from('order_items')
          .select(`
            material_name,
            quantity,
            orders!inner(
              type,
              status,
              cancelled
            )
          `)
          .eq('user_id', user.id)
          .eq('orders.status', 'completed')
          .eq('orders.cancelled', false)
          .range(from, from + batchSize - 1);

        if (error) throw error;

        if (orderItems && orderItems.length > 0) {
          allOrderItems = [...allOrderItems, ...orderItems];
          from += batchSize;
          // Se retornou menos que o batchSize, não há mais registros
          hasMore = orderItems.length === batchSize;
        } else {
          hasMore = false;
        }
      }

      // Calculate stock for each requested material
      materialNames.forEach(materialName => {
        const canonicalKey = getCanonicalKey(materialName);
        const normalizedSearchName = materialName.toLowerCase().trim();
        
        let totalCompras = 0;
        let totalVendas = 0;

        allOrderItems.forEach(item => {
          // Primary: case-insensitive exact match
          const normalizedItemName = (item.material_name || '').toLowerCase().trim();
          const isMatch = normalizedItemName === normalizedSearchName || 
                         areMaterialsEquivalent(item.material_name, materialName);
          
          if (isMatch) {
            const quantity = item.quantity || 0;
            if (item.orders.type === 'compra') {
              totalCompras += quantity;
            } else if (item.orders.type === 'venda') {
              totalVendas += quantity;
            }
          }
        });

        const stock = Math.max(0, roundToThreeDecimals(totalCompras - totalVendas));
        result[materialName] = stock;
        
        // Update cache
        setStockCache(prev => new Map(prev.set(canonicalKey, {
          stock,
          timestamp: Date.now()
        })));
      });

      return result;
    } catch (error) {
      console.error('Error calculating multiple materials stock:', error);
      return {};
    }
  }, [user]);

  return {
    calculateMaterialStock,
    calculateMultipleMaterialsStock,
    isLoadingStock,
    clearCache
  };
};
