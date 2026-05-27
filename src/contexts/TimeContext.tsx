import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TimeContextValue {
  currentTime: Date;
  formatTime: (date: Date) => string;
  formatDate: (date: Date) => string;
}

const TimeContext = createContext<TimeContextValue | undefined>(undefined);

interface TimeProviderProps {
  children: ReactNode;
}

/**
 * TimeProvider - Provider unificado de tempo para todo o app
 * 
 * OTIMIZAÇÃO: Substitui múltiplos setInterval(1000) espalhados por componentes
 * por um único interval centralizado. Reduz de 5+ intervals para 1.
 * 
 * Componentes que usavam setInterval próprio:
 * - Footer.tsx
 * - MobilePDVLayout.tsx  
 * - CashRegisterOpeningModal.tsx
 * - InteractiveProductCard.tsx
 * - ShopMobileInteractiveCard.tsx
 */
export const TimeProvider: React.FC<TimeProviderProps> = ({ children }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <TimeContext.Provider value={{ currentTime, formatTime, formatDate }}>
      {children}
    </TimeContext.Provider>
  );
};

/**
 * Hook para acessar o tempo atual do app
 * 
 * @example
 * const { currentTime, formatTime, formatDate } = useTime();
 * return <span>{formatTime(currentTime)}</span>;
 */
export const useTime = (): TimeContextValue => {
  const context = useContext(TimeContext);
  if (context === undefined) {
    // Fallback para componentes fora do provider
    return {
      currentTime: new Date(),
      formatTime: (date: Date) => date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      formatDate: (date: Date) => date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    };
  }
  return context;
};

export default TimeContext;
