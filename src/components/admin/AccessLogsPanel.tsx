import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Search,
  Filter,
  Monitor,
  Smartphone,
  Globe
} from 'lucide-react';
import { useAccessLogs } from '@/hooks/useAccessLogs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const AccessLogsPanel = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSuccess, setFilterSuccess] = useState<boolean | undefined>(undefined);
  
  const { logs, loading, totalCount, refetch } = useAccessLogs({ 
    limit: 100,
    success: filterSuccess 
  });

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(search) ||
      log.ipAddress?.toLowerCase().includes(search) ||
      log.browser?.toLowerCase().includes(search) ||
      log.country?.toLowerCase().includes(search)
    );
  });

  const getDeviceIcon = (deviceType: string | null) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-4 w-4 text-blue-400" />;
      case 'desktop':
        return <Monitor className="h-4 w-4 text-green-400" />;
      default:
        return <Globe className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-400" />
              Logs de Acesso
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
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por ação, IP, navegador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterSuccess === undefined ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterSuccess(undefined)}
                className={filterSuccess === undefined ? "bg-gray-600" : "border-gray-600 text-gray-300"}
              >
                Todos
              </Button>
              <Button
                variant={filterSuccess === true ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterSuccess(true)}
                className={filterSuccess === true ? "bg-green-600" : "border-gray-600 text-gray-300"}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Sucesso
              </Button>
              <Button
                variant={filterSuccess === false ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterSuccess(false)}
                className={filterSuccess === false ? "bg-red-600" : "border-gray-600 text-gray-300"}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Falha
              </Button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="rounded-lg border border-gray-700 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-700/50 hover:bg-gray-700/50">
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Ação</TableHead>
                    <TableHead className="text-gray-300">IP</TableHead>
                    <TableHead className="text-gray-300">Dispositivo</TableHead>
                    <TableHead className="text-gray-300">Localização</TableHead>
                    <TableHead className="text-gray-300">Data/Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map(log => (
                    <TableRow key={log.id} className="border-gray-700 hover:bg-gray-700/30">
                      <TableCell>
                        {log.success ? (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-400" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-white font-medium">{log.action}</p>
                          {log.errorMessage && (
                            <p className="text-xs text-red-400">{log.errorMessage}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm text-blue-400 bg-blue-900/20 px-2 py-1 rounded">
                          {log.ipAddress || 'N/A'}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(log.deviceType)}
                          <div className="text-sm">
                            <p className="text-gray-300">{log.browser || 'Desconhecido'}</p>
                            <p className="text-xs text-gray-500">{log.os || ''}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-300">
                          {log.city && log.country ? (
                            <>
                              <p>{log.city}</p>
                              <p className="text-xs text-gray-500">{log.country}</p>
                            </>
                          ) : (
                            <span className="text-gray-500">Não disponível</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="text-gray-300">
                            {format(new Date(log.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(log.createdAt), 'HH:mm:ss', { locale: ptBR })}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                        Nenhum log encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
