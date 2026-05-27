import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';


interface DirectMessage {
  id: string;
  title: string;
  message: string;
  sender_name: string;
  created_at: string;
}

const PROCESSED_MESSAGES_KEY = 'direct_messages_processed';

const getProcessedFromStorage = (): Set<string> => {
  try {
    const stored = localStorage.getItem(PROCESSED_MESSAGES_KEY);
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
    localStorage.setItem(PROCESSED_MESSAGES_KEY, JSON.stringify(arr));
  } catch (e) {
    console.error('Erro ao salvar mensagens processadas:', e);
  }
};

export const useDirectMessages = () => {
  const [currentMessage, setCurrentMessage] = useState<DirectMessage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isProcessingRef = useRef(false);
  const processedMessagesRef = useRef<Set<string>>(getProcessedFromStorage());
  const hasCheckedRef = useRef(false);

  const checkForDirectMessages = useCallback(async () => {
    if (isProcessingRef.current || isModalOpen) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: messages, error } = await supabase
        .from('user_direct_messages')
        .select('*')
        .eq('recipient_id', user.id)
        .is('read_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: true })
        .limit(1);

      if (error) {
        console.error('Erro ao verificar mensagens diretas:', error);
        return;
      }

      if (messages && messages.length > 0) {
        const message = messages[0];
        
        if (processedMessagesRef.current.has(message.id)) {
          return;
        }
        
        setCurrentMessage({
          id: message.id,
          title: message.title,
          message: message.message,
          sender_name: message.sender_name,
          created_at: message.created_at
        });
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error('Erro ao buscar mensagens diretas:', error);
    }
  }, [isModalOpen]);

  const markMessageAsRead = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('user_direct_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId);

      if (error) {
        console.error('Erro ao marcar mensagem como lida:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao marcar mensagem como lida:', error);
      return false;
    }
  }, []);

  const handleCloseMessage = useCallback(async () => {
    if (isProcessingRef.current || !currentMessage) return;
    isProcessingRef.current = true;
    
    const messageId = currentMessage.id;
    
    try {
      processedMessagesRef.current.add(messageId);
      saveProcessedToStorage(processedMessagesRef.current);
      
      setIsModalOpen(false);
      setCurrentMessage(null);
      
      await markMessageAsRead(messageId);
    } finally {
      isProcessingRef.current = false;
    }
  }, [currentMessage, markMessageAsRead]);

  useEffect(() => {
    if (!hasCheckedRef.current) {
      hasCheckedRef.current = true;
      checkForDirectMessages();
    }

    const interval = setInterval(() => {
      if (!isProcessingRef.current && !isModalOpen) {
        checkForDirectMessages();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [checkForDirectMessages, isModalOpen]);

  return {
    currentMessage,
    isModalOpen,
    handleCloseMessage
  };
};
