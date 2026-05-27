import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Send, Users, Wifi, WifiOff, Bell, MessageSquare, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UnifiedNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type RecipientType = 'all' | 'online' | 'offline';
type DisplayType = 'popup' | 'notification';

interface OnlineUser {
  id: string;
  name: string;
  email: string;
  isOnline: boolean;
}

export const UnifiedNotificationModal = ({
  isOpen,
  onClose
}: UnifiedNotificationModalProps) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [recipientType, setRecipientType] = useState<RecipientType>('all');
  const [displayType, setDisplayType] = useState<DisplayType>('popup');
  const [isSending, setIsSending] = useState(false);
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      // Buscar todos os profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email');

      if (profilesError) throw profilesError;

      // Buscar usuários online via RPC
      const { data: onlineUsers } = await supabase.rpc('get_online_users');
      const onlineIds = new Set((onlineUsers || []).map((u: { user_id: string }) => u.user_id));

      const usersWithStatus = (profiles || []).map(profile => ({
        id: profile.id,
        name: profile.name || 'Usuário',
        email: profile.email || '',
        isOnline: onlineIds.has(profile.id)
      }));

      setUsers(usersWithStatus);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const getRecipients = () => {
    switch (recipientType) {
      case 'online':
        return users.filter(u => u.isOnline);
      case 'offline':
        return users.filter(u => !u.isOnline);
      default:
        return users;
    }
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: "Erro",
        description: "Preencha o título e a mensagem.",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();

      const senderName = profile?.name || 'Administrador';
      const recipients = getRecipients();

      if (displayType === 'notification') {
        // Enviar como notificação global (aparece na lista do sino)
        const { error } = await supabase
          .from('global_notifications')
          .insert({
            title: title.trim(),
            message: message.trim(),
            sender_id: user.id,
            sender_name: senderName,
            is_active: true,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias
          });

        if (error) throw error;

        toast({
          title: "Sucesso!",
          description: `Notificação enviada para ${recipients.length} usuário(s).`
        });
      } else {
        // Enviar como popup
        const onlineRecipients = recipients.filter(r => r.isOnline);
        const offlineRecipients = recipients.filter(r => !r.isOnline);

        // Popups para online: admin_realtime_messages
        if (onlineRecipients.length > 0) {
          const realtimeInserts = onlineRecipients.map(recipient => ({
            title: title.trim(),
            message: message.trim(),
            sender_id: user.id,
            sender_name: senderName,
            target_user_id: recipient.id,
            is_read: false,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          }));

          const { error } = await supabase
            .from('admin_realtime_messages')
            .insert(realtimeInserts);

          if (error) throw error;
        }

        // Popups para offline: user_direct_messages
        if (offlineRecipients.length > 0) {
          const directInserts = offlineRecipients.map(recipient => ({
            title: title.trim(),
            message: message.trim(),
            sender_id: user.id,
            sender_name: senderName,
            recipient_id: recipient.id
          }));

          const { error } = await supabase
            .from('user_direct_messages')
            .insert(directInserts);

          if (error) throw error;
        }

        toast({
          title: "Sucesso!",
          description: `Popup enviado para ${onlineRecipients.length} online e ${offlineRecipients.length} offline.`
        });
      }

      handleClose();
    } catch (error) {
      console.error('Erro ao enviar:', error);
      toast({
        title: "Erro",
        description: "Falha ao enviar notificação.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setMessage('');
    setRecipientType('all');
    setDisplayType('popup');
    onClose();
  };

  const onlineCount = users.filter(u => u.isOnline).length;
  const offlineCount = users.filter(u => !u.isOnline).length;
  const recipientCount = getRecipients().length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-blue-400" />
            Enviar Notificação
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Envie mensagens para seus usuários
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Digite o título da notificação"
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          {/* Mensagem */}
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite a mensagem..."
              className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
            />
          </div>

          {/* Tipo de Exibição */}
          <div className="space-y-2">
            <Label>Como exibir?</Label>
            <RadioGroup value={displayType} onValueChange={(v) => setDisplayType(v as DisplayType)}>
              <div className="flex items-center space-x-3 bg-gray-800 p-3 rounded-lg border border-gray-700">
                <RadioGroupItem value="popup" id="popup" />
                <Label htmlFor="popup" className="flex items-center gap-2 cursor-pointer flex-1">
                  <MessageSquare className="h-4 w-4 text-green-400" />
                  <div>
                    <div className="font-medium">Popup Imediato</div>
                    <div className="text-xs text-gray-400">Aparece na tela do usuário automaticamente</div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 bg-gray-800 p-3 rounded-lg border border-gray-700">
                <RadioGroupItem value="notification" id="notification" />
                <Label htmlFor="notification" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Bell className="h-4 w-4 text-yellow-400" />
                  <div>
                    <div className="font-medium">Lista de Notificações</div>
                    <div className="text-xs text-gray-400">Aparece no ícone do sino (todos recebem)</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Destinatários (apenas para popup) */}
          {displayType === 'popup' && (
            <div className="space-y-2">
              <Label>Destinatários</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={recipientType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRecipientType('all')}
                  className={recipientType === 'all' ? 'bg-blue-600' : 'border-gray-600'}
                >
                  <Users className="h-4 w-4 mr-1" />
                  Todos ({users.length})
                </Button>
                <Button
                  type="button"
                  variant={recipientType === 'online' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRecipientType('online')}
                  className={recipientType === 'online' ? 'bg-green-600' : 'border-gray-600'}
                >
                  <Wifi className="h-4 w-4 mr-1" />
                  Online ({onlineCount})
                </Button>
                <Button
                  type="button"
                  variant={recipientType === 'offline' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRecipientType('offline')}
                  className={recipientType === 'offline' ? 'bg-orange-600' : 'border-gray-600'}
                >
                  <WifiOff className="h-4 w-4 mr-1" />
                  Offline ({offlineCount})
                </Button>
              </div>
              
              <div className="text-sm text-gray-400 mt-2">
                {recipientType === 'all' && (
                  <span>Online receberão popup imediato. Offline receberão quando entrarem.</span>
                )}
                {recipientType === 'online' && (
                  <span>Apenas usuários online receberão o popup agora.</span>
                )}
                {recipientType === 'offline' && (
                  <span>Usuários offline receberão quando entrarem no sistema.</span>
                )}
              </div>
            </div>
          )}

          {/* Resumo */}
          <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
            <div className="text-sm text-gray-300">
              <span className="font-medium">Resumo:</span> Será enviado{' '}
              {displayType === 'popup' ? 'popup' : 'notificação'} para{' '}
              <Badge variant="secondary" className="bg-blue-600 text-white">
                {displayType === 'notification' ? users.length : recipientCount} usuário(s)
              </Badge>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={handleClose}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSend} 
              disabled={isSending || !title.trim() || !message.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
