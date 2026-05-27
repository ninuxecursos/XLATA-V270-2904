
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Customer, Order, Material, OrderItem } from '../types/pdv';
import { toast } from './use-toast';

// Hook ultra-otimizado com técnicas avançadas de performance
export const usePDVUltraPerformance = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [isSaleMode, setIsSaleMode] = useState<boolean>(false);
  const [currentBalance, setCurrentBalance] = useState(0);

  // Usar refs para evitar re-renders desnecessários
  const customersRef = useRef(customers);
  const materialsRef = useRef(materials);
  const debounceRef = useRef<NodeJS.Timeout>();
  const batchUpdateRef = useRef<(() => void)[]>([]);
  const isScheduledRef = useRef(false);

  // Batch updates para React com requestAnimationFrame
  const batchUpdate = useCallback((update: () => void) => {
    batchUpdateRef.current.push(update);
    
    if (!isScheduledRef.current) {
      isScheduledRef.current = true;
      requestAnimationFrame(() => {
        const updates = [...batchUpdateRef.current];
        batchUpdateRef.current.length = 0;
        isScheduledRef.current = false;
        
        updates.forEach(update => update());
      });
    }
  }, []);

  // Memoização avançada para formatação
  const formatPeso = useCallback((value: string | number) => {
    if (!value) return "0,000/kg";
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return "0,000/kg";
    
    return numValue.toLocaleString('pt-BR', { 
      minimumFractionDigits: 3, 
      maximumFractionDigits: 3 
    }).replace('.', ',') + "/kg";
  }, []);

  // Geração de UUID otimizada
  const generateUUID = useCallback(() => {
    return crypto.randomUUID();
  }, []);

  // Seleção de cliente ultra-otimizada
  const selectCustomer = useCallback((customer: Customer | null) => {
    batchUpdate(() => {
      setCurrentCustomer(customer);
      if (customer) {
        const openOrder = customer.orders.find(o => o.status === 'open');
        setActiveOrder(openOrder || null);
      } else {
        setActiveOrder(null);
      }
    });
  }, [batchUpdate]);

  // Adição de item ultra-otimizada
  const addItemToOrder = useCallback(async (
    material: Material, 
    quantity: number, 
    tara: number = 0,
    adjustedPrice?: number
  ) => {
    if (!currentCustomer || !activeOrder) {
      toast({
        title: "Erro",
        description: "Cliente ou pedido não selecionado",
        variant: "destructive",
        duration: 1500,
      });
      return false;
    }

    const netWeight = Math.max(0, quantity - tara);
    const price = adjustedPrice !== undefined 
      ? adjustedPrice 
      : (isSaleMode ? material.salePrice : material.price);

    const newItem: OrderItem = {
      materialId: material.id,
      materialName: material.name.trim(),
      quantity: netWeight,
      price: price,
      total: price * netWeight,
      tara: tara > 0 ? tara : undefined
    };

    const updatedOrder = {
      ...activeOrder,
      items: [...activeOrder.items, newItem],
      total: activeOrder.total + newItem.total,
      type: isSaleMode ? 'venda' as const : 'compra' as const
    };

    const updatedCustomer = {
      ...currentCustomer,
      orders: currentCustomer.orders.map(o =>
        o.id === updatedOrder.id ? updatedOrder : o
      )
    };

    // Batch updates ultra-rápidos
    batchUpdate(() => {
      setActiveOrder(updatedOrder);
      setCurrentCustomer(updatedCustomer);
      setCustomers(prev => prev.map(c => c.id === currentCustomer.id ? updatedCustomer : c));
    });

    return true;
  }, [currentCustomer, activeOrder, isSaleMode, batchUpdate]);

  // Remoção de item ultra-otimizada
  const removeItemFromOrder = useCallback((index: number) => {
    if (!currentCustomer || !activeOrder || index < 0 || index >= activeOrder.items.length) {
      return false;
    }

    const itemToRemove = activeOrder.items[index];
    const updatedItems = activeOrder.items.filter((_, i) => i !== index);

    const updatedOrder = {
      ...activeOrder,
      items: updatedItems,
      total: activeOrder.total - itemToRemove.total
    };

    const updatedCustomer = {
      ...currentCustomer,
      orders: currentCustomer.orders.map(o => 
        o.id === updatedOrder.id ? updatedOrder : o
      )
    };

    batchUpdate(() => {
      setActiveOrder(updatedOrder);
      setCurrentCustomer(updatedCustomer);
      setCustomers(prev => prev.map(c => c.id === currentCustomer.id ? updatedCustomer : c));
    });

    return true;
  }, [currentCustomer, activeOrder, batchUpdate]);

  // Stats ultra-memoizadas
  const stats = useMemo(() => ({
    totalCustomers: customersRef.current.length,
    totalItems: activeOrder?.items.length || 0,
    orderTotal: activeOrder?.total || 0,
    hasActiveOrder: !!activeOrder && activeOrder.items.length > 0
  }), [activeOrder]);

  // Cleanup - CORREÇÃO: limpar todos os refs para evitar memory leaks
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      // Limpar batch updates pendentes para evitar memory leak
      batchUpdateRef.current.length = 0;
      isScheduledRef.current = false;
    };
  }, []);

  return {
    // Estado
    customers,
    materials,
    currentCustomer,
    activeOrder,
    isSaleMode,
    currentBalance,
    stats,

    // Setters ultra-otimizados
    setCustomers: useCallback((newCustomers: Customer[] | ((prev: Customer[]) => Customer[])) => {
      batchUpdate(() => {
        if (typeof newCustomers === 'function') {
          setCustomers(prev => {
            const result = newCustomers(prev);
            customersRef.current = result;
            return result;
          });
        } else {
          setCustomers(newCustomers);
          customersRef.current = newCustomers;
        }
      });
    }, [batchUpdate]),

    setMaterials: useCallback((newMaterials: Material[] | ((prev: Material[]) => Material[])) => {
      batchUpdate(() => {
        if (typeof newMaterials === 'function') {
          setMaterials(prev => {
            const result = newMaterials(prev);
            materialsRef.current = result;
            return result;
          });
        } else {
          setMaterials(newMaterials);
          materialsRef.current = newMaterials;
        }
      });
    }, [batchUpdate]),

    setIsSaleMode: useCallback((value: boolean) => {
      batchUpdate(() => setIsSaleMode(value));
    }, [batchUpdate]),

    setCurrentBalance: useCallback((value: number) => {
      batchUpdate(() => setCurrentBalance(value));
    }, [batchUpdate]),

    // Ações ultra-otimizadas
    selectCustomer,
    addItemToOrder,
    removeItemFromOrder,
    formatPeso,
    generateUUID,
    batchUpdate,
  };
};
