// FASE 4: SISTEMA REALTIME ULTRA-OTIMIZADO
// Hook com pool de conexões, reconnect automático e queue de mensagens

import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createUltraThrottle, createUltraBatchProcessor, scheduleUltraTask } from '@/utils/ultraPerformanceUtils';
import { createLogger } from '@/utils/performanceUtils';

const logger = createLogger('[RealtimeOptimized]');

interface Message {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  processed: boolean;
  retryCount: number;
}

interface ConnectionState {
  isConnected: boolean;
  lastHeartbeat: number;
  reconnectCount: number;
  error: string | null;
}

interface RealtimeConfig {
  channelName: string;
  tables: string[];
  heartbeatInterval?: number;
  maxReconnectAttempts?: number;
  messageQueueSize?: number;
  batchSize?: number;
}

// Pool global de conexões para reutilização
class ConnectionPool {
  private static instance: ConnectionPool;
  private connections = new Map<string, any>();
  private heartbeats = new Map<string, NodeJS.Timeout>();

  static getInstance(): ConnectionPool {
    if (!ConnectionPool.instance) {
      ConnectionPool.instance = new ConnectionPool();
    }
    return ConnectionPool.instance;
  }

  getConnection(key: string): any | null {
    return this.connections.get(key) || null;
  }

  setConnection(key: string, connection: any): void {
    // Limpar conexão anterior se existir
    this.removeConnection(key);
    this.connections.set(key, connection);
  }

  removeConnection(key: string): void {
    const connection = this.connections.get(key);
    if (connection) {
      try {
        supabase.removeChannel(connection);
      } catch (error) {
        logger.error('Erro ao remover conexão:', error);
      }
      this.connections.delete(key);
    }

    const heartbeat = this.heartbeats.get(key);
    if (heartbeat) {
      clearInterval(heartbeat);
      this.heartbeats.delete(key);
    }
  }

  startHeartbeat(key: string, callback: () => void, interval: number = 30000): void {
    this.stopHeartbeat(key);
    
    const heartbeatInterval = setInterval(() => {
      logger.log(`Heartbeat para conexão ${key}`);
      callback();
    }, interval);
    
    this.heartbeats.set(key, heartbeatInterval);
  }

  stopHeartbeat(key: string): void {
    const heartbeat = this.heartbeats.get(key);
    if (heartbeat) {
      clearInterval(heartbeat);
      this.heartbeats.delete(key);
    }
  }

  cleanup(): void {
    logger.log('Limpando pool de conexões');
    
    this.connections.forEach((connection, key) => {
      this.removeConnection(key);
    });
    
    this.connections.clear();
    this.heartbeats.clear();
  }
}

