
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  Server, 
  Database, 
  Shield, 
  Settings, 
  RefreshCw, 
  Save,
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive,
  Network,
  Users,
  BarChart3,
  Info
} from 'lucide-react';
import { useSystemConfig } from '@/hooks/useSystemConfig';

export const SystemManagement = () => {
  const { 
    config, 
    stats, 
    loading, 
    error, 
    updateSystemConfig, 
    performSystemAction 
  } = useSystemConfig();

  const [isLoading, setIsLoading] = useState(false);
  const [localConfig, setLocalConfig] = useState({
    max_users: '',
    session_timeout: '',
    backup_interval: '',
    log_retention: '',
    backup_enabled: true,
    auto_update_enabled: false,
    maintenance_mode: false
  });

  // Sincronizar estado local com dados do Supabase
  useEffect(() => {
    if (config) {
      setLocalConfig({
        max_users: config.max_users.toString(),
        session_timeout: config.session_timeout.toString(),
        backup_interval: config.backup_interval.toString(),
        log_retention: config.log_retention.toString(),
        backup_enabled: config.backup_enabled,
        auto_update_enabled: config.auto_update_enabled,
        maintenance_mode: config.maintenance_mode
      });
    }
  }, [config]);

  // Função para converter bytes em formato legível
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 MB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Função para obter cor baseada na porcentagem de uso
  const getUsageColor = (percentage: number) => {
    if (percentage > 80) return 'text-red-400';
    if (percentage > 60) return 'text-yellow-400';
    return 'text-green-400';
  };

  // Dados de disco não disponíveis no plano Free
  // Exibir como N/A ou omitir

  const handleSaveConfig = async () => {
    setIsLoading(true);
    
    const success = await updateSystemConfig({
      max_users: parseInt(localConfig.max_users),
      session_timeout: parseInt(localConfig.session_timeout),
      backup_interval: parseInt(localConfig.backup_interval),
      log_retention: parseInt(localConfig.log_retention),
      backup_enabled: localConfig.backup_enabled,
      auto_update_enabled: localConfig.auto_update_enabled,
      maintenance_mode: localConfig.maintenance_mode
    });

    setIsLoading(false);
  };

  const handleSystemRestart = async () => {
    setIsLoading(true);
    await performSystemAction('restart');
    setIsLoading(false);
  };

  const handleBackupNow = async () => {
    setIsLoading(true);
    await performSystemAction('backup');
    setIsLoading(false);
  };

  if (loading && !config) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Carregando configurações do sistema...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-white text-lg mb-4">Erro ao carregar configurações: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status do Sistema */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Server className="h-5 w-5 text-green-400" />
            Status do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-muted-foreground text-sm">Servidor</span>
              </div>
              <Badge className="bg-green-600 hover:bg-green-700">Online</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-green-400" />
                <span className="text-muted-foreground text-sm">Banco de Dados</span>
              </div>
              <Badge className="bg-green-600 hover:bg-green-700">Conectado</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-400" />
                <span className="text-muted-foreground text-sm">Backup</span>
              </div>
              <Badge className={localConfig.backup_enabled ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}>
                {localConfig.backup_enabled ? 'Ativado' : 'Desativado'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-blue-400" />
                <span className="text-muted-foreground text-sm">API</span>
              </div>
              <Badge className="bg-blue-600 hover:bg-blue-700">Funcional</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações do Banco de Dados Supabase */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-400" />
            Banco de Dados Supabase ({stats.supabase_plan})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informações do Banco */}
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nome do Banco:</span>
                <span className="text-foreground font-semibold">{stats.database_name}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Uso do Banco:</span>
                  <div className="text-right">
                    <div className="text-sm text-foreground font-semibold">
                      {stats.database_size} / {stats.database_capacity}
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <Progress 
                    value={stats.database_usage_percentage} 
                    className="h-2 bg-muted" 
                  />
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">0%</span>
                    <span className={`font-medium ${getUsageColor(stats.database_usage_percentage)}`}>
                      {stats.database_usage_percentage}% usado
                    </span>
                    <span className="text-muted-foreground">100%</span>
                  </div>
                </div>
                {stats.database_usage_percentage > 80 && (
                  <div className="flex items-center gap-1 text-red-400 text-xs">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Próximo ao limite! Considere fazer limpeza ou upgrade.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Storage de Arquivos */}
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plano Supabase:</span>
                <Badge className="bg-blue-600 hover:bg-blue-700">{stats.supabase_plan}</Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Storage de Arquivos:</span>
                  <div className="text-right">
                    <div className="text-sm text-foreground font-semibold">
                      {stats.storage_size} / {stats.storage_capacity}
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <Progress 
                    value={stats.storage_usage_percentage} 
                    className="h-2 bg-muted" 
                  />
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">0%</span>
                    <span className={`font-medium ${getUsageColor(stats.storage_usage_percentage)}`}>
                      {stats.storage_usage_percentage}% usado
                    </span>
                    <span className="text-muted-foreground">100%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações do Sistema */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-400" />
            Informações do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Versão do Sistema:</span>
                <span className="text-foreground font-semibold">{config?.system_version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Última Atualização:</span>
                <span className="text-blue-400">
                  {config?.updated_at ? new Date(config.updated_at).toLocaleString('pt-BR') : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tempo Online:</span>
                <span className="text-green-400">
                  {stats.uptime_days} dias, {stats.uptime_hours}h {stats.uptime_minutes}m
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Conexões Ativas:</span>
                <span className="text-foreground font-semibold">{stats.active_connections}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Usuários Ativos:</span>
                <span className="text-foreground font-semibold">{stats.active_users}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transações Hoje:</span>
                <span className="text-foreground font-semibold">{stats.transactions_today}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total de Transações:</span>
                <span className="text-foreground font-semibold">{stats.total_transactions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total de Tabelas:</span>
                <span className="text-foreground font-semibold">{stats.total_tables}</span>
              </div>
            </div>

            <div className="space-y-2">
              {stats.cpu_usage !== undefined && stats.cpu_usage > 0 ? (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Uso de CPU:</span>
                  <span className={stats.cpu_usage < 50 ? "text-green-400" : "text-yellow-400"}>
                    {stats.cpu_usage}%
                  </span>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Uso de CPU:</span>
                  <span className="text-muted-foreground text-sm flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    N/A (Plano {stats.supabase_plan})
                  </span>
                </div>
              )}
              
              {stats.memory_usage !== undefined && stats.memory_usage > 0 ? (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Uso de Memória:</span>
                  <span className={stats.memory_usage < 70 ? "text-green-400" : "text-yellow-400"}>
                    {stats.memory_usage}%
                  </span>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Uso de Memória:</span>
                  <span className="text-muted-foreground text-sm flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    N/A (Plano {stats.supabase_plan})
                  </span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <HardDrive className="h-3 w-3" />
                  Espaço em Disco:
                </span>
                <span className="text-muted-foreground text-sm flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  N/A (Plano {stats.supabase_plan})
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações do Sistema */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            Configurações do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="maxUsers" className="text-muted-foreground">Máximo de Usuários</Label>
                <Input
                  id="maxUsers"
                  type="number"
                  value={localConfig.max_users}
                  onChange={(e) => setLocalConfig({...localConfig, max_users: e.target.value})}
                  className="bg-muted border-border text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionTimeout" className="text-muted-foreground">Timeout de Sessão (minutos)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={localConfig.session_timeout}
                  onChange={(e) => setLocalConfig({...localConfig, session_timeout: e.target.value})}
                  className="bg-muted border-border text-foreground"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="backupInterval" className="text-muted-foreground">Intervalo de Backup (horas)</Label>
                <Input
                  id="backupInterval"
                  type="number"
                  value={localConfig.backup_interval}
                  onChange={(e) => setLocalConfig({...localConfig, backup_interval: e.target.value})}
                  className="bg-muted border-border text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logRetention" className="text-muted-foreground">Retenção de Logs (dias)</Label>
                <Input
                  id="logRetention"
                  type="number"
                  value={localConfig.log_retention}
                  onChange={(e) => setLocalConfig({...localConfig, log_retention: e.target.value})}
                  className="bg-muted border-border text-foreground"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-border" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-gray-300">Backup Automático</Label>
                <p className="text-sm text-gray-500">Realizar backups automaticamente do sistema</p>
              </div>
              <Switch
                checked={localConfig.backup_enabled}
                onCheckedChange={(checked) => setLocalConfig({...localConfig, backup_enabled: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-gray-300">Atualizações Automáticas</Label>
                <p className="text-sm text-gray-500">Permitir atualizações automáticas do sistema</p>
              </div>
              <Switch
                checked={localConfig.auto_update_enabled}
                onCheckedChange={(checked) => setLocalConfig({...localConfig, auto_update_enabled: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-gray-300">Modo de Manutenção</Label>
                <p className="text-sm text-gray-500">Ativar modo de manutenção para usuários</p>
              </div>
              <Switch
                checked={localConfig.maintenance_mode}
                onCheckedChange={(checked) => setLocalConfig({...localConfig, maintenance_mode: checked})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações do Sistema */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            Ações do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={handleSaveConfig}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </Button>

            <Button
              onClick={handleBackupNow}
              disabled={isLoading}
              variant="outline"
              className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
            >
              <HardDrive className="h-4 w-4 mr-2" />
              Backup Manual
            </Button>

            <Button
              onClick={handleSystemRestart}
              disabled={isLoading}
              variant="outline"
              className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Reiniciar Sistema
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
