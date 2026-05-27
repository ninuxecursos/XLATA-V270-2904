import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createSafeLogger } from '@/utils/safeLogger';

const logger = createSafeLogger('[OnlineUsers]');

interface OnlineUser {
  user_id: string;
  last_seen_at: string;
  session_id: string;
  is_online: boolean;
}

export const useOnlineUsersFromDB = () => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);

  const fetchOnlineUsers = async () => {
    try {
      setLoading(true);
      
      // Chamar a função do banco que limpa usuários antigos e retorna os online
      const { data: onlineUsersData, error } = await supabase.rpc('get_online_users');
      
      if (error) {
        logger.error('Erro ao buscar usuários online:', error);
        return { onlineUsers: [], loading: false, count: 0 };
      }

      // Buscar dados completos dos usuários online
      if (onlineUsersData && onlineUsersData.length > 0) {
        const userIds = onlineUsersData.map((user: any) => user.user_id);
        
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, email, created_at, status')
          .in('id', userIds);

        if (profilesError) {
          logger.error('Erro ao buscar perfis:', profilesError);
          return { onlineUsers: [], loading: false, count: 0 };
        }

        // Combinar dados de presença com perfis
        const combinedUsers = onlineUsersData.map((presenceUser: any) => {
          const profile = profiles?.find(p => p.id === presenceUser.user_id);
          return {
            user_id: presenceUser.user_id,
            last_seen_at: presenceUser.last_seen_at,
            session_id: '', // Não precisamos expor session_id
            is_online: true,
            name: profile?.name || null,
            email: profile?.email || 'Email não encontrado',
            status: profile?.status || 'user',
            created_at: profile?.created_at
          };
        });

        setOnlineUsers(combinedUsers);
        setCount(combinedUsers.length);
        logger.debug(`Usuários online encontrados: ${combinedUsers.length}`);
      } else {
        setOnlineUsers([]);
        setCount(0);
      }
    } catch (error) {
      logger.error('Erro ao buscar usuários online:', error);
      setOnlineUsers([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    fetchOnlineUsers();
  };

  useEffect(() => {
    fetchOnlineUsers();
  }, []);

  return { 
    onlineUsers, 
    loading, 
    refresh,
    count 
  };
};
