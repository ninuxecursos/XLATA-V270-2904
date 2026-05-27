
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useUserPresence = () => {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    let presenceInterval: NodeJS.Timeout;
    let sessionId: string;

    const updatePresence = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          if (!sessionId) {
            sessionId = `${user.id}-${Date.now()}`;
          }

          // Atualizar ou inserir presença do usuário
          const { error } = await supabase
            .from('user_presence')
            .upsert({
              user_id: user.id,
              session_id: sessionId,
              last_seen_at: new Date().toISOString(),
              is_online: true
            }, {
              onConflict: 'user_id,session_id'
            });

          if (error) {
            console.error('Erro ao atualizar presença:', error);
          }
        }
      } catch (error) {
        console.error('Erro ao gerenciar presença:', error);
      }
    };

    const startPresenceTracking = () => {
      // Atualizar presença imediatamente
      updatePresence();
      
      // Atualizar presença a cada 60 segundos (otimizado de 30s para 60s)
      presenceInterval = setInterval(updatePresence, 60000);
    };

    const stopPresenceTracking = async () => {
      if (presenceInterval) {
        clearInterval(presenceInterval);
      }

      // Marcar como offline ao sair
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && sessionId) {
          await supabase
            .from('user_presence')
            .update({ is_online: false })
            .eq('user_id', user.id)
            .eq('session_id', sessionId);
        }
      } catch (error) {
        console.error('Erro ao marcar como offline:', error);
      }
    };

    // Iniciar rastreamento
    startPresenceTracking();

    // Eventos para detectar quando o usuário sai
    const handleBeforeUnload = () => {
      stopPresenceTracking();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPresenceTracking();
      } else {
        startPresenceTracking();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPresenceTracking();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (presenceInterval) {
        clearInterval(presenceInterval);
      }
    };
  }, []);

  return { onlineUsers };
};
