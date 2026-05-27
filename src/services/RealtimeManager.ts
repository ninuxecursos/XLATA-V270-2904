import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface ChannelConfig {
  table?: string;
  schema?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  callback?: (payload: any) => void;
}

interface ManagedChannel {
  channel: RealtimeChannel;
  name: string;
  createdAt: number;
  lastUsedAt: number;
  refCount: number;
}

/**
 * RealtimeManager - Gerenciador centralizado de canais Supabase Realtime
 * 
 * OTIMIZAÇÃO: Limita e gerencia conexões realtime para evitar:
 * - Múltiplos canais com mesmo propósito
 * - Vazamento de conexões não limpas
 * - Sobrecarga do navegador com websockets
 * 
 * Features:
 * - Limite máximo de conexões (default: 5)
 * - Reuso de canais existentes pelo nome
 * - Cleanup automático de canais antigos quando limite é atingido
 * - Contagem de referência para cleanup seguro
 */
class RealtimeManagerClass {
  private static instance: RealtimeManagerClass;
  private channels = new Map<string, ManagedChannel>();
  private readonly MAX_CHANNELS = 5;
  private readonly CHANNEL_TIMEOUT = 5 * 60 * 1000; // 5 minutos

  private constructor() {
    // Singleton
    console.log('[RealtimeManager] Inicializado com limite de', this.MAX_CHANNELS, 'canais');
  }

  static getInstance(): RealtimeManagerClass {
    if (!RealtimeManagerClass.instance) {
      RealtimeManagerClass.instance = new RealtimeManagerClass();
    }
    return RealtimeManagerClass.instance;
  }

  /**
   * Obtém ou cria um canal com o nome especificado
   */
  getChannel(name: string): RealtimeChannel {
    const existing = this.channels.get(name);
    
    if (existing) {
      existing.lastUsedAt = Date.now();
      existing.refCount++;
      console.log(`[RealtimeManager] Reutilizando canal: ${name} (refs: ${existing.refCount})`);
      return existing.channel;
    }

    // Limpar canais antigos se atingir limite
    if (this.channels.size >= this.MAX_CHANNELS) {
      this.cleanupOldestChannel();
    }

    const channel = supabase.channel(name);
    const managed: ManagedChannel = {
      channel,
      name,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      refCount: 1
    };

    this.channels.set(name, managed);
    console.log(`[RealtimeManager] Novo canal criado: ${name} (total: ${this.channels.size})`);
    
    return channel;
  }

  /**
   * Subscreve a mudanças em uma tabela do Postgres
   */
  subscribeToTable(
    channelName: string,
    tableName: string,
    callback: (payload: any) => void,
    options?: {
      schema?: string;
      event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
      filter?: string;
    }
  ): RealtimeChannel {
    const channel = this.getChannel(channelName);
    
    const config: any = {
      event: options?.event || '*',
      schema: options?.schema || 'public',
      table: tableName
    };

    if (options?.filter) {
      config.filter = options.filter;
    }

    channel
      .on('postgres_changes', config, callback)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[RealtimeManager] Canal ${channelName} subscrito à tabela ${tableName}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`[RealtimeManager] Erro no canal ${channelName}`);
        }
      });

    return channel;
  }

  /**
   * Libera referência a um canal
   * Canal só é removido quando refCount chega a 0
   */
  releaseChannel(name: string): void {
    const managed = this.channels.get(name);
    if (!managed) return;

    managed.refCount--;
    console.log(`[RealtimeManager] Liberando canal: ${name} (refs: ${managed.refCount})`);

    if (managed.refCount <= 0) {
      this.removeChannel(name);
    }
  }

  /**
   * Remove um canal imediatamente
   */
  removeChannel(name: string): void {
    const managed = this.channels.get(name);
    if (!managed) return;

    supabase.removeChannel(managed.channel);
    this.channels.delete(name);
    console.log(`[RealtimeManager] Canal removido: ${name} (total: ${this.channels.size})`);
  }

  /**
   * Remove o canal mais antigo que não está sendo usado
   */
  private cleanupOldestChannel(): void {
    let oldest: ManagedChannel | null = null;
    let oldestName: string | null = null;

    for (const [name, managed] of this.channels) {
      // Só remover canais sem referências
      if (managed.refCount <= 0) {
        if (!oldest || managed.lastUsedAt < oldest.lastUsedAt) {
          oldest = managed;
          oldestName = name;
        }
      }
    }

    // Se não encontrou canal sem referência, pegar o mais antigo mesmo assim
    if (!oldestName) {
      for (const [name, managed] of this.channels) {
        if (!oldest || managed.lastUsedAt < oldest.lastUsedAt) {
          oldest = managed;
          oldestName = name;
        }
      }
    }

    if (oldestName) {
      console.log(`[RealtimeManager] Limpando canal antigo: ${oldestName}`);
      this.removeChannel(oldestName);
    }
  }

  /**
   * Limpa canais inativos (não usados há mais de CHANNEL_TIMEOUT)
   */
  cleanupInactiveChannels(): void {
    const now = Date.now();
    const toRemove: string[] = [];

    for (const [name, managed] of this.channels) {
      if (managed.refCount <= 0 && (now - managed.lastUsedAt) > this.CHANNEL_TIMEOUT) {
        toRemove.push(name);
      }
    }

    for (const name of toRemove) {
      this.removeChannel(name);
    }

    if (toRemove.length > 0) {
      console.log(`[RealtimeManager] Limpeza automática: ${toRemove.length} canais removidos`);
    }
  }

  /**
   * Remove todos os canais (para logout ou cleanup geral)
   */
  removeAllChannels(): void {
    for (const [name] of this.channels) {
      this.removeChannel(name);
    }
    console.log('[RealtimeManager] Todos os canais removidos');
  }

  /**
   * Retorna estatísticas dos canais ativos
   */
  getStats(): { total: number; channels: string[] } {
    return {
      total: this.channels.size,
      channels: Array.from(this.channels.keys())
    };
  }
}

// Exportar singleton
export const RealtimeManager = RealtimeManagerClass.getInstance();
export default RealtimeManager;
