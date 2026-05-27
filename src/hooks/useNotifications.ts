import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  sender_name: string;
  created_at: string;
  type?: 'global' | 'direct';
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingRef = useRef(false);

  const fetchNotifications = useCallback(async () => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setNotifications([]);
        setUnreadCount(0);
        setIsLoading(false);
        isFetchingRef.current = false;
        return;
      }

      // Buscar IDs das notificações globais já lidas
      const { data: readNotifications } = await supabase
        .from('global_notification_recipients')
        .select('notification_id')
        .eq('user_id', user.id);

      const readIds = readNotifications?.map(item => item.notification_id) || [];

      // Buscar notificações globais ativas
      const { data: globalNotificationsData, error: globalError } = await supabase
        .from('global_notifications')
        .select('id, title, message, sender_name, created_at')
        .eq('is_active', true)
        .gte('created_at', user.created_at)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (globalError) throw globalError;

      // Filtrar notificações globais não lidas
      const unreadGlobal = (globalNotificationsData || [])
        .filter(n => !readIds.includes(n.id))
        .map(n => ({ ...n, type: 'global' as const }));

      // Buscar mensagens diretas não lidas
      const { data: directMessages, error: directError } = await supabase
        .from('user_direct_messages')
        .select('id, title, message, sender_name, created_at')
        .eq('recipient_id', user.id)
        .is('read_at', null)
        .order('created_at', { ascending: false });

      if (directError) throw directError;

      const unreadDirect: NotificationData[] = (directMessages || [])
        .map(n => ({ ...n, type: 'direct' as const }));

      // Combinar e ordenar por data
      const allNotifications = [...unreadGlobal, ...unreadDirect]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(allNotifications);
      setUnreadCount(allNotifications.length);

    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  // Debounced fetch to prevent rapid refetching
  const debouncedFetch = useCallback(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    fetchTimeoutRef.current = setTimeout(() => {
      fetchNotifications();
    }, 500);
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: string, type: 'global' | 'direct' = 'global') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Immediately update local state for instant feedback
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));

      if (type === 'global') {
        const { error } = await supabase
          .from('global_notification_recipients')
          .insert({
            notification_id: notificationId,
            user_id: user.id
          });

        if (error && error.code !== '23505') {
          throw error;
        }
      } else {
        const { error } = await supabase
          .from('user_direct_messages')
          .update({ read_at: new Date().toISOString() })
          .eq('id', notificationId);

        if (error) throw error;
      }

    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      // Refetch on error to restore correct state
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || notifications.length === 0) return;

      const currentNotifications = [...notifications];
      
      // Immediately update local state for instant feedback
      setNotifications([]);
      setUnreadCount(0);

      const globalNotificationsToMark = currentNotifications.filter(n => n.type === 'global');
      const directNotificationsToMark = currentNotifications.filter(n => n.type === 'direct');

      // Marcar globais como lidas
      if (globalNotificationsToMark.length > 0) {
        const insertData = globalNotificationsToMark.map(notification => ({
          notification_id: notification.id,
          user_id: user.id
        }));

        await supabase
          .from('global_notification_recipients')
          .upsert(insertData, { 
            onConflict: 'notification_id,user_id',
            ignoreDuplicates: true 
          });
      }

      // Marcar diretas como lidas
      if (directNotificationsToMark.length > 0) {
        const directIds = directNotificationsToMark.map(n => n.id);
        await supabase
          .from('user_direct_messages')
          .update({ read_at: new Date().toISOString() })
          .in('id', directIds);
      }

    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      // Refetch on error to restore correct state
      fetchNotifications();
    }
  }, [notifications, fetchNotifications]);

  useEffect(() => {
    fetchNotifications();

    // Configurar listener em tempo real - only listen for new notifications
    const channel = supabase
      .channel('unified-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'global_notifications'
        },
        () => {
          debouncedFetch();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_direct_messages'
        },
        () => {
          debouncedFetch();
        }
      )
      .subscribe();

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications, debouncedFetch]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
};
