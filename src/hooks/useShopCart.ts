import { useEffect, useCallback, useSyncExternalStore, useRef } from 'react';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  stockQuantity?: number;
}

const CART_KEY = 'xlata_shop_cart';

// Store compartilhado para sincronizar entre componentes
let globalItems: CartItem[] = [];
let listeners: Set<() => void> = new Set();
let isInitialized = false;

// Inicializar com dados do localStorage de forma segura
function initializeStore() {
  if (isInitialized || typeof window === 'undefined') return;
  isInitialized = true;
  
  const stored = localStorage.getItem(CART_KEY);
  if (stored) {
    try {
      globalItems = JSON.parse(stored);
    } catch {
      localStorage.removeItem(CART_KEY);
      globalItems = [];
    }
  }
}

// Inicializar imediatamente se possível
if (typeof window !== 'undefined') {
  initializeStore();
}

function notifyListeners() {
  listeners.forEach(listener => listener());
}

function subscribe(listener: () => void) {
  initializeStore();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): CartItem[] {
  initializeStore();
  return globalItems;
}

function getServerSnapshot(): CartItem[] {
  return [];
}

function setGlobalItems(items: CartItem[]) {
  globalItems = items;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  notifyListeners();
}

export function useShopCart() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isLoaded = useRef(true);

  // Sincronizar com eventos de storage de outras tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CART_KEY && e.newValue) {
        try {
          globalItems = JSON.parse(e.newValue);
          notifyListeners();
        } catch {
          // Ignore parsing errors
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    const current = getSnapshot();
    const existing = current.find(i => i.productId === item.productId);
    const maxStock = item.stockQuantity ?? Infinity;
    
    if (existing) {
      const newQty = Math.min(existing.quantity + quantity, maxStock);
      const newItems = current.map(i => 
        i.productId === item.productId 
          ? { ...i, quantity: newQty, stockQuantity: item.stockQuantity ?? i.stockQuantity }
          : i
      );
      setGlobalItems(newItems);
    } else {
      const clampedQty = Math.min(quantity, maxStock);
      setGlobalItems([...current, { ...item, quantity: clampedQty }]);
    }
  }, []);

  const removeItem = useCallback((productId: string) => {
    const current = getSnapshot();
    setGlobalItems(current.filter(i => i.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    const current = getSnapshot();
    const item = current.find(i => i.productId === productId);
    const maxStock = item?.stockQuantity ?? Infinity;
    const clampedQty = Math.min(quantity, maxStock);
    setGlobalItems(
      current.map(i => 
        i.productId === productId ? { ...i, quantity: clampedQty } : i
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setGlobalItems([]);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return {
    items,
    isLoaded: isLoaded.current,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice
  };
}
