
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const usePasswordAuth = () => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { user } = useAuth();

  const authenticateUser = async (inputPassword: string): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Não autenticado",
        description: "Você precisa estar logado para realizar esta ação.",
        variant: "destructive",
        duration: 3000,
      });
      return false;
    }

    setIsAuthenticating(true);

    try {
      // Verificar a senha usando o Supabase Auth
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
        // Senha correta
        return true;
      }
    } catch (error) {
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
    }
  };

  return {
    isAuthenticating,
    authenticateUser
  };
};
