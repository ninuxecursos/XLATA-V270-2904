import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Users, Clock, User, MessageCircle, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { SendMessageModal } from './SendMessageModal';
import { BroadcastMessageModal } from './BroadcastMessageModal';
import { useOnlineUsersFromDB } from '@/hooks/useOnlineUsersFromDB';
import { createSafeLogger } from '@/utils/safeLogger';

const logger = createSafeLogger('[ActiveUsers]');

interface ActiveUser {
  user_id: string;
  name: string | null;
  email: string;
  last_seen_at: string;
  session_started: string;
  is_online: boolean;
  status: string;
  time_offline?: number; // em minutos
}

export const ActiveUsersList = () => {
  const { onlineUsers: onlineUsersFromDB, loading: dbLoading, refresh: refreshDB, count } = useOnlineUsersFromDB();
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [sendMessageModal, setSendMessageModal] = useState({
    open: false,
    targetUserId: '',
    targetUserName: ''
  });
  const [broadcastModal, setBroadcastModal] = useState(false);

  const fetchActiveUsers = async () => {
    try {
      setLoading(true);
      
      // Buscar usuários online da tabela user_presence
      const { data: onlinePresence, error: presenceError } = await supabase
        .rpc('get_online_users');

      if (presenceError) {
        logger.error('Erro ao buscar presença online:', presenceError);
        // Fallback para método anterior se a função não existir
        return fetchActiveUsersFallback();
      }

      let allUsers: ActiveUser[] = [];

      if (onlinePresence && onlinePresence.length > 0) {
        // Buscar perfis dos usuários online
        const onlineUserIds = onlinePresence.map((u: any) => u.user_id);
        
        const { data: onlineProfiles, error: onlineError } = await supabase
          .from('profiles')
          .select('id, name, email, created_at, status')
          .in('id', onlineUserIds);

        if (onlineError) {
          logger.error('Erro ao buscar perfis online:', onlineError);
        } else {
          // Mapear usuários online
          const onlineUsers = onlinePresence.map((presence: any) => {
            const profile = onlineProfiles?.find(p => p.id === presence.user_id);
            return {
              user_id: presence.user_id,
              name: profile?.name || null,
              email: profile?.email || 'Email não encontrado',
              last_seen_at: presence.last_seen_at,
              session_started: profile?.created_at || presence.last_seen_at,
              is_online: true,
              status: profile?.status || 'user',
              time_offline: 0
            };
          });
          
          allUsers = [...onlineUsers];
        }
      }

      // Buscar usuários que estiveram ativos recentemente (últimas 2 horas) mas não estão online
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      
      const { data: recentProfiles, error: recentError } = await supabase
        .from('profiles')
        .select('id, name, email, last_login_at, updated_at, created_at, status')
        .gte('last_login_at', twoHoursAgo)
        .not('last_login_at', 'is', null)
        .order('last_login_at', { ascending: false });

      if (recentError) {
        logger.error('Erro ao buscar usuários recentes:', recentError);
      } else {
        // Filtrar usuários que não estão na lista de online
        const onlineUserIds = allUsers.map(u => u.user_id);
        const offlineUsers = recentProfiles
          ?.filter(profile => !onlineUserIds.includes(profile.id))
          .map(profile => {
            const lastSeen = new Date(profile.last_login_at || profile.updated_at);
            const now = new Date();
            const timeOfflineMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));
            
            return {
              user_id: profile.id,
              name: profile.name,
              email: profile.email,
              last_seen_at: profile.last_login_at || profile.updated_at,
              session_started: profile.created_at,
              is_online: false,
              status: profile.status || 'user',
              time_offline: timeOfflineMinutes
            };
          }) || [];

        allUsers = [...allUsers, ...offlineUsers];
      }

      // Ordenar por último acesso (online primeiro, depois por data mais recente)
      allUsers.sort((a, b) => {
        // Usuários online sempre primeiro
        if (a.is_online && !b.is_online) return -1;
        if (!a.is_online && b.is_online) return 1;
        
        // Se ambos têm o mesmo status online, ordenar por último acesso
        return new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime();
      });

      setActiveUsers(allUsers);
      setLastUpdate(new Date());
      
      logger.debug(`Usuários encontrados: ${allUsers.length} (${allUsers.filter(u => u.is_online).length} online)`);
      
    } catch (error) {
      logger.error('Erro ao buscar usuários ativos:', error);
      toast({
        title: "Erro",
        description: "Erro ao conectar com o banco de dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Método de fallback caso a função RPC não esteja disponível
  const fetchActiveUsersFallback = async () => {
    const sixtyMinutesAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, name, email, updated_at, created_at, status')
      .gte('updated_at', sixtyMinutesAgo)
      .order('updated_at', { ascending: false });

    if (error) {
      logger.error('Erro ao buscar usuários ativos (fallback):', error);
      return;
    }

    const users: ActiveUser[] = profiles?.map(profile => {
      const lastSeen = new Date(profile.updated_at);
      const now = new Date();
      const timeOfflineMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));
      
      return {
        user_id: profile.id,
        name: profile.name,
        email: profile.email,
        last_seen_at: profile.updated_at,
        session_started: profile.created_at,
        is_online: timeOfflineMinutes < 5, // Considerar online se ativo nos últimos 5 minutos
        status: profile.status || 'user',
        time_offline: timeOfflineMinutes
      };
    }) || [];

    setActiveUsers(users);
    setLastUpdate(new Date());
  };

  useEffect(() => {
    fetchActiveUsers();
    
    // Auto-atualizar a cada 60 segundos (otimizado de 10s para 60s)
    const interval = setInterval(fetchActiveUsers, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Atualizar quando o hook de DB retornar novos dados
  useEffect(() => {
    if (onlineUsersFromDB.length > 0) {
      fetchActiveUsers();
    }
  }, [onlineUsersFromDB]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getTimeAgo = (dateString: string, isOnline: boolean, timeOfflineMinutes?: number) => {
    if (isOnline) {
      return 'Online agora';
    }

    if (timeOfflineMinutes !== undefined) {
      if (timeOfflineMinutes < 1) {
        return 'Agora mesmo';
      } else if (timeOfflineMinutes === 1) {
        return 'Offline há 1 minuto';
      } else if (timeOfflineMinutes < 60) {
        return `Offline há ${timeOfflineMinutes} minutos`;
      } else {
        const hours = Math.floor(timeOfflineMinutes / 60);
        if (hours === 1) {
          return 'Offline há 1 hora';
        } else {
          return `Offline há ${hours} horas`;
        }
      }
    }

    // Fallback para cálculo manual
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Agora mesmo';
    } else if (diffInMinutes === 1) {
      return 'Offline há 1 minuto';
    } else if (diffInMinutes < 60) {
      return `Offline há ${diffInMinutes} minutos`;
    } else {
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours === 1) {
        return 'Offline há 1 hora';
      } else {
        return `Offline há ${diffInHours} horas`;
      }
    }
  };

  const handleSendMessage = (userId: string, userName: string) => {
    setSendMessageModal({
      open: true,
      targetUserId: userId,
      targetUserName: userName
    });
  };

  const closeSendMessageModal = () => {
    setSendMessageModal({
      open: false,
      targetUserId: '',
      targetUserName: ''
    });
  };

  const onlineCount = activeUsers.filter(u => u.is_online).length;
  const offlineCount = activeUsers.filter(u => !u.is_online).length;

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-green-400" />
              Usuários Autenticados Online
              <Badge className="bg-green-600 text-white ml-2">
                {onlineCount} online
              </Badge>
              {offlineCount > 0 && (
                <Badge className="bg-gray-600 text-white ml-1">
                  {offlineCount} recentes
                </Badge>
              )}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={() => setBroadcastModal(true)}
                variant="outline"
                size="sm"
                className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white bg-transparent"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Envio em Massa
              </Button>
              <Button
                onClick={fetchActiveUsers}
                disabled={loading}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
          <p className="text-sm text-gray-400">
            Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')} • Atualização automática a cada 60 segundos
          </p>
        </CardHeader>
        <CardContent>
          {loading && activeUsers.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
              <span className="ml-3 text-gray-300">Carregando usuários ativos...</span>
            </div>
          ) : activeUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Nenhum usuário ativo no momento</p>
              <p className="text-gray-500 text-sm mt-2">
                Usuários com atividade nas últimas 2 horas aparecerão aqui
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeUsers.map((user) => (
                <div
                  key={user.user_id}
                  className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-medium">
                        {(user.name || user.email).charAt(0).toUpperCase()}
                      </div>
                      {user.is_online ? (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900 animate-pulse"></div>
                      ) : (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-gray-900"></div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-medium">
                          {user.name || 'Usuário sem nome'}
                        </h3>
                        {user.is_online ? (
                          <Badge className="bg-green-600 text-white text-xs">
                            🟢 Online
                          </Badge>
                        ) : (
                          <Badge className="bg-red-600 text-white text-xs">
                            🔴 Offline
                          </Badge>
                        )}
                        {user.status === 'admin' && (
                          <Badge className="bg-pink-600 text-white text-xs">
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Clock className="h-4 w-4" />
                        <span>Status:</span>
                      </div>
                      <div className={`text-xs ${user.is_online ? 'text-green-400' : 'text-red-400'}`}>
                        {getTimeAgo(user.last_seen_at, user.is_online, user.time_offline)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatTime(user.last_seen_at)} - {formatDate(user.last_seen_at)}
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => handleSendMessage(user.user_id, user.name || user.email)}
                      variant="outline"
                      size="sm"
                      className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white bg-transparent"
                      title="Enviar mensagem"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Informações adicionais */}
          <div className="mt-6 p-4 bg-gray-900 rounded-lg border border-gray-700">
            <h4 className="text-white font-medium mb-2 flex items-center gap-2">
              <User className="h-4 w-4" />
              Informações sobre Usuários Ativos
            </h4>
            <div className="text-sm text-gray-400 space-y-1">
              <p>• Usuários online em tempo real: <span className="text-green-400 font-medium">{onlineCount}</span></p>
              <p>• Usuários offline recentes (2h): <span className="text-red-400 font-medium">{offlineCount}</span></p>
              <p>• Lista atualizada automaticamente a cada 60 segundos</p>
              <p>• Indicador verde 🟢 para online, vermelho 🔴 para offline</p>
              <p>• Total de usuários exibidos: <span className="text-blue-400 font-medium">{activeUsers.length}</span></p>
              <p>• Clique no ícone de mensagem para enviar alertas individuais</p>
              <p>• Use "Envio em Massa" para enviar mensagens formatadas para múltiplos usuários</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de envio de mensagem individual */}
      <SendMessageModal
        open={sendMessageModal.open}
        onOpenChange={closeSendMessageModal}
        targetUserId={sendMessageModal.targetUserId}
        targetUserName={sendMessageModal.targetUserName}
      />

      {/* Modal de envio de mensagem em massa */}
      <BroadcastMessageModal
        open={broadcastModal}
        onOpenChange={setBroadcastModal}
      />
    </div>
  );
};
