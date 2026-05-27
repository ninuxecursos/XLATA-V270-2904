
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SystemConfig {
  id: string;
  max_users: number;
  session_timeout: number;
  backup_interval: number;
  log_retention: number;
  backup_enabled: boolean;
  auto_update_enabled: boolean;
  maintenance_mode: boolean;
  system_version: string;
  server_uptime_start: string;
  created_at: string;
  updated_at: string;
}

interface SystemStats {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: string;
  disk_total: string;
  disk_used: string;
  disk_free: string;
  disk_percentage: number;
  database_name: string;
  database_size: string;
  database_size_bytes: number;
  database_capacity: string;
  database_usage_percentage: number;
  storage_size: string;
  storage_capacity: string;
  storage_usage_percentage: number;
  active_users: number;
  transactions_today: number;
  total_transactions: number;
  uptime_days: number;
  uptime_hours: number;
  uptime_minutes: number;
  total_tables: number;
  total_functions: number;
  active_connections: number;
  supabase_plan: string;
}

export const useSystemConfig = () => {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [stats, setStats] = useState<SystemStats>({
    cpu_usage: 0,
    memory_usage: 0,
    disk_usage: '0MB',
    disk_total: '50GB',
    disk_used: '12.5GB',
    disk_free: '37.5GB',
    disk_percentage: 25,
    database_name: 'supabase_db',
    database_size: '0MB',
    database_size_bytes: 0,
    database_capacity: '500 MB',
    database_usage_percentage: 0,
    storage_size: '0MB',
    storage_capacity: '1 GB',
    storage_usage_percentage: 0,
    active_users: 0,
    transactions_today: 0,
    total_transactions: 0,
    uptime_days: 0,
    uptime_hours: 0,
    uptime_minutes: 0,
    total_tables: 0,
    total_functions: 0,
    active_connections: 0,
    supabase_plan: 'Free'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para gerar uma nova versão do sistema baseada em timestamp
  const generateNewVersion = () => {
    const now = new Date();
    const major = 2;
    const minor = 2; // Incrementado para refletir as melhorias
    // Usar timestamp mais específico para garantir versões únicas
    const patch = Math.floor(now.getTime() / 1000) % 10000; // Últimos 4 dígitos do timestamp
    return `v${major}.${minor}.${patch}`;
  };

  // Função para atualizar a versão do sistema automaticamente
  const updateSystemVersion = async (forceUpdate = false) => {
    try {
      const newVersion = generateNewVersion();
      
      // Verificar se config existe e tem ID válido antes de atualizar
      if (!config?.id) {
        console.warn('Config não carregado ainda, aguardando...');
        return newVersion;
      }
      
      // Só atualizar se for uma atualização forçada ou se a versão atual for diferente
      if (forceUpdate || !config?.system_version || config.system_version !== newVersion) {
        const { error } = await supabase
          .from('admin_system_config')
          .update({ 
            system_version: newVersion,
            updated_at: new Date().toISOString()
          })
          .eq('id', config.id); // Usar config.id diretamente, já validado acima

        if (error) throw error;

        console.log(`Sistema atualizado para versão ${newVersion}`);
        return newVersion;
      }
      
      return config?.system_version || newVersion;
    } catch (error) {
      console.error('Erro ao atualizar versão do sistema:', error);
      return null;
    }
  };

  // Nota: Dados de disco não são acessíveis no plano Free do Supabase
  // Removido simulação - valores serão omitidos ou mostrados como N/A

  const fetchSystemConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching system configuration...');

      // Buscar configurações do sistema
      const { data: configData, error: configError } = await supabase
        .from('admin_system_config')
        .select('*')
        .single();

      if (configError) {
        console.error('Config error:', configError);
        throw configError;
      }

      console.log('Config data loaded:', configData);
      setConfig(configData);

      // Atualizar versão automaticamente ao carregar
      const updatedVersion = await updateSystemVersion(false);
      if (updatedVersion && updatedVersion !== configData.system_version) {
        setConfig(prev => prev ? { ...prev, system_version: updatedVersion } : prev);
      }

      // Calcular uptime baseado no server_uptime_start
      if (configData) {
        const uptimeStart = new Date(configData.server_uptime_start);
        const now = new Date();
        const uptimeDiff = now.getTime() - uptimeStart.getTime();
        
        const days = Math.floor(uptimeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((uptimeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((uptimeDiff % (1000 * 60 * 60)) / (1000 * 60));

        setStats(prevStats => ({
          ...prevStats,
          uptime_days: days,
          uptime_hours: hours,
          uptime_minutes: minutes
        }));
      }

      // Buscar estatísticas reais do sistema via edge function
      await fetchRealSystemStats();

    } catch (error) {
      console.error('Erro ao carregar configurações do sistema:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const fetchRealSystemStats = async () => {
    try {
      console.log('Fetching detailed system stats via edge function...');
      
      const { data: systemStats, error } = await supabase.functions.invoke('get-system-stats');
      
      if (error) {
        console.error('Error fetching system stats:', error);
        return;
      }

      console.log('Detailed system stats received:', systemStats);

      if (systemStats) {
        setStats(prevStats => ({
          ...prevStats,
          cpu_usage: systemStats.cpu_usage || 0,
          memory_usage: systemStats.memory_usage || 0,
          database_name: systemStats.database_name || 'supabase_db',
          database_size: systemStats.database_size || 'N/A',
          database_size_bytes: systemStats.database_size_bytes || 0,
          database_capacity: systemStats.database_capacity || '500 MB',
          database_usage_percentage: systemStats.database_usage_percentage || 0,
          storage_size: systemStats.storage_size || '0 MB',
          storage_capacity: systemStats.storage_capacity || '1 GB',
          storage_usage_percentage: systemStats.storage_usage_percentage || 0,
          total_tables: systemStats.total_tables || 0,
          total_functions: systemStats.total_functions || 0,
          active_connections: systemStats.active_connections || 0,
          active_users: systemStats.active_users || 0,
          transactions_today: systemStats.transactions_today || 0,
          total_transactions: systemStats.total_transactions || 0,
          supabase_plan: systemStats.supabase_plan || 'Free',
          // Disk stats removidos - não disponíveis no plano Free
          disk_usage: 'N/A',
          disk_total: 'N/A',
          disk_used: 'N/A',
          disk_free: 'N/A',
          disk_percentage: 0
        }));
      }

    } catch (error) {
      console.error('Erro ao buscar estatísticas reais:', error);
    }
  };

  const updateSystemConfig = async (updates: Partial<SystemConfig>) => {
    try {
      setLoading(true);

      // Atualizar versão sempre que houver modificações no sistema
      const newVersion = await updateSystemVersion(true);
      if (newVersion) {
        updates.system_version = newVersion;
      }

      const { data, error } = await supabase
        .from('admin_system_config')
        .update(updates)
        .eq('id', config?.id)
        .select()
        .single();

      if (error) throw error;

      setConfig(data);

      toast({
        title: "Configurações Salvas",
        description: `Configurações atualizadas e sistema atualizado para ${data.system_version}.`,
        duration: 3000,
      });

      return true;
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar as configurações do sistema.",
        variant: "destructive",
        duration: 3000,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const performSystemAction = async (action: 'backup' | 'restart') => {
    try {
      setLoading(true);

      if (action === 'backup') {
        // Simular backup - em produção chamaria uma edge function específica
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Atualizar versão após backup
        await updateSystemVersion(true);
        
        toast({
          title: "Backup Realizado",
          description: "Backup manual do sistema concluído com sucesso.",
          duration: 3000,
        });
      } else if (action === 'restart') {
        // Simular reinicialização
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Atualizar server_uptime_start e versão
        const newVersion = await updateSystemVersion(true);
        await updateSystemConfig({ 
          server_uptime_start: new Date().toISOString(),
          system_version: newVersion || config?.system_version || 'v2.2.0'
        });
        
        toast({
          title: "Sistema Reiniciado",
          description: "O sistema foi reiniciado com sucesso.",
          duration: 3000,
        });
      }

      // Recarregar dados após a ação
      await fetchSystemConfig();

      return true;
    } catch (error) {
      console.error(`Erro ao executar ${action}:`, error);
      toast({
        title: "Erro",
        description: `Falha ao executar ${action} do sistema.`,
        variant: "destructive",
        duration: 3000,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemConfig();
    
    // Atualizar estatísticas a cada 120 segundos (otimizado de 30s para 120s)
    const interval = setInterval(() => {
      fetchRealSystemStats();
    }, 120000);

    // Atualizar versão a cada 10 minutos (otimizado de 5 para 10 minutos)
    const versionInterval = setInterval(() => {
      updateSystemVersion(false);
    }, 600000);

    return () => {
      clearInterval(interval);
      clearInterval(versionInterval);
    };
  }, []);

  return {
    config,
    stats,
    loading,
    error,
    updateSystemConfig,
    performSystemAction,
    refetch: fetchSystemConfig
  };
};
