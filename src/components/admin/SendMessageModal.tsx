
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Send, X } from 'lucide-react';

interface SendMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUserId: string;
  targetUserName: string;
}

export const SendMessageModal = ({
  open,
  onOpenChange,
  targetUserId,
  targetUserName
}: SendMessageModalProps) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o título e a mensagem.",
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

      // Enviar mensagem
      const { error } = await supabase
        .from('admin_realtime_messages')
        .insert({
          sender_id: user.id,
          sender_name: senderName,
          target_user_id: targetUserId,
          title: title.trim(),
          message: message.trim()
        });

      if (error) throw error;

      toast({
        title: "Mensagem enviada",
        description: `Mensagem enviada com sucesso para ${targetUserName}.`,
      });

      // Limpar formulário
      setTitle('');
      setMessage('');
      onOpenChange(false);

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setMessage('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-400" />
              Enviar Mensagem
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
            <p className="text-sm text-gray-400">
              Enviando para: <span className="text-blue-400 font-medium">{targetUserName}</span>
            </p>
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="message" className="text-gray-300">
              Mensagem
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400 min-h-[100px]"
              maxLength={500}
            />
            <p className="text-xs text-gray-500">
              {message.length}/500 caracteres
            </p>
          </div>

          <div className="flex gap-2 pt-4">
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
              disabled={sending || !title.trim() || !message.trim()}
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
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
