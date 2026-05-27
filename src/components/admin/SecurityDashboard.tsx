import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Shield, 
  Lock, 
  Eye, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus,
  Trash2,
  Globe,
  User,
  Mail,
  Smartphone,
  FileText,
  Search,
  Filter,
  Download
} from 'lucide-react';
import { useSecurityBlocks, BlockType } from '@/hooks/useSecurityBlocks';
import { useAccessLogs } from '@/hooks/useAccessLogs';
import { useAdminAuditLogs } from '@/hooks/useAdminAuditLogs';
import { useAuditLog } from '@/hooks/useAuditLog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export const SecurityDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Block Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBlock, setNewBlock] = useState({
    identifier: '',
    blockType: 'ip' as BlockType,
    reason: '',
    isPermanent: false,
    durationHours: 24
  });

  // Hooks
  const { blocks, loading: blocksLoading, refetch: refetchBlocks, createBlock, removeBlock, getActiveBlocks } = useSecurityBlocks();
  const { logs: accessLogs, totalCount: accessLogsCount, loading: accessLoading, refetch: refetchAccessLogs } = useAccessLogs({ limit: 500 });
  const { logs: auditLogs, totalCount: auditLogsCount, loading: auditLoading, refetch: refetchAuditLogs } = useAdminAuditLogs({ limit: 500 });
  const { logSecurityAction } = useAuditLog();

  const activeBlocks = getActiveBlocks();
  const recentFailedLogins = accessLogs.filter(log => log.action === 'login' && !log.success);
  const isLoading = blocksLoading || accessLoading || auditLoading;

  // Filtered Access Logs
  const filteredAccessLogs = useMemo(() => {
    return accessLogs.filter(log => {
      const matchesSearch = searchTerm === '' || 
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.ipAddress?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.userId?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesAction = actionFilter === 'all' || log.action === actionFilter;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'success' && log.success) ||
        (statusFilter === 'failed' && !log.success);
      
      return matchesSearch && matchesAction && matchesStatus;
    });
  }, [accessLogs, searchTerm, actionFilter, statusFilter]);

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchesSearch = searchTerm === '' || 
        log.actionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.adminEmail?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.description?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesSearch;
    });
  }, [auditLogs, searchTerm]);

  // Unique Action Types
  const uniqueActions = useMemo(() => {
    const actions = new Set(accessLogs.map(log => log.action));
    return Array.from(actions).sort();
  }, [accessLogs]);

  // Block Handlers
  const getBlockTypeIcon = (type: BlockType) => {
    switch (type) {
      case 'ip': return <Globe className="h-4 w-4 text-blue-400" />;
      case 'user': return <User className="h-4 w-4 text-green-400" />;
      case 'email': return <Mail className="h-4 w-4 text-purple-400" />;
      case 'device': return <Smartphone className="h-4 w-4 text-yellow-400" />;
    }
  };

  const getBlockTypeLabel = (type: BlockType) => {
    switch (type) {
      case 'ip': return 'Endereço IP';
      case 'user': return 'Usuário';
      case 'email': return 'Email';
      case 'device': return 'Dispositivo';
    }
  };

  const handleAddBlock = async () => {
    if (!newBlock.identifier || !newBlock.reason) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const blockedUntil = newBlock.isPermanent 
      ? undefined 
      : new Date(Date.now() + newBlock.durationHours * 60 * 60 * 1000);

    const success = await createBlock(
      newBlock.identifier,
      newBlock.blockType,
      newBlock.reason,
      newBlock.isPermanent,
      blockedUntil
    );

    if (success) {
      await logSecurityAction('block_created', newBlock.identifier, 
        `Bloqueio ${newBlock.blockType} criado: ${newBlock.reason}`);
      toast.success('Bloqueio criado com sucesso');
      setShowAddModal(false);
      setNewBlock({ identifier: '', blockType: 'ip', reason: '', isPermanent: false, durationHours: 24 });
    } else {
      toast.error('Erro ao criar bloqueio');
    }
  };

  const handleRemoveBlock = async (blockId: string, identifier: string) => {
    const success = await removeBlock(blockId);
    if (success) {
      await logSecurityAction('block_removed', blockId, `Bloqueio removido: ${identifier}`);
      toast.success('Bloqueio removido');
    } else {
      toast.error('Erro ao remover bloqueio');
    }
  };

  const handleRefreshAll = () => {
    refetchBlocks();
    refetchAccessLogs();
    refetchAuditLogs();
    toast.success('Dados atualizados');
  };

  const exportLogs = (type: 'access' | 'audit') => {
    const data = type === 'access' ? filteredAccessLogs : filteredAuditLogs;
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-logs-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Logs exportados');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="h-6 w-6 text-green-400" />
            Central de Segurança
          </h2>
          <p className="text-gray-400">Monitore e gerencie a segurança do sistema</p>
        </div>
        <Button onClick={handleRefreshAll} variant="outline" className="border-gray-600">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar Tudo
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-card border-border">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Shield className="h-4 w-4 mr-2" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="blocks" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Lock className="h-4 w-4 mr-2" />
            Bloqueios ({activeBlocks.length})
          </TabsTrigger>
          <TabsTrigger value="access" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Eye className="h-4 w-4 mr-2" />
            Logs de Acesso ({accessLogsCount})
          </TabsTrigger>
          <TabsTrigger value="audit" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <FileText className="h-4 w-4 mr-2" />
            Auditoria ({auditLogsCount})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Bloqueios Ativos</p>
                    <p className="text-2xl font-bold text-foreground">{activeBlocks.length}</p>
                  </div>
                  <div className={`p-3 rounded-full ${activeBlocks.length > 0 ? 'bg-red-600/20' : 'bg-green-600/20'}`}>
                    <Lock className={`h-6 w-6 ${activeBlocks.length > 0 ? 'text-red-400' : 'text-green-400'}`} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Logs de Acesso</p>
                    <p className="text-2xl font-bold text-foreground">{accessLogsCount}</p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-600/20">
                    <Eye className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Ações Auditadas</p>
                    <p className="text-2xl font-bold text-foreground">{auditLogsCount}</p>
                  </div>
                  <div className="p-3 rounded-full bg-purple-600/20">
                    <Clock className="h-6 w-6 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Logins Falhos</p>
                    <p className="text-2xl font-bold text-foreground">{recentFailedLogins.length}</p>
                  </div>
                  <div className={`p-3 rounded-full ${recentFailedLogins.length > 5 ? 'bg-yellow-600/20' : 'bg-green-600/20'}`}>
                    <AlertTriangle className={`h-6 w-6 ${recentFailedLogins.length > 5 ? 'text-yellow-400' : 'text-green-400'}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Status */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-foreground flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-400" />
                Status de Segurança
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: 'Criptografia de Senhas', value: 'bcrypt', active: true },
                  { label: 'Rate Limiting', value: 'Ativo', active: true },
                  { label: 'RLS (Row Level Security)', value: 'Ativo', active: true },
                  { label: 'Logs de Auditoria', value: 'Ativo', active: true },
                  { label: 'Sistema de Permissões', value: 'RBAC', active: true },
                  { label: 'Bloqueio Automático', value: 'Ativo', active: true },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      <span className="text-muted-foreground">{item.label}</span>
                    </div>
                    <Badge className="bg-green-600">{item.value}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Access Logs */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-4 flex flex-row items-center justify-between">
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-400" />
                  Acessos Recentes
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('access')} className="text-muted-foreground hover:text-foreground">
                  Ver Todos
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {accessLogs.slice(0, 5).map(log => (
                    <div key={log.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        {log.success ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-400" />
                        )}
                        <div>
                          <p className="text-sm text-foreground">{log.action}</p>
                          <p className="text-xs text-muted-foreground">{log.ipAddress || 'IP desconhecido'}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.createdAt), 'HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                  ))}
                  {accessLogs.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">Nenhum log de acesso recente</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Active Blocks */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-4 flex flex-row items-center justify-between">
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Lock className="h-5 w-5 text-red-400" />
                  Bloqueios Ativos
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('blocks')} className="text-muted-foreground hover:text-foreground">
                  Ver Todos
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activeBlocks.slice(0, 5).map(block => (
                    <div key={block.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getBlockTypeIcon(block.blockType)}
                        <div>
                          <p className="text-sm text-foreground">{block.identifier}</p>
                          <p className="text-xs text-muted-foreground">{block.reason}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={block.isPermanent ? 'border-red-500 text-red-400' : 'border-yellow-500 text-yellow-400'}>
                        {block.isPermanent ? 'Permanente' : 'Temporário'}
                      </Badge>
                    </div>
                  ))}
                  {activeBlocks.length === 0 && (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <CheckCircle className="h-5 w-5 mr-2 text-green-400" />
                      <span>Nenhum bloqueio ativo</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Blocks Tab */}
        <TabsContent value="blocks" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Bloqueios</p>
                    <p className="text-2xl font-bold text-foreground">{blocks.length}</p>
                  </div>
                  <Lock className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Bloqueios Ativos</p>
                    <p className="text-2xl font-bold text-red-400">{activeBlocks.length}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Permanentes</p>
                    <p className="text-2xl font-bold text-yellow-400">
                      {blocks.filter(b => b.isPermanent).length}
                    </p>
                  </div>
                  <Lock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Automáticos</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {blocks.filter(b => b.autoBlocked).length}
                    </p>
                  </div>
                  <Globe className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Blocks Table */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Lock className="h-5 w-5 text-red-400" />
                  Gerenciar Bloqueios
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={refetchBlocks} disabled={blocksLoading} className="text-gray-400 hover:text-white">
                    <RefreshCw className={`h-4 w-4 mr-2 ${blocksLoading ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                  <Button size="sm" onClick={() => setShowAddModal(true)} className="bg-red-600 hover:bg-red-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Bloqueio
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-700/50 hover:bg-gray-700/50">
                      <TableHead className="text-gray-300">Tipo</TableHead>
                      <TableHead className="text-gray-300">Identificador</TableHead>
                      <TableHead className="text-gray-300">Motivo</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Expira em</TableHead>
                      <TableHead className="text-gray-300">Criado em</TableHead>
                      <TableHead className="text-gray-300 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blocks.map(block => {
                      const isActive = block.isPermanent || (block.blockedUntil && new Date(block.blockedUntil) > new Date());
                      return (
                        <TableRow key={block.id} className="border-gray-700 hover:bg-gray-700/30">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getBlockTypeIcon(block.blockType)}
                              <span className="text-gray-300">{getBlockTypeLabel(block.blockType)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-sm text-blue-400 bg-blue-900/20 px-2 py-1 rounded">
                              {block.identifier}
                            </code>
                          </TableCell>
                          <TableCell className="text-gray-300 max-w-xs truncate">{block.reason}</TableCell>
                          <TableCell>
                            <Badge className={isActive ? 'bg-red-600' : 'bg-gray-600'}>
                              {isActive ? 'Ativo' : 'Expirado'}
                            </Badge>
                            {block.autoBlocked && (
                              <Badge variant="outline" className="ml-2 border-yellow-600 text-yellow-400">Auto</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {block.isPermanent ? (
                              <span className="text-red-400">Permanente</span>
                            ) : block.blockedUntil ? (
                              format(new Date(block.blockedUntil), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-gray-400 text-sm">
                            {format(new Date(block.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveBlock(block.id, block.identifier)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {blocks.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                          Nenhum bloqueio cadastrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Access Logs Tab */}
        <TabsContent value="access" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <CardTitle className="text-white flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-400" />
                  Logs de Acesso ({filteredAccessLogs.length})
                </CardTitle>
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 bg-gray-700 border-gray-600 w-48"
                    />
                  </div>
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="w-40 bg-gray-700 border-gray-600">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Ação" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="all">Todas Ações</SelectItem>
                      {uniqueActions.map(action => (
                        <SelectItem key={action} value={action}>{action}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32 bg-gray-700 border-gray-600">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="success">Sucesso</SelectItem>
                      <SelectItem value="failed">Falha</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => exportLogs('access')} className="border-gray-600">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-700/50 hover:bg-gray-700/50">
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Ação</TableHead>
                      <TableHead className="text-gray-300">IP</TableHead>
                      <TableHead className="text-gray-300">Localização</TableHead>
                      <TableHead className="text-gray-300">Dispositivo</TableHead>
                      <TableHead className="text-gray-300">Data/Hora</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAccessLogs.map(log => (
                      <TableRow key={log.id} className="border-gray-700 hover:bg-gray-700/30">
                        <TableCell>
                          {log.success ? (
                            <Badge className="bg-green-600">Sucesso</Badge>
                          ) : (
                            <Badge className="bg-red-600">Falha</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-300">{log.action}</TableCell>
                        <TableCell>
                          <code className="text-sm text-blue-400 bg-blue-900/20 px-2 py-1 rounded">
                            {log.ipAddress || '-'}
                          </code>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {log.city && log.country ? `${log.city}, ${log.country}` : '-'}
                        </TableCell>
                        <TableCell className="text-gray-400 text-sm">
                          {log.browser && log.os ? `${log.browser} / ${log.os}` : log.deviceType || '-'}
                        </TableCell>
                        <TableCell className="text-gray-400 text-sm">
                          {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredAccessLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                          Nenhum log encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-400" />
                  Logs de Auditoria ({filteredAuditLogs.length})
                </CardTitle>
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 bg-gray-700 border-gray-600 w-48"
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={() => exportLogs('audit')} className="border-gray-600">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-700/50 hover:bg-gray-700/50">
                      <TableHead className="text-gray-300">Tipo de Ação</TableHead>
                      <TableHead className="text-gray-300">Admin</TableHead>
                      <TableHead className="text-gray-300">Descrição</TableHead>
                      <TableHead className="text-gray-300">Tabela Alvo</TableHead>
                      <TableHead className="text-gray-300">IP</TableHead>
                      <TableHead className="text-gray-300">Data/Hora</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAuditLogs.map(log => (
                      <TableRow key={log.id} className="border-gray-700 hover:bg-gray-700/30">
                        <TableCell>
                          <Badge variant="outline" className="border-purple-500 text-purple-400">
                            {log.actionType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300">{log.adminEmail || '-'}</TableCell>
                        <TableCell className="text-gray-300 max-w-xs truncate">
                          {log.description || '-'}
                        </TableCell>
                        <TableCell className="text-gray-400">{log.targetTable || '-'}</TableCell>
                        <TableCell>
                          <code className="text-sm text-blue-400 bg-blue-900/20 px-2 py-1 rounded">
                            {log.ipAddress || '-'}
                          </code>
                        </TableCell>
                        <TableCell className="text-gray-400 text-sm">
                          {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredAuditLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                          Nenhum log encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Block Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-red-400" />
              Novo Bloqueio
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Bloqueio</Label>
              <Select value={newBlock.blockType} onValueChange={(v: BlockType) => setNewBlock({ ...newBlock, blockType: v })}>
                <SelectTrigger className="bg-gray-700 border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="ip">Endereço IP</SelectItem>
                  <SelectItem value="user">Usuário (ID)</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="device">Dispositivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Identificador</Label>
              <Input
                placeholder={
                  newBlock.blockType === 'ip' ? '192.168.1.1' :
                  newBlock.blockType === 'email' ? 'email@exemplo.com' :
                  newBlock.blockType === 'user' ? 'UUID do usuário' :
                  'Identificador do dispositivo'
                }
                value={newBlock.identifier}
                onChange={(e) => setNewBlock({ ...newBlock, identifier: e.target.value })}
                className="bg-gray-700 border-gray-600"
              />
            </div>

            <div className="space-y-2">
              <Label>Motivo</Label>
              <Textarea
                placeholder="Descreva o motivo do bloqueio..."
                value={newBlock.reason}
                onChange={(e) => setNewBlock({ ...newBlock, reason: e.target.value })}
                className="bg-gray-700 border-gray-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Bloqueio Permanente</Label>
              <Switch
                checked={newBlock.isPermanent}
                onCheckedChange={(checked) => setNewBlock({ ...newBlock, isPermanent: checked })}
              />
            </div>

            {!newBlock.isPermanent && (
              <div className="space-y-2">
                <Label>Duração (horas)</Label>
                <Input
                  type="number"
                  min={1}
                  value={newBlock.durationHours}
                  onChange={(e) => setNewBlock({ ...newBlock, durationHours: parseInt(e.target.value) || 24 })}
                  className="bg-gray-700 border-gray-600"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddBlock} className="bg-red-600 hover:bg-red-700">
              Criar Bloqueio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
