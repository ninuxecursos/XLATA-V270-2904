
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Send, Users, UserCheck, UserX, MessageSquare, Search, X } from 'lucide-react';
import { FormattedTextInput } from './FormattedTextInput';

interface User {
  id: string;
  name: string | null;
  email: string;
  last_seen_at: string;
  is_online: boolean;
}

interface BroadcastMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BroadcastMessageModal = ({
  open,
  onOpenChange
}: BroadcastMessageModalProps) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectFilter, setSelectFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Buscar usuários ao abrir o modal
  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  // Filtrar usuários baseado no termo de busca
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [users, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, name, email, updated_at')
        .order('name');

      if (error) throw error;

      // Determinar quais usuários estão online (últimos 30 minutos)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      
      const usersWithStatus: User[] = profiles?.map(profile => ({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        last_seen_at: profile.updated_at,
        is_online: new Date(profile.updated_at) > thirtyMinutesAgo
      })) || [];

      setUsers(usersWithStatus);
      
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de usuários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFilter = (filter: 'all' | 'online' | 'offline') => {
    setSelectFilter(filter);
    
    let usersToSelect: string[] = [];
    
    switch (filter) {
      case 'all':
        usersToSelect = filteredUsers.map(u => u.id);
        break;
      case 'online':
        usersToSelect = filteredUsers.filter(u => u.is_online).map(u => u.id);
        break;
      case 'offline':
        usersToSelect = filteredUsers.filter(u => !u.is_online).map(u => u.id);
        break;
    }
    
    setSelectedUsers(new Set(usersToSelect));
  };

  const handleRemoveSelection = () => {
    setSelectedUsers(new Set());
    setSelectFilter('all');
  };

  const handleUserToggle = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleUserContainerClick = (userId: string) => {
    const isSelected = selectedUsers.has(userId);
    handleUserToggle(userId, !isSelected);
  };

  const formatMessageForDisplay = (text: string) => {
    return text
      .replace(/\[b\](.*?)\[\/b\]/g, '<strong>$1</strong>')
      .replace(/\[i\](.*?)\[\/i\]/g, '<em>$1</em>')
      .replace(/\[u\](.*?)\[\/u\]/g, '<u>$1</u>')
      .replace(/\n/g, '<br>');
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o título e a mensagem.",
        variant: "destructive",
      });
      return;
    }

    if (selectedUsers.size === 0) {
      toast({
        title: "Usuários não selecionados",
        description: "Por favor, selecione pelo menos um usuário.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSending(true);
      
      // Obter dados do admin atual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuário não encontrado');
      }

      // Obter nome do admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();

      const senderName = profile?.name || user.email || 'Administrador';

      // Preparar mensagem formatada para exibição
      const formattedMessage = formatMessageForDisplay(message.trim());

      // Separar usuários online e offline
      const selectedUsersList = Array.from(selectedUsers);
      const onlineUsers = selectedUsersList.filter(userId => 
        users.find(u => u.id === userId)?.is_online
      );
      const offlineUsers = selectedUsersList.filter(userId => 
        !users.find(u => u.id === userId)?.is_online
      );

      // Enviar mensagens para usuários ONLINE (realtime)
      const onlinePromises = onlineUsers.map(targetUserId => 
        supabase
          .from('admin_realtime_messages')
          .insert({
            sender_id: user.id,
            sender_name: senderName,
            target_user_id: targetUserId,
            title: title.trim(),
            message: formattedMessage
          })
      );

      // Enviar mensagens para usuários OFFLINE (persistentes)
      const offlinePromises = offlineUsers.map(targetUserId => 
        supabase
          .from('user_direct_messages')
          .insert({
            sender_id: user.id,
            sender_name: senderName,
            recipient_id: targetUserId,
            title: title.trim(),
            message: formattedMessage,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 dias
          })
      );

      // Executar todas as promessas
      const allPromises = [...onlinePromises, ...offlinePromises];
      const results = await Promise.allSettled(allPromises);
      
      const failed = results.filter(result => result.status === 'rejected').length;
      const success = results.filter(result => result.status === 'fulfilled').length;

      if (failed > 0) {
        toast({
          title: "Parcialmente enviado",
          description: `${success} mensagens enviadas com sucesso, ${failed} falharam.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Mensagens enviadas",
          description: `${success} mensagens enviadas (${onlineUsers.length} para usuários online, ${offlineUsers.length} para usuários offline).`,
        });
      }

      // Limpar formulário
      setTitle('');
      setMessage('');
      setSelectedUsers(new Set());
      setSearchTerm('');
      onOpenChange(false);

    } catch (error) {
      console.error('Erro ao enviar mensagens:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar as mensagens.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setMessage('');
    setSelectedUsers(new Set());
    setSearchTerm('');
    onOpenChange(false);
  };

  const onlineUsers = filteredUsers.filter(u => u.is_online);
  const offlineUsers = filteredUsers.filter(u => !u.is_online);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen h-screen max-w-none max-h-none bg-gray-900 border-gray-700 text-white overflow-y-auto p-8">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2 text-2xl">
            <MessageSquare className="h-6 w-6 text-blue-400" />
            Enviar Mensagem em Massa
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-6">
          {/* Título da mensagem */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-gray-300">
              Título da Mensagem
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Digite o título da mensagem..."
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400"
              maxLength={100}
            />
          </div>

          {/* Mensagem com formatação */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-gray-300">
              Mensagem
            </Label>
            <FormattedTextInput
              value={message}
              onChange={setMessage}
              placeholder="Digite sua mensagem... Use [b]negrito[/b], [i]itálico[/i], emojis e quebras de linha."
              maxLength={1000}
            />
          </div>

          {/* Seleção de usuários */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-gray-300">Destinatários</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectFilter('all')}
                  className={`border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent ${
                    selectFilter === 'all' ? 'bg-blue-600 text-white border-blue-600' : ''
                  }`}
                >
                  <Users className="h-4 w-4 mr-1" />
                  Todos ({filteredUsers.length})
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectFilter('online')}
                  className={`border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent ${
                    selectFilter === 'online' ? 'bg-green-600 text-white border-green-600' : ''
                  }`}
                >
                  <UserCheck className="h-4 w-4 mr-1" />
                  Online ({onlineUsers.length})
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectFilter('offline')}
                  className={`border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent ${
                    selectFilter === 'offline' ? 'bg-gray-600 text-white border-gray-500' : ''
                  }`}
                >
                  <UserX className="h-4 w-4 mr-1" />
                  Offline ({offlineUsers.length})
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveSelection}
                  className="border-red-600 text-red-400 hover:bg-red-700 bg-transparent"
                  disabled={selectedUsers.size === 0}
                >
                  <X className="h-4 w-4 mr-1" />
                  Remover Seleção
                </Button>
              </div>
            </div>

            {/* Campo de busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                <span className="ml-3 text-gray-300">Carregando usuários...</span>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 max-h-80 overflow-y-auto">
                <div className="space-y-3">
                  {onlineUsers.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-green-400 mb-2 flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        Usuários Online ({onlineUsers.length})
                      </h4>
                      <div className="space-y-2">
                        {onlineUsers.map((user) => (
                          <div 
                            key={user.id} 
                            className="flex items-center space-x-3 p-2 bg-gray-900 rounded cursor-pointer hover:bg-gray-700 transition-colors"
                            onClick={() => handleUserContainerClick(user.id)}
                          >
                            <Checkbox
                              checked={selectedUsers.has(user.id)}
                              onCheckedChange={(checked) => handleUserToggle(user.id, checked as boolean)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium">
                                  {user.name || 'Usuário sem nome'}
                                </span>
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                              </div>
                              <span className="text-gray-400 text-sm">{user.email}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {offlineUsers.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                        <UserX className="h-4 w-4" />
                        Usuários Offline ({offlineUsers.length})
                      </h4>
                      <div className="space-y-2">
                        {offlineUsers.map((user) => (
                          <div 
                            key={user.id} 
                            className="flex items-center space-x-3 p-2 bg-gray-900 rounded cursor-pointer hover:bg-gray-700 transition-colors"
                            onClick={() => handleUserContainerClick(user.id)}
                          >
                            <Checkbox
                              checked={selectedUsers.has(user.id)}
                              onCheckedChange={(checked) => handleUserToggle(user.id, checked as boolean)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium">
                                  {user.name || 'Usuário sem nome'}
                                </span>
                                <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                              </div>
                              <span className="text-gray-400 text-sm">{user.email}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredUsers.length === 0 && (
                    <div className="text-center py-4">
                      <span className="text-gray-400">Nenhum usuário encontrado</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="text-sm text-gray-400">
              {selectedUsers.size} usuário{selectedUsers.size !== 1 ? 's' : ''} selecionado{selectedUsers.size !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
              disabled={sending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSend}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={sending || !title.trim() || !message.trim() || selectedUsers.size === 0}
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar para {selectedUsers.size} usuário{selectedUsers.size !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
