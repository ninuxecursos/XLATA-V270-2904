import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/hooks/useAuth';

interface PasswordAuthModalProps {
  open: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
}

const SUPABASE_URL = "https://oxawvjcckmbevjztyfgp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94YXd2amNja21iZXZqenR5ZmdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NjQ5MzksImV4cCI6MjA2MzQ0MDkzOX0.N3iIA9YoJgN2X43uy_pyXu5YLLsAnoILG1vTF5THSNE";

const PasswordAuthModal: React.FC<PasswordAuthModalProps> = ({
  open,
  onSuccess,
  onCancel,
  title = "Autenticação Necessária",
  description = "Digite sua senha para continuar"
}) => {
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { user } = useAuth();

  // Cliente Supabase ISOLADO — não persiste sessão, não dispara onAuthStateChange.
  // Isso permite validar a senha sem afetar a sessão atual do usuário.
  const verifierClient = useMemo(
    () =>
      createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }),
    []
  );

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setPassword('');
      setIsAuthenticating(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!password.trim()) {
      toast({
        title: "Senha obrigatória",
        description: "Digite sua senha para continuar.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (!user?.email) {
      toast({
        title: "Erro",
        description: "Usuário não encontrado.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (isAuthenticating) return;
    setIsAuthenticating(true);

    try {
      const { data, error } = await verifierClient.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      if (error || !data.user) {
        toast({
          title: "Senha incorreta",
          description: "A senha digitada está incorreta.",
          variant: "destructive",
          duration: 3000,
        });
        setIsAuthenticating(false);
        return;
      }

      // Limpa a sessão temporária do cliente verificador para não acumular tokens
      try {
        await verifierClient.auth.signOut();
      } catch {
        // ignore
      }

      // Senha correta → chama o callback diretamente, sem timeouts ou refs.
      setIsAuthenticating(false);
      onSuccess();
    } catch (error) {
      console.error('Error verifying password:', error);
      toast({
        title: "Erro ao verificar senha",
        description: "Ocorreu um erro ao verificar sua senha. Tente novamente.",
        variant: "destructive",
        duration: 3000,
      });
      setIsAuthenticating(false);
    }
  };

  const handleCancel = () => {
    if (isAuthenticating) return;
    setPassword('');
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen && !isAuthenticating) {
        handleCancel();
      }
    }}>
      <DialogContent className="sm:max-w-[400px] bg-gray-900 text-white border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2 text-2xl text-emerald-400">
            <Lock className="h-7 w-7" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400 text-lg">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-white font-medium">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              className="w-full p-3 bg-gray-800 border border-gray-700 text-white rounded-md focus:outline-none focus:border-emerald-400"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isAuthenticating) {
                  handleSubmit();
                }
              }}
              disabled={isAuthenticating}
            />
          </div>
          
          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="outline"
              onClick={handleCancel}
              className="flex-1 bg-transparent hover:bg-gray-700 text-white border-gray-600"
              disabled={isAuthenticating}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={isAuthenticating || !password.trim()}
            >
              {isAuthenticating ? "Verificando..." : "Continuar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordAuthModal;
