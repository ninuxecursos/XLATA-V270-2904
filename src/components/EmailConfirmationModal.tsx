
import React, { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle, RefreshCw, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface EmailConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  email: string;
}

const EmailConfirmationModal: React.FC<EmailConfirmationModalProps> = ({ 
  open, 
  onClose, 
  email 
}) => {
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) {
        toast({ title: "❌ Erro ao reenviar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "✅ Email reenviado!", description: "Verifique sua caixa de entrada e spam." });
        setCooldown(60);
      }
    } catch {
      toast({ title: "❌ Erro", description: "Falha ao reenviar. Tente novamente.", variant: "destructive" });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="bg-gray-800 text-white border-gray-700 max-w-md">
        <AlertDialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <AlertDialogTitle className="text-xl font-bold text-green-400 text-center">
            Cadastro Realizado com Sucesso!
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-300 space-y-3">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Mail className="h-5 w-5 text-blue-400" />
              <span className="font-semibold">Confirme seu e-mail</span>
            </div>
            <p>
              Enviamos um e-mail de confirmação para:
            </p>
            <p className="font-semibold text-green-400 bg-gray-900/50 p-2 rounded text-center text-lg">
              {email}
            </p>
            <p>
              Para acessar sua conta no <strong>XLATA.SITE</strong>, você precisa confirmar seu e-mail 
              clicando no link que enviamos.
            </p>

            {/* Instruções para novos usuários */}
            <div className="bg-blue-900/20 border border-blue-600/50 rounded-lg p-3 mt-3 text-left">
              <p className="text-blue-300 text-sm font-semibold mb-2">📋 Próximos passos:</p>
              <ol className="text-blue-200 text-sm space-y-1 list-decimal list-inside">
                <li>Abra seu e-mail e procure a mensagem de confirmação</li>
                <li>Clique no link de confirmação dentro do e-mail</li>
                <li>Após confirmar, faça login com seu e-mail e senha</li>
                <li>Seu teste grátis de 7 dias será ativado automaticamente</li>
              </ol>
            </div>

            <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-3 mt-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
                <div className="text-yellow-300 text-sm">
                  <p className="font-semibold mb-1">Não recebeu o e-mail?</p>
                  <ul className="space-y-1 text-yellow-200 text-xs">
                    <li>• Verifique a pasta de <strong>spam</strong> ou <strong>lixo eletrônico</strong></li>
                    <li>• Aguarde até 5 minutos para o e-mail chegar</li>
                    <li>• Verifique se digitou o e-mail corretamente</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Botão reenviar */}
            <Button
              type="button"
              variant="outline"
              onClick={handleResend}
              disabled={isResending || cooldown > 0}
              className="w-full mt-3 border-gray-600 text-gray-200 hover:bg-gray-700"
            >
              {isResending ? (
                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Reenviando...</>
              ) : cooldown > 0 ? (
                <><Clock className="h-4 w-4 mr-2" /> Reenviar em {cooldown}s</>
              ) : (
                <><RefreshCw className="h-4 w-4 mr-2" /> Reenviar e-mail de confirmação</>
              )}
            </Button>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction 
            onClick={onClose}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
          >
            Entendi, vou confirmar meu e-mail
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EmailConfirmationModal;
