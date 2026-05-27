// FASE 2: SISTEMA DE PRESENÇA OTIMIZADO
// Hook ultra-otimizado para presença com cache inteligente e cleanup automático

import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createUltraThrottle, createUltraMemoize, scheduleUltraTask } from '@/utils/ultraPerformanceUtils';
import { createLogger } from '@/utils/performanceUtils';

const logger = createLogger('[PresenceOptimized]');

interface PresenceState {
  onlineUsers: Set<string>;
  lastUpdate: number;
  isConnected: boolean;
}

// Cache otimizado com TTL
const createPresenceCache = () => {
  const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  return {
    get: (key: string) => {
      const entry = cache.get(key);
      if (!entry || Date.now() - entry.timestamp > entry.ttl) {
        cache.delete(key);
        return null;
      }
      return entry.data;
    },
    set: (key: string, data: any, ttl: number = 60000) => {
      cache.set(key, { data, timestamp: Date.now(), ttl });
    },
    clear: () => cache.clear(),
    size: () => cache.size
  };
};

const presenceCache = createPresenceCache();

export const useUserPresenceOptimized = () => {
  const [presenceState, setPresenceState] = useState<PresenceState>({
    onlineUsers: new Set(),
    lastUpdate: 0,
    isConnected: false
  });

  const sessionIdRef = useRef<string>();
  const intervalRef = useRef<NodeJS.Timeout>();
  const channelRef = useRef<any>();
  const lastActivityRef = useRef<number>(Date.now());
  const retryCountRef = useRef<number>(0);
  const maxRetries = 3;

  // Throttled presence update (máximo 1 vez por minuto)
  const throttledUpdatePresence = useRef(
    createUltraThrottle(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          logger.warn('Usuário não autenticado para atualização de presença');
          return;
        }

        if (!sessionIdRef.current) {
          sessionIdRef.current = `${user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }

        // Verificar se usuário está ativo (últimos 5 minutos)
        const isActive = Date.now() - lastActivityRef.current < 300000;

        const { error } = await supabase
          .from('user_presence')
          .upsert({
            user_id: user.id,
            session_id: sessionIdRef.current,
            last_seen_at: new Date().toISOString(),
            is_online: isActive
          }, {
            onConflict: 'user_id,session_id'
          });

        if (error) {
          logger.error('Erro ao atualizar presença:', error);
          retryCountRef.current++;
          
          if (retryCountRef.current <= maxRetries) {
            // Retry exponencial backoff
            setTimeout(() => throttledUpdatePresence(), Math.pow(2, retryCountRef.current) * 1000);
          }
        } else {
          retryCountRef.current = 0;
          logger.log('Presença atualizada com sucesso');
        }

      } catch (error) {
        logger.error('Erro na atualização de presença:', error);
      }
    }, 60000, { leading: true, trailing: true }) // 1 minuto throttle
  ).current;

  // Memoized function para buscar usuários online
  const fetchOnlineUsers = useRef(
    createUltraMemoize(async () => {
      const cached = presenceCache.get('online_users');
      if (cached) {
        logger.log('Usando cache para usuários online');
        return cached;
      }

      try {
        const { data, error } = await supabase.rpc('get_online_users');
        
        if (error) {
          logger.error('Erro ao buscar usuários online:', error);
          return { users: [], success: false };
        }

        const result = { users: data || [], success: true };
        presenceCache.set('online_users', result, 30000); // Cache por 30 segundos
        return result;

      } catch (error) {
        logger.error('Erro na busca de usuários online:', error);
        return { users: [], success: false };
      }
    })
  ).current;

  // Activity tracker otimizado
  const trackActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Setup do sistema de presença
  const setupPresenceSystem = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        logger.warn('Usuário não autenticado');
        return;
      }

      // Atualização inicial imediata
      await throttledUpdatePresence();

      // Configurar intervalo otimizado (60 segundos)
      intervalRef.current = setInterval(() => {
        scheduleUltraTask(() => {
          throttledUpdatePresence();
        }, 'low'); // Baixa prioridade para não bloquear UI
      }, 60000);

      // Setup realtime channel com reconnect automático
      channelRef.current = supabase
        .channel('presence-optimized', {
          config: {
            presence: {
              key: sessionIdRef.current,
            },
          },
        })
        .on('presence', { event: 'sync' }, async () => {
          logger.log('Presença sincronizada');
          
          // Atualizar lista de usuários online
          scheduleUltraTask(async () => {
            const result = await fetchOnlineUsers();
            if (result.success) {
              setPresenceState(prev => ({
                ...prev,
                onlineUsers: new Set(result.users.map((u: any) => u.user_id)),
                lastUpdate: Date.now()
              }));
            }
          }, 'normal');
        })
        .on('presence', { event: 'join' }, (payload) => {
          logger.log('Usuário entrou:', payload.key);
          
          setPresenceState(prev => {
            const newOnlineUsers = new Set(prev.onlineUsers);
            if (payload.newPresences) {
              payload.newPresences.forEach((presence: any) => {
                newOnlineUsers.add(presence.user_id);
              });
            }
            return {
              ...prev,
              onlineUsers: newOnlineUsers,
              lastUpdate: Date.now()
            };
          });
        })
        .on('presence', { event: 'leave' }, (payload) => {
          logger.log('Usuário saiu:', payload.key);
          
          setPresenceState(prev => {
            const newOnlineUsers = new Set(prev.onlineUsers);
            if (payload.leftPresences) {
              payload.leftPresences.forEach((presence: any) => {
                newOnlineUsers.delete(presence.user_id);
              });
            }
            return {
              ...prev,
              onlineUsers: newOnlineUsers,
              lastUpdate: Date.now()
            };
          });
        })
        .subscribe(async (status) => {
          logger.log('Status do canal:', status);
          setPresenceState(prev => ({ ...prev, isConnected: status === 'SUBSCRIBED' }));
          
          if (status === 'SUBSCRIBED') {
            // Fazer track inicial da presença
            await channelRef.current?.track({
              user_id: user.id,
              online_at: new Date().toISOString(),
            });
            
            logger.log('Presença inicial registrada');
          }
        });

      logger.log('Sistema de presença configurado');

    } catch (error) {
      logger.error('Erro ao configurar sistema de presença:', error);
    }
  }, [throttledUpdatePresence, fetchOnlineUsers]);

  // Cleanup otimizado
  const cleanup = useCallback(async () => {
    try {
      logger.log('Iniciando cleanup de presença');

      // Parar rastreamento de atividade
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }

      // Marcar como offline
      const { data: { user } } = await supabase.auth.getUser();
      if (user && sessionIdRef.current) {
        await supabase
          .from('user_presence')
          .update({ is_online: false, last_seen_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('session_id', sessionIdRef.current);
      }

      // Cleanup do canal
      if (channelRef.current) {
        await channelRef.current.unsubscribe();
        channelRef.current = null;
      }

      // Limpar cache
      presenceCache.clear();

      logger.log('Cleanup de presença concluído');

    } catch (error) {
      logger.error('Erro no cleanup de presença:', error);
    }
  }, []);

  // Setup inicial e listeners
  useEffect(() => {
    setupPresenceSystem();

    // Event listeners para rastrear atividade
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    const throttledTrackActivity = createUltraThrottle(trackActivity, 30000); // 30 segundos

    events.forEach(event => {
      document.addEventListener(event, throttledTrackActivity, { passive: true });
    });

    // Cleanup ao sair da página - usa o cliente Supabase para evitar expor API key
    const handleBeforeUnload = async () => {
      try {
        const userId = sessionIdRef.current?.split('-')[0];
        if (userId) {
          // Usar o cliente Supabase ao invés de sendBeacon com URL exposta
          await supabase
            .from('user_presence')
            .update({ is_online: false, last_seen_at: new Date().toISOString() })
            .eq('user_id', userId);
        }
      } catch (error) {
        // Silenciar erros no beforeunload
        logger.error('Erro ao atualizar presença:', error);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        cleanup();
      } else {
        setupPresenceSystem();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cleanup();
      events.forEach(event => {
        document.removeEventListener(event, throttledTrackActivity);
      });
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [setupPresenceSystem, cleanup, trackActivity]);

  return {
    ...presenceState,
    trackActivity,
    forceUpdate: throttledUpdatePresence,
    cacheSize: presenceCache.size(),
    sessionId: sessionIdRef.current
  };
};