export const useRealtimeOptimized = (config: RealtimeConfig) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    lastHeartbeat: 0,
    reconnectCount: 0,
    error: null
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const messageQueueRef = useRef<Message[]>([]);
  const processedMessagesRef = useRef(new Set<string>());
  const connectionPool = ConnectionPool.getInstance();
  const batchProcessor = useRef(createUltraBatchProcessor(config.batchSize || 20));

  const {
    channelName,
    tables,
    heartbeatInterval = 30000,
    maxReconnectAttempts = 5,
    messageQueueSize = 1000
  } = config;

  // Deduplicação de mensagens
  const deduplicateMessage = useCallback((message: Message): boolean => {
    const messageId = `${message.type}_${message.id}_${message.timestamp}`;
    
    if (processedMessagesRef.current.has(messageId)) {
      logger.log('Mensagem duplicada ignorada:', messageId);
      return false;
    }
    
    processedMessagesRef.current.add(messageId);
    
    // Limitar tamanho do set de mensagens processadas
    if (processedMessagesRef.current.size > 5000) {
      const oldMessages = Array.from(processedMessagesRef.current).slice(0, 1000);
      oldMessages.forEach(id => processedMessagesRef.current.delete(id));
    }
    
    return true;
  }, []);

  // Processamento de mensagens em batch
  const processMessage = useCallback((payload: any) => {
    const message: Message = {
      id: payload.id || `msg_${Date.now()}_${Math.random()}`,
      type: payload.eventType || 'unknown',
      data: payload,
      timestamp: Date.now(),
      processed: false,
      retryCount: 0
    };

    // Verificar duplicação
    if (!deduplicateMessage(message)) {
      return;
    }

    // Adicionar à queue
    messageQueueRef.current.push(message);
    
    // Limitar tamanho da queue
    if (messageQueueRef.current.length > messageQueueSize) {
      messageQueueRef.current = messageQueueRef.current.slice(-messageQueueSize);
      logger.warn('Queue de mensagens truncada');
    }

    // Processar em batch
    batchProcessor.current.add(() => {
      try {
        logger.log('Processando mensagem:', message.type, message.id);
        
        setMessages(prev => {
          const newMessages = [...prev, { ...message, processed: true }];
          // Manter apenas as últimas 500 mensagens na UI
          return newMessages.slice(-500);
        });

        // Marcar como processada
        message.processed = true;
        
      } catch (error) {
        logger.error('Erro ao processar mensagem:', error);
        
        // Retry logic
        if (message.retryCount < 3) {
          message.retryCount++;
          scheduleUltraTask(() => {
            logger.log(`Tentativa ${message.retryCount} de processar mensagem:`, message.id);
            processMessage(payload);
          }, 'normal');
        }
      }
    });
  }, [deduplicateMessage, messageQueueSize, batchProcessor]);

  // Throttled heartbeat
  const throttledHeartbeat = useRef(
    createUltraThrottle(() => {
      setConnectionState(prev => ({
        ...prev,
        lastHeartbeat: Date.now()
      }));
      
      logger.log('Heartbeat enviado');
    }, 5000) // Máximo 1 heartbeat a cada 5 segundos
  ).current;

  // Reconexão com backoff exponencial
  const reconnect = useCallback(async () => {
    const connectionKey = `${channelName}_optimized`;
    
    setConnectionState(prev => {
      if (prev.reconnectCount >= maxReconnectAttempts) {
        logger.error('Máximo de tentativas de reconexão atingido');
        return { ...prev, error: 'Máximo de tentativas de reconexão atingido' };
      }
      
      return { ...prev, reconnectCount: prev.reconnectCount + 1 };
    });

    // Delay com backoff exponencial
    const delay = Math.min(Math.pow(2, connectionState.reconnectCount) * 1000, 30000);
    logger.log(`Tentando reconexão em ${delay}ms (tentativa ${connectionState.reconnectCount + 1})`);
    
    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      // Remover conexão anterior
      connectionPool.removeConnection(connectionKey);
      
      // Criar nova conexão
      await setupConnection();
      
      logger.log('Reconexão bem-sucedida');
      
    } catch (error) {
      logger.error('Falha na reconexão:', error);
      
      // Tentar novamente se não atingiu o limite
      if (connectionState.reconnectCount < maxReconnectAttempts) {
        scheduleUltraTask(() => {
          reconnect();
        }, 'high');
      }
    }
  }, [connectionState.reconnectCount, maxReconnectAttempts, channelName]);

  // Setup da conexão principal
  const setupConnection = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        logger.warn('Usuário não autenticado para conexão realtime');
        return;
      }

      const connectionKey = `${channelName}_optimized`;
      
      logger.log('Configurando conexão realtime:', connectionKey);

      // Criar novo canal
      const channel = supabase.channel(connectionKey, {
        config: {
          presence: {
            key: `user_${user.id}_${Date.now()}`,
          },
        },
      });

      // Configurar listeners para cada tabela
      tables.forEach(table => {
        channel.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
          },
          (payload) => {
            logger.log(`Mudança em ${table}:`, payload);
            processMessage({ ...payload, eventType: `${table}_change` });
          }
        );
      });

      // Subscribe e configurar callbacks
      channel.subscribe(async (status) => {
        logger.log(`Status da conexão ${connectionKey}:`, status);
        
        setConnectionState(prev => ({
          ...prev,
          isConnected: status === 'SUBSCRIBED',
          error: status === 'CLOSED' ? 'Conexão fechada' : null,
          reconnectCount: status === 'SUBSCRIBED' ? 0 : prev.reconnectCount
        }));

        if (status === 'SUBSCRIBED') {
          logger.log('Conexão realtime estabelecida');
          
          // Iniciar heartbeat
          connectionPool.startHeartbeat(connectionKey, throttledHeartbeat, heartbeatInterval);
          
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          logger.warn('Conexão perdida, iniciando reconexão');
          scheduleUltraTask(() => {
            reconnect();
          }, 'high');
        }
      });

      // Armazenar conexão no pool
      connectionPool.setConnection(connectionKey, channel);
      
      logger.log('Conexão configurada com sucesso');

    } catch (error) {
      logger.error('Erro ao configurar conexão:', error);
      setConnectionState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }));
    }
  }, [channelName, tables, processMessage, throttledHeartbeat, heartbeatInterval, reconnect]);

  // API pública
  const sendMessage = useCallback((message: any) => {
    const connectionKey = `${channelName}_optimized`;
    const connection = connectionPool.getConnection(connectionKey);
    
    if (!connection || !connectionState.isConnected) {
      logger.warn('Conexão não disponível para envio de mensagem');
      return false;
    }

    try {
      connection.send({
        type: 'broadcast',
        event: 'message',
        payload: message
      });
      
      logger.log('Mensagem enviada:', message);
      return true;
      
    } catch (error) {
      logger.error('Erro ao enviar mensagem:', error);
      return false;
    }
  }, [channelName, connectionState.isConnected]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    messageQueueRef.current = [];
    processedMessagesRef.current.clear();
    batchProcessor.current.clear();
    
    logger.log('Mensagens limpas');
  }, [batchProcessor]);

  const getQueueStatus = useCallback(() => ({
    queueSize: messageQueueRef.current.length,
    processedCount: processedMessagesRef.current.size,
    batchSize: batchProcessor.current.size(),
    messagesDisplayed: messages.length
  }), [messages.length, batchProcessor]);

  // Setup inicial
  useEffect(() => {
    let mounted = true;

    const initializeConnection = async () => {
      if (!mounted) return;
      
      logger.log('Inicializando sistema realtime otimizado');
      await setupConnection();
    };

    initializeConnection();

    return () => {
      mounted = false;
      const connectionKey = `${channelName}_optimized`;
      connectionPool.removeConnection(connectionKey);
      
      logger.log('Cleanup do sistema realtime concluído');
    };
  }, [setupConnection, channelName]);

  // Cleanup global quando componente desmonta
  useEffect(() => {
    return () => {
      // Cleanup final
      batchProcessor.current.clear();
      processedMessagesRef.current.clear();
    };
  }, [batchProcessor]);

  return {
    ...connectionState,
    messages,
    sendMessage,
    clearMessages,
    getQueueStatus,
    reconnect: () => scheduleUltraTask(reconnect, 'high'),
    isHealthy: connectionState.isConnected && 
               Date.now() - connectionState.lastHeartbeat < heartbeatInterval * 2
  };
};