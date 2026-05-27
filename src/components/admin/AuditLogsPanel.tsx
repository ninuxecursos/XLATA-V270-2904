import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Clock, 
  RefreshCw,
  Search,
  User,
  Settings,
  CreditCard,
  FileText,
  Shield,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAdminAuditLogs } from '@/hooks/useAdminAuditLogs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const AuditLogsPanel = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  
  const { logs, loading, totalCount, refetch } = useAdminAuditLogs({ limit: 100 });

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.actionType.toLowerCase().includes(search) ||
      log.adminEmail?.toLowerCase().includes(search) ||
      log.description?.toLowerCase().includes(search) ||
      log.targetTable?.toLowerCase().includes(search)
    );
  });

  const getActionIcon = (actionType: string) => {
    if (actionType.includes('user') || actionType.includes('profile')) {
      return <User className="h-4 w-4 text-blue-400" />;
    }
    if (actionType.includes('subscription') || actionType.includes('payment')) {
      return <CreditCard className="h-4 w-4 text-green-400" />;
    }
    if (actionType.includes('content') || actionType.includes('landing')) {
      return <FileText className="h-4 w-4 text-purple-400" />;
    }
    if (actionType.includes('security') || actionType.includes('role')) {
      return <Shield className="h-4 w-4 text-red-400" />;
    }
    return <Settings className="h-4 w-4 text-gray-400" />;
  };

  const getActionColor = (actionType: string) => {
    if (actionType.includes('create') || actionType.includes('insert')) {
      return 'bg-green-600';
    }
    if (actionType.includes('update') || actionType.includes('change')) {
      return 'bg-blue-600';
    }
    if (actionType.includes('delete') || actionType.includes('remove')) {
      return 'bg-red-600';
    }
    if (actionType.includes('security') || actionType.includes('block')) {
      return 'bg-yellow-600';
    }
    return 'bg-gray-600';
  };

  const formatActionType = (actionType: string) => {
    return actionType
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-400" />
              Logs de Auditoria
              <Badge variant="secondary" className="ml-2">
                {totalCount} registros
              </Badge>
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={refetch}
              disabled={loading}
              className="text-gray-400 hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por ação, admin, descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-700 border-gray-600 text-white"
            />
          </div>

          {/* Timeline */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map(log => (
                <div 
                  key={log.id} 
                  className="bg-gray-700/30 rounded-lg border border-gray-700 overflow-hidden"
                >
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-700/50 transition-colors"
                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {getActionIcon(log.actionType)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getActionColor(log.actionType)}>
                              {formatActionType(log.actionType)}
                            </Badge>
                            {log.targetTable && (
                              <Badge variant="outline" className="border-gray-600 text-gray-400">
                                {log.targetTable}
                              </Badge>
                            )}
                          </div>
                          <p className="text-white">{log.description || 'Sem descrição'}</p>
                          <p className="text-sm text-gray-400 mt-1">
                            Por: <span className="text-gray-300">{log.adminEmail || 'Sistema'}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right text-sm">
                          <p className="text-gray-300">
                            {format(new Date(log.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                          <p className="text-gray-500">
                            {format(new Date(log.createdAt), 'HH:mm:ss', { locale: ptBR })}
                          </p>
                        </div>
                        {(log.oldValue || log.newValue) && (
                          expandedLog === log.id ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedLog === log.id && (log.oldValue || log.newValue) && (
                    <div className="border-t border-gray-700 p-4 bg-gray-800/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {log.oldValue && (
                          <div>
                            <p className="text-sm font-semibold text-red-400 mb-2">Valor Anterior</p>
                            <pre className="bg-gray-900 p-3 rounded text-xs text-gray-300 overflow-x-auto">
                              {JSON.stringify(log.oldValue, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.newValue && (
                          <div>
                            <p className="text-sm font-semibold text-green-400 mb-2">Novo Valor</p>
                            <pre className="bg-gray-900 p-3 rounded text-xs text-gray-300 overflow-x-auto">
                              {JSON.stringify(log.newValue, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                      {log.ipAddress && (
                        <p className="text-xs text-gray-500 mt-3">
                          IP: <code className="bg-gray-900 px-2 py-1 rounded">{log.ipAddress}</code>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {filteredLogs.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  Nenhum log de auditoria encontrado
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
