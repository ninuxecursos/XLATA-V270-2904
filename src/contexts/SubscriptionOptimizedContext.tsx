// FASE 3: SISTEMA DE ASSINATURAS ULTRA-OTIMIZADO
// Contexto centralizado com cache inteligente e sincronização em tempo real

import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createUltraDebounce, createUltraMemoize, scheduleUltraTask } from '@/utils/ultraPerformanceUtils';
import { createLogger } from '@/utils/performanceUtils';

const logger = createLogger('[SubscriptionOptimized]');

interface SubscriptionData {
  id: string;
  user_id: string;
  plan_type: string;
  is_active: boolean;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

interface SubscriptionState {
  subscription: SubscriptionData | null;
  isActive: boolean;
  loading: boolean;
  error: string | null;
  lastSync: number;
  cacheValid: boolean;
  retryCount: number;
}

type SubscriptionAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SUBSCRIPTION'; payload: SubscriptionData | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ACTIVE'; payload: boolean }
  | { type: 'UPDATE_CACHE'; payload: { lastSync: number; cacheValid: boolean } }
  | { type: 'INCREMENT_RETRY' }
  | { type: 'RESET_RETRY' };

const initialState: SubscriptionState = {
  subscription: null,
  isActive: false,
  loading: true,
  error: null,
  lastSync: 0,
  cacheValid: false,
  retryCount: 0
};

// Reducer otimizado com logs detalhados
const subscriptionReducer = (state: SubscriptionState, action: SubscriptionAction): SubscriptionState => {
  logger.log('Dispatch action:', action.type, 'payload' in action ? action.payload : undefined);
  
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_SUBSCRIPTION':
      const isActive = action.payload 
        ? action.payload.is_active && new Date(action.payload.expires_at) > new Date()
        : false;
      
      return {
        ...state,
        subscription: action.payload,
        isActive,
        loading: false,
        error: null,
        cacheValid: true,
        lastSync: Date.now()
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    
    case 'SET_ACTIVE':
      return { ...state, isActive: action.payload };
    
    case 'UPDATE_CACHE':
      return {
        ...state,
        lastSync: action.payload.lastSync,
        cacheValid: action.payload.cacheValid
      };
    
    case 'INCREMENT_RETRY':
      return { ...state, retryCount: state.retryCount + 1 };
    
    case 'RESET_RETRY':
      return { ...state, retryCount: 0 };
    
    default:
      return state;
  }
};

interface SubscriptionContextType extends SubscriptionState {
  syncSubscriptionData: () => Promise<void>;
  checkSubscriptionStatus: () => boolean;
  invalidateCache: () => void;
  getTimeUntilExpiration: () => number | null;
  isTrialPeriod: () => boolean;
}

const SubscriptionOptimizedContext = createContext<SubscriptionContextType | undefined>(undefined);

// Cache em memória para performance máxima
class SubscriptionCache {
  private static instance: SubscriptionCache;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly DEFAULT_TTL = 60000; // 1 minuto

