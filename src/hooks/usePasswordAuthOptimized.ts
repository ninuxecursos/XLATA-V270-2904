
import { useState, useCallback, useRef } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const usePasswordAuthOptimized = () => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { user } = useAuth();
  const abortControllerRef = useRef<AbortController>();

  const authenticateUser = useCallback(async (inputPassword: string): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Não autenticado",
        description: "Você precisa estar logado para realizar esta ação.",
        variant: "destructive",
        duration: 3000,
      });
      return false;
    }

    if (isAuthenticating) {
      return false;
    }

    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsAuthenticating(true);

    try {
      // Verificar senha usando Supabase Auth com timeout
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: user.email || '',
        password: inputPassword
      });

      if (error || !authData.user) {
        toast({
          title: "Senha incorreta",
          description: "A senha digitada está incorreta.",
          variant: "destructive",
          duration: 3000,
        });
        return false;
      } else {
        return true;
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return false;
      }
      
      console.error('Error verifying password:', error);
      toast({
        title: "Erro ao verificar senha",
        description: "Ocorreu um erro ao verificar sua senha. Tente novamente.",
        variant: "destructive",
        duration: 3000,
      });
      return false;
    } finally {
      setIsAuthenticating(false);
      abortControllerRef.current = undefined;
    }
  }, [user, isAuthenticating]);

  // Cleanup
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    isAuthenticating,
    authenticateUser,
    cleanup
  };
};
