
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Customer, Order, Material, OrderItem } from '../types/pdv';
import { toast } from './use-toast';

// Hook altamente otimizado para performance do PDV
export const usePDVPerformance = () => {
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

  useEffect(() => {
    customersRef.current = customers;
  }, [customers]);

  useEffect(() => {
    materialsRef.current = materials;
  }, [materials]);

  // Função de debounce para operações custosas
  const debounce = useCallback((func: Function, delay: number) => {
    return (...args: any[]) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => func(...args), delay);
    };
  }, []);

  // Memoizar formatação de peso para evitar recálculos
  const formatPeso = useCallback((value: string | number) => {
    if (!value) return "0,000/kg";
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return "0,000/kg";
    
    return numValue.toLocaleString('pt-BR', { 
      minimumFractionDigits: 3, 
      maximumFractionDigits: 3 
    }).replace('.', ',') + "/kg";
  }, []);

  // Otimizar geração de UUID
  const generateUUID = useCallback(() => {
    return crypto.randomUUID();
  }, []);

  // Validação de UUID otimizada
  const isValidUUID = useCallback((uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }, []);

  // Seleção de cliente ultra-otimizada
  const selectCustomer = useCallback((customer: Customer | null) => {
    // Usar requestAnimationFrame para suavizar a transição
    requestAnimationFrame(() => {
      setCurrentCustomer(customer);
      if (customer) {
        const openOrder = customer.orders.find(o => o.status === 'open');
        setActiveOrder(openOrder || null);
      } else {
        setActiveOrder(null);
      }
    });
  }, []);

  // Adição de item otimizada com batch updates
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
        duration: 2000,
      });
      return false;
    }

    // Calcular valores imediatamente
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

    // Usar React's batch update pattern
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

    // Batch state updates usando requestAnimationFrame
    requestAnimationFrame(() => {
      setActiveOrder(updatedOrder);
      setCurrentCustomer(updatedCustomer);
      setCustomers(prev => prev.map(c => c.id === currentCustomer.id ? updatedCustomer : c));
    });

    return true;
  }, [currentCustomer, activeOrder, isSaleMode]);

  // Remoção de item otimizada
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

    // Batch updates
    requestAnimationFrame(() => {
      setActiveOrder(updatedOrder);
      setCurrentCustomer(updatedCustomer);
      setCustomers(prev => prev.map(c => c.id === currentCustomer.id ? updatedCustomer : c));
    });

    return true;
  }, [currentCustomer, activeOrder]);

  // Stats memoizadas para evitar recálculos
  // CORREÇÃO: usar customers diretamente ao invés de customersRef para rastreamento correto
  const stats = useMemo(() => ({
    totalCustomers: customers.length,
    totalItems: activeOrder?.items.length || 0,
    orderTotal: activeOrder?.total || 0,
    hasActiveOrder: !!activeOrder && activeOrder.items.length > 0
  }), [customers.length, activeOrder]);

  // Setters otimizados com debounce para operações custosas
  const setCustomersOptimized = useCallback((newCustomers: Customer[] | ((prev: Customer[]) => Customer[])) => {
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
  }, []);

  const setMaterialsOptimized = useCallback((newMaterials: Material[] | ((prev: Material[]) => Material[])) => {
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

    // Setters otimizados
    setCustomers: setCustomersOptimized,
    setMaterials: setMaterialsOptimized,
    setIsSaleMode: useCallback(setIsSaleMode, []),
    setCurrentBalance: useCallback(setCurrentBalance, []),

    // Ações otimizadas
    selectCustomer,
    addItemToOrder,
    removeItemFromOrder,
    formatPeso,
    generateUUID,
    isValidUUID,
    debounce,
  };
};
