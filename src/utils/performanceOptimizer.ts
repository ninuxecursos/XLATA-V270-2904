// Performance optimizer para reduzir delays e melhorar responsividade
import React from 'react';
import { createUltraDebounce, scheduleUltraTask } from './ultraPerformanceUtils';

// Configurações de performance ultra-otimizadas
export const PERFORMANCE_CONFIG = {
  // Delays mínimos para interações de UI
  MODAL_OPEN_DELAY: 0, // Sem delay para abertura de modais
  BUTTON_CLICK_DELAY: 0, // Sem delay para cliques
  FOCUS_DELAY: 0, // Sem delay para foco
  TOAST_DELAY: 50, // Mínimo para toasts
  
  // Debounce otimizado - reduzido
  INPUT_DEBOUNCE: 100, // Reduzido de 150
  SEARCH_DEBOUNCE: 150, // Reduzido de 200
  
  // Timeouts específicos
  AUTO_RETURN_TIMEOUT: 6000, // Reduzido de 8000
  NOTIFICATION_TIMEOUT: 1500, // Reduzido de 2000
  
  // Novos configs de performance
  SUBMIT_DEBOUNCE: 100, // Para submits
  ANIMATION_DURATION: 100, // Duração de animações
};

// Cache para elementos DOM frequentemente acessados
const domCache = new Map<string, Element>();

// Otimizador de eventos DOM
export const optimizedEventHandler = <T extends (...args: any[]) => void>(
  handler: T,
  options: {
    debounce?: number;
    immediate?: boolean;
    priority?: 'immediate' | 'high' | 'normal' | 'low';
  } = {}
): (...args: Parameters<T>) => void => {
  const { debounce = 0, immediate = true, priority = 'immediate' } = options;
  
  if (debounce > 0) {
    const debouncedFn = createUltraDebounce(handler, debounce);
    return (...args: Parameters<T>) => debouncedFn(...args);
  }
  
  return (...args: Parameters<T>) => {
    if (immediate) {
      handler(...args);
    } else {
      scheduleUltraTask(() => handler(...args), priority);
    }
  };
};

// Otimizador de abertura de modais
export const optimizedModalOpen = (
  openFunction: () => void,
  delay: number = PERFORMANCE_CONFIG.MODAL_OPEN_DELAY
) => {
  if (delay === 0) {
    openFunction();
  } else {
    scheduleUltraTask(openFunction, 'high');
  }
};

// Otimizador de foco
export const optimizedFocus = (element: HTMLElement | null) => {
  if (!element) return;
  
  scheduleUltraTask(() => {
    try {
      element.focus();
    } catch (error) {
      console.warn('Erro ao focar elemento:', error);
    }
  }, 'high');
};

// Cache DOM otimizado
export const getCachedElement = (selector: string): Element | null => {
  if (domCache.has(selector)) {
    const cached = domCache.get(selector);
    // Verifica se o elemento ainda está no DOM
    if (cached && document.contains(cached)) {
      return cached;
    }
    domCache.delete(selector);
  }
  
  const element = document.querySelector(selector);
  if (element) {
    domCache.set(selector, element);
  }
  
  return element;
};

// Limpeza de cache DOM
export const clearDOMCache = () => {
  domCache.clear();
};

// Hook para otimizar re-renders
export const useOptimizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: any[],
  options: {
    debounce?: number;
    immediate?: boolean;
  } = {}
) => {
  const { debounce = 0, immediate = true } = options;
  
  return React.useCallback(
    optimizedEventHandler(callback, { debounce, immediate }),
    deps
  );
};

// Otimizador para timeouts comuns
export const optimizedTimeout = (
  callback: () => void,
  delay: number,
  priority: 'immediate' | 'high' | 'normal' | 'low' = 'normal'
) => {
  if (delay === 0) {
    scheduleUltraTask(callback, 'immediate');
  } else if (delay < 100) {
    scheduleUltraTask(callback, priority);
  } else {
    setTimeout(callback, delay);
  }
};

// Monitor de performance para debugging
export const performanceMonitor = {
  measureStart: (label: string) => {
    performance.mark(`${label}-start`);
  },
  
  measureEnd: (label: string) => {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
    
    const measure = performance.getEntriesByName(label)[0];
    if (measure && measure.duration > 16) { // 60fps threshold
      console.warn(`Performance warning: ${label} took ${measure.duration.toFixed(2)}ms`);
    }
  }
};