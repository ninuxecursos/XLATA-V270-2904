
// Utilitários ultra-otimizados para performance máxima

// Debounce super-otimizado com cancelamento
export const createUltraDebounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): {
  (...args: Parameters<T>): void;
  cancel: () => void;
} => {
  let timeoutId: NodeJS.Timeout;
  
  const debouncedFunction = (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
  
  debouncedFunction.cancel = () => {
    clearTimeout(timeoutId);
  };
  
  return debouncedFunction;
};

// Throttle com leading e trailing
export const createUltraThrottle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  options: { leading?: boolean; trailing?: boolean } = { leading: true, trailing: true }
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  let lastArgs: Parameters<T>;
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    lastArgs = args;
    
    if (now - lastCall >= delay) {
      if (options.leading) {
        lastCall = now;
        func(...args);
      }
    }
    
    if (options.trailing) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (now - lastCall >= delay) {
          lastCall = Date.now();
          func(...lastArgs);
        }
      }, delay);
    }
  };
};

// Scheduler de tarefas ultra-otimizado
export const scheduleUltraTask = (
  callback: () => void, 
  priority: 'immediate' | 'high' | 'normal' | 'low' | 'idle' = 'normal'
) => {
  switch (priority) {
    case 'immediate':
      callback();
      break;
    case 'high':
      setTimeout(callback, 0);
      break;
    case 'normal':
      requestAnimationFrame(callback);
      break;
    case 'low':
      requestAnimationFrame(() => {
        setTimeout(callback, 0);
      });
      break;
    case 'idle':
      if ('requestIdleCallback' in window) {
        requestIdleCallback(callback, { timeout: 2000 });
      } else {
        setTimeout(callback, 100);
      }
      break;
  }
};

// Memoização com LRU cache
export const createUltraMemoize = <T extends (...args: any[]) => any>(
  fn: T,
  maxSize: number = 100
) => {
  const cache = new Map();
  const accessOrder = new Set();
  
  return (...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      // Atualizar ordem de acesso
      accessOrder.delete(key);
      accessOrder.add(key);
      return cache.get(key);
    }
    
    const result = fn(...args);
    
    // Limpar cache se necessário
    if (cache.size >= maxSize) {
      const oldestKey = accessOrder.values().next().value;
      cache.delete(oldestKey);
      accessOrder.delete(oldestKey);
    }
    
    cache.set(key, result);
    accessOrder.add(key);
    
    return result;
  };
};

// Virtualização ultra-otimizada
export const createUltraVirtualizer = (
  items: any[],
  itemHeight: number,
  containerHeight: number,
  scrollTop: number,
  overscan: number = 2
) => {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );
  
  return {
    startIndex,
    endIndex,
    visibleItems: items.slice(startIndex, endIndex),
    totalHeight: items.length * itemHeight,
    offsetY: startIndex * itemHeight,
    visibleCount: endIndex - startIndex
  };
};

// Batch processor ultra-rápido
export const createUltraBatchProcessor = (maxBatchSize: number = 50) => {
  const batch: (() => void)[] = [];
  let isProcessing = false;
  
  const processBatch = () => {
    if (isProcessing) return;
    
    isProcessing = true;
    const currentBatch = batch.splice(0, maxBatchSize);
    
    requestAnimationFrame(() => {
      currentBatch.forEach(task => {
        try {
          task();
        } catch (error) {
          console.error('Erro no batch processor:', error);
        }
      });
      
      isProcessing = false;
      
      if (batch.length > 0) {
        processBatch();
      }
    });
  };
  
  return {
    add: (task: () => void) => {
      batch.push(task);
      if (!isProcessing) {
        processBatch();
      }
    },
    
    clear: () => {
      batch.length = 0;
    },
    
    size: () => batch.length
  };
};

// Monitor de performance
export const createPerformanceMonitor = () => {
  const metrics = {
    renders: 0,
    updates: 0,
    lastRenderTime: 0,
    averageRenderTime: 0
  };
  
  return {
    startRender: () => {
      metrics.lastRenderTime = performance.now();
    },
    
    endRender: () => {
      const renderTime = performance.now() - metrics.lastRenderTime;
      metrics.renders++;
      metrics.averageRenderTime = (metrics.averageRenderTime * (metrics.renders - 1) + renderTime) / metrics.renders;
    },
    
    recordUpdate: () => {
      metrics.updates++;
    },
    
    getMetrics: () => ({ ...metrics }),
    
    reset: () => {
      Object.assign(metrics, {
        renders: 0,
        updates: 0,
        lastRenderTime: 0,
        averageRenderTime: 0
      });
    }
  };
};

// Otimizador de eventos
export const createEventOptimizer = () => {
  const listeners = new Map();
  
  return {
    addEventListener: (element: Element, event: string, handler: EventListener, options?: AddEventListenerOptions) => {
      const key = `${event}-${element}`;
      
      if (listeners.has(key)) {
        element.removeEventListener(event, listeners.get(key));
      }
      
      const optimizedHandler = createUltraThrottle(handler, 16); // 60fps
      element.addEventListener(event, optimizedHandler, { passive: true, ...options });
      listeners.set(key, optimizedHandler);
    },
    
    removeAllListeners: () => {
      listeners.clear();
    }
  };
};
