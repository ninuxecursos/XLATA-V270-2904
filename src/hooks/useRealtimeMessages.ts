import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface RealtimeMessage {
  id: string;
  sender_name: string;
  title: string;
  message: string;
  created_at: string;
}

const PROCESSED_REALTIME_KEY = 'realtime_messages_processed';

const getProcessedFromStorage = (): Set<string> => {
  try {
    const stored = localStorage.getItem(PROCESSED_REALTIME_KEY);
    if (stored) {
      return new Set(JSON.parse(stored));
    }
  } catch (e) {
    console.error('Erro ao carregar mensagens processadas:', e);
  }
  return new Set();
};

const saveProcessedToStorage = (processed: Set<string>) => {
  try {
    const arr = Array.from(processed).slice(-100);
    localStorage.setItem(PROCESSED_REALTIME_KEY, JSON.stringify(arr));
  } catch (e) {
    console.error('Erro ao salvar mensagens processadas:', e);
  }
};

export const useRealtimeMessages = () => {
  const [unreadMessages, setUnreadMessages] = useState<RealtimeMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<RealtimeMessage | null>(null);
  
  const processedMessagesRef = useRef<Set<string>>(getProcessedFromStorage());
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    fetchUnreadMessages();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('admin_realtime_messages_listener')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_realtime_messages'
        },
        (payload) => {
          console.log('Nova mensagem recebida:', payload);
          const newMessage = payload.new as any;
          
          if (processedMessagesRef.current.has(newMessage.id)) {
            console.log('Mensagem já processada, ignorando:', newMessage.id);
            return;
          }
          
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user && newMessage.target_user_id === user.id) {
              const message: RealtimeMessage = {
                id: newMessage.id,
                sender_name: newMessage.sender_name,
                title: newMessage.title,
                message: newMessage.message,
                created_at: newMessage.created_at
              };
              
              processedMessagesRef.current.add(newMessage.id);
              saveProcessedToStorage(processedMessagesRef.current);
              
              setUnreadMessages(prev => [message, ...prev]);
              setCurrentMessage(prev => prev || message);
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUnreadMessages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('admin_realtime_messages')
        .select('id, sender_name, title, message, created_at')
        .eq('target_user_id', user.id)
        .eq('is_read', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar mensagens:', error);
        return;
      }

      if (data && data.length > 0) {
        // Filtrar mensagens já processadas
        const unprocessedMessages = data.filter(msg => !processedMessagesRef.current.has(msg.id));
        
        if (unprocessedMessages.length > 0) {
          const messages = unprocessedMessages.map(msg => ({
            id: msg.id,
            sender_name: msg.sender_name,
            title: msg.title,
            message: msg.message,
            created_at: msg.created_at
          }));
          
          setUnreadMessages(messages);
          setCurrentMessage(messages[0]);
        } else {
          setUnreadMessages([]);
          setCurrentMessage(null);
        }
      } else {
        setUnreadMessages([]);
        setCurrentMessage(null);
      }
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    }
  };

  const markAsRead = useCallback(async (messageId: string) => {
    try {
      processedMessagesRef.current.add(messageId);
      saveProcessedToStorage(processedMessagesRef.current);
      
      const { error } = await supabase
        .from('admin_realtime_messages')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) {
        console.error('Erro ao marcar mensagem como lida:', error);
        throw error;
      }

      setUnreadMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== messageId);
        
        setCurrentMessage(current => {
          if (current?.id === messageId) {
            return filtered.length > 0 ? filtered[0] : null;
          }
          return current;
        });
        
        return filtered;
      });
      
    } catch (error) {
      console.error('Erro ao marcar mensagem como lida:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar mensagem. Tente novamente.",
        variant: "destructive",
        duration: 3000,
      });
    }
  }, []);

  const dismissCurrentMessage = useCallback(() => {
    setCurrentMessage(current => {
      if (current) {
        markAsRead(current.id);
      }
      return null;
    });
  }, [markAsRead]);

  return {
    unreadMessages,
    currentMessage,
    dismissCurrentMessage,
    fetchUnreadMessages
  };
};
