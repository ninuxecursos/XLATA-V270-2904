import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2 } from 'lucide-react';

interface BroadcastNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BroadcastNotificationModal = ({ isOpen, onClose }: BroadcastNotificationModalProps) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !message.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o título e a descrição da notificação.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Buscar dados do usuário atual (admin)
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user?.id)
        .single();

      // Criar notificação global
      const { error } = await supabase
        .from('global_notifications')
        .insert({
          title: title.trim(),
          message: message.trim(),
          sender_id: user?.id,
          sender_name: profile?.name || 'Administrador',
          is_active: true,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
        });

      if (error) throw error;

      toast({
        title: "Notificação enviada!",
        description: "A notificação foi enviada para todos os usuários.",
      });

      // Limpar formulário e fechar modal
      setTitle('');
      setMessage('');
      onClose();
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar a notificação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-blue-400" />
            Enviar Notificação para Todos
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-gray-300">
              Título *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Digite o título da notificação..."
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
              maxLength={100}
            />
          </div>

          <div>
            <Label htmlFor="message" className="text-gray-300">
              Descrição *
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite a descrição da notificação..."
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 resize-none"
              rows={4}
              maxLength={500}
            />
            <div className="text-xs text-gray-400 mt-1">
              {message.length}/500 caracteres
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={isLoading || !title.trim() || !message.trim()}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};