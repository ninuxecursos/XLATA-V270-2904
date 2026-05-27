import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para gerenciar posicionamento responsivo em tutoriais
 */
export function useTutorialMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return false;
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  /**
   * Ajusta a posição do tooltip para mobile
   * Em mobile, left/right viram bottom para evitar cortes
   */
  const getResponsivePosition = useCallback((position: 'top' | 'bottom' | 'left' | 'right'): 'top' | 'bottom' | 'left' | 'right' => {
    if (isMobile) {
      // Em mobile, left e right ficam cortados, converter para bottom/top
      if (position === 'left' || position === 'right') {
        return 'bottom';
      }
    }
    return position;
  }, [isMobile]);

  /**
   * Calcula padding apropriado para mobile
   */
  const getResponsivePadding = useCallback((defaultPadding: number): number => {
    if (isMobile) {
      return Math.min(defaultPadding, 8);
    }
    return defaultPadding;
  }, [isMobile]);

  return {
    isMobile,
    getResponsivePosition,
    getResponsivePadding
  };
}