  static getInstance(): SubscriptionCache {
    if (!SubscriptionCache.instance) {
      SubscriptionCache.instance = new SubscriptionCache();
    }
    return SubscriptionCache.instance;
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  invalidate(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  size(): number {
    return this.cache.size;
  }
}

export const SubscriptionOptimizedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(subscriptionReducer, initialState);
  const cache = SubscriptionCache.getInstance();
  const channelRef = useRef<any>();
  const syncTimeoutRef = useRef<NodeJS.Timeout>();
  const maxRetries = 3;

  // Função memoizada para buscar dados da assinatura
  const fetchSubscriptionData = useRef(
    createUltraMemoize(async (userId: string) => {
      const cacheKey = `subscription_${userId}`;
      
      // Verificar cache primeiro
      const cached = cache.get(cacheKey);
      if (cached) {
        logger.log('Usando dados do cache para assinatura');
        return cached;
      }

      try {
        logger.log('Buscando dados da assinatura no servidor');
        
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('expires_at', { ascending: false })
          .maybeSingle();

        if (error) {
          logger.error('Erro ao buscar assinatura:', error);
          throw error;
        }

        // Cache os dados por 1 minuto
        cache.set(cacheKey, data, 60000);
        logger.log('Dados da assinatura carregados e cached');
        
        return data;

      } catch (error) {
        logger.error('Erro na busca da assinatura:', error);
        throw error;
      }
    })
  ).current;

  // Sincronização otimizada com debounce
  const debouncedSync = useRef(
    createUltraDebounce(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          logger.warn('Usuário não autenticado para sync de assinatura');
          dispatch({ type: 'SET_SUBSCRIPTION', payload: null });
          return;
        }

        dispatch({ type: 'SET_LOADING', payload: true });

        const subscriptionData = await fetchSubscriptionData(user.id);
        
        dispatch({ type: 'SET_SUBSCRIPTION', payload: subscriptionData });
        dispatch({ type: 'RESET_RETRY' });

        logger.log('Sincronização de assinatura concluída:', subscriptionData);

      } catch (error) {
        logger.error('Erro na sincronização:', error);
        
        dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Erro desconhecido' });
        dispatch({ type: 'INCREMENT_RETRY' });

        // Retry com backoff exponencial
        if (state.retryCount < maxRetries) {
          const delay = Math.pow(2, state.retryCount) * 1000;
          logger.log(`Reagendando sincronização em ${delay}ms`);
          
          syncTimeoutRef.current = setTimeout(() => {
            debouncedSync();
          }, delay);
        }
      }
    }, 1000) // 1 segundo de debounce
  ).current;

  // API pública do contexto
  const syncSubscriptionData = useCallback(async () => {
    logger.log('Sincronização manual solicitada');
    await debouncedSync();
  }, [debouncedSync]);

  const checkSubscriptionStatus = useCallback((): boolean => {
    if (!state.subscription) return false;
    
    const isActive = state.subscription.is_active && 
                    new Date(state.subscription.expires_at) > new Date();
    
    logger.log('Verificação de status:', { isActive, subscription: state.subscription });
    return isActive;
  }, [state.subscription]);

  const invalidateCache = useCallback(() => {
    logger.log('Invalidando cache de assinatura');
    cache.invalidate();
    dispatch({ type: 'UPDATE_CACHE', payload: { lastSync: 0, cacheValid: false } });
  }, [cache]);

  const getTimeUntilExpiration = useCallback((): number | null => {
    if (!state.subscription) return null;
    
    const expirationTime = new Date(state.subscription.expires_at).getTime();
    const currentTime = Date.now();
    
    return Math.max(0, expirationTime - currentTime);
  }, [state.subscription]);

  const isTrialPeriod = useCallback((): boolean => {
    if (!state.subscription) return false;
    
    const createdAt = new Date(state.subscription.created_at);
    const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    
    return daysSinceCreation <= 7; // Primeiro semana é considerado trial
  }, [state.subscription]);

  // Setup inicial e listeners de tempo real
  useEffect(() => {
    let mounted = true;

    const setupSubscriptionSystem = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user || !mounted) return;

        logger.log('Configurando sistema de assinatura para usuário:', user.id);

        // Sincronização inicial
        await debouncedSync();

        // Setup do canal realtime para atualizações
        channelRef.current = supabase
          .channel('subscription-optimized')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_subscriptions',
              filter: `user_id=eq.${user.id}`
            },
            (payload) => {
              logger.log('Atualização realtime de assinatura:', payload);
              
              // DELETE = plano removido → bloquear imediatamente
              if (payload.eventType === 'DELETE') {
                logger.log('Assinatura DELETADA - bloqueando acesso imediatamente');
                dispatch({ type: 'SET_SUBSCRIPTION', payload: null });
                dispatch({ type: 'SET_ACTIVE', payload: false });
                cache.invalidate();
                window.dispatchEvent(new CustomEvent('subscriptionCleared', { detail: { userId: user.id } }));
              } else {
                scheduleUltraTask(() => {
                  cache.invalidate(`subscription_${user.id}`);
                  debouncedSync();
                }, 'high');
              }
            }
          )
          .subscribe((status) => {
            logger.log('Status do canal de assinatura:', status);
          });

        // Sincronização periódica (a cada 5 minutos)
        const periodicSync = setInterval(() => {
          if (mounted) {
            scheduleUltraTask(() => {
              logger.log('Sincronização periódica automática');
              debouncedSync();
            }, 'low');
          }
        }, 300000); // 5 minutos

        // Cleanup
        return () => {
          mounted = false;
          clearInterval(periodicSync);
          if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
          }
        };

      } catch (error) {
        logger.error('Erro no setup do sistema de assinatura:', error);
      }
    };

    setupSubscriptionSystem();

    return () => {
      mounted = false;
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [debouncedSync, cache]);

  // Listener para mudanças de foco da página
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        logger.log('Página retornou ao foco, re-sincronizando assinatura');
        scheduleUltraTask(() => {
          debouncedSync();
        }, 'normal');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [debouncedSync]);

  const contextValue: SubscriptionContextType = {
    ...state,
    syncSubscriptionData,
    checkSubscriptionStatus,
    invalidateCache,
    getTimeUntilExpiration,
    isTrialPeriod
  };

  return (
    <SubscriptionOptimizedContext.Provider value={contextValue}>
      {children}
    </SubscriptionOptimizedContext.Provider>
  );
};

export const useSubscriptionOptimized = (): SubscriptionContextType => {
  const context = useContext(SubscriptionOptimizedContext);
  
  if (context === undefined) {
    throw new Error('useSubscriptionOptimized deve ser usado dentro de SubscriptionOptimizedProvider');
  }
  
  return context;
};