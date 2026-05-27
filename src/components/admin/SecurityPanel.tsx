import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Lock, 
  Eye, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { useSecurityBlocks } from '@/hooks/useSecurityBlocks';
import { useAccessLogs } from '@/hooks/useAccessLogs';
import { useAdminAuditLogs } from '@/hooks/useAdminAuditLogs';

export const SecurityPanel = () => {
  const { blocks, getActiveBlocks, loading: blocksLoading, refetch: refetchBlocks } = useSecurityBlocks();
  const { logs: accessLogs, totalCount: accessLogsCount, loading: accessLoading } = useAccessLogs({ limit: 10 });
  const { logs: auditLogs, totalCount: auditLogsCount, loading: auditLoading } = useAdminAuditLogs({ limit: 10 });

  const activeBlocks = getActiveBlocks();
  const recentFailedLogins = accessLogs.filter(log => log.action === 'login' && !log.success);

  const isLoading = blocksLoading || accessLoading || auditLoading;

  return (
    <div className="space-y-6">
      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Bloqueios Ativos</p>
                <p className="text-2xl font-bold text-white">{activeBlocks.length}</p>
              </div>
              <div className={`p-3 rounded-full ${activeBlocks.length > 0 ? 'bg-red-600/20' : 'bg-green-600/20'}`}>
                <Lock className={`h-6 w-6 ${activeBlocks.length > 0 ? 'text-red-400' : 'text-green-400'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Logs de Acesso</p>
                <p className="text-2xl font-bold text-white">{accessLogsCount}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-600/20">
                <Eye className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Ações Auditadas</p>
                <p className="text-2xl font-bold text-white">{auditLogsCount}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-600/20">
                <Clock className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Logins Falhos (24h)</p>
                <p className="text-2xl font-bold text-white">{recentFailedLogins.length}</p>
              </div>
              <div className={`p-3 rounded-full ${recentFailedLogins.length > 5 ? 'bg-yellow-600/20' : 'bg-green-600/20'}`}>
                <AlertTriangle className={`h-6 w-6 ${recentFailedLogins.length > 5 ? 'text-yellow-400' : 'text-green-400'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Status */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-4">
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-400" />
            Status de Segurança
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span className="text-gray-300">Criptografia de Senhas</span>
              </div>
              <Badge className="bg-green-600">bcrypt</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span className="text-gray-300">Rate Limiting</span>
              </div>
              <Badge className="bg-green-600">Ativo</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span className="text-gray-300">RLS (Row Level Security)</span>
              </div>
              <Badge className="bg-green-600">Ativo</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span className="text-gray-300">Logs de Auditoria</span>
              </div>
              <Badge className="bg-green-600">Ativo</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span className="text-gray-300">Sistema de Permissões</span>
              </div>
              <Badge className="bg-green-600">RBAC</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span className="text-gray-300">Bloqueio Automático</span>
              </div>
              <Badge className="bg-green-600">Ativo</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Access Logs */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-400" />
              Acessos Recentes
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-400 hover:text-white"
              onClick={() => {}}
            >
              Ver Todos
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-3">
                {accessLogs.slice(0, 5).map(log => (
                  <div key={log.id} className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      {log.success ? (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400" />
                      )}
                      <div>
                        <p className="text-sm text-white">{log.action}</p>
                        <p className="text-xs text-gray-400">
                          {log.ipAddress || 'IP desconhecido'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(log.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
                {accessLogs.length === 0 && (
                  <p className="text-gray-400 text-center py-4">Nenhum log de acesso recente</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Blocks */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Lock className="h-5 w-5 text-red-400" />
              Bloqueios Ativos
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-400 hover:text-white"
              onClick={refetchBlocks}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {blocksLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-3">
                {activeBlocks.slice(0, 5).map(block => (
                  <div key={block.id} className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Lock className="h-4 w-4 text-red-400" />
                      <div>
                        <p className="text-sm text-white">{block.identifier}</p>
                        <p className="text-xs text-gray-400">{block.reason}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={block.isPermanent ? 'border-red-500 text-red-400' : 'border-yellow-500 text-yellow-400'}>
                      {block.isPermanent ? 'Permanente' : 'Temporário'}
                    </Badge>
                  </div>
                ))}
                {activeBlocks.length === 0 && (
                  <div className="flex items-center justify-center py-8 text-gray-400">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-400" />
                    <span>Nenhum bloqueio ativo</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
