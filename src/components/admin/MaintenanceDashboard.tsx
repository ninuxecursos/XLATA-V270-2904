import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Settings, 
  Server, 
  Database,
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Power,
  HardDrive,
  Activity,
  Calendar,
  Bell,
  Trash2,
  Download,
  Upload,
  Wrench,
  XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuditLog } from '@/hooks/useAuditLog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface SystemConfig {
  id: string;
  maintenance_mode: boolean;
  backup_enabled: boolean;
  backup_interval: number;
  log_retention: number;
  session_timeout: number;
  max_users: number;
  auto_update_enabled: boolean;
  system_version: string;
  server_uptime_start: string;
}

interface MaintenanceNotice {
  id: string;
  title: string;
  message: string;
  is_active: boolean;
  created_at: string;
  created_by: string;
}

export const MaintenanceDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('status');
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [notices, setNotices] = useState<MaintenanceNotice[]>([]);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [showMaintenanceConfirm, setShowMaintenanceConfirm] = useState(false);
  const [newNotice, setNewNotice] = useState({ title: '', message: '' });
  const [dbStats, setDbStats] = useState<{ size: string; tables: number; functions: number }>({ 
    size: '0 MB', tables: 0, functions: 0 
  });
  
  const { logSystemChange, logSecurityAction } = useAuditLog();

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch system config
      const { data: configData } = await supabase
        .from('admin_system_config')
        .select('*')
        .limit(1)
        .maybeSingle();
      
      if (configData) {
        setConfig(configData as SystemConfig);
      }

      // Fetch maintenance notices
      const { data: noticesData } = await supabase
        .from('maintenance_notices')
        .select('*')
        .order('created_at', { ascending: false });
      
      setNotices(noticesData || []);

      // Fetch DB stats
      const { data: tableCount } = await supabase.rpc('get_table_count');
      const { data: funcCount } = await supabase.rpc('get_function_count');
      const { data: dbSize } = await supabase.rpc('get_database_statistics');

      const tableCountData = tableCount as { count?: number } | null;
      const funcCountData = funcCount as { count?: number } | null;
      const dbSizeData = dbSize as { database_size?: string } | null;

      setDbStats({
        size: dbSizeData?.database_size || '0 MB',
        tables: tableCountData?.count || 0,
        functions: funcCountData?.count || 0
      });

    } catch (error) {
      console.error('Error fetching maintenance data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleMaintenance = async () => {
    if (!config) return;
    
    const newValue = !config.maintenance_mode;
    
    try {
      const { error } = await supabase
        .from('admin_system_config')
        .update({ maintenance_mode: newValue })
        .eq('id', config.id);

      if (error) throw error;

      await logSystemChange('maintenance_mode', config.maintenance_mode, newValue);
      
      setConfig({ ...config, maintenance_mode: newValue });
      setShowMaintenanceConfirm(false);
      toast.success(newValue ? 'Modo manutenção ativado' : 'Modo manutenção desativado');
    } catch (error) {
      console.error('Error toggling maintenance:', error);
      toast.error('Erro ao alterar modo manutenção');
    }
  };

  const handleUpdateConfig = async (field: keyof SystemConfig, value: unknown) => {
    if (!config) return;

    try {
      const { error } = await supabase
        .from('admin_system_config')
        .update({ [field]: value })
        .eq('id', config.id);

      if (error) throw error;

      await logSystemChange(field, config[field], value);
      
      setConfig({ ...config, [field]: value });
      toast.success('Configuração atualizada');
    } catch (error) {
      console.error('Error updating config:', error);
      toast.error('Erro ao atualizar configuração');
    }
  };

  const handleCreateNotice = async () => {
    if (!newNotice.title || !newNotice.message) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('maintenance_notices')
        .insert({
          title: newNotice.title,
          message: newNotice.message,
          created_by: user?.id,
          is_active: true
        });

      if (error) throw error;

      await logSecurityAction('notice_created', 'maintenance', `Aviso criado: ${newNotice.title}`);
      
      setShowNoticeModal(false);
      setNewNotice({ title: '', message: '' });
      fetchData();
      toast.success('Aviso de manutenção criado');
    } catch (error) {
      console.error('Error creating notice:', error);
      toast.error('Erro ao criar aviso');
    }
  };

  const handleToggleNotice = async (notice: MaintenanceNotice) => {
    try {
      const { error } = await supabase
        .from('maintenance_notices')
        .update({ is_active: !notice.is_active })
        .eq('id', notice.id);

      if (error) throw error;

      fetchData();
      toast.success(notice.is_active ? 'Aviso desativado' : 'Aviso ativado');
    } catch (error) {
      console.error('Error toggling notice:', error);
      toast.error('Erro ao alterar aviso');
    }
  };

  const handleDeleteNotice = async (noticeId: string) => {
    try {
      const { error } = await supabase
        .from('maintenance_notices')
        .delete()
        .eq('id', noticeId);

      if (error) throw error;

      fetchData();
      toast.success('Aviso removido');
    } catch (error) {
      console.error('Error deleting notice:', error);
      toast.error('Erro ao remover aviso');
    }
  };

  const handleCleanupLogs = async () => {
    try {
      // Clean old presence records
      await supabase.rpc('cleanup_old_presence');
      
      // Clean expired rate limits
      await supabase.rpc('cleanup_expired_rate_limits');
      
      await logSecurityAction('cleanup', 'system', 'Limpeza de logs e dados temporários executada');
      
      toast.success('Limpeza executada com sucesso');
    } catch (error) {
      console.error('Error cleaning up:', error);
      toast.error('Erro na limpeza');
    }
  };

  const getUptimeDays = () => {
    if (!config?.server_uptime_start) return 0;
    const start = new Date(config.server_uptime_start);
    const now = new Date();
    return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Wrench className="h-6 w-6 text-yellow-400" />
            Manutenção & Sistema
          </h2>
          <p className="text-gray-400">Configurações do sistema, backup e manutenção</p>
        </div>
        <Button onClick={fetchData} variant="outline" className="border-gray-600">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Maintenance Mode Alert */}
      {config?.maintenance_mode && (
        <Card className="bg-yellow-900/20 border-yellow-600/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-yellow-400" />
              <div>
                <h3 className="text-yellow-300 font-semibold">Modo Manutenção Ativo</h3>
                <p className="text-yellow-200/70 text-sm">O sistema está em modo manutenção. Usuários não conseguem acessar.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-card border-border">
          <TabsTrigger value="status" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Server className="h-4 w-4 mr-2" />
            Status
          </TabsTrigger>
          <TabsTrigger value="config" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="notices" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Bell className="h-4 w-4 mr-2" />
            Avisos ({notices.filter(n => n.is_active).length})
          </TabsTrigger>
          <TabsTrigger value="cleanup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Trash2 className="h-4 w-4 mr-2" />
            Limpeza
          </TabsTrigger>
        </TabsList>

        {/* Status Tab */}
        <TabsContent value="status" className="space-y-6">
          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Status do Sistema</p>
                    <p className="text-xl font-bold text-green-400">Online</p>
                  </div>
                  <div className="p-3 rounded-full bg-green-600/20">
                    <Power className="h-6 w-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Uptime</p>
                    <p className="text-xl font-bold text-foreground">{getUptimeDays()} dias</p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-600/20">
                    <Activity className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tamanho do DB</p>
                    <p className="text-xl font-bold text-foreground">{dbStats.size}</p>
                  </div>
                  <div className="p-3 rounded-full bg-purple-600/20">
                    <Database className="h-6 w-6 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Versão</p>
                    <p className="text-xl font-bold text-foreground">{config?.system_version || '1.0.0'}</p>
                  </div>
                  <div className="p-3 rounded-full bg-yellow-600/20">
                    <HardDrive className="h-6 w-6 text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Info */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Server className="h-5 w-5 text-blue-400" />
                Informações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Servidor</span>
                    <Badge className="bg-green-600">Supabase</Badge>
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tabelas</span>
                    <span className="text-foreground font-medium">{dbStats.tables}</span>
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Funções</span>
                    <span className="text-foreground font-medium">{dbStats.functions}</span>
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Backup</span>
                    <Badge className={config?.backup_enabled ? 'bg-green-600' : 'bg-muted'}>
                      {config?.backup_enabled ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Modo Manutenção</span>
                    <Badge className={config?.maintenance_mode ? 'bg-yellow-600' : 'bg-muted'}>
                      {config?.maintenance_mode ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Auto Update</span>
                    <Badge className={config?.auto_update_enabled ? 'bg-green-600' : 'bg-muted'}>
                      {config?.auto_update_enabled ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Maintenance Mode Control */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                Controle de Manutenção
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Ative o modo manutenção para bloquear o acesso de usuários durante atualizações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <h4 className="text-foreground font-medium">Modo Manutenção</h4>
                  <p className="text-muted-foreground text-sm">Quando ativo, apenas admins podem acessar o sistema</p>
                </div>
                <Button
                  variant={config?.maintenance_mode ? 'destructive' : 'default'}
                  onClick={() => setShowMaintenanceConfirm(true)}
                  className={config?.maintenance_mode ? '' : 'bg-yellow-600 hover:bg-yellow-700'}
                >
                  {config?.maintenance_mode ? (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Desativar
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Ativar Manutenção
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Config Tab */}
        <TabsContent value="config" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Configurações do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Versão do Sistema</Label>
                  <Input
                    value={config?.system_version || ''}
                    onChange={(e) => setConfig(config ? { ...config, system_version: e.target.value } : null)}
                    onBlur={() => config && handleUpdateConfig('system_version', config.system_version)}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Timeout de Sessão (minutos)</Label>
                  <Input
                    type="number"
                    value={config?.session_timeout || 60}
                    onChange={(e) => setConfig(config ? { ...config, session_timeout: parseInt(e.target.value) } : null)}
                    onBlur={() => config && handleUpdateConfig('session_timeout', config.session_timeout)}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Retenção de Logs (dias)</Label>
                  <Input
                    type="number"
                    value={config?.log_retention || 30}
                    onChange={(e) => setConfig(config ? { ...config, log_retention: parseInt(e.target.value) } : null)}
                    onBlur={() => config && handleUpdateConfig('log_retention', config.log_retention)}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Máximo de Usuários</Label>
                  <Input
                    type="number"
                    value={config?.max_users || 1000}
                    onChange={(e) => setConfig(config ? { ...config, max_users: parseInt(e.target.value) } : null)}
                    onBlur={() => config && handleUpdateConfig('max_users', config.max_users)}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-700">
                <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div>
                    <h4 className="text-white font-medium">Backup Automático</h4>
                    <p className="text-gray-400 text-sm">Habilita backups automáticos do banco de dados</p>
                  </div>
                  <Switch
                    checked={config?.backup_enabled || false}
                    onCheckedChange={(checked) => handleUpdateConfig('backup_enabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div>
                    <h4 className="text-white font-medium">Atualizações Automáticas</h4>
                    <p className="text-gray-400 text-sm">Permite atualizações automáticas do sistema</p>
                  </div>
                  <Switch
                    checked={config?.auto_update_enabled || false}
                    onCheckedChange={(checked) => handleUpdateConfig('auto_update_enabled', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notices Tab */}
        <TabsContent value="notices" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Bell className="h-5 w-5 text-yellow-400" />
                Avisos de Manutenção
              </CardTitle>
              <Button onClick={() => setShowNoticeModal(true)} className="bg-yellow-600 hover:bg-yellow-700">
                <Bell className="h-4 w-4 mr-2" />
                Novo Aviso
              </Button>
            </CardHeader>
            <CardContent>
              {notices.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum aviso de manutenção</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notices.map(notice => (
                    <div key={notice.id} className={`p-4 rounded-lg border ${notice.is_active ? 'bg-yellow-900/20 border-yellow-600/50' : 'bg-gray-700/50 border-gray-600'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-white font-medium">{notice.title}</h4>
                            <Badge className={notice.is_active ? 'bg-yellow-600' : 'bg-gray-600'}>
                              {notice.is_active ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                          <p className="text-gray-300 text-sm">{notice.message}</p>
                          <p className="text-gray-500 text-xs mt-2">
                            Criado em {format(new Date(notice.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleNotice(notice)}
                            className="text-gray-400 hover:text-white"
                          >
                            {notice.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteNotice(notice.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cleanup Tab */}
        <TabsContent value="cleanup" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-400" />
                Limpeza do Sistema
              </CardTitle>
              <CardDescription className="text-gray-400">
                Execute tarefas de limpeza para manter o sistema otimizado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gray-700/50 rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium">Limpar Dados de Presença Antigos</h4>
                  <p className="text-gray-400 text-sm">Remove registros de presença com mais de 2 horas</p>
                </div>
                <Button variant="outline" onClick={handleCleanupLogs} className="border-gray-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Executar
                </Button>
              </div>

              <div className="p-4 bg-gray-700/50 rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium">Limpar Rate Limits Expirados</h4>
                  <p className="text-gray-400 text-sm">Remove registros de rate limiting antigos</p>
                </div>
                <Button variant="outline" onClick={handleCleanupLogs} className="border-gray-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Executar
                </Button>
              </div>

              <div className="p-4 bg-red-900/20 border border-red-600/30 rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="text-red-300 font-medium">Limpar Logs Antigos</h4>
                  <p className="text-red-200/70 text-sm">Remove logs com mais de {config?.log_retention || 30} dias (irreversível)</p>
                </div>
                <Button variant="destructive" disabled className="opacity-50">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Em breve
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Maintenance Confirm Modal */}
      <Dialog open={showMaintenanceConfirm} onOpenChange={setShowMaintenanceConfirm}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              {config?.maintenance_mode ? 'Desativar' : 'Ativar'} Modo Manutenção
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {config?.maintenance_mode 
                ? 'Os usuários poderão acessar o sistema normalmente após desativar.' 
                : 'Todos os usuários serão desconectados e impedidos de acessar o sistema.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowMaintenanceConfirm(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleToggleMaintenance}
              className={config?.maintenance_mode ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Notice Modal */}
      <Dialog open={showNoticeModal} onOpenChange={setShowNoticeModal}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-yellow-400" />
              Novo Aviso de Manutenção
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                placeholder="Ex: Manutenção Programada"
                value={newNotice.title}
                onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                className="bg-gray-700 border-gray-600"
              />
            </div>
            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea
                placeholder="Descreva os detalhes da manutenção..."
                value={newNotice.message}
                onChange={(e) => setNewNotice({ ...newNotice, message: e.target.value })}
                className="bg-gray-700 border-gray-600"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNoticeModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateNotice} className="bg-yellow-600 hover:bg-yellow-700">
              Criar Aviso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
