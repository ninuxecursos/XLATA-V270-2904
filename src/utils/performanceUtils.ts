
// Utilitários de performance para o PDV

// Debounce otimizado para inputs
export const createOptimizedDebounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Throttle para eventos de scroll/resize
export const createThrottle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

// Função para schedular tarefas não-críticas
export const scheduleTask = (callback: () => void, priority: 'high' | 'normal' | 'low' = 'normal') => {
  switch (priority) {
    case 'high':
      // Execução imediata
      callback();
      break;
    case 'normal':
      // Próximo frame
      requestAnimationFrame(callback);
      break;
    case 'low':
      // Quando o browser estiver idle
      if ('requestIdleCallback' in window) {
        requestIdleCallback(callback, { timeout: 5000 });
      } else {
        setTimeout(callback, 0);
      }
      break;
  }
};

// Memoização para cálculos custosos
export const createMemoize = <T extends (...args: any[]) => any>(fn: T) => {
  const cache = new Map();
  
  return (...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    // Limitar tamanho do cache
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  };
};

// Otimização para listas grandes
export const createVirtualizedRenderer = (
  items: any[],
  itemHeight: number,
  containerHeight: number,
  scrollTop: number
) => {
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );
  
  return {
    startIndex,
    endIndex,
    visibleItems: items.slice(startIndex, endIndex),
    totalHeight: items.length * itemHeight,
    offsetY: startIndex * itemHeight
  };
};

// Batch updates para React
export const createBatchUpdater = () => {
  const updates: (() => void)[] = [];
  let isScheduled = false;
  
  const flush = () => {
    const toRun = [...updates];
    updates.length = 0;
    isScheduled = false;
    
    toRun.forEach(update => update());
  };
  
  return (update: () => void) => {
    updates.push(update);
    
    if (!isScheduled) {
      isScheduled = true;
      requestAnimationFrame(flush);
    }
  };
};

// Lazy loading para listas grandes de dados
export const createLazyLoader = <T>(
  data: T[],
  batchSize: number = 50
) => {
  let currentIndex = 0;
  
  return {
    loadNext: (): T[] => {
      const batch = data.slice(currentIndex, currentIndex + batchSize);
      currentIndex += batchSize;
      return batch;
    },
    hasMore: (): boolean => currentIndex < data.length,
    reset: (): void => {
      currentIndex = 0;
    },
    getTotalCount: (): number => data.length,
    getLoadedCount: (): number => currentIndex
  };
};
// Re-export logger from centralized utility
export { createLogger } from './logger';
